/**
 * RYVYNN Avatar System Database Schema
 * Extends existing schema with avatar, analytics, and integration tables
 *
 * Migration: 20260120000004_avatar_tables.sql
 */

-- ============================================
-- AVATAR PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Core Avatar Settings
  gender_persona TEXT NOT NULL DEFAULT 'feminine' CHECK (gender_persona IN ('feminine', 'masculine', 'nonbinary')),
  age_tier TEXT NOT NULL DEFAULT 'young_adult' CHECK (age_tier IN ('youth', 'young_adult', 'adult', 'mature')),
  avatar_name TEXT NOT NULL DEFAULT 'Aria',

  -- Tier 4: Custom Avatar Settings
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

COMMENT ON TABLE avatar_profiles IS 'User avatar configuration and customization settings';
COMMENT ON COLUMN avatar_profiles.gender_persona IS 'Feminine, Masculine, or Nonbinary persona selection';
COMMENT ON COLUMN avatar_profiles.age_tier IS 'Youth, Young Adult, Adult, or Mature context tier';
COMMENT ON COLUMN avatar_profiles.custom_visual_url IS 'Tier 4 only: uploaded or generated avatar image URL';
COMMENT ON COLUMN avatar_profiles.personality_warmth IS 'Tier 4 only: warmth slider 1-10';


-- ============================================
-- ENTITLEMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS entitlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Tier Information
  current_tier INT NOT NULL DEFAULT 0 CHECK (current_tier BETWEEN 0 AND 4),
  subscription_id TEXT,

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

COMMENT ON TABLE entitlements IS 'User tier, limits, and feature access';
COMMENT ON COLUMN entitlements.current_tier IS '0=Base, 1=Standard, 2=Enhanced, 3=Pro, 4=Infinite';
COMMENT ON COLUMN entitlements.features IS 'JSONB feature flags: {voice_interaction: true, ...}';


-- ============================================
-- MOOD LOGS TABLE
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

COMMENT ON TABLE mood_logs IS 'Daily mood check-ins for analytics (Tier 2+)';


-- ============================================
-- GOALS TABLE
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

COMMENT ON TABLE goals IS 'Daily goal tracking (Tier 1+)';


-- ============================================
-- STREAKS TABLE
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
-- ANALYTICS SUMMARIES TABLE
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
  patterns JSONB, -- { "monday_anxiety": true, "evening_stress": true }
  recommendations TEXT[], -- ['Try 5-minute calm on Mondays']

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, period_type, period_start)
);

CREATE INDEX idx_analytics_user_period ON analytics_summaries(user_id, period_type, period_start DESC);

COMMENT ON TABLE analytics_summaries IS 'Pre-computed weekly/monthly analytics (Tier 2+)';


-- ============================================
-- INTEGRATION CONNECTIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS integration_connections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  provider TEXT NOT NULL, -- 'google_calendar', 'apple_health', 'fitbit', etc.
  access_token TEXT NOT NULL, -- should be encrypted
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

COMMENT ON TABLE integration_connections IS 'Third-party integration credentials (Tier 3+)';
COMMENT ON COLUMN integration_connections.access_token IS 'OAuth access token (encrypt before storing)';


-- ============================================
-- API KEYS TABLE (Tier 3+)
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

COMMENT ON TABLE api_keys IS 'API authentication keys for Pro+ users';


-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_avatar_profiles_updated_at
  BEFORE UPDATE ON avatar_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_connections_updated_at
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Create default avatar profile on user signup
CREATE OR REPLACE FUNCTION create_default_avatar_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO avatar_profiles (user_id, gender_persona, age_tier, avatar_name)
  VALUES (NEW.id, 'feminine', 'young_adult', 'Aria');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created_avatar
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_avatar_profile();


-- Create default entitlement (Base tier) on user signup
CREATE OR REPLACE FUNCTION create_default_entitlement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entitlements (user_id, current_tier, flame_conversations_per_day, daily_goals_max, api_calls_per_day)
  VALUES (NEW.id, 0, 5, 0, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_auth_user_created_entitlement
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_entitlement();


-- ============================================
-- MODIFY EXISTING TABLES
-- ============================================

-- Add tier tracking to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_tier INT DEFAULT 0 CHECK (current_tier BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN profiles.current_tier IS 'Denormalized tier for quick access (synced from entitlements)';
