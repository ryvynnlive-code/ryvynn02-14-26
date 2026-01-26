-- ============================================================================
-- Migration 009: Webhook Support Tables
-- Created: 2026-01-26
-- Description: Tables for Stripe webhook processing, payment tracking, and entitlements
-- ============================================================================

-- ============================================================================
-- PROCESSED EVENTS TABLE (Idempotency Tracking)
-- ============================================================================
-- Prevents duplicate webhook event processing
CREATE TABLE IF NOT EXISTS processed_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_processed_events_stripe_id ON processed_events(stripe_event_id);
CREATE INDEX idx_processed_events_type ON processed_events(event_type);

COMMENT ON TABLE processed_events IS 'Idempotency tracking for Stripe webhook events';

-- ============================================================================
-- PAYMENT EVENTS TABLE (Payment Audit Log)
-- ============================================================================
-- Tracks all payment attempts (success and failure)
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stripe_invoice_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd' NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_payment_events_invoice ON payment_events(stripe_invoice_id);
CREATE INDEX idx_payment_events_subscription ON payment_events(stripe_subscription_id);
CREATE INDEX idx_payment_events_customer ON payment_events(stripe_customer_id);
CREATE INDEX idx_payment_events_status ON payment_events(status, created_at DESC);

COMMENT ON TABLE payment_events IS 'Audit log of all payment events from Stripe';

-- ============================================================================
-- ENTITLEMENTS TABLE (Feature Gates)
-- ============================================================================
-- User-specific feature limits and access
CREATE TABLE IF NOT EXISTS entitlements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_tier INT DEFAULT 0 NOT NULL,
  tier_version TEXT DEFAULT 'OMEGA_v1.0',

  -- Rate limits
  flame_conversations_per_day INT DEFAULT 5,
  daily_goals_max INT DEFAULT 0,
  api_calls_per_day INT DEFAULT 0,
  journal_retention_days INT DEFAULT 0,
  truth_reads_per_day INT DEFAULT 3,
  truth_posts_per_day INT DEFAULT 0,

  -- Feature access (stored as JSONB for flexibility)
  features JSONB DEFAULT '{
    "truth_feed_read": true,
    "truth_feed_post": false,
    "flame_dialogues": true,
    "journaling": false,
    "avatar_evolution": false,
    "analytics": false,
    "voice": false,
    "integrations": false,
    "impact_allocation": false,
    "blessings": false
  }'::JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_entitlements_user ON entitlements(user_id);
CREATE INDEX idx_entitlements_tier ON entitlements(current_tier);

COMMENT ON TABLE entitlements IS 'User feature entitlements based on subscription tier';
COMMENT ON COLUMN entitlements.current_tier IS '0=Free, 1=Spark, 2=Blaze, 3=Radiance, 4=Sovereign, 5=Transcendent';

-- ============================================================================
-- UPDATE PROFILES TABLE
-- ============================================================================
-- Add current_tier for quick access
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS current_tier INT DEFAULT 0;

COMMENT ON COLUMN profiles.current_tier IS 'Current subscription tier (0-5)';

-- Update roles column to JSONB if it's currently TEXT[]
-- (This handles the case where it was created as TEXT[] in initial migration)
DO $$
BEGIN
  -- Check if column is TEXT[] and convert to JSONB if needed
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
    AND column_name = 'roles'
    AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE profiles
      ALTER COLUMN roles TYPE JSONB USING to_jsonb(roles);
  END IF;
END $$;

-- ============================================================================
-- UPDATE SUBSCRIPTIONS TABLE
-- ============================================================================
-- Add missing columns for webhook handler
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS price_id TEXT,
  ADD COLUMN IF NOT EXISTS tier INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Create index for customer ID lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_customer_id ON subscriptions(stripe_customer_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Processed Events (service role only)
ALTER TABLE processed_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage processed events"
  ON processed_events FOR ALL
  USING (auth.role() = 'service_role');

-- Payment Events (service role only for writes, users can read own)
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage payment events"
  ON payment_events FOR ALL
  USING (auth.role() = 'service_role');

-- Entitlements (users can read own, service role can manage)
ALTER TABLE entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entitlements"
  ON entitlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage entitlements"
  ON entitlements FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on entitlements
CREATE TRIGGER update_entitlements_updated_at
  BEFORE UPDATE ON entitlements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create entitlements on user signup
CREATE OR REPLACE FUNCTION create_user_entitlements()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO entitlements (user_id, current_tier)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_entitlements'
  ) THEN
    CREATE TRIGGER on_auth_user_created_entitlements
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION create_user_entitlements();
  END IF;
END $$;

-- ============================================================================
-- SEED FREE TIER ENTITLEMENTS FOR EXISTING USERS
-- ============================================================================
-- Ensure all existing users have entitlements
INSERT INTO entitlements (user_id, current_tier)
SELECT user_id, COALESCE(current_tier, 0)
FROM profiles
WHERE user_id NOT IN (SELECT user_id FROM entitlements)
ON CONFLICT (user_id) DO NOTHING;
