#!/usr/bin/env node
/**
 * Create RYVYNN OMEGA Stripe Products
 * Automatically creates all 5 tiers with monthly and annual prices
 */

const stripe = require('stripe')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const stripeKey = process.env.STRIPE_SECRET_KEY

if (!stripeKey || stripeKey.includes('placeholder')) {
  console.error('❌ Error: Missing or invalid Stripe secret key')
  console.error('Please update .env.local with your actual STRIPE_SECRET_KEY')
  console.error('Get it from: https://dashboard.stripe.com/apikeys')
  process.exit(1)
}

const stripeClient = stripe(stripeKey)

const OMEGA_TIERS = [
  {
    name: 'RYVYNN Spark',
    description: 'Unlimited Truth Feed reading, 3 posts/day, Soul Token earning',
    monthly: 12.00,
    annual: 120.00,
    tier: 1
  },
  {
    name: 'RYVYNN Blaze',
    description: 'Everything in Spark, plus 10 posts/day, 2x Soul Token earn rate',
    monthly: 36.00,
    annual: 360.00,
    tier: 2
  },
  {
    name: 'RYVYNN Radiance',
    description: 'Everything in Blaze, plus 25 posts/day, impact allocation rights',
    monthly: 64.00,
    annual: 640.00,
    tier: 3
  },
  {
    name: 'RYVYNN Sovereign',
    description: 'Everything in Radiance, plus unlimited posts, 10x Soul Token earn',
    monthly: 96.00,
    annual: 960.00,
    tier: 4
  },
  {
    name: 'RYVYNN Transcendent',
    description: 'Ultimate tier with 15x Soul Token earn, priority support, all features',
    monthly: 936.00,
    annual: 9360.00,
    tier: 5
  }
]

async function createProducts() {
  console.log('🚀 RYVYNN OMEGA - Creating Stripe Products')
  console.log('=' .repeat(60))
  console.log('')

  const envVars = []

  for (const tierConfig of OMEGA_TIERS) {
    console.log(`\n📦 Creating product: ${tierConfig.name}`)
    console.log(`   Tier ${tierConfig.tier} | $${tierConfig.monthly}/mo or $${tierConfig.annual}/yr`)

    try {
      // Create product
      const product = await stripeClient.products.create({
        name: tierConfig.name,
        description: tierConfig.description,
        metadata: {
          tier: tierConfig.tier.toString(),
          omega_version: '1.0'
        }
      })

      console.log(`   ✅ Product created: ${product.id}`)

      // Create monthly price
      const monthlyPrice = await stripeClient.prices.create({
        product: product.id,
        unit_amount: Math.round(tierConfig.monthly * 100),
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        metadata: {
          tier: tierConfig.tier.toString(),
          cadence: 'monthly'
        }
      })

      console.log(`   ✅ Monthly price: ${monthlyPrice.id}`)

      // Create annual price
      const annualPrice = await stripeClient.prices.create({
        product: product.id,
        unit_amount: Math.round(tierConfig.annual * 100),
        currency: 'usd',
        recurring: {
          interval: 'year'
        },
        metadata: {
          tier: tierConfig.tier.toString(),
          cadence: 'annual'
        }
      })

      console.log(`   ✅ Annual price: ${annualPrice.id}`)

      // Track env vars
      const tierName = tierConfig.name.split(' ')[1].toUpperCase()
      envVars.push(`STRIPE_PRICE_ID_${tierName}_MONTHLY=${monthlyPrice.id}`)
      envVars.push(`STRIPE_PRICE_ID_${tierName}_ANNUAL=${annualPrice.id}`)

    } catch (error) {
      console.error(`   ❌ Error creating ${tierConfig.name}:`, error.message)
    }
  }

  console.log('')
  console.log('=' .repeat(60))
  console.log('🎉 Stripe product creation complete!')
  console.log('')
  console.log('📋 Add these to your .env.local and Vercel:')
  console.log('')
  envVars.forEach(line => console.log(line))
  console.log('')
  console.log('Next steps:')
  console.log('  1. Copy environment variables above')
  console.log('  2. Add to .env.local')
  console.log('  3. Add to Vercel: vercel env add [VAR_NAME]')
  console.log('  4. Redeploy: vercel --prod')
}

createProducts().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
