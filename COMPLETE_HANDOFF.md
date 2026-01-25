# 🚀 RYVYNN OMEGA - COMPLETE HANDOFF PACKAGE
# Copy-Paste Deployment Guide

**Branch:** claude/ryvynn-mvp-complete-FzTfo
**Status:** 100% Ready for Production
**Date:** 2026-01-23

---

## 📋 TABLE OF CONTENTS

1. [DEPLOYMENT STEPS](#deployment-steps)
2. [DATABASE MIGRATION SQL](#database-migration-sql)
3. [ENVIRONMENT VARIABLES](#environment-variables)
4. [VERCEL CONFIGURATION](#vercel-configuration)
5. [STRIPE PRODUCTS SETUP](#stripe-products-setup)
6. [VERIFICATION CHECKLIST](#verification-checklist)

---

## 🎯 DEPLOYMENT STEPS

### STEP 1: Deploy to Vercel (5 minutes)

**Method A - Vercel Dashboard (Easiest):**
```
1. Go to: https://vercel.com/dashboard
2. Click "Add New" → "Project"
3. Import Git Repository: ryvynnlive-code/ryvynn02-14-26
4. Branch: claude/ryvynn-mvp-complete-FzTfo
5. Framework: Next.js (auto-detected)
6. Click "Deploy"
```

**Method B - Vercel CLI:**
```bash
# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

**Method C - GitHub Push (if Actions configured):**
```bash
# Just push to GitHub - auto-deploys
git push origin claude/ryvynn-mvp-complete-FzTfo
```

---

### STEP 2: Apply Database Migrations (5 minutes)

**Go to:** https://supabase.com/dashboard

1. Select your project
2. Click "SQL Editor"
3. Click "New Query"
4. Copy the ENTIRE "DATABASE MIGRATION SQL" section below
5. Paste into editor
6. Click "Run"

---

### STEP 3: Configure Stripe Webhook (2 minutes)

**Go to:** https://dashboard.stripe.com/webhooks

1. Get your Vercel URL from Step 1 (e.g., https://ryvynn.vercel.app)
2. Click "Add endpoint"
3. Endpoint URL: `https://your-vercel-url.vercel.app/api/webhooks/stripe`
4. Select these events:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
5. Click "Add endpoint"
6. Copy the "Signing secret" (starts with whsec_)
7. Go to Vercel → Settings → Environment Variables
8. Add: `STRIPE_WEBHOOK_SECRET` with the value you copied
9. Redeploy in Vercel

---

### STEP 4: Create Stripe Products (10 minutes)

**Go to:** https://dashboard.stripe.com/products

Create 5 products with monthly and annual prices:

**Product 1: RYVYNN Spark**
- Monthly: $12.00
- Annual: $120.00

**Product 2: RYVYNN Blaze**
- Monthly: $36.00
- Annual: $360.00

**Product 3: RYVYNN Radiance**
- Monthly: $64.00
- Annual: $640.00

**Product 4: RYVYNN Sovereign**
- Monthly: $96.00
- Annual: $960.00

**Product 5: RYVYNN Transcendent**
- Monthly: $936.00
- Annual: $9,360.00

After creating each price, copy the price ID (starts with `price_`) and add to Vercel environment variables.

---

## 💾 DATABASE MIGRATION SQL

**COPY EVERYTHING BELOW AND PASTE INTO SUPABASE SQL EDITOR:**

```sql
-- ============================================
-- RYVYNN OMEGA - Complete Database Migration
-- Creates: Truth Feed, Soul Tokens, Impact System
-- Tables: 9 new tables
-- Version: 1.0
-- ============================================

-- ============================================
-- TABLE: truth_posts (Anonymous Social Feed)
-- ============================================

CREATE TABLE IF NOT EXISTS truth_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 10 AND 2000),
  emotion_tag TEXT NOT NULL CHECK (emotion_tag IN ('light', 'shadow')),
  is_visible BOOLEAN DEFAULT FALSE,
  contains_crisis_keywords BOOLEAN DEFAULT FALSE,
  crisis_level TEXT CHECK (crisis_level IN ('low', 'medium', 'high')),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_truth_posts_emotion ON truth_posts(emotion_tag) WHERE is_visible = TRUE;
CREATE INDEX idx_truth_posts_created ON truth_posts(created_at DESC) WHERE is_visible = TRUE;
CREATE INDEX idx_truth_posts_user ON truth_posts(user_id);

-- ============================================
-- TABLE: truth_reads (Track who read what)
-- ============================================

CREATE TABLE IF NOT EXISTS truth_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES truth_posts(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_truth_reads_user_date ON truth_reads(user_id, read_at DESC);
CREATE INDEX idx_truth_reads_post ON truth_reads(post_id);

-- ============================================
-- TABLE: soul_tokens_personal (Growth Ledger)
-- ============================================

CREATE TABLE IF NOT EXISTS soul_tokens_personal (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_earned BIGINT DEFAULT 0,
  current_balance BIGINT DEFAULT 0,
  earned_from_truth_reading BIGINT DEFAULT 0,
  earned_from_truth_sharing BIGINT DEFAULT 0,
  earned_from_flame_conversations BIGINT DEFAULT 0,
  earned_from_journaling BIGINT DEFAULT 0,
  earned_from_check_ins BIGINT DEFAULT 0,
  avatar_stage INTEGER DEFAULT 0 CHECK (avatar_stage BETWEEN 0 AND 5),
  last_earn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_soul_tokens_personal_stage ON soul_tokens_personal(avatar_stage);

-- ============================================
-- TABLE: soul_tokens_collective (Impact Ledger)
-- ============================================

CREATE TABLE IF NOT EXISTS soul_tokens_collective (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_impact_tokens BIGINT DEFAULT 0,
  allocated_tokens BIGINT DEFAULT 0,
  impact_weight DECIMAL(5,2) DEFAULT 0.0,
  can_allocate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLE: soul_token_transactions (Audit Log)
-- ============================================

CREATE TABLE IF NOT EXISTS soul_token_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount BIGINT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earn', 'spend', 'transfer')),
  source TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_soul_token_tx_user ON soul_token_transactions(user_id, created_at DESC);

-- ============================================
-- TABLE: impact_allocations (Real-World Support)
-- ============================================

CREATE TABLE IF NOT EXISTS impact_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('emergency_ac', 'hotel', 'food', 'school', 'car_repair', 'utilities')),
  total_allocated BIGINT DEFAULT 0,
  total_fulfilled BIGINT DEFAULT 0,
  month DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, month)
);

-- ============================================
-- TABLE: help_requests (User Support Requests)
-- ============================================

CREATE TABLE IF NOT EXISTS help_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('emergency_ac', 'hotel', 'food', 'school', 'car_repair', 'utilities')),
  amount_requested DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'denied')),
  approved_amount DECIMAL(10,2),
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_help_requests_user ON help_requests(user_id);
CREATE INDEX idx_help_requests_status ON help_requests(status);

-- ============================================
-- TABLE: blessings (Random Gifts)
-- ============================================

CREATE TABLE IF NOT EXISTS blessings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blessing_type TEXT NOT NULL CHECK (blessing_type IN ('soul_tokens', 'tier_unlock', 'cosmetic', 'real_world')),
  blessing_value TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blessings_user ON blessings(user_id, status);

-- ============================================
-- TABLE: avatar_evolution_history (Stage Tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS avatar_evolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_stage INTEGER NOT NULL,
  to_stage INTEGER NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_avatar_evolution_user ON avatar_evolution_history(user_id, created_at DESC);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function: Award Soul Tokens to Personal Ledger
CREATE OR REPLACE FUNCTION award_soul_tokens_personal(
  p_user_id UUID,
  p_amount BIGINT,
  p_source TEXT
) RETURNS VOID AS $$
BEGIN
  -- Insert or update personal ledger
  INSERT INTO soul_tokens_personal (
    user_id,
    total_earned,
    current_balance,
    earned_from_truth_reading,
    earned_from_truth_sharing,
    earned_from_flame_conversations,
    earned_from_journaling,
    earned_from_check_ins,
    last_earn_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_amount,
    p_amount,
    CASE WHEN p_source = 'truth_reading' THEN p_amount ELSE 0 END,
    CASE WHEN p_source = 'truth_sharing' THEN p_amount ELSE 0 END,
    CASE WHEN p_source = 'flame_conversations' THEN p_amount ELSE 0 END,
    CASE WHEN p_source = 'journaling' THEN p_amount ELSE 0 END,
    CASE WHEN p_source = 'check_ins' THEN p_amount ELSE 0 END,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_earned = soul_tokens_personal.total_earned + p_amount,
    current_balance = soul_tokens_personal.current_balance + p_amount,
    earned_from_truth_reading = soul_tokens_personal.earned_from_truth_reading +
      CASE WHEN p_source = 'truth_reading' THEN p_amount ELSE 0 END,
    earned_from_truth_sharing = soul_tokens_personal.earned_from_truth_sharing +
      CASE WHEN p_source = 'truth_sharing' THEN p_amount ELSE 0 END,
    earned_from_flame_conversations = soul_tokens_personal.earned_from_flame_conversations +
      CASE WHEN p_source = 'flame_conversations' THEN p_amount ELSE 0 END,
    earned_from_journaling = soul_tokens_personal.earned_from_journaling +
      CASE WHEN p_source = 'journaling' THEN p_amount ELSE 0 END,
    earned_from_check_ins = soul_tokens_personal.earned_from_check_ins +
      CASE WHEN p_source = 'check_ins' THEN p_amount ELSE 0 END,
    last_earn_at = NOW(),
    updated_at = NOW();

  -- Log transaction
  INSERT INTO soul_token_transactions (user_id, amount, transaction_type, source, description)
  VALUES (p_user_id, p_amount, 'earn', p_source, 'Soul tokens earned from ' || p_source);
END;
$$ LANGUAGE plpgsql;

-- Function: Get Balanced Truth Feed (50/50 light/shadow)
CREATE OR REPLACE FUNCTION get_balanced_truth_feed(
  p_user_id UUID,
  p_limit INT DEFAULT 10
) RETURNS TABLE (
  id UUID,
  content TEXT,
  emotion_tag TEXT,
  created_at TIMESTAMPTZ,
  is_visible BOOLEAN,
  contains_crisis_keywords BOOLEAN,
  crisis_level TEXT
) AS $$
DECLARE
  light_count INT;
  shadow_count INT;
BEGIN
  light_count := p_limit / 2;
  shadow_count := p_limit - light_count;

  RETURN QUERY
  (
    -- Get light posts
    SELECT
      tp.id,
      tp.content,
      tp.emotion_tag,
      tp.created_at,
      tp.is_visible,
      tp.contains_crisis_keywords,
      tp.crisis_level
    FROM truth_posts tp
    WHERE tp.is_visible = TRUE
      AND tp.emotion_tag = 'light'
      AND (p_user_id IS NULL OR tp.id NOT IN (
        SELECT post_id FROM truth_reads WHERE user_id = p_user_id
      ))
    ORDER BY tp.created_at DESC
    LIMIT light_count
  )
  UNION ALL
  (
    -- Get shadow posts
    SELECT
      tp.id,
      tp.content,
      tp.emotion_tag,
      tp.created_at,
      tp.is_visible,
      tp.contains_crisis_keywords,
      tp.crisis_level
    FROM truth_posts tp
    WHERE tp.is_visible = TRUE
      AND tp.emotion_tag = 'shadow'
      AND (p_user_id IS NULL OR tp.id NOT IN (
        SELECT post_id FROM truth_reads WHERE user_id = p_user_id
      ))
    ORDER BY tp.created_at DESC
    LIMIT shadow_count
  )
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE truth_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE truth_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_tokens_personal ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_tokens_collective ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blessings ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_evolution_history ENABLE ROW LEVEL SECURITY;

-- Truth Posts Policies
CREATE POLICY "Anyone can view visible truth posts"
  ON truth_posts FOR SELECT
  USING (is_visible = true);

CREATE POLICY "Users can create own truth posts"
  ON truth_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own truth posts"
  ON truth_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Truth Reads Policies
CREATE POLICY "Users can view own truth reads"
  ON truth_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own truth reads"
  ON truth_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Soul Tokens Personal Policies
CREATE POLICY "Users can view own personal soul tokens"
  ON soul_tokens_personal FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own personal soul tokens"
  ON soul_tokens_personal FOR UPDATE
  USING (auth.uid() = user_id);

-- Soul Tokens Collective Policies
CREATE POLICY "Users can view own collective soul tokens"
  ON soul_tokens_collective FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view impact allocations"
  ON impact_allocations FOR SELECT
  USING (true);

-- Help Requests Policies
CREATE POLICY "Users can view own help requests"
  ON help_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own help requests"
  ON help_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Blessings Policies
CREATE POLICY "Users can view own blessings"
  ON blessings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own blessings"
  ON blessings FOR UPDATE
  USING (auth.uid() = user_id);

-- Soul Token Transactions Policies
CREATE POLICY "Users can view own transactions"
  ON soul_token_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Avatar Evolution History Policies
CREATE POLICY "Users can view own evolution history"
  ON avatar_evolution_history FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- INITIAL DATA SETUP
-- ============================================

-- Initialize Soul Token balances for existing users
INSERT INTO soul_tokens_personal (user_id, total_earned, current_balance, avatar_stage)
SELECT
  id as user_id,
  0 as total_earned,
  0 as current_balance,
  0 as avatar_stage
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO soul_tokens_collective (user_id, total_impact_tokens, allocated_tokens, impact_weight, can_allocate)
SELECT
  id as user_id,
  0 as total_impact_tokens,
  0 as allocated_tokens,
  0.0 as impact_weight,
  false as can_allocate
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RYVYNN OMEGA migration completed successfully!';
  RAISE NOTICE 'Created 9 tables, 2 functions, and RLS policies';
  RAISE NOTICE 'Tables: truth_posts, truth_reads, soul_tokens_personal, soul_tokens_collective, soul_token_transactions, impact_allocations, help_requests, blessings, avatar_evolution_history';
END $$;
```

---

## 🔐 ENVIRONMENT VARIABLES

**Add these to Vercel → Settings → Environment Variables:**

### Required (Already in Vercel - Verify)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=sk_test_or_sk_live_your_key_here
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
```

### After Creating Stripe Products (Add to Vercel)
```bash
# Spark Tier
STRIPE_PRICE_ID_SPARK_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_SPARK_ANNUAL=price_xxxxxxxxxxxxx

# Blaze Tier
STRIPE_PRICE_ID_BLAZE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BLAZE_ANNUAL=price_xxxxxxxxxxxxx

# Radiance Tier
STRIPE_PRICE_ID_RADIANCE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_RADIANCE_ANNUAL=price_xxxxxxxxxxxxx

# Sovereign Tier
STRIPE_PRICE_ID_SOVEREIGN_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_SOVEREIGN_ANNUAL=price_xxxxxxxxxxxxx

# Transcendent Tier
STRIPE_PRICE_ID_TRANSCENDENT_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_TRANSCENDENT_ANNUAL=price_xxxxxxxxxxxxx
```

### After Configuring Webhook (Add to Vercel)
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

---

## ⚙️ VERCEL CONFIGURATION

**File: `vercel.json`** (Already in repo)

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "STRIPE_SECRET_KEY": "@stripe_secret_key",
    "STRIPE_WEBHOOK_SECRET": "@stripe_webhook_secret",
    "NEXT_PUBLIC_APP_URL": "@next_public_app_url"
  },
  "regions": ["iad1"]
}
```

---

## 💳 STRIPE PRODUCTS SETUP

### Product Descriptions (Copy for Stripe Dashboard)

**Spark ($12/mo or $120/yr)**
```
Unlimited Truth Feed reading
3 anonymous posts per day
Soul Token earning (2x rate)
Avatar evolution to Ember stage
25 Flame conversations/day
```

**Blaze ($36/mo or $360/yr)**
```
Everything in Spark, plus:
10 anonymous posts per day
Soul Token earning (5x rate)
Avatar evolution to Flame stage
Unlimited Flame conversations
```

**Radiance ($64/mo or $640/yr)**
```
Everything in Blaze, plus:
25 anonymous posts per day
Soul Token earning (8x rate)
Impact allocation rights
Avatar evolution to Pillar stage
Priority response from Flame
```

**Sovereign ($96/mo or $960/yr)**
```
Everything in Radiance, plus:
Unlimited anonymous posts
Soul Token earning (10x rate)
Avatar evolution to Beacon stage
All features unlocked
```

**Transcendent ($936/mo or $9360/yr)**
```
Ultimate tier with all features
Soul Token earning (15x rate)
Avatar evolution to Sovereign stage
Priority support
First access to new features
Maximum impact allocation weight
```

---

## ✅ VERIFICATION CHECKLIST

After deployment, test these features:

### Basic Functionality
- [ ] Visit production URL
- [ ] Truth Feed displays as first screen
- [ ] Can view posts without login (up to 3 for free tier)
- [ ] Sign up creates new account
- [ ] Login works correctly

### Truth Feed
- [ ] Can create anonymous post (after login)
- [ ] Choose light or shadow emotion
- [ ] Post appears in feed
- [ ] Character limit enforced (10-2000)
- [ ] Crisis keywords detected (test with "suicide" - should be held)

### Soul Tokens
- [ ] Tokens awarded for reading posts
- [ ] Tokens awarded for creating posts
- [ ] Balance shows in profile/dashboard
- [ ] Transaction history visible

### Subscriptions
- [ ] Free tier limited to 3 reads/day
- [ ] Upgrade button shows Stripe checkout
- [ ] Test card works: 4242 4242 4242 4242
- [ ] After purchase, tier updates
- [ ] New limits apply immediately
- [ ] Webhook shows successful calls in Stripe

### Database
- [ ] All 9 tables created
- [ ] No errors in Supabase logs
- [ ] RLS policies working (users can't see each other's data)

---

## 🚨 TROUBLESHOOTING

### Build Fails
```
Problem: Build fails in Vercel
Solution:
1. Check Vercel build logs for specific error
2. Verify all environment variables are set
3. Ensure Node.js 18+ is selected in Vercel
4. Try: npm run build locally first
```

### Truth Feed Not Loading
```
Problem: Page shows error or no posts
Solution:
1. Apply database migrations (Step 2)
2. Check browser console for errors
3. Verify Supabase credentials in Vercel
4. Check Supabase logs for errors
```

### Subscriptions Not Working
```
Problem: Checkout succeeds but tier doesn't update
Solution:
1. Configure Stripe webhook (Step 3)
2. Verify STRIPE_WEBHOOK_SECRET in Vercel
3. Check Stripe webhook logs
4. Check Vercel function logs
5. Redeploy after adding webhook secret
```

### Posts Not Appearing
```
Problem: Created posts don't show in feed
Solution:
1. Check if post was flagged for crisis keywords
2. Posts start with is_visible=false for safety
3. Check truth_posts table in Supabase
4. Admins need to approve first posts (optional)
```

---

## 📞 QUICK REFERENCE LINKS

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Webhooks:** https://dashboard.stripe.com/webhooks
- **Stripe Products:** https://dashboard.stripe.com/products

---

## 🎉 SUCCESS CRITERIA

Your deployment is complete when:

✅ Vercel shows "Ready" status
✅ Production URL loads without errors
✅ Truth Feed displays on home page
✅ Can create and view anonymous posts
✅ Soul Tokens are awarded
✅ Stripe checkout redirects correctly
✅ Webhook processes subscriptions
✅ Tier limits are enforced

---

## 📊 WHAT'S DEPLOYED

- **Truth Feed:** Anonymous social feed (first screen)
- **Soul Tokens:** Dual-ledger tracking system
- **6-Tier Pricing:** Free to Transcendent ($0-$936/mo)
- **Avatar Evolution:** 6 stages (Ember → Sovereign)
- **Crisis Detection:** Auto-hold concerning posts
- **Real-World Impact:** Infrastructure ready (Phase 2)
- **Stripe Integration:** Full subscription management
- **Database:** 9 tables with RLS policies

---

**Branch:** claude/ryvynn-mvp-complete-FzTfo
**Status:** 100% Ready
**Total Deployment Time:** ~20 minutes

🚀 **START DEPLOYMENT NOW!** 🚀
