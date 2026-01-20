/**
 * Migration 006: Triggers, Functions, and Views
 * Creates helper functions, triggers, and entitlements view
 */

-- ============================================
-- AUTO-UPDATE TRIGGERS
-- ============================================

-- Trigger function (reuse existing from migration 003)
-- Update avatar_profiles.updated_at
CREATE TRIGGER update_avatar_profiles_updated_at
  BEFORE UPDATE ON avatar_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update entitlements.updated_at
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update streaks.updated_at
CREATE TRIGGER update_streaks_updated_at
  BEFORE UPDATE ON streaks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update integration_connections.updated_at
CREATE TRIGGER update_integration_connections_updated_at
  BEFORE UPDATE ON integration_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE DEFAULT RECORDS
-- ============================================

/**
 * Create default avatar profile on user signup
 */
CREATE OR REPLACE FUNCTION create_default_avatar_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO avatar_profiles (user_id, gender_persona, age_tier, avatar_name)
  VALUES (NEW.id, 'feminine', 'young_adult', 'Aria')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_avatar
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_avatar_profile();

/**
 * Create default entitlement (Base tier) on user signup
 */
CREATE OR REPLACE FUNCTION create_default_entitlement()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entitlements (
    user_id,
    current_tier,
    tier_version,
    flame_conversations_per_day,
    daily_goals_max,
    api_calls_per_day,
    journal_retention_days,
    features
  )
  VALUES (
    NEW.id,
    0, -- Base tier
    '2026-01-v1',
    5,
    0,
    0,
    NULL, -- No retention on base tier
    '{}'::jsonb
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_entitlement
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_entitlement();

-- ============================================
-- UNIQUE CONSTRAINTS FOR IDEMPOTENCY
-- ============================================

-- Stripe customer ID should be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_unique
  ON profiles(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Stripe subscription ID should be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_unique
  ON subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- Processed events must be unique
-- Already has UNIQUE constraint on stripe_event_id from migration 004

-- ============================================
-- ENTITLEMENTS VIEW
-- ============================================

/**
 * Comprehensive entitlements view
 * Joins user, tier, and feature data for easy access
 */
CREATE OR REPLACE VIEW user_entitlements AS
SELECT
  e.user_id,
  e.current_tier,
  e.tier_version,
  e.subscription_id,
  e.flame_conversations_per_day,
  e.daily_goals_max,
  e.api_calls_per_day,
  e.journal_retention_days,
  e.features,
  e.purchased_addons,
  p.email,
  p.stripe_customer_id,
  p.plan AS legacy_plan,
  s.status AS subscription_status,
  s.cancel_at_period_end,
  s.current_period_end,
  CASE
    WHEN e.current_tier = 0 THEN 'Base'
    WHEN e.current_tier = 1 THEN 'Standard'
    WHEN e.current_tier = 2 THEN 'Enhanced'
    WHEN e.current_tier = 3 THEN 'Pro'
    WHEN e.current_tier = 4 THEN 'Infinite'
  END AS tier_name,
  CASE
    WHEN e.current_tier >= 2 THEN TRUE ELSE FALSE
  END AS has_analytics,
  CASE
    WHEN e.current_tier >= 2 THEN TRUE ELSE FALSE
  END AS has_voice,
  CASE
    WHEN e.current_tier >= 3 THEN TRUE ELSE FALSE
  END AS has_integrations,
  CASE
    WHEN e.current_tier >= 4 THEN TRUE ELSE FALSE
  END AS has_custom_avatar
FROM entitlements e
LEFT JOIN profiles p ON p.user_id = e.user_id
LEFT JOIN subscriptions s ON s.stripe_subscription_id = e.subscription_id;

COMMENT ON VIEW user_entitlements IS 'Comprehensive view of user tier and features';

-- Grant access to view
GRANT SELECT ON user_entitlements TO authenticated;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

/**
 * Check if user has feature access
 */
CREATE OR REPLACE FUNCTION user_has_feature(
  p_user_id UUID,
  p_feature_key TEXT,
  p_minimum_tier INT DEFAULT 0
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_tier INT;
BEGIN
  SELECT current_tier INTO v_current_tier
  FROM entitlements
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_current_tier >= p_minimum_tier, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION user_has_feature IS 'Check if user tier allows feature access';

/**
 * Get user's daily usage limits
 */
CREATE OR REPLACE FUNCTION get_user_limits(p_user_id UUID)
RETURNS TABLE (
  flame_limit INT,
  goals_limit INT,
  api_limit INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    flame_conversations_per_day,
    daily_goals_max,
    api_calls_per_day
  FROM entitlements
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_limits IS 'Get daily usage limits for user';

/**
 * Update streak on activity
 */
CREATE OR REPLACE FUNCTION update_streak(
  p_user_id UUID,
  p_streak_type TEXT,
  p_activity_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INT;
  v_longest_streak INT;
BEGIN
  -- Get existing streak
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM streaks
  WHERE user_id = p_user_id AND streak_type = p_streak_type;

  -- If no record, create one
  IF NOT FOUND THEN
    INSERT INTO streaks (user_id, streak_type, current_streak, longest_streak, last_activity_date)
    VALUES (p_user_id, p_streak_type, 1, 1, p_activity_date);
    RETURN;
  END IF;

  -- Check if continuing streak
  IF v_last_date = p_activity_date - INTERVAL '1 day' THEN
    -- Continue streak
    v_current_streak := v_current_streak + 1;
    v_longest_streak := GREATEST(v_current_streak, v_longest_streak);
  ELSIF v_last_date = p_activity_date THEN
    -- Same day, no change
    RETURN;
  ELSE
    -- Streak broken, restart
    v_current_streak := 1;
  END IF;

  -- Update streak
  UPDATE streaks
  SET
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_activity_date = p_activity_date,
    updated_at = NOW()
  WHERE user_id = p_user_id AND streak_type = p_streak_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_streak IS 'Update user streak on activity';

-- ============================================
-- CLEANUP FUNCTIONS
-- ============================================

/**
 * Delete old processed events (keep 90 days)
 */
CREATE OR REPLACE FUNCTION cleanup_old_processed_events()
RETURNS VOID AS $$
BEGIN
  DELETE FROM processed_events
  WHERE processed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_processed_events IS 'Delete webhook events older than 90 days';

/**
 * Delete old journal entries based on tier retention
 */
CREATE OR REPLACE FUNCTION cleanup_old_journals()
RETURNS VOID AS $$
BEGIN
  -- Delete journals for users with retention limits
  DELETE FROM journal_entries je
  USING entitlements e
  WHERE je.user_id = e.user_id
    AND e.journal_retention_days IS NOT NULL
    AND je.created_at < NOW() - (e.journal_retention_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_journals IS 'Auto-delete journals based on tier retention';
