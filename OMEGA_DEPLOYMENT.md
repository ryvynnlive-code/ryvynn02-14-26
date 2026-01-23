# RYVYNN OMEGA - Deployment Guide

## Overview

RYVYNN OMEGA is now implemented with the following core features:

### ✅ Implemented
- **Truth Feed** - Anonymous posting with light/shadow emotion tags
- **Soul Token System** - Dual-ledger (personal + collective) tracking
- **6-Tier Pricing** - Free/Spark/Blaze/Radiance/Sovereign/Transcendent
- **Avatar Evolution** - Stage progression based on engagement
- **Crisis Detection** - Auto-hold posts with self-harm keywords
- **Real-World Impact Infrastructure** - Tables ready for help requests, blessings, allocations

### 🚧 Pending Deployment Steps
1. Apply Supabase migrations
2. Configure Stripe products and prices
3. Set environment variables
4. Deploy to Vercel

---

## Step 1: Apply Supabase Migrations

The following migration files need to be applied to your Supabase project:

### Migration Files
- `supabase/migrations/20260121000007_truth_feed_soul_tokens.sql` - Core OMEGA tables
- `supabase/migrations/20260121000008_truth_feed_rls.sql` - Row Level Security policies

### Tables Created
1. **truth_posts** - Anonymous posts with emotion tags
2. **truth_reads** - Tracking who read what
3. **soul_tokens_personal** - Private growth ledger
4. **soul_tokens_collective** - Impact allocation rights
5. **soul_token_transactions** - Audit log
6. **impact_allocations** - Real-world support pools
7. **help_requests** - User support requests
8. **blessings** - Random gifts
9. **avatar_evolution_history** - Stage progression tracking

### How to Apply

**Option A: Supabase CLI**
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

**Option B: Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of each migration file
4. Run them in order (007, then 008)

---

## Step 2: Configure Stripe Products

You need to create 5 products in Stripe with 2 prices each (monthly + annual):

### Products to Create

| Tier | Name | Monthly Price | Annual Price |
|------|------|--------------|--------------|
| 1 | Spark | $12 | $120 |
| 2 | Blaze | $36 | $360 |
| 3 | Radiance | $64 | $640 |
| 4 | Sovereign | $96 | $960 |
| 5 | Transcendent | $936 | $9,360 |

### Steps in Stripe Dashboard

1. Go to https://dashboard.stripe.com/products
2. For each tier, click "Add product"
3. Set name, description, and create two recurring prices
4. Copy the price IDs (format: `price_xxxxxxxxxxxxxxxx`)
5. Add price IDs to your environment variables

---

## Step 3: Set Environment Variables

Add the following to your `.env.local` file:

```bash
# Stripe Price IDs - Tier 1 (Spark)
STRIPE_PRICE_ID_SPARK_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_SPARK_ANNUAL=price_xxxxxxxxxxxxx

# Stripe Price IDs - Tier 2 (Blaze)
STRIPE_PRICE_ID_BLAZE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_BLAZE_ANNUAL=price_xxxxxxxxxxxxx

# Stripe Price IDs - Tier 3 (Radiance)
STRIPE_PRICE_ID_RADIANCE_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_RADIANCE_ANNUAL=price_xxxxxxxxxxxxx

# Stripe Price IDs - Tier 4 (Sovereign)
STRIPE_PRICE_ID_SOVEREIGN_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_SOVEREIGN_ANNUAL=price_xxxxxxxxxxxxx

# Stripe Price IDs - Tier 5 (Transcendent)
STRIPE_PRICE_ID_TRANSCENDENT_MONTHLY=price_xxxxxxxxxxxxx
STRIPE_PRICE_ID_TRANSCENDENT_ANNUAL=price_xxxxxxxxxxxxx

# Existing environment variables (keep as-is)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 4: Deploy to Vercel

### Initial Setup
```bash
# Install Vercel CLI if not already installed
npm install -g vercel

# Link project (if first time)
vercel link

# Add environment variables to Vercel
vercel env add STRIPE_PRICE_ID_SPARK_MONTHLY
vercel env add STRIPE_PRICE_ID_SPARK_ANNUAL
# ... (repeat for all environment variables)
```

### Deploy
```bash
# Deploy to production
vercel --prod
```

### Configure Stripe Webhook
1. Get your deployed URL (e.g., `https://ryvynn.vercel.app`)
2. In Stripe Dashboard, go to Webhooks
3. Add endpoint: `https://ryvynn.vercel.app/api/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy webhook signing secret and add to Vercel env vars

---

## Step 5: Initialize User Soul Token Balances

After deploying, you'll need to initialize Soul Token balances for all existing users:

```sql
-- Run this in Supabase SQL Editor
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
```

---

## Verification Checklist

After deployment, verify the following:

- [ ] Truth Feed loads on home page
- [ ] Users can create anonymous posts (light/shadow)
- [ ] Soul Tokens are awarded for reading posts
- [ ] Soul Tokens are awarded for creating posts
- [ ] Daily read limits are enforced for Free tier
- [ ] Crisis keyword detection works (posts held for review)
- [ ] Stripe checkout works for all 5 paid tiers
- [ ] Webhook processes subscription events correctly
- [ ] Entitlements sync properly after subscription changes

---

## OMEGA Features Not Yet Active

The following OMEGA features have database infrastructure but require operational setup:

### Phase 2 (Deferred)
- **Real-World Impact Fulfillment** - Requires vendor partnerships
- **Help Request Approval Queue** - Needs admin UI
- **Blessing Distribution** - Needs scheduling system
- **Impact Allocation Voting** - Needs UI for collective decisions

These can be activated once:
1. Legal/compliance review is complete
2. Vendor partnerships are established
3. Fraud prevention systems are implemented
4. Admin dashboard is built

---

## Key Files Reference

### Configuration
- `/data/tier_matrix_omega.json` - 6-tier structure definition
- `/lib/billing/stripe-map-omega.ts` - Stripe price mappings
- `/types/tiers.ts` - Updated to support Tier 5

### Database
- `/supabase/migrations/20260121000007_truth_feed_soul_tokens.sql`
- `/supabase/migrations/20260121000008_truth_feed_rls.sql`

### Truth Feed
- `/lib/actions/truth.ts` - Server actions (create, read, feed)
- `/components/truth-feed.tsx` - Feed display component
- `/components/truth-post-card.tsx` - Individual post card
- `/components/truth-post-form.tsx` - Post creation form
- `/app/truth/post/page.tsx` - Post creation page

### Billing
- `/lib/billing/webhook-handler.ts` - Updated for 6 tiers
- `/lib/billing/checkout.ts` - Updated for OMEGA pricing

---

## Support

If you encounter issues during deployment:

1. Check Vercel deployment logs
2. Check Supabase logs (Database > Logs)
3. Check Stripe webhook logs (Developers > Webhooks)
4. Verify all environment variables are set correctly

---

## OMEGA Spec Compliance

This implementation follows the RYVYNN OMEGA specification:

✅ **Truth Feed First** - App opens to Truth Feed (no signup wall)
✅ **Anonymous Posts** - No user attribution visible
✅ **50/50 Balance** - Database function maintains light/shadow balance
✅ **Soul Tokens** - Dual-ledger system implemented
✅ **Crisis Awareness** - Auto-hold posts with concerning keywords
✅ **6-Tier Pricing** - Complete pricing structure
✅ **Avatar Evolution** - Stage tracking ready
⏳ **Real-World Impact** - Infrastructure ready, activation pending

---

**Deployment Version:** RYVYNN OMEGA v1.0
**Last Updated:** 2026-01-23
