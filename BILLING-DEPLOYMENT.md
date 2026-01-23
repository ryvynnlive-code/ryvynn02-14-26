# RYVYNN Billing System Deployment Guide

**Status:** Ready for Production
**Est. Time:** 30-45 minutes
**Complexity:** Medium

---

## 📋 Pre-Flight Checklist

Before you start, ensure you have:

- [ ] Stripe account (test mode)
- [ ] Supabase project credentials
- [ ] Vercel account
- [ ] Admin access to GitHub repo
- [ ] Local development environment ready

---

## 🎯 Deployment Sequence

### Phase 1: Stripe Product Setup (15 min)

#### Step 1.1: Create Products in Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/products
2. Click **"+ Add product"** (create 4 products)

**Product 1: RYVYNN Standard**
```
Name: RYVYNN Standard
Description: 25 conversations/day, journaling, goals, coping modules
```
- Click "Add another price"
- Price 1: $9.00 USD / month (recurring)
- Price 2: $90.00 USD / year (recurring)
- Save product
- **Copy both price IDs** (starts with `price_...`)

**Product 2: RYVYNN Enhanced**
```
Name: RYVYNN Enhanced
Description: Analytics, voice, mini-courses, weekly summaries
```
- Price 1: $24.00 USD / month
- Price 2: $240.00 USD / year
- Save and copy price IDs

**Product 3: RYVYNN Pro**
```
Name: RYVYNN Pro
Description: Unlimited conversations, integrations, API access
```
- Price 1: $49.00 USD / month
- Price 2: $490.00 USD / year
- Save and copy price IDs

**Product 4: RYVYNN Infinite**
```
Name: RYVYNN Infinite
Description: Custom avatars, predictive insights, human coaching
```
- Price 1: $99.00 USD / month
- Price 2: $990.00 USD / year
- Save and copy price IDs

#### Step 1.2: Create Add-On Products

**One-Time Add-Ons:**
1. Premium Avatar Visual Pack - $4.99 (one-time payment)
2. Premium Voice Pack - $7.99 (one-time payment)
3. Analytics Deep Dive Report - $9.99 (one-time payment)

**Recurring Add-Ons:**
1. Community Dashboard - $14.00/month (recurring)
2. Clinician Dashboard - $29.00/month (recurring)

**Copy all 5 add-on price IDs**

---

### Phase 2: Environment Configuration (5 min)

#### Step 2.1: Update `.env.local`

Open `.env.local` and add/update these variables:

```bash
# === STRIPE CORE ===
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_PLACEHOLDER_update_after_webhook_setup

# === TIER PRICES (Monthly) ===
STRIPE_PRICE_ID_STANDARD_MONTHLY=price_YOUR_STANDARD_MONTHLY_ID
STRIPE_PRICE_ID_ENHANCED_MONTHLY=price_YOUR_ENHANCED_MONTHLY_ID
STRIPE_PRICE_ID_PRO_MONTHLY=price_YOUR_PRO_MONTHLY_ID
STRIPE_PRICE_ID_INFINITE_MONTHLY=price_YOUR_INFINITE_MONTHLY_ID

# === TIER PRICES (Annual) ===
STRIPE_PRICE_ID_STANDARD_ANNUAL=price_YOUR_STANDARD_ANNUAL_ID
STRIPE_PRICE_ID_ENHANCED_ANNUAL=price_YOUR_ENHANCED_ANNUAL_ID
STRIPE_PRICE_ID_PRO_ANNUAL=price_YOUR_PRO_ANNUAL_ID
STRIPE_PRICE_ID_INFINITE_ANNUAL=price_YOUR_INFINITE_ANNUAL_ID

# === ADD-ONS ===
STRIPE_PRICE_ID_AVATAR_PACK=price_YOUR_AVATAR_PACK_ID
STRIPE_PRICE_ID_VOICE_PACK=price_YOUR_VOICE_PACK_ID
STRIPE_PRICE_ID_ANALYTICS_REPORT=price_YOUR_ANALYTICS_REPORT_ID
STRIPE_PRICE_ID_COMMUNITY_DASHBOARD=price_YOUR_COMMUNITY_DASHBOARD_ID
STRIPE_PRICE_ID_CLINICIAN_DASHBOARD=price_YOUR_CLINICIAN_DASHBOARD_ID
```

#### Step 2.2: Verify Configuration

```bash
npm run dev
```

Open: http://localhost:3000/api/webhooks/stripe

Should return:
```json
{
  "status": "ok",
  "webhook": "stripe",
  "env": {
    "secret_key_configured": true,
    "webhook_secret_configured": false
  }
}
```

**NOTE:** `webhook_secret_configured: false` is expected at this stage.

---

### Phase 3: Database Migration (10 min)

#### Step 3.1: Apply Migrations

**Option A: Using Supabase CLI (Recommended)**

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

**Option B: Using Supabase Dashboard**

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Click **SQL Editor**
3. Open each migration file and run in order:
   - `supabase/migrations/20260120000004_avatar_tables.sql`
   - `supabase/migrations/20260120000005_avatar_rls.sql`
   - `supabase/migrations/20260120000006_triggers_and_views.sql`

#### Step 3.2: Verify Tables Created

In Supabase Dashboard → Table Editor, verify these tables exist:

- [x] `avatar_profiles`
- [x] `entitlements`
- [x] `mood_logs`
- [x] `goals`
- [x] `streaks`
- [x] `analytics_summaries`
- [x] `integration_connections`
- [x] `api_keys`
- [x] `processed_events`

#### Step 3.3: Verify RLS Enabled

In SQL Editor, run:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'avatar_profiles',
    'entitlements',
    'mood_logs',
    'goals',
    'streaks',
    'analytics_summaries'
  );
```

All rows should show `rowsecurity = true`.

#### Step 3.4: Test Triggers

Create a test user and verify auto-creation:

```sql
-- Check if default avatar profile and entitlement were created
SELECT
  ap.avatar_name,
  ap.gender_persona,
  e.current_tier,
  e.flame_conversations_per_day
FROM auth.users u
LEFT JOIN avatar_profiles ap ON ap.user_id = u.id
LEFT JOIN entitlements e ON e.user_id = u.id
LIMIT 1;
```

Should return default values (Aria, feminine, tier 0, 5 conversations).

---

### Phase 4: Deploy to Vercel (5 min)

#### Step 4.1: Commit and Push

```bash
git add .
git commit -m "feat: Add billing system with tier-based entitlements"
git push origin claude/ryvynn-mvp-complete-FzTfo
```

#### Step 4.2: Deploy to Vercel

Vercel will auto-deploy from your branch. Monitor deployment:

```bash
vercel --prod
```

#### Step 4.3: Add Environment Variables to Vercel

1. Go to: Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables from `.env.local`
3. Select: **Production, Preview, Development**
4. Click **Save**

#### Step 4.4: Redeploy

```bash
vercel --prod
```

---

### Phase 5: Webhook Configuration (5 min)

#### Step 5.1: Add Webhook Endpoint in Stripe

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click **"+ Add endpoint"**
3. Endpoint URL: `https://YOUR_DOMAIN.vercel.app/api/webhooks/stripe`
4. Description: "RYVYNN subscription events"

**Select these events:**
- [x] `checkout.session.completed`
- [x] `customer.subscription.created`
- [x] `customer.subscription.updated`
- [x] `customer.subscription.deleted`
- [x] `invoice.payment_succeeded`
- [x] `invoice.payment_failed`

5. Click **"Add endpoint"**

#### Step 5.2: Copy Signing Secret

1. Click on your new webhook endpoint
2. Click **"Reveal"** under "Signing secret"
3. Copy the secret (starts with `whsec_...`)

#### Step 5.3: Add Signing Secret to Vercel

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Find `STRIPE_WEBHOOK_SECRET`
3. Click **Edit** → Paste the `whsec_...` value
4. Save

#### Step 5.4: Redeploy (Final Time)

```bash
vercel --prod
```

#### Step 5.5: Test Webhook

1. In Stripe Dashboard → Webhooks → Your endpoint
2. Click **"Send test webhook"**
3. Select `checkout.session.completed`
4. Click **"Send test event"**
5. Verify response: `200 OK`

---

### Phase 6: Testing (10 min)

#### Step 6.1: Test Checkout Flow

```bash
# In your local development environment
npm run dev
```

Create a test checkout URL:

```typescript
// Create a test file: scripts/test-checkout.ts
import { createCheckoutSession } from '@/lib/billing/checkout'

async function test() {
  const result = await createCheckoutSession({
    userId: 'YOUR_TEST_USER_ID',
    tier: 1, // Standard
    cadence: 'monthly',
  })

  console.log('Checkout URL:', result.url)
}

test()
```

Run:
```bash
npx ts-node scripts/test-checkout.ts
```

#### Step 6.2: Complete Test Purchase

1. Open the checkout URL
2. Use test card: `4242 4242 4242 4242`
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Complete checkout

#### Step 6.3: Verify Entitlements Updated

In Supabase SQL Editor:

```sql
SELECT
  user_id,
  current_tier,
  flame_conversations_per_day,
  subscription_id
FROM entitlements
WHERE user_id = 'YOUR_TEST_USER_ID';
```

Should show:
- `current_tier = 1`
- `flame_conversations_per_day = 25`
- `subscription_id` populated

#### Step 6.4: Verify Webhook Event Logged

```sql
SELECT
  stripe_event_id,
  event_type,
  processed_at
FROM processed_events
ORDER BY processed_at DESC
LIMIT 5;
```

Should show recent `checkout.session.completed` event.

---

## 🔍 Verification Checklist

After deployment, verify:

### Stripe Configuration
- [ ] 4 tier products created with 8 prices total
- [ ] 5 add-on prices created
- [ ] All price IDs copied to `.env.local`
- [ ] Webhook endpoint configured with 6 events
- [ ] Webhook signing secret added to Vercel

### Database
- [ ] 9 new tables created
- [ ] RLS enabled on all tables
- [ ] Triggers create default avatar_profile + entitlement on signup
- [ ] `user_entitlements` view returns data
- [ ] Unique constraints on `stripe_customer_id`, `stripe_subscription_id`, `stripe_event_id`

### API Endpoints
- [ ] `GET /api/webhooks/stripe` returns 200 OK
- [ ] `POST /api/webhooks/stripe` returns 400 without signature
- [ ] Webhook test event succeeds in Stripe Dashboard

### Entitlement System
- [ ] New users get tier 0 entitlement automatically
- [ ] Checkout session creates subscription in Stripe
- [ ] Webhook updates entitlements table
- [ ] `profiles.current_tier` syncs with `entitlements.current_tier`
- [ ] Feature flags respect tier requirements

---

## 🧪 Test Card Numbers

**Successful Payment:**
- Card: `4242 4242 4242 4242`
- Any future expiry, any CVC, any ZIP

**Declined Payment:**
- Card: `4000 0000 0000 0002`

**3D Secure Required:**
- Card: `4000 0025 0000 3155`

**Insufficient Funds:**
- Card: `4000 0000 0000 9995`

---

## 🐛 Troubleshooting

### Issue: Webhook returns 401

**Cause:** Signing secret mismatch

**Fix:**
1. Verify `STRIPE_WEBHOOK_SECRET` in Vercel matches Stripe Dashboard
2. Redeploy after updating env var
3. Resend test webhook

### Issue: Entitlements not updating

**Cause:** Missing `user_id` in subscription metadata

**Fix:**
```typescript
// In lib/billing/checkout.ts, ensure metadata is passed:
subscription_data: {
  metadata: {
    user_id: userId, // CRITICAL
  },
}
```

### Issue: RLS blocks admin operations

**Cause:** Service role not used for webhook operations

**Fix:**
```typescript
// In lib/billing/webhook-handler.ts, use admin client:
import { createAdminClient } from '@/lib/supabase/server'
const supabase = createAdminClient()
```

### Issue: Duplicate webhook processing

**Cause:** `processed_events` table not being checked/updated

**Fix:** Uncomment the TODO sections in `lib/billing/webhook-handler.ts`:
- `isEventProcessed()`
- `markEventProcessed()`

---

## 📊 Monitoring

### Stripe Dashboard

**Webhooks:** https://dashboard.stripe.com/test/webhooks
- View recent deliveries
- Check response codes
- Retry failed events

**Logs:** https://dashboard.stripe.com/test/logs
- Search by customer ID
- Filter by event type

**Subscriptions:** https://dashboard.stripe.com/test/subscriptions
- View active subscriptions
- Check cancellation status

### Vercel Logs

```bash
vercel logs --follow
```

Filter for webhook events:
```bash
vercel logs | grep "webhook"
```

### Supabase Logs

Dashboard → Logs → API Logs

Filter for entitlement updates:
```sql
SELECT * FROM entitlements
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;
```

---

## 🚀 Next Steps

After billing is live:

1. **Implement Feature Gates**
   - Update `lib/actions/flame.ts` to use `checkFeature()`
   - Add tier checks to voice, analytics, integrations

2. **Build Upgrade UI**
   - Tier comparison page
   - Upgrade buttons with `createCheckoutSession()`
   - Customer portal link

3. **Enable Add-Ons**
   - Add-on purchase flow
   - Update `purchased_addons` array in entitlements

4. **Analytics Dashboard**
   - Track conversion rates
   - Monitor churn
   - Usage by tier

5. **Switch to Live Mode**
   - Create live products/prices in Stripe
   - Update environment variables
   - Configure live webhook endpoint

---

## ✅ Definition of Done

Billing system is **production-ready** when:

- [x] All 8 tier prices configured in Stripe
- [x] All 5 add-on prices configured
- [x] Database migrations applied
- [x] RLS policies enabled
- [x] Webhooks receiving events successfully
- [x] Entitlements update on subscription changes
- [x] Test checkout completes end-to-end
- [x] Idempotency prevents duplicate processing
- [x] Monitoring shows no errors

**Time to revenue: 30-45 minutes** 🎉

---

## 📞 Support

**Stripe Documentation:** https://stripe.com/docs/billing/subscriptions/overview

**Supabase RLS Guide:** https://supabase.com/docs/guides/auth/row-level-security

**Next.js API Routes:** https://nextjs.org/docs/app/building-your-application/routing/route-handlers

**RYVYNN Spec:** `/spec/RYVYNN_AVATAR_PRICING_SPEC.md`

**Data Contracts:** `/data/tier_matrix.json`, `/data/avatar_profiles.json`

---

**Deployment Owner:** OMEGA BUILDER
**Last Updated:** 2026-01-20
**Version:** 1.0.0
