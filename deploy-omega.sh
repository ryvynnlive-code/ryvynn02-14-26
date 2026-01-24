#!/bin/bash
# RYVYNN OMEGA Deployment Script

set -e

echo "🚀 RYVYNN OMEGA Deployment"
echo "=========================="
echo ""

# Step 1: Build check
echo "Step 1: Verifying build..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix errors before deploying."
  exit 1
fi

echo "✅ Build successful"
echo ""

# Step 2: Deploy to Vercel
echo "Step 2: Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployed to Vercel"
echo ""

# Step 3: Instructions for manual steps
echo "📋 MANUAL STEPS REQUIRED:"
echo "========================"
echo ""
echo "1. Apply Supabase Migrations:"
echo "   - Go to your Supabase Dashboard → SQL Editor"
echo "   - Run migration: supabase/migrations/20260121000007_truth_feed_soul_tokens.sql"
echo "   - Run migration: supabase/migrations/20260121000008_truth_feed_rls.sql"
echo ""
echo "2. Create Stripe Products:"
echo "   - Go to https://dashboard.stripe.com/products"
echo "   - Create 5 products with monthly/annual prices:"
echo "     * Spark: \$12/mo, \$120/yr"
echo "     * Blaze: \$36/mo, \$360/yr"
echo "     * Radiance: \$64/mo, \$640/yr"
echo "     * Sovereign: \$96/mo, \$960/yr"
echo "     * Transcendent: \$936/mo, \$9360/yr"
echo ""
echo "3. Add Stripe Price IDs to Vercel Environment:"
echo "   - Go to Vercel Project → Settings → Environment Variables"
echo "   - Add all 10 price IDs (see OMEGA_DEPLOYMENT.md)"
echo ""
echo "4. Configure Stripe Webhook:"
echo "   - Go to Stripe Dashboard → Webhooks"
echo "   - Add endpoint: https://your-domain.vercel.app/api/webhooks/stripe"
echo "   - Select events: checkout.session.completed, customer.subscription.*"
echo "   - Add webhook secret to Vercel environment"
echo ""
echo "5. Initialize Soul Token Balances:"
echo "   - Run the SQL script in OMEGA_DEPLOYMENT.md to initialize all users"
echo ""
echo "See OMEGA_DEPLOYMENT.md for detailed instructions."
echo ""
echo "🎉 Deployment complete!"
