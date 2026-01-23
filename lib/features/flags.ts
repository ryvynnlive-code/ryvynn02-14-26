/**
 * Feature Flag System
 * Server-side feature entitlement checks based on user tier
 */

import { createClient } from '@/lib/supabase/server'
import { Tier, FeatureKey } from '@/types/tiers'
import tierMatrix from '@/data/tier_matrix.json'

export interface FeatureCheckResult {
  entitled: boolean
  reason?: string
  current_tier?: Tier
  required_tier?: Tier
  upgrade_url?: string
}

/**
 * Check if user has access to a specific feature
 */
export async function checkFeature(
  userId: string,
  featureKey: string
): Promise<FeatureCheckResult> {
  const supabase = await createClient()

  // Get user entitlements
  const { data: entitlement, error } = await supabase
    .from('entitlements')
    .select('current_tier, features, purchased_addons')
    .eq('user_id', userId)
    .single()

  if (error || !entitlement) {
    return {
      entitled: false,
      reason: 'No entitlement record found',
    }
  }

  // Load feature definition from tier_matrix.json
  const featureDefinition = tierMatrix.feature_keys.find(
    (f: FeatureKey) => f.feature_key === featureKey
  )

  if (!featureDefinition) {
    return {
      entitled: false,
      reason: `Feature not found: ${featureKey}`,
    }
  }

  // Check tier requirement
  if (entitlement.current_tier < featureDefinition.minimum_tier) {
    return {
      entitled: false,
      reason: `Requires ${getTierName(featureDefinition.minimum_tier)} tier or higher`,
      current_tier: entitlement.current_tier,
      required_tier: featureDefinition.minimum_tier,
      upgrade_url: '/app/settings?tab=subscription',
    }
  }

  return { entitled: true, current_tier: entitlement.current_tier }
}

/**
 * Require minimum tier or throw error
 */
export async function requireTier(userId: string, minTier: Tier): Promise<void> {
  const supabase = await createClient()

  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('current_tier')
    .eq('user_id', userId)
    .single()

  if (!entitlement || entitlement.current_tier < minTier) {
    throw new Error(
      `This feature requires ${getTierName(minTier)} tier or higher. Your current tier: ${getTierName(
        entitlement?.current_tier || 0
      )}`
    )
  }
}

/**
 * Get user's current tier
 */
export async function getCurrentTier(userId: string): Promise<Tier> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('entitlements')
    .select('current_tier')
    .eq('user_id', userId)
    .single()

  return (data?.current_tier as Tier) || 0
}

/**
 * Get all features enabled for user's tier
 */
export async function getEnabledFeatures(userId: string): Promise<string[]> {
  const tier = await getCurrentTier(userId)

  const enabledFeatures = tierMatrix.feature_keys
    .filter((f: FeatureKey) => f.minimum_tier <= tier)
    .map((f: FeatureKey) => f.feature_key)

  return enabledFeatures
}

/**
 * Check multiple features at once
 */
export async function checkMultipleFeatures(
  userId: string,
  featureKeys: string[]
): Promise<Record<string, FeatureCheckResult>> {
  const results: Record<string, FeatureCheckResult> = {}

  for (const key of featureKeys) {
    results[key] = await checkFeature(userId, key)
  }

  return results
}

/**
 * Get user's tier limits
 */
export async function getTierLimits(userId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('entitlements')
    .select('flame_conversations_per_day, daily_goals_max, api_calls_per_day, journal_retention_days')
    .eq('user_id', userId)
    .single()

  return data || null
}

/**
 * Check if user has hit usage limit for the day
 */
export async function checkUsageLimit(
  userId: string,
  limitType: 'flame_conversations' | 'api_calls' | 'daily_goals'
): Promise<{ withinLimit: boolean; current: number; limit: number }> {
  const supabase = await createClient()

  // Get user's limit
  const { data: entitlement } = await supabase
    .from('entitlements')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!entitlement) {
    return { withinLimit: false, current: 0, limit: 0 }
  }

  const today = new Date().toISOString().split('T')[0]

  // Get today's usage
  const { data: usage } = await supabase
    .from('usage_daily')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  let current = 0
  let limit = 0

  switch (limitType) {
    case 'flame_conversations':
      current = usage?.flame_calls || 0
      limit = entitlement.flame_conversations_per_day
      break
    case 'api_calls':
      current = usage?.api_calls_count || 0
      limit = entitlement.api_calls_per_day
      break
    case 'daily_goals':
      // Check goals table for today
      const { count } = await supabase
        .from('goals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('goal_date', today)

      current = count || 0
      limit = entitlement.daily_goals_max
      break
  }

  // Unlimited tiers
  if (limit === -1 || limit === 999999) {
    return { withinLimit: true, current, limit: -1 }
  }

  return {
    withinLimit: current < limit,
    current,
    limit,
  }
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
  userId: string,
  usageType: 'flame_conversations' | 'api_calls'
): Promise<void> {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  const column = usageType === 'flame_conversations' ? 'flame_calls' : 'api_calls_count'

  // Upsert usage record
  const { data: existing } = await supabase
    .from('usage_daily')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .single()

  if (existing) {
    await supabase
      .from('usage_daily')
      .update({ [column]: (existing[column] || 0) + 1 })
      .eq('id', existing.id)
  } else {
    await supabase.from('usage_daily').insert({
      user_id: userId,
      date: today,
      [column]: 1,
    })
  }
}

// Helper functions
function getTierName(tier: Tier): string {
  const names: Record<Tier, string> = {
    0: 'Base',
    1: 'Standard',
    2: 'Enhanced',
    3: 'Pro',
    4: 'Infinite',
  }
  return names[tier] || 'Unknown'
}
