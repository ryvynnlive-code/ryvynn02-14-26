#!/bin/bash
# RYVYNN Autonomous Deployment System
# Finds credentials from any source and deploys automatically

set -e

echo "🔥🔥 RYVYNN AUTONOMOUS DEPLOYMENT 🔥🔥"
echo "========================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Function to find credentials from various sources
find_credentials() {
    echo "🔍 Scanning for credentials..."

    # Check Vercel CLI
    if command -v vercel &> /dev/null; then
        echo "  → Checking Vercel..."
        if vercel env ls 2>/dev/null | grep -q "SUPABASE"; then
            echo -e "${GREEN}  ✅ Found Vercel environment variables${NC}"
            return 0
        fi
    fi

    # Check GitHub CLI
    if command -v gh &> /dev/null; then
        echo "  → Checking GitHub..."
        if gh secret list 2>/dev/null | grep -q "SUPABASE"; then
            echo -e "${GREEN}  ✅ Found GitHub secrets${NC}"
            return 0
        fi
    fi

    # Check for .env files
    if [ -f .env.local ] || [ -f .env ]; then
        echo -e "${GREEN}  ✅ Found .env file${NC}"
        return 0
    fi

    echo -e "${YELLOW}  ⚠️  No credentials found automatically${NC}"
    return 1
}

# Check if we have Vercel project linked
if [ ! -d .vercel ]; then
    echo "📦 Linking to Vercel project..."

    # Try to link automatically
    if command -v vercel &> /dev/null; then
        vercel link --yes 2>/dev/null || {
            echo -e "${YELLOW}Manual Vercel link required${NC}"
            echo "Run: vercel link"
            echo "Then run this script again"
            exit 1
        }
    else
        echo -e "${RED}Vercel CLI not available${NC}"
        echo "Install: npm i -g vercel@latest"
        exit 1
    fi
fi

# Try to find credentials
if ! find_credentials; then
    echo ""
    echo "🔑 Credential Setup Required"
    echo ""
    echo "I need to know WHERE your credentials are:"
    echo "  1) In Vercel dashboard (I'll fetch them)"
    echo "  2) In GitHub secrets (I'll use gh CLI)"
    echo "  3) You'll provide them now (I'll create .env.local)"
    echo ""
    read -p "Choose (1/2/3): " CRED_SOURCE

    case $CRED_SOURCE in
        1)
            echo "Pulling from Vercel..."
            vercel env pull .env.local
            ;;
        2)
            echo "Using GitHub secrets..."
            # Export GitHub secrets as env vars
            gh secret list --json name -q '.[].name' | while read secret; do
                value=$(gh secret get $secret)
                echo "$secret=$value" >> .env.local
            done
            ;;
        3)
            echo "Creating .env.local interactively..."
            ./complete-deployment.sh
            exit 0
            ;;
    esac
fi

# Now deploy
echo ""
echo "🚀 Deploying to Vercel..."

if [ -f .env.local ]; then
    # Upload env vars to Vercel
    echo "  → Syncing environment variables..."
    cat .env.local | while IFS='=' read -r key value; do
        if [ ! -z "$key" ] && [ ! -z "$value" ]; then
            vercel env add "$key" production <<< "$value" 2>/dev/null || true
        fi
    done
fi

# Build and deploy
echo "  → Building..."
npm run build

echo "  → Deploying..."
vercel --prod --yes

echo ""
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo ""
echo "🌐 Your app is now live!"
vercel ls | head -5
