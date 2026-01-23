/**
 * Tier and Entitlement Type Definitions
 * Maps to /data/tier_matrix.json structure
 */

export type Tier = 0 | 1 | 2 | 3 | 4 | 5

export interface TierDefinition {
  id: Tier
  name: string
  description: string
  pricing: {
    monthly: number
    annual?: number
  }
  stripe_price_ids: {
    monthly: string
    annual?: string
  }
  limits: TierLimits
  features: TierFeatures
  highlight?: string
}

export interface TierLimits {
  flame_conversations_per_day: number | 'unlimited'
  daily_goals_max: number | 'unlimited'
  api_calls_per_day: number
  journal_retention_days: number | null // null = unlimited
}

export interface TierFeatures {
  avatar: {
    gender_selection: boolean
    age_tier_switching: boolean
    custom_visuals: boolean
    personality_sliders: boolean
    rename_avatar: boolean
  }
  interactions: {
    text_conversations: boolean
    voice_tts: boolean
    voice_stt: boolean
    priority_response: boolean
  }
  journaling: {
    basic_journal: boolean
    unlimited_retention: boolean
    tags_search: boolean
    analytics_integration: boolean
  }
  goals_structure: {
    daily_goals: boolean
    reminders: boolean
    guided_coping_modules: boolean
    mini_courses: boolean
    streaks: boolean
  }
  analytics: {
    current_mood_tracking: boolean
    weekly_summaries: boolean
    pattern_detection: boolean
    export: boolean
  }
  integrations: {
    calendar_sync: boolean
    wearable_data: boolean
    api_access: boolean
  }
  advanced: {
    adaptive_modeling: boolean
    predictive_insights: boolean
    human_ai_coaching: boolean
    concierge_support: boolean
  }
  privacy_control: {
    data_export: boolean
    account_deletion: boolean
    encryption: boolean
  }
}

export interface Entitlement {
  id: string
  user_id: string
  current_tier: Tier
  subscription_id?: string
  flame_conversations_per_day: number
  daily_goals_max: number
  api_calls_per_day: number
  journal_retention_days: number | null
  features: TierFeatures
  purchased_addons: string[]
  created_at: string
  updated_at: string
}

export interface AddOn {
  id: string
  name: string
  description: string
  price: number
  type: 'one_time' | 'monthly'
  stripe_price_id: string
  available_for_tiers: Tier[]
  feature_unlocks?: string[]
}

export interface FeatureKey {
  feature_key: string
  display_name: string
  description: string
  minimum_tier: Tier
  category: 'avatar' | 'interactions' | 'journaling' | 'goals' | 'analytics' | 'integrations' | 'advanced'
}

export interface UsageTracker {
  user_id: string
  date: string
  flame_conversations_count: number
  api_calls_count: number
  daily_goals_created: number
}

// ============================================
// FEATURE KEY ENUM
// ============================================

/**
 * Feature keys matching data/tier_matrix.json
 * TIER_VERSION: 2026-01-v1
 */
export enum FeatureKey {
  AVATAR_SELECTION = 'avatar_selection',
  AGE_TIER_SWITCHING = 'age_tier_switching',
  VOICE_INTERACTION = 'voice_interaction',
  JOURNALING = 'journaling',
  GOALS_DAILY = 'goals_daily',
  COPING_MODULES = 'coping_modules',
  MINI_COURSES = 'mini_courses',
  ANALYTICS_TRENDS = 'analytics_trends',
  WEEKLY_SUMMARY = 'weekly_summary',
  CALENDAR_SYNC = 'calendar_sync',
  WEARABLE_SYNC = 'wearable_sync',
  API_ACCESS = 'api_access',
  CUSTOM_AVATAR = 'custom_avatar',
  PERSONALITY_SLIDERS = 'personality_sliders',
  PREDICTIVE_INSIGHTS = 'predictive_insights',
  HUMAN_COACHING = 'human_coaching',
}

/**
 * Tier version constant for grandfathering
 * Update this when tier structure changes
 */
export const TIER_VERSION = '2026-01-omega' as const

/**
 * Billing cadence options
 */
export type BillingCadence = 'monthly' | 'annual'

/**
 * Subscription status from Stripe
 */
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid'
