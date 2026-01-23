'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Crisis keywords for detection
const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end my life',
  'want to die',
  'better off dead',
  'self harm',
  'cut myself',
  'overdose',
]

interface TruthPost {
  id: string
  content: string
  emotion_tag: 'light' | 'shadow'
  created_at: string
  is_visible: boolean
  contains_crisis_keywords: boolean
  crisis_level: string | null
}

interface CreateTruthPostResult {
  success: boolean
  error?: string
  post_id?: string
  contains_crisis?: boolean
  upgrade_required?: boolean
  limit_info?: {
    used: number
    limit: number
    tier_name: string
  }
}

interface ReadTruthPostResult {
  success: boolean
  error?: string
  tokens_earned?: number
  upgrade_required?: boolean
  limit_info?: {
    reads_today: number
    limit: number
    tier_name: string
  }
}

interface GetTruthFeedResult {
  success: boolean
  error?: string
  posts?: TruthPost[]
  has_more?: boolean
  reads_remaining?: number
  limit_info?: {
    reads_today: number
    limit: number
    tier_name: string
  }
}

/**
 * Create a new truth post (anonymous)
 * Awards Soul Tokens on successful creation
 * Checks daily posting limits based on tier
 */
export async function createTruthPost(
  content: string,
  emotionTag: 'light' | 'shadow'
): Promise<CreateTruthPostResult> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'You must be logged in to post to the Truth Feed',
    }
  }

  // Validate content
  if (!content || content.length < 10 || content.length > 2000) {
    return {
      success: false,
      error: 'Truth post must be between 10 and 2000 characters',
    }
  }

  // Get user's tier and limits
  const { data: entitlement } = await adminClient
    .from('entitlements')
    .select('current_tier')
    .eq('user_id', user.id)
    .single()

  if (!entitlement) {
    return {
      success: false,
      error: 'Unable to verify your subscription tier',
    }
  }

  // Load tier matrix to check limits
  const tierMatrix = await import('@/data/tier_matrix_omega.json')
  const tier = tierMatrix.tiers.find((t) => t.id === entitlement.current_tier)

  if (!tier) {
    return {
      success: false,
      error: 'Invalid tier configuration',
    }
  }

  const postLimit = tier.limits.truth_posts_per_day

  // Check daily post count
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: postsToday } = await adminClient
    .from('truth_posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  if (postLimit !== -1 && postsToday !== null && postsToday >= postLimit) {
    return {
      success: false,
      error: 'Daily posting limit reached',
      upgrade_required: true,
      limit_info: {
        used: postsToday,
        limit: postLimit,
        tier_name: tier.name,
      },
    }
  }

  // Check for crisis keywords
  const contentLower = content.toLowerCase()
  const containsCrisis = CRISIS_KEYWORDS.some((keyword) =>
    contentLower.includes(keyword)
  )
  const crisisLevel = containsCrisis ? 'high' : null

  // Create the post
  const { data: post, error: insertError } = await adminClient
    .from('truth_posts')
    .insert({
      user_id: user.id,
      content,
      emotion_tag: emotionTag,
      contains_crisis_keywords: containsCrisis,
      crisis_level: crisisLevel,
      is_visible: !containsCrisis, // Auto-hide crisis posts for review
    })
    .select('id')
    .single()

  if (insertError || !post) {
    console.error('Error creating truth post:', insertError)
    return {
      success: false,
      error: 'Failed to create post. Please try again.',
    }
  }

  // Award Soul Tokens for posting (if not crisis)
  if (!containsCrisis) {
    const tokensToAward = tier.soul_tokens.earn_rate * 5 // 5x multiplier for posting

    const { error: tokenError } = await adminClient.rpc(
      'award_soul_tokens_personal',
      {
        p_user_id: user.id,
        p_amount: tokensToAward,
        p_source: 'truth_sharing',
      }
    )

    if (tokenError) {
      console.error('Error awarding soul tokens:', tokenError)
    }
  }

  revalidatePath('/truth')
  revalidatePath('/')

  return {
    success: true,
    post_id: post.id,
    contains_crisis: containsCrisis,
  }
}

/**
 * Mark a truth post as read
 * Awards Soul Tokens for reading
 * Enforces daily read limits for free tier
 */
export async function readTruthPost(
  postId: string
): Promise<ReadTruthPostResult> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user (optional - anonymous reading allowed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Anonymous users can't earn tokens or have limits enforced
    return {
      success: true,
      tokens_earned: 0,
    }
  }

  // Get user's tier and limits
  const { data: entitlement } = await adminClient
    .from('entitlements')
    .select('current_tier')
    .eq('user_id', user.id)
    .single()

  if (!entitlement) {
    return {
      success: false,
      error: 'Unable to verify your subscription tier',
    }
  }

  // Load tier matrix
  const tierMatrix = await import('@/data/tier_matrix_omega.json')
  const tier = tierMatrix.tiers.find((t) => t.id === entitlement.current_tier)

  if (!tier) {
    return {
      success: false,
      error: 'Invalid tier configuration',
    }
  }

  const readLimit = tier.limits.truth_reads_per_day

  // Check if already read
  const { data: existingRead } = await adminClient
    .from('truth_reads')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single()

  if (existingRead) {
    // Already read, no tokens awarded
    return {
      success: true,
      tokens_earned: 0,
    }
  }

  // Check daily read count
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { count: readsToday } = await adminClient
    .from('truth_reads')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('read_at', today.toISOString())

  if (readLimit !== -1 && readsToday !== null && readsToday >= readLimit) {
    return {
      success: false,
      error: 'Daily read limit reached',
      upgrade_required: true,
      limit_info: {
        reads_today: readsToday,
        limit: readLimit,
        tier_name: tier.name,
      },
    }
  }

  // Record the read
  const { error: readError } = await adminClient
    .from('truth_reads')
    .insert({
      user_id: user.id,
      post_id: postId,
    })

  if (readError) {
    console.error('Error recording truth read:', readError)
    return {
      success: false,
      error: 'Failed to record read',
    }
  }

  // Award Soul Tokens
  const tokensToAward = tier.soul_tokens.earn_rate

  const { error: tokenError } = await adminClient.rpc(
    'award_soul_tokens_personal',
    {
      p_user_id: user.id,
      p_amount: tokensToAward,
      p_source: 'truth_reading',
    }
  )

  if (tokenError) {
    console.error('Error awarding soul tokens:', tokenError)
  }

  return {
    success: true,
    tokens_earned: tokensToAward,
    limit_info: {
      reads_today: (readsToday || 0) + 1,
      limit: readLimit,
      tier_name: tier.name,
    },
  }
}

/**
 * Get balanced Truth Feed (50% light, 50% shadow)
 * Uses database function for optimal 50/50 balance
 */
export async function getTruthFeed(
  limit: number = 10
): Promise<GetTruthFeedResult> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Get current user (optional)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let readsRemaining = -1
  let tierName = 'Free'
  let readsToday = 0

  if (user) {
    // Get user's tier and check read limits
    const { data: entitlement } = await adminClient
      .from('entitlements')
      .select('current_tier')
      .eq('user_id', user.id)
      .single()

    if (entitlement) {
      const tierMatrix = await import('@/data/tier_matrix_omega.json')
      const tier = tierMatrix.tiers.find(
        (t) => t.id === entitlement.current_tier
      )

      if (tier) {
        const readLimit = tier.limits.truth_reads_per_day
        tierName = tier.name

        if (readLimit !== -1) {
          // Count today's reads
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const { count } = await adminClient
            .from('truth_reads')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('read_at', today.toISOString())

          readsToday = count || 0
          readsRemaining = Math.max(0, readLimit - readsToday)
        }
      }
    }
  }

  // Get balanced feed using database function
  const { data: posts, error } = await adminClient.rpc(
    'get_balanced_truth_feed',
    {
      p_user_id: user?.id || null,
      p_limit: limit,
    }
  )

  if (error) {
    console.error('Error fetching truth feed:', error)
    return {
      success: false,
      error: 'Failed to load Truth Feed',
    }
  }

  return {
    success: true,
    posts: posts || [],
    has_more: (posts?.length || 0) >= limit,
    reads_remaining: readsRemaining,
    limit_info: {
      reads_today: readsToday,
      limit: readsRemaining === -1 ? -1 : readsToday + readsRemaining,
      tier_name: tierName,
    },
  }
}

/**
 * Get user's Soul Token balance
 */
export async function getSoulTokenBalance() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      success: false,
      error: 'Not authenticated',
    }
  }

  const { data: personal, error: personalError } = await adminClient
    .from('soul_tokens_personal')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: collective, error: collectiveError } = await adminClient
    .from('soul_tokens_collective')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (personalError || collectiveError) {
    return {
      success: false,
      error: 'Failed to load Soul Token balance',
    }
  }

  return {
    success: true,
    personal: personal || {
      total_earned: 0,
      current_balance: 0,
      earned_from_truth_reading: 0,
      earned_from_truth_sharing: 0,
      avatar_stage: 0,
    },
    collective: collective || {
      total_impact_tokens: 0,
      allocated_tokens: 0,
      impact_weight: 0,
      can_allocate: false,
    },
  }
}
