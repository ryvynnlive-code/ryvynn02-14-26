/**
 * Migration 005: Row Level Security Policies
 * RLS policies for avatar system tables
 */

-- ============================================
-- AVATAR PROFILES RLS
-- ============================================

ALTER TABLE avatar_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own avatar profile"
  ON avatar_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own avatar profile"
  ON avatar_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own avatar profile"
  ON avatar_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ENTITLEMENTS RLS
-- ============================================

ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON entitlements FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can modify entitlements (via webhooks)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================
-- MOOD LOGS RLS
-- ============================================

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own mood logs"
  ON mood_logs FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- GOALS RLS
-- ============================================

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- STREAKS RLS
-- ============================================

ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON streaks FOR SELECT
  USING (auth.uid() = user_id);

-- Service role manages streak updates (via triggers)

-- ============================================
-- ANALYTICS SUMMARIES RLS
-- ============================================

ALTER TABLE analytics_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analytics"
  ON analytics_summaries FOR SELECT
  USING (auth.uid() = user_id);

-- Service role generates summaries (via cron jobs)

-- ============================================
-- INTEGRATION CONNECTIONS RLS
-- ============================================

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own integrations"
  ON integration_connections FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- API KEYS RLS
-- ============================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- PROCESSED EVENTS RLS
-- ============================================

ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

-- No user access to processed_events (service role only)

-- ============================================
-- ADMIN POLICIES
-- ============================================

-- Admin users can view all entitlements
CREATE POLICY "Admins can view all entitlements"
  ON entitlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.roles @> '["admin"]'::jsonb
    )
  );

-- Admin users can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON analytics_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.roles @> '["admin"]'::jsonb
    )
  );
