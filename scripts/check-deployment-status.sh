#!/bin/bash
# RYVYNN OMEGA - Deployment Status Checker

echo "🔍 RYVYNN OMEGA - Deployment Status Check"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

total=0
complete=0

# 1. Check code repository
echo "1️⃣  Code Repository"
if git rev-parse --git-dir > /dev/null 2>&1; then
    BRANCH=$(git branch --show-current)
    COMMITS=$(git log --oneline | head -5 | wc -l)
    echo -e "   ${GREEN}✅ Git repository initialized${NC}"
    echo "      Branch: $BRANCH"
    echo "      Recent commits: $COMMITS"
    ((complete++))
else
    echo -e "   ${RED}❌ Not a git repository${NC}"
fi
((total++))
echo ""

# 2. Check build
echo "2️⃣  Project Build"
if [ -d ".next" ]; then
    BUILD_TIME=$(stat -c %y .next 2>/dev/null | cut -d' ' -f1,2 | cut -d'.' -f1)
    echo -e "   ${GREEN}✅ Project built successfully${NC}"
    echo "      Built: $BUILD_TIME"
    ((complete++))
else
    echo -e "   ${YELLOW}⚠️  No build found${NC}"
    echo "      Run: npm run build"
fi
((total++))
echo ""

# 3. Check migrations
echo "3️⃣  Database Migrations"
if [ -f "supabase_omega_complete.sql" ]; then
    LINES=$(wc -l < supabase_omega_complete.sql)
    TABLES=$(grep -c "CREATE TABLE" supabase_omega_complete.sql)
    echo -e "   ${GREEN}✅ Migration file ready${NC}"
    echo "      File: supabase_omega_complete.sql"
    echo "      Lines: $LINES"
    echo "      Tables: $TABLES"
    echo -e "   ${YELLOW}⚠️  Not yet applied to Supabase${NC}"
    echo "      Apply via: Supabase Dashboard → SQL Editor"
else
    echo -e "   ${RED}❌ Migration file not found${NC}"
fi
((total++))
echo ""

# 4. Check environment variables
echo "4️⃣  Environment Variables"
if [ -f ".env.local" ]; then
    if grep -q "placeholder" .env.local; then
        echo -e "   ${YELLOW}⚠️  .env.local contains placeholders${NC}"
        echo "      Update with actual credentials"
    else
        SUPABASE=$(grep -c "SUPABASE" .env.local)
        STRIPE=$(grep -c "STRIPE" .env.local)
        echo -e "   ${GREEN}✅ .env.local configured${NC}"
        echo "      Supabase vars: $SUPABASE"
        echo "      Stripe vars: $STRIPE"
        ((complete++))
    fi
else
    echo -e "   ${RED}❌ .env.local not found${NC}"
fi
((total++))
echo ""

# 5. Check Stripe configuration
echo "5️⃣  Stripe Products"
if grep -q "STRIPE_PRICE_ID_SPARK_MONTHLY" .env.local 2>/dev/null; then
    PRICE_IDS=$(grep "STRIPE_PRICE_ID_" .env.local | grep -v "placeholder" | wc -l)
    if [ $PRICE_IDS -eq 10 ]; then
        echo -e "   ${GREEN}✅ All 10 Stripe price IDs configured${NC}"
        ((complete++))
    else
        echo -e "   ${YELLOW}⚠️  Only $PRICE_IDS/10 price IDs configured${NC}"
        echo "      Run: npm run setup:stripe"
    fi
else
    echo -e "   ${YELLOW}⚠️  Stripe products not configured${NC}"
    echo "      Run: npm run setup:stripe"
fi
((total++))
echo ""

# 6. Check Vercel deployment
echo "6️⃣  Vercel Deployment"
if [ -d ".vercel" ]; then
    if [ -f ".vercel/project.json" ]; then
        PROJECT=$(cat .vercel/project.json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
        echo -e "   ${GREEN}✅ Linked to Vercel project${NC}"
        echo "      Project: $PROJECT"
        ((complete++))
    else
        echo -e "   ${YELLOW}⚠️  Vercel directory exists but not configured${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Not deployed to Vercel${NC}"
    echo "      Run: npm run deploy"
fi
((total++))
echo ""

# 7. Check deployment scripts
echo "7️⃣  Deployment Automation"
SCRIPTS=0
[ -f "scripts/deploy-full.sh" ] && ((SCRIPTS++))
[ -f "scripts/setup-stripe-products.js" ] && ((SCRIPTS++))
[ -f "scripts/apply-migrations.js" ] && ((SCRIPTS++))

if [ $SCRIPTS -eq 3 ]; then
    echo -e "   ${GREEN}✅ All deployment scripts present${NC}"
    echo "      - deploy-full.sh"
    echo "      - setup-stripe-products.js"
    echo "      - apply-migrations.js"
    ((complete++))
else
    echo -e "   ${YELLOW}⚠️  Only $SCRIPTS/3 scripts found${NC}"
fi
((total++))
echo ""

# Summary
echo "=========================================="
echo "📊 Deployment Progress: $complete/$total complete"
echo ""

PERCENTAGE=$((complete * 100 / total))

if [ $complete -eq $total ]; then
    echo -e "${GREEN}🎉 Fully deployed and ready!${NC}"
elif [ $PERCENTAGE -ge 70 ]; then
    echo -e "${YELLOW}⚠️  Almost there! A few steps remaining.${NC}"
else
    echo -e "${YELLOW}⚠️  More setup needed. Follow DEPLOY_NOW.md${NC}"
fi

echo ""
echo "Next steps:"
if [ ! -f ".vercel/project.json" ]; then
    echo "  1. Deploy to Vercel: npm run deploy"
fi
if grep -q "placeholder" .env.local 2>/dev/null; then
    echo "  2. Update .env.local with real credentials"
fi
if ! grep -q "STRIPE_PRICE_ID_SPARK_MONTHLY" .env.local 2>/dev/null; then
    echo "  3. Create Stripe products: npm run setup:stripe"
fi
echo "  4. Apply migrations via Supabase Dashboard"
echo "  5. Configure Stripe webhook"
echo ""
echo "See DEPLOY_NOW.md for detailed instructions"
