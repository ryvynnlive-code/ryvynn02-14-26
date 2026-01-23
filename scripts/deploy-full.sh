#!/bin/bash
# RYVYNN OMEGA - Full Deployment Automation Script

set -e

echo "🚀 RYVYNN OMEGA - FULL DEPLOYMENT"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm --version)${NC}"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi
echo -e "${GREEN}✅ Vercel CLI $(vercel --version)${NC}"

echo ""

# Check environment variables
echo "📋 Step 2: Checking environment variables..."
echo ""

if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    echo "Please create .env.local with your credentials"
    exit 1
fi

# Check for placeholders
if grep -q "placeholder" .env.local; then
    echo -e "${YELLOW}⚠️  Warning: .env.local contains placeholder values${NC}"
    echo "Please update .env.local with your actual credentials before deploying"
    echo ""
    echo "Required credentials:"
    echo "  - NEXT_PUBLIC_SUPABASE_URL"
    echo "  - SUPABASE_SERVICE_ROLE_KEY"
    echo "  - STRIPE_SECRET_KEY"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Environment file exists${NC}"
echo ""

# Build the project
echo "📋 Step 3: Building project..."
echo ""

npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Ask about Supabase migrations
echo "📋 Step 4: Database migrations..."
echo ""
echo "Would you like to apply Supabase migrations now?"
echo "  1) Yes, apply via Supabase Dashboard (manual)"
echo "  2) Skip for now"
echo ""
read -p "Choice (1/2): " db_choice

if [ "$db_choice" = "1" ]; then
    echo ""
    echo "📖 Opening migration file..."
    echo "File: $(pwd)/supabase_omega_complete.sql"
    echo ""
    echo "To apply:"
    echo "  1. Go to: https://supabase.com/dashboard"
    echo "  2. Select your project → SQL Editor"
    echo "  3. Copy contents of: supabase_omega_complete.sql"
    echo "  4. Paste and click Run"
    echo ""
    read -p "Press Enter when migrations are complete..."
fi

echo ""

# Ask about Stripe products
echo "📋 Step 5: Stripe products..."
echo ""

# Check if Stripe key is valid
if grep -q "sk_test_" .env.local || grep -q "sk_live_" .env.local; then
    echo "Would you like to create Stripe products automatically?"
    echo "  1) Yes, create products now"
    echo "  2) No, I'll create them manually"
    echo ""
    read -p "Choice (1/2): " stripe_choice

    if [ "$stripe_choice" = "1" ]; then
        echo ""
        echo "🔧 Creating Stripe products..."
        node scripts/setup-stripe-products.js
        echo ""
        echo "⚠️  IMPORTANT: Copy the environment variables above"
        echo "You'll need to add them to Vercel in the next step"
        echo ""
        read -p "Press Enter to continue..."
    fi
else
    echo -e "${YELLOW}⚠️  Skipping Stripe setup (no valid key found)${NC}"
fi

echo ""

# Deploy to Vercel
echo "📋 Step 6: Deploying to Vercel..."
echo ""

echo "This will deploy RYVYNN OMEGA to production."
echo ""
read -p "Ready to deploy? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Deploying to Vercel..."
    echo ""

    # Check if already linked
    if [ -d .vercel ]; then
        echo "Project already linked to Vercel"
        vercel --prod
    else
        echo "First time deployment - you'll be prompted to link/create project"
        vercel --prod
    fi

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Deployment successful!${NC}"
        echo ""

        # Get deployment URL
        DEPLOY_URL=$(vercel --prod 2>&1 | grep -o 'https://[^ ]*' | head -1)

        echo "🎉 Your app is live!"
        echo ""
        echo "📋 Final Steps:"
        echo "  1. Add Stripe price IDs to Vercel env vars"
        echo "  2. Set up Stripe webhook at:"
        echo "     ${DEPLOY_URL}/api/webhooks/stripe"
        echo "  3. Test the Truth Feed!"
        echo ""
        echo "See OMEGA_DEPLOYMENT.md for detailed verification steps"
    else
        echo -e "${RED}❌ Deployment failed${NC}"
        echo "Check Vercel logs for details"
        exit 1
    fi
else
    echo "Deployment cancelled"
fi

echo ""
echo "✨ Deployment script complete!"
