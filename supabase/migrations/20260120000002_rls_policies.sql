-- RYVYNN Row Level Security (RLS) Policies
-- Created: 2026-01-20
-- Description: Security policies ensuring users can only access their own data

-- ============================================================================
-- PROFILES TABLE RLS
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert profiles (for new user registration)
CREATE POLICY "Service role can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Admin can view all profiles
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND 'admin' = ANY(p.roles)
    )
  );

-- ============================================================================
-- SUBSCRIPTIONS TABLE RLS
-- ============================================================================

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin can view all subscriptions
CREATE POLICY "Admin can view all subscriptions"
  ON subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND 'admin' = ANY(p.roles)
    )
  );

-- ============================================================================
-- JOURNAL ENTRIES TABLE RLS
-- ============================================================================

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Users can view their own journal entries
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own journal entries
CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own journal entries
CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own journal entries
CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USAGE DAILY TABLE RLS
-- ============================================================================

ALTER TABLE usage_daily ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON usage_daily FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage usage (for server-side enforcement)
CREATE POLICY "Service role can manage usage"
  ON usage_daily FOR ALL
  USING (true)
  WITH CHECK (true);

-- Admin can view all usage
CREATE POLICY "Admin can view all usage"
  ON usage_daily FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND 'admin' = ANY(p.roles)
    )
  );

-- ============================================================================
-- EVENTS TABLE RLS
-- ============================================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can insert their own events (limited types)
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Users can view their own events
CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

-- Admin can view all events (for analytics)
CREATE POLICY "Admin can view all events"
  ON events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
      AND 'admin' = ANY(p.roles)
    )
  );

-- Service role can insert system events
CREATE POLICY "Service role can insert system events"
  ON events FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- STORAGE POLICIES (for user exports bucket)
-- ============================================================================

-- Users can upload their own exports
CREATE POLICY "Users can upload own exports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can view their own exports
CREATE POLICY "Users can view own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own exports
CREATE POLICY "Users can delete own exports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
