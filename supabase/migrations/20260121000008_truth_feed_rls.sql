/**
 * Migration 008: RLS Policies for Truth Feed + Soul Tokens
 */

-- ============================================
-- TRUTH POSTS RLS
-- ============================================

ALTER TABLE truth_posts ENABLE ROW LEVEL SECURITY;

-- Users can create their own truth posts
CREATE POLICY "Users can create own truth posts"
  ON truth_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view visible truth posts (public feed)
CREATE POLICY "Anyone can view visible truth posts"
  ON truth_posts FOR SELECT
  USING (is_visible = true);

-- Users can view their own posts (even if not visible yet)
CREATE POLICY "Users can view own truth posts"
  ON truth_posts FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can update any truth post (moderation)
CREATE POLICY "Admins can moderate truth posts"
  ON truth_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.roles @> '["admin"]'::jsonb
    )
  );


-- ============================================
-- TRUTH READS RLS
-- ============================================

ALTER TABLE truth_reads ENABLE ROW LEVEL SECURITY;

-- Users can track their own reads
CREATE POLICY "Users can track own reads"
  ON truth_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own read history
CREATE POLICY "Users can view own reads"
  ON truth_reads FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================
-- SOUL TOKENS PERSONAL RLS
-- ============================================

ALTER TABLE soul_tokens_personal ENABLE ROW LEVEL SECURITY;

-- Users can view their own personal ledger
CREATE POLICY "Users can view own personal soul tokens"
  ON soul_tokens_personal FOR SELECT
  USING (auth.uid() = user_id);

-- No direct updates (use award_soul_tokens_personal function)


-- ============================================
-- SOUL TOKENS COLLECTIVE RLS
-- ============================================

ALTER TABLE soul_tokens_collective ENABLE ROW LEVEL SECURITY;

-- Users can view their own collective ledger
CREATE POLICY "Users can view own collective soul tokens"
  ON soul_tokens_collective FOR SELECT
  USING (auth.uid() = user_id);


-- ============================================
-- SOUL TOKEN TRANSACTIONS RLS
-- ============================================

ALTER TABLE soul_token_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transaction history
CREATE POLICY "Users can view own transactions"
  ON soul_token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON soul_token_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.roles @> '["admin"]'::jsonb
    )
  );


-- ============================================
-- IMPACT ALLOCATIONS RLS
-- ============================================

ALTER TABLE impact_allocations ENABLE ROW LEVEL SECURITY;

-- All users can view impact allocations (transparency)
CREATE POLICY "Anyone can view impact allocations"
  ON impact_allocations FOR SELECT
  USING (true);

-- Only admins can create/update
CREATE POLICY "Admins can manage impact allocations"
  ON impact_allocations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.roles @> '["admin"]'::jsonb
    )
  );


-- ============================================
-- HELP REQUESTS RLS
-- ============================================

ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own help requests
CREATE POLICY "Users can create own help requests"
  ON help_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own help requests
CREATE POLICY "Users can view own help requests"
  ON help_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view/update all help requests
CREATE POLICY "Admins can manage help requests"
  ON help_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.roles @> '["admin"]'::jsonb
    )
  );


-- ============================================
-- BLESSINGS RLS
-- ============================================

ALTER TABLE blessings ENABLE ROW LEVEL SECURITY;

-- Users can view their own blessings
CREATE POLICY "Users can view own blessings"
  ON blessings FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own blessings (redeem)
CREATE POLICY "Users can redeem own blessings"
  ON blessings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (status IN ('delivered', 'redeemed'));

-- Admins can create blessings
CREATE POLICY "Admins can create blessings"
  ON blessings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.roles @> '["admin"]'::jsonb
    )
  );


-- ============================================
-- AVATAR EVOLUTION HISTORY RLS
-- ============================================

ALTER TABLE avatar_evolution_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own evolution history
CREATE POLICY "Users can view own evolution"
  ON avatar_evolution_history FOR SELECT
  USING (auth.uid() = user_id);

-- Service role inserts evolution events (no direct user access)
