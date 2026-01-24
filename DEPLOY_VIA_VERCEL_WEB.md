# 🚀 Deploy RYVYNN OMEGA via Vercel Web Interface

Since you already have your environment variables configured in Vercel, let's deploy through the web interface!

---

## Option 1: Deploy from GitHub (Recommended - Automatic)

### Step 1: Import Project to Vercel
1. Go to: https://vercel.com/new
2. Select **Import Git Repository**
3. Choose your repository: `ryvynnlive-code/ryvynn02-14-26`
4. Select branch: `claude/ryvynn-mvp-complete-FzTfo`

### Step 2: Configure Project
Vercel should auto-detect Next.js. Confirm settings:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (auto-detected)
- **Output Directory:** `.next` (auto-detected)
- **Install Command:** `npm install` (auto-detected)

### Step 3: Environment Variables
You mentioned Vercel already has your env vars! Verify these are set:

**Required for RYVYNN OMEGA:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```

**Additional for OMEGA (if you created Stripe products):**
```
STRIPE_PRICE_ID_SPARK_MONTHLY
STRIPE_PRICE_ID_SPARK_ANNUAL
STRIPE_PRICE_ID_BLAZE_MONTHLY
STRIPE_PRICE_ID_BLAZE_ANNUAL
STRIPE_PRICE_ID_RADIANCE_MONTHLY
STRIPE_PRICE_ID_RADIANCE_ANNUAL
STRIPE_PRICE_ID_SOVEREIGN_MONTHLY
STRIPE_PRICE_ID_SOVEREIGN_ANNUAL
STRIPE_PRICE_ID_TRANSCENDENT_MONTHLY
STRIPE_PRICE_ID_TRANSCENDENT_ANNUAL
```

### Step 4: Deploy!
Click **Deploy** and Vercel will:
- ✅ Clone your repository
- ✅ Install dependencies
- ✅ Build the project
- ✅ Deploy to production
- ✅ Give you a live URL

**Time:** 3-5 minutes

---

## Option 2: Re-deploy Existing Project

If you already have a Vercel project for this repo:

### Method A: Via Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Find your project
3. Go to **Settings** → **Git**
4. Change **Production Branch** to: `claude/ryvynn-mvp-complete-FzTfo`
5. Go to **Deployments**
6. Click **...** → **Redeploy** on latest deployment

### Method B: Trigger via Git Push
Your latest push to `claude/ryvynn-mvp-complete-FzTfo` should automatically trigger a deployment if:
- Vercel is connected to your GitHub repo
- The branch is set as production branch

Check: https://vercel.com/dashboard for deployment status

---

## Option 3: Deploy with Vercel CLI (Requires Login)

If you prefer CLI:

```bash
# Login to Vercel (will open browser)
vercel login

# Link to existing project or create new
vercel link

# Deploy to production
vercel --prod
```

---

## After Deployment

### 1. Get Your Production URL
Vercel will provide a URL like:
- `https://ryvynn02-14-26.vercel.app`
- Or your custom domain

### 2. Update NEXT_PUBLIC_APP_URL
In Vercel environment variables, update:
```
NEXT_PUBLIC_APP_URL=https://your-production-url.vercel.app
```

Then redeploy (or Vercel will auto-redeploy)

### 3. Configure Stripe Webhook
1. Go to: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Endpoint URL: `https://your-production-url.vercel.app/api/webhooks/stripe`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to Vercel env vars as: `STRIPE_WEBHOOK_SECRET`

---

## Verify Deployment

### Check Build Logs
1. Go to your Vercel deployment
2. Click on the deployment
3. View **Build Logs** - should show:
   - ✅ Dependencies installed
   - ✅ TypeScript compiled
   - ✅ Pages generated
   - ✅ Build completed successfully

### Test the App
1. Visit your production URL
2. Should see **Truth Feed** as first screen
3. Try creating an anonymous post (need to sign up first)
4. Verify Soul Tokens are awarded

### Test Stripe Integration
1. Click upgrade from Free tier
2. Should redirect to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
4. Verify webhook received in Stripe Dashboard

---

## Troubleshooting

### Build Fails
**Check:** Vercel build logs for specific error
**Common fixes:**
- Verify all environment variables are set
- Check that Node version is compatible (18+)
- Ensure `npm run build` works locally

### Webhook Not Working
**Check:**
- Stripe webhook URL is correct
- Webhook secret is in Vercel env vars
- Events are selected in Stripe
**Fix:** Check Vercel function logs for errors

### Environment Variables Missing
**Solution:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add missing variables
3. Redeploy

---

## Quick Status Check

After deployment, verify:
- [ ] Production URL is live
- [ ] Truth Feed loads
- [ ] Can create anonymous posts
- [ ] Stripe checkout works
- [ ] Webhook processes subscriptions
- [ ] Environment variables all set

---

## Deployment Status

**Current Branch:** `claude/ryvynn-mvp-complete-FzTfo`
**Latest Commit:** `f31f293` (Vercel configuration added)
**Build Status:** ✅ Passing locally
**Ready for Production:** ✅ Yes

---

## What About Database?

**Important:** Don't forget to apply Supabase migrations!

### Apply Migrations:
1. Go to: https://supabase.com/dashboard
2. Select your project → **SQL Editor**
3. Copy contents of: `supabase_omega_complete.sql`
4. Paste and click **Run**

This creates:
- 9 new tables (Truth Feed, Soul Tokens, etc.)
- All RLS policies
- Database functions

**Without migrations:** App will deploy but Truth Feed won't work.

---

## Need Stripe Products?

If you haven't created Stripe products yet:

### Automated Creation:
```bash
# Update .env.local with your Stripe key, then:
npm run setup:stripe
```

### Manual Creation:
See `DEPLOY_NOW.md` for step-by-step instructions.

---

## Summary

Since Vercel already has your environment variables:

**Fastest Path to Production:**
1. Go to https://vercel.com/new
2. Import repo: `ryvynnlive-code/ryvynn02-14-26`
3. Select branch: `claude/ryvynn-mvp-complete-FzTfo`
4. Click Deploy ✅

**Total Time:** ~5 minutes

Then:
- Apply Supabase migrations (5 min)
- Configure Stripe webhook (2 min)
- Test deployment (3 min)

**Total:** ~15 minutes to fully deployed RYVYNN OMEGA! 🚀
