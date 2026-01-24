# 🚀 RYVYNN OMEGA - Deploy Right Now (5 Minutes)

Since Vercel already has your environment variables configured, you can deploy immediately!

---

## 🎯 Fastest Path to Production

### Option 1: Vercel Web Interface (Recommended - 5 min)

**Go here:** https://vercel.com/new

1. **Import Repository**
   - Select: `ryvynnlive-code/ryvynn02-14-26`
   - Branch: `claude/ryvynn-mvp-complete-FzTfo`

2. **Verify Settings** (auto-detected)
   - Framework: Next.js ✅
   - Build Command: `npm run build` ✅
   - Output: `.next` ✅

3. **Environment Variables**
   - Already configured in Vercel ✅
   - Just verify they're applied to this project

4. **Click Deploy** 🚀

**Done!** Your app will be live in ~3-5 minutes.

---

### Option 2: Vercel CLI (If you prefer terminal)

```bash
# Login (opens browser)
vercel login

# Deploy to production
vercel --prod
```

Follow the prompts to link/create project.

---

## 📋 After Deployment (10 minutes)

### 1. Apply Database Migrations (5 min)
**Required for Truth Feed to work**

1. Go to: https://supabase.com/dashboard
2. SQL Editor
3. Copy/paste: `supabase_omega_complete.sql`
4. Click Run

Creates 9 tables for Truth Feed, Soul Tokens, etc.

---

### 2. Configure Stripe Webhook (2 min)
**Required for subscriptions to work**

1. Get your Vercel URL (e.g., `https://ryvynn.vercel.app`)
2. Go to: https://dashboard.stripe.com/webhooks
3. Add endpoint: `https://your-url.vercel.app/api/webhooks/stripe`
4. Select events:
   - checkout.session.completed
   - customer.subscription.*
   - invoice.payment_*
5. Copy webhook secret
6. Add to Vercel: Settings → Environment Variables → `STRIPE_WEBHOOK_SECRET`

---

### 3. Create Stripe Products (Optional - if not done)

**If you haven't created the 5 OMEGA tiers yet:**

```bash
# Add your Stripe key to .env.local, then:
npm run setup:stripe
```

This auto-creates:
- Spark ($12/$120)
- Blaze ($36/$360)
- Radiance ($64/$640)
- Sovereign ($96/$960)
- Transcendent ($936/$9360)

Then add the 10 price IDs to Vercel environment.

---

## ✅ Verify Deployment

Visit your production URL and check:

- [ ] Truth Feed displays on home page
- [ ] Can sign up / log in
- [ ] Can create anonymous post (light/shadow)
- [ ] Soul Tokens show in profile
- [ ] Upgrade flow works (Stripe checkout)

---

## 🎉 That's It!

**Total Time:** ~15 minutes
- Deploy: 5 min
- Migrations: 5 min
- Webhook: 2 min
- Verify: 3 min

**Your RYVYNN OMEGA app is live!** 🚀

---

## 📞 Need Help?

**Build fails?**
- Check Vercel build logs
- Verify environment variables are set
- See `DEPLOY_VIA_VERCEL_WEB.md` for troubleshooting

**Truth Feed not working?**
- Make sure migrations are applied
- Check Supabase logs

**Stripe not working?**
- Verify webhook is configured
- Check webhook secret is in Vercel
- Test with card: 4242 4242 4242 4242

---

## 📁 Helpful Files

- `DEPLOY_VIA_VERCEL_WEB.md` - Detailed Vercel deployment
- `OMEGA_DEPLOYMENT.md` - Full deployment guide
- `supabase_omega_complete.sql` - Database migrations
- `scripts/setup-stripe-products.js` - Auto Stripe setup

---

**Branch:** `claude/ryvynn-mvp-complete-FzTfo`
**Status:** ✅ Ready for deployment
**All code committed and pushed** ✅
