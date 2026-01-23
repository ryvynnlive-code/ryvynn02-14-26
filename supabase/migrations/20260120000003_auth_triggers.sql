-- RYVYNN Auth Triggers and Helper Functions
-- Created: 2026-01-20
-- Description: Automatically create profile when user signs up

-- ============================================================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================================================

-- Function to create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, plan, roles)
  VALUES (
    NEW.id,
    NEW.email,
    'free',
    ARRAY[]::TEXT[]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has premium access
CREATE OR REPLACE FUNCTION public.has_premium_access(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_plan TEXT;
  v_has_active_sub BOOLEAN;
BEGIN
  -- Get user's current plan
  SELECT plan INTO v_plan
  FROM profiles
  WHERE user_id = p_user_id;

  -- If plan is already marked as premium, check if subscription is still active
  IF v_plan = 'premium' THEN
    SELECT EXISTS(
      SELECT 1
      FROM subscriptions
      WHERE user_id = p_user_id
        AND status IN ('active', 'trialing')
        AND current_period_end > NOW()
    ) INTO v_has_active_sub;

    RETURN v_has_active_sub;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's daily usage limit
CREATE OR REPLACE FUNCTION public.get_daily_flame_limit(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_has_premium BOOLEAN;
BEGIN
  v_has_premium := public.has_premium_access(p_user_id);

  IF v_has_premium THEN
    RETURN 100; -- Premium limit
  ELSE
    RETURN 5;   -- Free limit
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can make flame call
CREATE OR REPLACE FUNCTION public.can_make_flame_call(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage INTEGER;
  v_daily_limit INTEGER;
BEGIN
  -- Get current usage for today
  SELECT COALESCE(flame_calls, 0) INTO v_current_usage
  FROM usage_daily
  WHERE user_id = p_user_id
    AND date = CURRENT_DATE;

  -- If no record exists, usage is 0
  v_current_usage := COALESCE(v_current_usage, 0);

  -- Get daily limit based on plan
  v_daily_limit := public.get_daily_flame_limit(p_user_id);

  -- Check if under limit
  RETURN v_current_usage < v_daily_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment flame call usage
CREATE OR REPLACE FUNCTION public.increment_flame_usage(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_daily (user_id, date, flame_calls)
  VALUES (p_user_id, CURRENT_DATE, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    flame_calls = usage_daily.flame_calls + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ANALYTICS HELPER FUNCTIONS
-- ============================================================================

-- Function to get active users in last N days
CREATE OR REPLACE FUNCTION public.get_active_users_count(days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM events
    WHERE created_at >= NOW() - (days || ' days')::INTERVAL
      AND user_id IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total premium subscribers
CREATE OR REPLACE FUNCTION public.get_premium_subscribers_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT user_id)
    FROM subscriptions
    WHERE status IN ('active', 'trialing')
      AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get flame calls today
CREATE OR REPLACE FUNCTION public.get_flame_calls_today()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(flame_calls), 0)::INTEGER
    FROM usage_daily
    WHERE date = CURRENT_DATE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
