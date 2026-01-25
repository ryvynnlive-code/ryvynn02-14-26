#!/bin/bash
# 🚀 FINAL DEPLOYMENT - EXECUTE THIS SCRIPT
# Run from: /home/user/ryvynn02-14-26/

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║   🚀 RYVYNN OMEGA - FINAL DEPLOYMENT                        ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Verify we're in the right directory
if [ ! -f "COMPLETE_HANDOFF.md" ]; then
    echo "❌ Error: Not in RYVYNN project directory"
    echo "Run this from: /home/user/ryvynn02-14-26/"
    exit 1
fi

echo "✅ Current directory verified"
echo "📂 Working from: $(pwd)"
echo ""

# Check git status
echo "📋 Git Status:"
git status --short
echo ""

# Verify build passes
echo "🔨 Verifying build..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed - check errors above"
    exit 1
fi
echo ""

# Attempt Vercel login and deploy
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║   DEPLOYMENT OPTIONS                                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Choose deployment method:"
echo ""
echo "  1) Vercel CLI (requires login)"
echo "  2) Show Vercel Web Dashboard instructions"
echo "  3) Display deployment summary"
echo "  4) Exit"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔐 Logging into Vercel..."
        echo "This will open a browser for authentication."
        echo ""
        vercel login

        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Login successful!"
            echo ""
            read -p "Deploy to production now? (y/n): " deploy

            if [ "$deploy" = "y" ] || [ "$deploy" = "Y" ]; then
                echo ""
                echo "🚀 Deploying to Vercel production..."
                vercel --prod

                if [ $? -eq 0 ]; then
                    echo ""
                    echo "╔══════════════════════════════════════════════════════════════╗"
                    echo "║   ✅ DEPLOYMENT SUCCESSFUL!                                  ║"
                    echo "╚══════════════════════════════════════════════════════════════╝"
                    echo ""
                    echo "🎉 RYVYNN OMEGA is now live!"
                    echo ""
                    echo "📋 Next Steps:"
                    echo "1. Copy SQL from COMPLETE_HANDOFF.md"
                    echo "2. Go to: https://supabase.com/dashboard"
                    echo "3. SQL Editor → Paste and Run"
                    echo "4. Configure Stripe webhook"
                    echo ""
                    echo "See COMPLETE_HANDOFF.md for details."
                else
                    echo ""
                    echo "❌ Deployment failed"
                    echo "Check Vercel logs above"
                fi
            fi
        else
            echo "❌ Login failed"
        fi
        ;;

    2)
        echo ""
        echo "╔══════════════════════════════════════════════════════════════╗"
        echo "║   VERCEL WEB DASHBOARD DEPLOYMENT                            ║"
        echo "╚══════════════════════════════════════════════════════════════╝"
        echo ""
        echo "1. Go to: https://vercel.com/dashboard"
        echo ""
        echo "2. Click 'Add New' → 'Project'"
        echo ""
        echo "3. Import Git Repository:"
        echo "   Repository: ryvynnlive-code/ryvynn02-14-26"
        echo "   Branch: claude/ryvynn-mvp-complete-FzTfo"
        echo ""
        echo "4. Framework: Next.js (auto-detected)"
        echo ""
        echo "5. Environment Variables:"
        echo "   ✓ Already configured in Vercel"
        echo ""
        echo "6. Click 'Deploy'"
        echo ""
        echo "7. Wait 3-5 minutes for build to complete"
        echo ""
        echo "8. Get production URL and apply database migrations"
        echo "   (See COMPLETE_HANDOFF.md)"
        echo ""
        ;;

    3)
        echo ""
        cat << 'EOF'
╔══════════════════════════════════════════════════════════════╗
║   DEPLOYMENT SUMMARY                                         ║
╚══════════════════════════════════════════════════════════════╝

✅ CODE STATUS
──────────────────────────────────────────────────────────────
• Branch: claude/ryvynn-mvp-complete-FzTfo
• Status: All changes committed and pushed
• Build: Passing (TypeScript clean)
• Files: All deployment files ready

📦 WHAT'S READY
──────────────────────────────────────────────────────────────
• Truth Feed (anonymous social feed)
• Soul Token System (dual-ledger)
• 6-Tier Subscriptions ($0-$936/mo)
• Avatar Evolution (6 stages)
• Crisis Detection
• 9 Database Tables (644 lines SQL)
• Stripe Integration
• GitHub Actions Workflow

📋 DEPLOYMENT FILES
──────────────────────────────────────────────────────────────
• COMPLETE_HANDOFF.md ......... Main deployment guide
• supabase_omega_complete.sql . Database migrations
• PRODUCTION_READY.md ......... Detailed guide
• vercel.json ................. Vercel configuration

🎯 QUICK DEPLOY
──────────────────────────────────────────────────────────────
1. Vercel Dashboard: https://vercel.com/dashboard
2. Import: ryvynnlive-code/ryvynn02-14-26
3. Branch: claude/ryvynn-mvp-complete-FzTfo
4. Deploy

Then apply database migrations and configure webhook.

See COMPLETE_HANDOFF.md for step-by-step instructions.

EOF
        ;;

    4)
        echo "Exiting..."
        exit 0
        ;;

    *)
        echo "Invalid option"
        exit 1
        ;;
esac

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
