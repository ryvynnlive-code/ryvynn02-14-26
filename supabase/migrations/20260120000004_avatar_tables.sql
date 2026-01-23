/**
 * Migration 004: Avatar System Tables
 * Creates tables for avatar profiles, entitlements, analytics, and integrations
 */

-- ============================================
-- AVATAR PROFILES
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Core Settings
  gender_persona TEXT NOT NULL DEFAULT 'feminine' CHECK (gender_persona IN ('feminine', 'masculine', 'nonbinary')),
  age_tier TEXT NOT NULL DEFAULT 'young_adult' CHECK (age_tier IN ('youth', 'young_adult', 'adult', 'mature')),
  avatar_name TEXT NOT NULL DEFAULT 'Aria',

  -- Tier 4: Custom Settings
  custom_visual_url TEXT,
  personality_warmth INT DEFAULT 5 CHECK (personality_warmth BETWEEN 1 AND 10),
  personality_directness INT DEFAULT 5 CHECK (personality_directness BETWEEN 1 AND 10),
  personality_humor INT DEFAULT 5 CHECK (personality_humor BETWEEN 1 AND 10),
  personality_formality INT DEFAULT 5 CHECK (personality_formality BETWEEN 1 AND 10),

  -- Voice Settings (Tier 2+)
  voice_enabled BOOLEAN DEFAULT FALSE,
  voice_id TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_avatar_profiles_user ON avatar_profiles(user_id);

COMMENT ON TABLE avatar_profiles IS 'User avatar configuration and customization';

-- ============================================
-- ENTITLEMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Tier Information
  current_tier INT NOT NULL DEFAULT 0 CHECK (current_tier BETWEEN 0 AND 4),
  tier_version TEXT NOT NULL DEFAULT '2026-01-v1',
  subscription_id TEXT, -- Stripe subscription ID

  -- Usage Limits
  flame_conversations_per_day INT NOT NULL DEFAULT 5,
  daily_goals_max INT NOT NULL DEFAULT 0,
  api_calls_per_day INT NOT NULL DEFAULT 0,
  journal_retention_days INT, -- NULL = unlimited

  -- Feature Flags (JSONB for flexibility)
  features JSONB DEFAULT '{}',

  -- Add-ons
  purchased_addons TEXT[] DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id);
CREATE INDEX idx_entitlements_tier ON entitlements(current_tier);
CREATE INDEX idx_entitlements_subscription ON entitlements(subscription_id) WHERE subscription_id IS NOT NULL;

COMMENT ON TABLE entitlements IS 'User tier, limits, and feature access';

-- ============================================
-- MOOD LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  mood_emoji TEXT NOT NULL,
  mood_text TEXT,
  intensity INT CHECK (intensity BETWEEN 1 AND 5),

  -- Context
  tags TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  logged_at DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_mood_logs_user_date ON mood_logs(user_id, logged_at DESC);

COMMENT ON TABLE mood_logs IS 'Daily mood check-ins for analytics';

-- ============================================
-- GOALS
-- ============================================

CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  goal_text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,

  -- Scheduling
  goal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reminder_time TIME,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_date ON goals(user_id, goal_date DESC);
CREATE INDEX idx_goals_completed ON goals(user_id, completed, goal_date);

COMMENT ON TABLE goals IS 'Daily goal tracking (Tier 1+)';

-- ============================================
-- STREAKS
-- ============================================

CREATE TABLE IF NOT EXISTS streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  streak_type TEXT NOT NULL CHECK (streak_type IN ('daily_check_in', 'journaling', 'goal_completion')),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, streak_type)
);

CREATE INDEX idx_streaks_user ON streaks(user_id);

COMMENT ON TABLE streaks IS 'User engagement streak tracking';

-- ============================================
-- ANALYTICS SUMMARIES
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_summaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Computed Metrics
  mood_trend TEXT CHECK (mood_trend IN ('improving', 'stable', 'declining')),
  most_common_mood TEXT,
  journal_entries_count INT DEFAULT 0,
  flame_conversations_count INT DEFAULT 0,
  goals_completed_count INT DEFAULT 0,
  streak_days INT DEFAULT 0,

  -- Insights
  patterns JSONB,
  recommendations TEXT[],

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_analytics_user_period ON analytics_summaries(user_id, period_type, period_start DESC);

COMMENT ON TABLE analytics_summaries IS 'Pre-computed analytics (Tier 2+)';

-- ============================================
-- INTEGRATION CONNECTIONS
-- ============================================

CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  provider TEXT NOT NULL, -- 'google_calendar', 'apple_health', 'fitbit', etc.
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Configuration
  config JSONB DEFAULT '{}',
  enabled BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

CREATE INDEX idx_integrations_user ON integration_connections(user_id);
CREATE INDEX idx_integrations_provider ON integration_connections(provider, enabled);

COMMENT ON TABLE integration_connections IS 'Third-party OAuth credentials (Tier 3+)';

-- ============================================
-- API KEYS
-- ============================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_key ON api_keys(key) WHERE active = TRUE;

COMMENT ON TABLE api_keys IS 'API authentication for Pro+ users';

-- ============================================
-- PROCESSED EVENTS (for idempotency)
-- ============================================

CREATE TABLE IF NOT EXISTS processed_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_processed_events_stripe_id ON processed_events(stripe_event_id);
CREATE INDEX idx_processed_events_created ON processed_events(processed_at DESC);

COMMENT ON TABLE processed_events IS 'Tracks processed Stripe webhook events for idempotency';

-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================

-- Add tier and customer ID to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_tier INT DEFAULT 0 CHECK (current_tier BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(current_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN profiles.current_tier IS 'Denormalized tier for quick access';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for billing';

-- Add tier to existing subscriptions table (if it exists)
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS tier INT DEFAULT 1 CHECK (tier BETWEEN 0 AND 4);

COMMENT ON COLUMN subscriptions.tier IS 'Subscription tier (mapped from price_id)';
