/**
 * Migration 007: Truth Feed + Soul Tokens (RYVYNN OMEGA)
 * Creates anonymous truth sharing system and dual-ledger Soul Token tracking
 */

-- ============================================
-- TRUTH POSTS (ANONYMOUS FEED)
-- ============================================

CREATE TABLE IF NOT EXISTS truth_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Content
  content TEXT NOT NULL CHECK (length(content) >= 10 AND length(content) <= 2000),
  emotion_tag TEXT NOT NULL CHECK (emotion_tag IN ('light', 'shadow')),

  -- Anonymity (no way to identify user from post)
  post_hash TEXT NOT NULL UNIQUE, -- hash of content + timestamp for dedup

  -- Moderation
  is_visible BOOLEAN DEFAULT FALSE, -- requires approval or auto-approved based on user trust
  is_flagged BOOLEAN DEFAULT FALSE,
  flagged_reason TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),

  -- Crisis detection
  contains_crisis_keywords BOOLEAN DEFAULT FALSE,
  crisis_level TEXT CHECK (crisis_level IN ('none', 'low', 'medium', 'high')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  view_count INT DEFAULT 0,

  -- Indexes
  CONSTRAINT emotion_balance CHECK (emotion_tag IN ('light', 'shadow'))
);

CREATE INDEX idx_truth_posts_visible ON truth_posts(is_visible, created_at DESC) WHERE is_visible = true;
CREATE INDEX idx_truth_posts_emotion ON truth_posts(emotion_tag, is_visible) WHERE is_visible = true;
CREATE INDEX idx_truth_posts_user ON truth_posts(user_id);
CREATE INDEX idx_truth_posts_crisis ON truth_posts(contains_crisis_keywords) WHERE contains_crisis_keywords = true;

COMMENT ON TABLE truth_posts IS 'Anonymous truth feed posts (public, no profiles)';
COMMENT ON COLUMN truth_posts.emotion_tag IS 'light=progress/hope, shadow=pain/struggle';
COMMENT ON COLUMN truth_posts.is_visible IS 'false=pending review, true=published';


-- ============================================
-- TRUTH READS (TRACK WHO READ WHAT)
-- ============================================

CREATE TABLE IF NOT EXISTS truth_reads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  truth_post_id UUID REFERENCES truth_posts(id) ON DELETE CASCADE NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, truth_post_id)
);

CREATE INDEX idx_truth_reads_user_date ON truth_reads(user_id, read_at DESC);
CREATE INDEX idx_truth_reads_post ON truth_reads(truth_post_id);

COMMENT ON TABLE truth_reads IS 'Tracks which posts users have read (for limits + Soul Tokens)';


-- ============================================
-- SOUL TOKENS - PERSONAL LEDGER (PRIVATE)
-- ============================================

CREATE TABLE IF NOT EXISTS soul_tokens_personal (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Balances
  total_earned BIGINT DEFAULT 0,
  total_spent BIGINT DEFAULT 0,
  current_balance BIGINT DEFAULT 0,

  -- Sources (breakdown of earnings)
  earned_from_truth_reading BIGINT DEFAULT 0,
  earned_from_truth_sharing BIGINT DEFAULT 0,
  earned_from_check_ins BIGINT DEFAULT 0,
  earned_from_journaling BIGINT DEFAULT 0,
  earned_from_returning BIGINT DEFAULT 0,
  earned_from_blessings BIGINT DEFAULT 0,

  -- Avatar evolution tracking
  avatar_stage INT DEFAULT 0 CHECK (avatar_stage BETWEEN 0 AND 5),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_soul_tokens_personal_user ON soul_tokens_personal(user_id);
CREATE INDEX idx_soul_tokens_personal_balance ON soul_tokens_personal(current_balance DESC);

COMMENT ON TABLE soul_tokens_personal IS 'Private ledger: personal growth tracking';
COMMENT ON COLUMN soul_tokens_personal.current_balance IS 'Available Soul Tokens for personal use';


-- ============================================
-- SOUL TOKENS - COLLECTIVE LEDGER (AGGREGATE)
-- ============================================

CREATE TABLE IF NOT EXISTS soul_tokens_collective (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Impact allocation
  total_impact_tokens BIGINT DEFAULT 0,
  allocated_tokens BIGINT DEFAULT 0,
  pending_tokens BIGINT DEFAULT 0,

  -- Weight multiplier (based on tier)
  impact_weight DECIMAL(3,1) DEFAULT 1.0,

  -- Participation
  can_allocate BOOLEAN DEFAULT FALSE,
  allocations_made INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

CREATE INDEX idx_soul_tokens_collective_user ON soul_tokens_collective(user_id);
CREATE INDEX idx_soul_tokens_collective_allocatable ON soul_tokens_collective(can_allocate) WHERE can_allocate = true;

COMMENT ON TABLE soul_tokens_collective IS 'Collective ledger: real-world impact allocation rights';
COMMENT ON COLUMN soul_tokens_collective.total_impact_tokens IS 'Accumulated tokens for impact decisions';


-- ============================================
-- SOUL TOKEN TRANSACTIONS (AUDIT LOG)
-- ============================================

CREATE TABLE IF NOT EXISTS soul_token_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Transaction details
  ledger_type TEXT NOT NULL CHECK (ledger_type IN ('personal', 'collective')),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'transfer', 'blessing')),
  amount BIGINT NOT NULL,

  -- Source/reason
  source TEXT NOT NULL, -- 'truth_read', 'truth_post', 'check_in', 'journal', 'blessing', etc.
  source_id UUID, -- reference to source entity (truth_post.id, journal_entry.id, etc.)

  -- Metadata
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_soul_token_transactions_user ON soul_token_transactions(user_id, created_at DESC);
CREATE INDEX idx_soul_token_transactions_type ON soul_token_transactions(transaction_type, created_at DESC);

COMMENT ON TABLE soul_token_transactions IS 'Immutable audit log of all Soul Token movements';


-- ============================================
-- IMPACT ALLOCATIONS (REAL-WORLD SUPPORT)
-- ============================================

CREATE TABLE IF NOT EXISTS impact_allocations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Allocation period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Pool info
  total_pool_amount DECIMAL(10,2) NOT NULL, -- USD available for this period
  total_tokens_in_pool BIGINT NOT NULL,

  -- Categories
  category TEXT NOT NULL CHECK (category IN ('emergency_ac', 'hotel', 'food', 'school', 'car_repair', 'utilities')),
  category_allocation DECIMAL(10,2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'collecting' CHECK (status IN ('collecting', 'distributing', 'completed')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  UNIQUE(period_start, category)
);

CREATE INDEX idx_impact_allocations_period ON impact_allocations(period_start DESC);
CREATE INDEX idx_impact_allocations_status ON impact_allocations(status);

COMMENT ON TABLE impact_allocations IS 'Real-world impact pool tracking (AC repair, hotel, food, etc.)';


-- ============================================
-- HELP REQUESTS (USER SIDE)
-- ============================================

CREATE TABLE IF NOT EXISTS help_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Request details
  category TEXT NOT NULL CHECK (category IN ('emergency_ac', 'hotel', 'food', 'school', 'car_repair', 'utilities')),
  amount_requested DECIMAL(10,2),
  explanation TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'denied', 'expired')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  review_notes TEXT,

  -- Fulfillment
  fulfilled_at TIMESTAMPTZ,
  fulfillment_method TEXT, -- 'vendor_direct', 'gift_card', etc.
  fulfillment_confirmation TEXT,

  -- Privacy
  request_hash TEXT NOT NULL UNIQUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_help_requests_user ON help_requests(user_id);
CREATE INDEX idx_help_requests_status ON help_requests(status, created_at DESC);
CREATE INDEX idx_help_requests_category ON help_requests(category, status);

COMMENT ON TABLE help_requests IS 'User requests for real-world support (no-shame flow)';


-- ============================================
-- BLESSINGS (RANDOM GIFTS)
-- ============================================

CREATE TABLE IF NOT EXISTS blessings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Blessing details
  blessing_type TEXT NOT NULL CHECK (blessing_type IN ('soul_tokens', 'tier_unlock', 'cosmetic', 'real_world')),
  blessing_value TEXT NOT NULL, -- JSON: {"tokens": 100} or {"tier": 2} or {"item": "grocery_card"}

  -- Delivery
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'redeemed', 'expired')),
  delivered_at TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',

  -- Source
  source TEXT NOT NULL, -- 'algorithm', 'manual', 'milestone'

  -- Metadata
  message TEXT, -- optional blessing message
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blessings_user ON blessings(user_id, status);
CREATE INDEX idx_blessings_type ON blessings(blessing_type, status);

COMMENT ON TABLE blessings IS 'Random grace gifts (digital + real-world)';


-- ============================================
-- AVATAR EVOLUTION (STAGES)
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_evolution_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Evolution
  from_stage INT NOT NULL,
  to_stage INT NOT NULL,
  stage_name TEXT NOT NULL, -- 'Ember', 'Flame', 'Pillar', 'Beacon', 'Sovereign'

  -- Trigger
  triggered_by TEXT NOT NULL, -- 'truth_consistency', 'return_after_lapse', 'milestone', etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_avatar_evolution_user ON avatar_evolution_history(user_id, created_at DESC);

COMMENT ON TABLE avatar_evolution_history IS 'Immutable log of avatar stage progressions';


-- ============================================
-- TRIGGERS FOR SOUL TOKENS
-- ============================================

-- Auto-create Soul Token ledgers on user signup
CREATE OR REPLACE FUNCTION create_soul_token_ledgers()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO soul_tokens_personal (user_id, current_balance, avatar_stage)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO soul_tokens_collective (user_id, can_allocate)
  VALUES (NEW.id, false)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_soul_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_soul_token_ledgers();


-- Update truth post view count
CREATE OR REPLACE FUNCTION increment_truth_post_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE truth_posts
  SET view_count = view_count + 1
  WHERE id = NEW.truth_post_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_truth_read_increment_views
  AFTER INSERT ON truth_reads
  FOR EACH ROW
  EXECUTE FUNCTION increment_truth_post_views();


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

/**
 * Award Soul Tokens (Personal Ledger)
 */
CREATE OR REPLACE FUNCTION award_soul_tokens_personal(
  p_user_id UUID,
  p_amount BIGINT,
  p_source TEXT,
  p_source_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update personal ledger
  UPDATE soul_tokens_personal
  SET
    total_earned = total_earned + p_amount,
    current_balance = current_balance + p_amount,
    updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Update source breakdown
  UPDATE soul_tokens_personal
  SET
    earned_from_truth_reading = CASE WHEN p_source = 'truth_read' THEN earned_from_truth_reading + p_amount ELSE earned_from_truth_reading END,
    earned_from_truth_sharing = CASE WHEN p_source = 'truth_post' THEN earned_from_truth_sharing + p_amount ELSE earned_from_truth_sharing END,
    earned_from_check_ins = CASE WHEN p_source = 'check_in' THEN earned_from_check_ins + p_amount ELSE earned_from_check_ins END,
    earned_from_journaling = CASE WHEN p_source = 'journal' THEN earned_from_journaling + p_amount ELSE earned_from_journaling END,
    earned_from_returning = CASE WHEN p_source = 'return' THEN earned_from_returning + p_amount ELSE earned_from_returning END,
    earned_from_blessings = CASE WHEN p_source = 'blessing' THEN earned_from_blessings + p_amount ELSE earned_from_blessings END
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO soul_token_transactions (user_id, ledger_type, transaction_type, amount, source, source_id, description)
  VALUES (p_user_id, 'personal', 'earn', p_amount, p_source, p_source_id, 'Soul Tokens earned');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION award_soul_tokens_personal IS 'Award Soul Tokens to personal ledger (private growth)';


/**
 * Get Truth Feed with 50/50 balance
 */
CREATE OR REPLACE FUNCTION get_balanced_truth_feed(
  p_user_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  emotion_tag TEXT,
  created_at TIMESTAMPTZ,
  view_count INT
) AS $$
DECLARE
  v_light_count INT;
  v_shadow_count INT;
BEGIN
  v_light_count := p_limit / 2;
  v_shadow_count := p_limit - v_light_count;

  RETURN QUERY
  (
    SELECT tp.id, tp.content, tp.emotion_tag, tp.created_at, tp.view_count
    FROM truth_posts tp
    WHERE tp.is_visible = true
      AND tp.emotion_tag = 'light'
      AND tp.id NOT IN (
        SELECT truth_post_id FROM truth_reads WHERE user_id = p_user_id
      )
    ORDER BY tp.created_at DESC
    LIMIT v_light_count
  )
  UNION ALL
  (
    SELECT tp.id, tp.content, tp.emotion_tag, tp.created_at, tp.view_count
    FROM truth_posts tp
    WHERE tp.is_visible = true
      AND tp.emotion_tag = 'shadow'
      AND tp.id NOT IN (
        SELECT truth_post_id FROM truth_reads WHERE user_id = p_user_id
      )
    ORDER BY tp.created_at DESC
    LIMIT v_shadow_count
  )
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_balanced_truth_feed IS 'Returns truth feed with 50% light, 50% shadow';


-- ============================================
-- UPDATE EXISTING TABLES
-- ============================================

-- Add truth feed limits to entitlements
ALTER TABLE entitlements
  ADD COLUMN IF NOT EXISTS truth_reads_per_day INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS truth_posts_per_day INT DEFAULT 0;

COMMENT ON COLUMN entitlements.truth_reads_per_day IS '-1 = unlimited, 0 = none, N = daily limit';
COMMENT ON COLUMN entitlements.truth_posts_per_day IS '-1 = unlimited, 0 = none, N = daily limit';
