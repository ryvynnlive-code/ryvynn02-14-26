'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateFlameResponse, detectCrisisLevel, getCrisisSafetyMessage } from '@/lib/flame/engine'
import { redirect } from 'next/navigation'
import { getCurrentTier } from '@/lib/features/flags'
import { getTierName } from '@/lib/billing/stripe-map-omega'

export async function callFlame(userMessage: string) {
  try {
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

    // Get user entitlements (tier-based limits)
    const { data: entitlement } = await adminClient
      .from('entitlements')
      .select('current_tier, flame_conversations_per_day')
      .eq('user_id', user.id)
      .single()

    if (!entitlement) {
      return {
        success: false,
        error: 'User entitlements not found. Please contact support.',
      }
    }

    const limit = entitlement.flame_conversations_per_day
    const tierName = getTierName(entitlement.current_tier)

    // Check daily usage
    const { data: usage } = await adminClient
      .from('usage_daily')
      .select('flame_calls')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    const currentUsage = usage?.flame_calls || 0

    // Enforce limit (999999 = unlimited for Tier 3+)
    if (limit < 999999 && currentUsage >= limit) {
      return {
        success: false,
        error: 'Daily limit reached',
        limit,
        usage: currentUsage,
        tier: entitlement.current_tier,
        tierName,
        upgrade_required: true,
      }
    }

    // Generate response
    const response = generateFlameResponse({
      userMessage,
      userId: user.id,
    })

    // Increment usage
    await adminClient.rpc('increment_flame_usage', { p_user_id: user.id })

    // Log event
    await adminClient.from('events').insert({
      user_id: user.id,
      event_type: 'flame_call',
      metadata: {},
    })

    // If crisis detected, log it (without content)
    if (response.isCrisis) {
      await adminClient.from('events').insert({
        user_id: user.id,
        event_type: 'crisis_shown',
        metadata: {
          level: response.crisisLevel,
        },
      })
    }

    return {
      success: true,
      response,
      usage: currentUsage + 1,
      limit,
    }
  } catch (error) {
    console.error('Error calling Flame:', error)
    return {
      success: false,
      error: 'An error occurred',
    }
  }
}

export async function getFlameUsage() {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    // Get entitlements (tier-based limits)
    const { data: entitlement } = await adminClient
      .from('entitlements')
      .select('current_tier, flame_conversations_per_day')
      .eq('user_id', user.id)
      .single()

    if (!entitlement) {
      return null
    }

    // Get today's usage
    const { data: usage } = await adminClient
      .from('usage_daily')
      .select('flame_calls')
      .eq('user_id', user.id)
      .eq('date', new Date().toISOString().split('T')[0])
      .single()

    const currentUsage = usage?.flame_calls || 0
    const limit = entitlement.flame_conversations_per_day

    return {
      usage: currentUsage,
      limit: limit >= 999999 ? 'unlimited' : limit,
      tier: entitlement.current_tier,
      tierName: getTierName(entitlement.current_tier),
    }
  } catch (error) {
    console.error('Error getting usage:', error)
    return null
  }
}
