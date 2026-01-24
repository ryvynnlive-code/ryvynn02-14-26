# 🚀 RYVYNN OMEGA - Quick Deployment Guide

## Pre-Deployment Checklist

All code is ready and committed to `claude/ryvynn-mvp-complete-FzTfo`. Follow these steps:

---

## Step 1: Apply Database Migrations (5 minutes)

### Option A: Single SQL File (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Open the file: `supabase_omega_complete.sql` (in project root)
5. Copy entire contents and paste into SQL Editor
6. Click **Run**

### Option B: Individual Files
Run these in order:
1. `supabase/migrations/20260121000007_truth_feed_soul_tokens.sql`
2. `supabase/migrations/20260121000008_truth_feed_rls.sql`

**Verification:** Check that these tables exist:
- truth_posts
- soul_tokens_personal
- soul_tokens_collective
- help_requests
- blessings

---

## Step 2: Deploy to Vercel (3 minutes)

### If you haven't linked Vercel yet:
```bash
vercel login
vercel --yes
```

### Deploy to production:
```bash
vercel --prod
```

**Note:** You'll be prompted to:
- Link to existing project or create new one
- Confirm project settings
- Select production deployment

---

## Step 3: Configure Environment Variables

### Required Environment Variables (Vercel Dashboard):
Go to: Vercel Project → Settings → Environment Variables

Add these if not already set:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=(get from Stripe after webhook setup)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

---

## Step 4: Create Stripe Products (10 minutes)

Go to: https://dashboard.stripe.com/products

### Create 5 Products:

#### 1. RYVYNN Spark
- Monthly: $12/mo → Copy price ID
- Annual: $120/yr → Copy price ID

#### 2. RYVYNN Blaze
- Monthly: $36/mo → Copy price ID
- Annual: $360/yr → Copy price ID

#### 3. RYVYNN Radiance
- Monthly: $64/mo → Copy price ID
- Annual: $640/yr → Copy price ID

#### 4. RYVYNN Sovereign
- Monthly: $96/mo → Copy price ID
- Annual: $960/yr → Copy price ID

#### 5. RYVYNN Transcendent
- Monthly: $936/mo → Copy price ID
- Annual: $9360/yr → Copy price ID

### Add Price IDs to Vercel:
```bash
vercel env add STRIPE_PRICE_ID_SPARK_MONTHLY production
vercel env add STRIPE_PRICE_ID_SPARK_ANNUAL production
vercel env add STRIPE_PRICE_ID_BLAZE_MONTHLY production
vercel env add STRIPE_PRICE_ID_BLAZE_ANNUAL production
vercel env add STRIPE_PRICE_ID_RADIANCE_MONTHLY production
vercel env add STRIPE_PRICE_ID_RADIANCE_ANNUAL production
vercel env add STRIPE_PRICE_ID_SOVEREIGN_MONTHLY production
vercel env add STRIPE_PRICE_ID_SOVEREIGN_ANNUAL production
vercel env add STRIPE_PRICE_ID_TRANSCENDENT_MONTHLY production
vercel env add STRIPE_PRICE_ID_TRANSCENDENT_ANNUAL production
```

**After adding env vars, redeploy:**
```bash
vercel --prod
```

---

## Step 5: Configure Stripe Webhook (2 minutes)

1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Select events:
   - ✅ checkout.session.completed
   - ✅ customer.subscription.created
   - ✅ customer.subscription.updated
   - ✅ customer.subscription.deleted
   - ✅ invoice.payment_succeeded
   - ✅ invoice.payment_failed
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to Vercel:
   ```bash
   vercel env add STRIPE_WEBHOOK_SECRET production
   ```
8. Redeploy: `vercel --prod`

---

## Step 6: Initialize Soul Token Balances (1 minute)

Run this in Supabase SQL Editor:

```sql
-- Initialize Soul Token balances for all existing users
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

## Verification Steps

### 1. Truth Feed
- [ ] Visit your deployed URL
- [ ] Truth Feed appears as first screen
- [ ] Can read posts without login
- [ ] Login and create a test post (light/shadow)

### 2. Soul Tokens
- [ ] Post a truth → Check Soul Tokens awarded
- [ ] Read a truth → Check Soul Tokens awarded
- [ ] Verify limits work for Free tier (3 reads/day)

### 3. Stripe Checkout
- [ ] Click upgrade from Free tier
- [ ] Stripe checkout loads with correct prices
- [ ] Test mode purchase completes
- [ ] Entitlements update after purchase

### 4. Webhook
- [ ] Check Stripe webhook logs show successful calls
- [ ] Check Vercel logs show webhook processing

---

## Troubleshooting

### Build fails on Vercel
- Check Vercel build logs
- Ensure all env vars are set
- Try: `npm run build` locally first

### Migrations fail
- Check Supabase logs: Dashboard → Logs
- Ensure SQL syntax is correct
- Run migrations one at a time

### Webhook not working
- Verify webhook URL is correct
- Check webhook signing secret matches
- Review Vercel function logs
- Ensure STRIPE_WEBHOOK_SECRET is set

---

## Quick Commands Reference

```bash
# Deploy to Vercel
vercel --prod

# Add environment variable
vercel env add VARIABLE_NAME production

# View deployment logs
vercel logs

# Rollback deployment
vercel rollback
```

---

## Support Files

- **Full Guide:** `OMEGA_DEPLOYMENT.md`
- **Combined Migrations:** `supabase_omega_complete.sql`
- **Deployment Script:** `deploy-omega.sh`

---

**Estimated Total Time:** 20-25 minutes

**Status:** All code committed to `claude/ryvynn-mvp-complete-FzTfo` ✅
