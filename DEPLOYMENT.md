# RYVYNN Deployment Guide

## Complete Setup & Deployment Instructions

This guide walks through deploying RYVYNN from scratch, including all required services and configurations.

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- A Supabase account (free tier works)
- A Stripe account (test mode works)
- A Vercel account (free tier works)

---

## Part 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Enter project details:
   - **Name**: ryvynn-prod (or your choice)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for project creation (~2 minutes)

### 1.2 Get Supabase Credentials

1. Go to Project Settings → API
2. Copy these values:
   - **URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbG...`  (starts with eyJ)
   - Go to Project Settings → Database → Find "Service Role Key" 
   - **service_role key**: `eyJhbG...` (different from anon key)

### 1.3 Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "+ New Query"
3. Copy the contents of `supabase/migrations/20260120000001_initial_schema.sql`
4. Paste and click "RUN"
5. Repeat for `20260120000002_rls_policies.sql`
6. Repeat for `20260120000003_auth_triggers.sql`
7. Verify: Go to Database → Tables - you should see: profiles, subscriptions, journal_entries, usage_daily, events

### 1.4 Configure Authentication

1. Go to Authentication → Providers
2. Enable "Email" provider
3. Configure email templates (optional but recommended):
   - Go to Authentication → Email Templates
   - Customize confirmation email with your branding

---

## Part 2: Stripe Setup

### 2.1 Create Stripe Account & Get Keys

1. Go to [https://stripe.com](https://stripe.com)
2. Sign up / Log in
3. Go to **Developers** → **API Keys**
4. Copy these values (use **Test Mode** for development):
   - **Publishable key**: `pk_test_xxxxx`
   - **Secret key**: `sk_test_xxxxx`

### 2.2 Create Product & Price

1. Go to **Products** → "+ Add Product"
2. Enter:
   - **Name**: RYVYNN Premium
   - **Description**: Unlimited access to The Flame and enhanced features
   - **Pricing**: $9.99 USD / month (recurring)
3. Click "Save product"
4. Copy the **Price ID**: `price_xxxxx` (you'll need this)

### 2.3 Set Up Webhook (After Vercel Deployment)

**Note**: Complete this AFTER deploying to Vercel (Part 4)

1. Go to **Developers** → **Webhooks**
2. Click "+ Add endpoint"
3. Enter:
   - **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/stripe`
   - **Events to send**: Select these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
     - `invoice.paid`
4. Click "Add endpoint"
5. Click on the webhook you just created
6. Copy the **Signing secret**: `whsec_xxxxx`

---

## Part 3: Environment Variables

### 3.1 Create .env.local (Local Development)

Create a file `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID_PREMIUM=price_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin (comma-separated emails)
ADMIN_EMAILS=admin@ryvynn.com,founder@ryvynn.com
```

### 3.2 Test Locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000 and verify:
- Landing page loads
- Sign up works
- Login works
- Can access /app (The Flame interface)

---

## Part 4: Vercel Deployment

### 4.1 Connect GitHub Repository

1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete RYVYNN MVP"
   git push -u origin claude/ryvynn-mvp-complete-FzTfo
   ```

2. Go to [https://vercel.com](https://vercel.com)
3. Sign up / Log in
4. Click "Add New..." → "Project"
5. Import your GitHub repository
6. Select the branch: `claude/ryvynn-mvp-complete-FzTfo`

### 4.2 Configure Vercel Environment Variables

In Vercel project settings → Environment Variables, add ALL variables from `.env.local`:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbG...` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Production, Preview, Development |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_xxxxx` | Production, Preview, Development |
| `STRIPE_SECRET_KEY` | `sk_test_xxxxx` | Production, Preview, Development |
| `STRIPE_WEBHOOK_SECRET` | `whsec_xxxxx` | Production, Preview, Development |
| `STRIPE_PRICE_ID_PREMIUM` | `price_xxxxx` | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production |
| `ADMIN_EMAILS` | `admin@ryvynn.com` | Production, Preview, Development |

**Important**: Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL after first deployment!

### 4.3 Deploy

1. Click "Deploy"
2. Wait for deployment (~3 minutes)
3. Copy your production URL: `https://your-app.vercel.app`
4. Update `NEXT_PUBLIC_APP_URL` environment variable with this URL
5. Redeploy

### 4.4 Complete Stripe Webhook Setup

Now go back to **Part 2.3** and set up the Stripe webhook with your production URL.

---

## Part 5: Post-Deployment Verification

### 5.1 Test Authentication Flow

1. Visit your production URL
2. Click "Get Started" → Sign Up
3. Create an account
4. Check your email for confirmation
5. Confirm email and log in

### 5.2 Test The Flame

1. Navigate to /app
2. Enter a message like "I'm feeling anxious about work"
3. Verify The Flame responds with:
   - Reflection
   - Next step
   - Coping tool
4. Check usage counter updates

### 5.3 Test Crisis Detection

1. Enter a message with crisis keywords (e.g., "I'm thinking about hurting myself")
2. Verify crisis banner appears with:
   - 988 hotline number
   - "I'm safe" / "I need help now" options

### 5.4 Test Journal Encryption

1. Go to /app/journal
2. Create a journal password (min 8 characters)
3. Write a journal entry
4. Verify it saves
5. Log out and log back in
6. Enter same password to unlock journal
7. Verify your entry is decrypted and visible

### 5.5 Test Stripe Subscription (Test Mode)

1. Click "Upgrade to Premium" in the app
2. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
3. Complete checkout
4. Verify redirect to /app
5. Verify usage limit increases to 100
6. Go to /app/settings
7. Click "Manage Subscription"
8. Verify Stripe Customer Portal opens
9. Cancel subscription
10. Verify plan downgrades to Free

### 5.6 Test Admin Dashboard

1. Make sure your email is in `ADMIN_EMAILS`
2. Go to /admin
3. Verify you see:
   - Total users count
   - Active users (last 7 days)
   - Flame calls today
   - Crisis detections
   - Recent activity feed

---

## Part 6: Going to Production

### 6.1 Switch Stripe to Live Mode

1. Go to Stripe Dashboard
2. Toggle from "Test Mode" to "Live Mode"
3. Go to Developers → API Keys
4. Copy **Live** keys (starts with `pk_live_` and `sk_live_`)
5. Update Vercel environment variables:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Live publishable key
   - `STRIPE_SECRET_KEY` → Live secret key
6. Create webhook for **Live Mode**:
   - URL: `https://your-app.vercel.app/api/webhooks/stripe`
   - Copy new webhook secret
   - Update `STRIPE_WEBHOOK_SECRET` in Vercel
7. Recreate Premium product in Live Mode
8. Update `STRIPE_PRICE_ID_PREMIUM` with live price ID
9. Redeploy Vercel

### 6.2 Configure Custom Domain (Optional)

1. In Vercel, go to Project Settings → Domains
2. Add your custom domain (e.g., app.ryvynn.com)
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` environment variable
5. Update Stripe webhook URL with custom domain
6. Redeploy

### 6.3 Enable Monitoring

1. Vercel automatically provides:
   - Error tracking
   - Performance monitoring
   - Analytics

2. Supabase Dashboard provides:
   - Database queries
   - Auth logs
   - API usage

3. Stripe Dashboard provides:
   - Payment events
   - Customer data
   - Revenue tracking

---

## Part 7: Maintenance & Updates

### 7.1 Database Backups

Supabase automatically backs up your database daily (free tier: 7 days retention).

To create manual backup:
1. Go to Supabase Dashboard → Database
2. Click "Backups"
3. Click "Create backup"

### 7.2 Monitoring Usage

**Check Daily**:
- Supabase: Auth → Users (check for suspicious signups)
- Stripe: Dashboard (check for failed payments)

**Check Weekly**:
- Vercel: Analytics tab (check performance)
- Supabase: Database → Query Performance
- Admin Dashboard: /admin (check metrics)

### 7.3 Updating Code

```bash
# Make changes
git add .
git commit -m "feat: description of changes"
git push

# Vercel automatically deploys from connected branch
```

---

## Troubleshooting

### Build Fails in Vercel

**Check**:
- All environment variables are set
- No typos in environment variable names
- Values don't have extra spaces or quotes

### Authentication Not Working

**Check**:
- `NEXT_PUBLIC_SUPABASE_URL` is correct
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` is the anon key (not service role)
- Email confirmation is enabled in Supabase Auth settings

### Stripe Webhook Not Triggering

**Check**:
- Webhook URL is correct (should end with `/api/webhooks/stripe`)
- `STRIPE_WEBHOOK_SECRET` matches webhook signing secret
- Webhook is enabled in Stripe dashboard
- Check Vercel Functions logs for errors

### Journal Entries Not Saving

**Check**:
- User created journal password
- Browser supports Web Crypto API (all modern browsers do)
- No console errors in browser dev tools

### Crisis Detection Not Working

**Check**:
- Flame response engine is being called (`/api/flame` or server action)
- Crisis keywords are in user message
- Frontend properly displays crisis banner

---

## Security Checklist

- [ ] All environment variables use production values (not test/placeholder)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client
- [ ] Stripe webhook signature verification is enabled
- [ ] RLS policies are enabled on all tables
- [ ] Admin dashboard requires admin role
- [ ] Journal entries are encrypted client-side
- [ ] HTTPS is enforced (Vercel does this automatically)
- [ ] Rate limiting is in place for Flame calls

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Stripe Docs**: https://docs.stripe.com
- **Next.js Docs**: https://nextjs.org/docs
- **Vercel Docs**: https://vercel.com/docs

---

## Estimated Time

- **Initial Setup**: 2-3 hours (first time)
- **Each Deployment**: 10-15 minutes (after initial setup)
- **Going to Production**: 30-45 minutes (Stripe live mode switch)

---

**Built with OMEGA BUILDER**
