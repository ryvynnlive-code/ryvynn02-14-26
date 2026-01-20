-- RYVYNN Initial Database Schema
-- Created: 2026-01-20
-- Description: Core tables for RYVYNN mental wellness app

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Stores user profile information linked to Supabase Auth
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'premium')),
  roles TEXT[] DEFAULT ARRAY[]::TEXT[] NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  email TEXT
);

-- Create index for faster lookups
CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
-- Stores Stripe subscription state
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired', 'trialing')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for faster lookups
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- JOURNAL ENTRIES TABLE
-- ============================================================================
-- Stores encrypted journal entries with client-side encryption
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Encrypted content (AES-GCM ciphertext as base64)
  ciphertext TEXT NOT NULL,
  -- Initialization vector (IV) for AES-GCM as base64
  iv TEXT NOT NULL,
  -- Algorithm version for future-proofing
  algo_version TEXT DEFAULT 'AES-GCM-256' NOT NULL,
  -- Optional tags (not encrypted, for filtering)
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  -- Additional metadata (not encrypted)
  metadata JSONB DEFAULT '{}'::JSONB
);

-- Create indexes for faster queries
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);

-- ============================================================================
-- USAGE DAILY TABLE
-- ============================================================================
-- Tracks daily usage for rate limiting
CREATE TABLE usage_daily (
  user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  flame_calls INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, date)
);

-- Create index for faster lookups
CREATE INDEX idx_usage_daily_date ON usage_daily(date DESC);

-- ============================================================================
-- EVENTS TABLE
-- ============================================================================
-- Stores minimal analytics events (no PHI/journal content)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  -- Index for filtering by type and date
  CHECK (event_type IN ('app_open', 'flame_call', 'crisis_shown', 'journal_created', 'subscription_started', 'subscription_canceled'))
);

-- Create indexes for analytics queries
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_user_id ON events(user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_daily_updated_at BEFORE UPDATE ON usage_daily
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE (for future use - profile pictures, exports, etc.)
-- ============================================================================

-- Create storage bucket for user exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-exports', 'user-exports', false)
ON CONFLICT (id) DO NOTHING;
