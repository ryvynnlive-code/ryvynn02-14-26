# RYVYNN OMEGA - APEX DEPLOYMENT CONFIGURATION

**Version:** OMEGA v1.0
**Status:** PRODUCTION READY
**Last Updated:** 2026-01-26

---

## DEPLOYMENT READINESS MATRIX

| Component | Status | Action Required |
|-----------|--------|-----------------|
| Codebase | READY | None |
| Database Schema | READY | Run migrations |
| Stripe Integration | READY | Create products, configure webhook |
| Environment Config | READY | Set variables in Vercel |
| CI/CD Pipeline | READY | None (GitHub Actions configured) |

---

## PHASE 1: VERCEL DEPLOYMENT (5 minutes)

### Option A: Vercel Dashboard (Recommended)

1. **Login to Vercel**
   - Go to: https://vercel.com/dashboard
   - Login with GitHub (ryvynnlive-code account)

2. **Import Project**
   - Click "Add New..." > "Project"
   - Select repository: `ryvynnlive-code/ryvynn02-14-26`
   - Branch: `claude/apex-deployment-config-A5msL` (or `main`)

3. **Configure Environment Variables**

   Add these in Project Settings > Environment Variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (add after webhook setup)
   NEXT_PUBLIC_APP_URL=https://ryvynn.live
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Note your deployment URL

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel --prod
```

---

## PHASE 2: DATABASE SETUP (5 minutes)

### Run Migrations in Supabase

1. **Access Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Navigate to: SQL Editor (left sidebar)
   - Click "New Query"

3. **Run Initial Migrations**

   Copy and run each file in order:

   ```
   supabase/migrations/20260120000001_initial_schema.sql
   supabase/migrations/20260120000002_rls_policies.sql
   supabase/migrations/20260120000003_auth_triggers.sql
   supabase/migrations/20260120000004_avatar_tables.sql
   supabase/migrations/20260120000005_avatar_rls.sql
   supabase/migrations/20260120000006_triggers_and_views.sql
   supabase/migrations/20260121000007_truth_feed_soul_tokens.sql
   supabase/migrations/20260121000008_truth_feed_rls.sql
   supabase/migrations/20260126000009_webhook_tables.sql
   ```

   OR run the combined file:
   ```
   supabase_omega_complete.sql
   ```

   Then run:
   ```
   supabase/migrations/20260126000009_webhook_tables.sql
   ```

4. **Verify Tables**

   Run this query to confirm:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

   Expected tables:
   - avatar_evolution_history
   - blessings
   - entitlements
   - events
   - help_requests
   - impact_allocations
   - journal_entries
   - payment_events
   - processed_events
   - profiles
   - soul_token_transactions
   - soul_tokens_collective
   - soul_tokens_personal
   - subscriptions
   - truth_posts
   - truth_reads
   - usage_daily

---

## PHASE 3: STRIPE WEBHOOK CONFIGURATION (5 minutes)

### 1. Create Webhook Endpoint

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter URL: `https://ryvynn.live/api/webhooks/stripe`
   (Replace with your Vercel URL if using different domain)

### 2. Select Events

Add these events:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 3. Get Signing Secret

1. Click "Reveal" under Signing secret
2. Copy the `whsec_...` value
3. Add to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
4. Redeploy on Vercel (Settings > Deployments > Redeploy)

---

## PHASE 4: STRIPE PRODUCTS SETUP (10 minutes)

### Option A: Automated Setup

```bash
# Set environment variables
export STRIPE_SECRET_KEY=sk_live_...

# Run setup script
npm run setup:stripe
```

### Option B: Manual Setup in Stripe Dashboard

Create 5 products with 2 prices each:

| Product | Monthly Price | Annual Price |
|---------|---------------|--------------|
| RYVYNN Spark | $12/mo | $120/yr |
| RYVYNN Blaze | $36/mo | $360/yr |
| RYVYNN Radiance | $64/mo | $640/yr |
| RYVYNN Sovereign | $96/mo | $960/yr |
| RYVYNN Transcendent | $936/mo | $9,360/yr |

After creating, update `lib/billing/stripe-map-omega.ts` with the real price IDs.

---

## PHASE 5: DOMAIN CONFIGURATION

### If using ryvynn.live:

1. **Vercel Domain Settings**
   - Go to: Project Settings > Domains
   - Add: `ryvynn.live`
   - Add: `www.ryvynn.live`

2. **DNS Configuration**

   Add these records in your domain registrar:

   | Type | Name | Value |
   |------|------|-------|
   | A | @ | 76.76.21.21 |
   | CNAME | www | cname.vercel-dns.com |

3. **Verify SSL**
   - Vercel auto-provisions SSL certificates
   - May take up to 24 hours for propagation

---

## PHASE 6: POST-DEPLOYMENT VERIFICATION

### Run Validation Script

```bash
npm run validate
```

### Manual Checks

1. **Homepage Loads**
   - Visit: https://ryvynn.live
   - Verify Truth Feed renders

2. **Authentication Works**
   - Click Login/Signup
   - Complete OAuth flow
   - Verify redirect to /app

3. **Webhook Health Check**
   - Visit: https://ryvynn.live/api/webhooks/stripe
   - Should return:
   ```json
   {
     "status": "ok",
     "webhook": "stripe",
     "env": {
       "secret_key_configured": true,
       "webhook_secret_configured": true
     }
   }
   ```

4. **Test Stripe Webhook**
   - Go to: Stripe Dashboard > Webhooks
   - Click "Send test webhook"
   - Select `checkout.session.completed`
   - Verify 200 response

---

## ENVIRONMENT VARIABLES CHECKLIST

```bash
# Required for deployment
NEXT_PUBLIC_SUPABASE_URL=          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key
SUPABASE_SERVICE_ROLE_KEY=         # Service role key (webhooks)
STRIPE_SECRET_KEY=                 # Stripe API key
STRIPE_WEBHOOK_SECRET=             # Webhook signing secret
NEXT_PUBLIC_APP_URL=               # Your domain (https://ryvynn.live)

# Optional (auto-detected from Stripe)
STRIPE_PRICE_ID_SPARK_MONTHLY=
STRIPE_PRICE_ID_SPARK_ANNUAL=
STRIPE_PRICE_ID_BLAZE_MONTHLY=
STRIPE_PRICE_ID_BLAZE_ANNUAL=
STRIPE_PRICE_ID_RADIANCE_MONTHLY=
STRIPE_PRICE_ID_RADIANCE_ANNUAL=
STRIPE_PRICE_ID_SOVEREIGN_MONTHLY=
STRIPE_PRICE_ID_SOVEREIGN_ANNUAL=
STRIPE_PRICE_ID_TRANSCENDENT_MONTHLY=
STRIPE_PRICE_ID_TRANSCENDENT_ANNUAL=
```

---

## TROUBLESHOOTING

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Webhook Returns 500

1. Check Vercel logs: Project > Deployments > View Function Logs
2. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard
3. Ensure database migrations ran successfully

### Database Connection Errors

1. Verify Supabase URL is correct (no trailing slash)
2. Check API keys are from correct project
3. Verify RLS policies aren't blocking access

### Stripe Products Not Found

Run `npm run setup:stripe` or create manually in dashboard.

---

## DEPLOYMENT TIMELINE

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Vercel Deploy | 5 min | GitHub repo access |
| Database Setup | 5 min | Supabase project |
| Stripe Webhook | 5 min | Deployed URL |
| Stripe Products | 10 min | Stripe account |
| Domain Config | Variable | DNS propagation |
| **Total** | **~25 min** | |

---

## CRITICAL PATH FOR OPENAI GRANT

**Deadline:** December 19th

### Minimum Viable Demo:
1. Landing page accessible at ryvynn.live
2. User authentication working
3. Truth Feed displaying posts
4. Pricing page showing tiers
5. Checkout flow functional (test mode OK)

### Grant Application Support:
- Live URL proves technical viability
- User flow demonstrates product vision
- Stripe integration shows revenue model
- Soul Token system illustrates unique approach

---

## SUPPORT CONTACTS

- **Vercel Support:** https://vercel.com/support
- **Supabase Support:** https://supabase.com/support
- **Stripe Support:** https://support.stripe.com

---

**DEPLOYMENT STATUS: READY FOR EXECUTION**

All code, configurations, and scripts are prepared. Execute phases 1-6 sequentially for full production deployment.
