#!/usr/bin/env npx ts-node
/**
 * RYVYNN Integration Validation Script
 * Verifies Stripe and Supabase connectivity before deployment
 *
 * Usage:
 *   npx ts-node scripts/validate-integrations.ts
 *   OR
 *   npm run validate
 */

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

interface ValidationResult {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  details?: Record<string, unknown>
}

const results: ValidationResult[] = []

function log(result: ValidationResult) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${result.name}: ${result.message}`)
  if (result.details) {
    Object.entries(result.details).forEach(([key, value]) => {
      console.log(`   └─ ${key}: ${value}`)
    })
  }
  results.push(result)
}

async function validateSupabaseConnection() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    log({
      name: 'Supabase Environment',
      status: 'fail',
      message: 'Missing required environment variables',
      details: {
        NEXT_PUBLIC_SUPABASE_URL: url ? '✓ Set' : '✗ Missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? '✓ Set' : '✗ Missing',
        SUPABASE_SERVICE_ROLE_KEY: serviceKey ? '✓ Set' : '✗ Missing (required for webhooks)',
      },
    })
    return false
  }

  log({
    name: 'Supabase Environment',
    status: 'pass',
    message: 'All environment variables configured',
  })

  try {
    const supabase = createClient(url, anonKey)
    const { error } = await supabase.from('profiles').select('count').limit(0)

    if (error) {
      log({
        name: 'Supabase Connection',
        status: 'fail',
        message: 'Failed to connect to database',
        details: { error: error.message },
      })
      return false
    }

    log({
      name: 'Supabase Connection',
      status: 'pass',
      message: 'Successfully connected to database',
    })
    return true
  } catch (err: any) {
    log({
      name: 'Supabase Connection',
      status: 'fail',
      message: 'Connection error',
      details: { error: err.message },
    })
    return false
  }
}

async function validateSupabaseTables() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    log({
      name: 'Supabase Tables',
      status: 'warn',
      message: 'Cannot validate tables without service role key',
    })
    return
  }

  const supabase = createClient(url, serviceKey)

  const requiredTables = [
    'profiles',
    'subscriptions',
    'entitlements',
    'processed_events',
    'payment_events',
    'truth_posts',
    'soul_tokens_personal',
  ]

  const missingTables: string[] = []

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0)
      if (error && error.code === '42P01') {
        missingTables.push(table)
      }
    } catch {
      missingTables.push(table)
    }
  }

  if (missingTables.length > 0) {
    log({
      name: 'Supabase Tables',
      status: 'warn',
      message: `${missingTables.length} table(s) need to be created`,
      details: { missing: missingTables.join(', ') },
    })
  } else {
    log({
      name: 'Supabase Tables',
      status: 'pass',
      message: 'All required tables exist',
    })
  }
}

async function validateStripeConnection() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey) {
    log({
      name: 'Stripe Environment',
      status: 'fail',
      message: 'Missing STRIPE_SECRET_KEY',
    })
    return false
  }

  log({
    name: 'Stripe Environment',
    status: webhookSecret ? 'pass' : 'warn',
    message: webhookSecret ? 'All keys configured' : 'STRIPE_WEBHOOK_SECRET not yet configured (normal before first deploy)',
    details: {
      STRIPE_SECRET_KEY: secretKey.startsWith('sk_test') ? '✓ Test mode' : secretKey.startsWith('sk_live') ? '✓ Live mode' : '✗ Invalid',
      STRIPE_WEBHOOK_SECRET: webhookSecret ? '✓ Set' : '⚠ Not set (configure after deployment)',
    },
  })

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2025-12-15.clover' as any })
    const account = await stripe.accounts.retrieve()

    log({
      name: 'Stripe Connection',
      status: 'pass',
      message: 'Successfully connected to Stripe',
      details: {
        account_id: account.id,
        country: account.country || 'N/A',
        charges_enabled: account.charges_enabled ?? 'N/A',
      },
    })
    return true
  } catch (err: any) {
    log({
      name: 'Stripe Connection',
      status: 'fail',
      message: 'Failed to connect to Stripe',
      details: { error: err.message },
    })
    return false
  }
}

async function validateStripeProducts() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return

  try {
    const stripe = new Stripe(secretKey, { apiVersion: '2025-12-15.clover' as any })
    const products = await stripe.products.list({ active: true, limit: 20 })
    const prices = await stripe.prices.list({ active: true, limit: 50 })

    const ryvynnProducts = products.data.filter((p) =>
      p.name?.toLowerCase().includes('ryvynn') ||
      ['spark', 'blaze', 'radiance', 'sovereign', 'transcendent'].some((tier) =>
        p.name?.toLowerCase().includes(tier)
      )
    )

    if (ryvynnProducts.length === 0) {
      log({
        name: 'Stripe Products',
        status: 'warn',
        message: 'No RYVYNN products found - run npm run setup:stripe to create them',
      })
    } else {
      log({
        name: 'Stripe Products',
        status: 'pass',
        message: `Found ${ryvynnProducts.length} RYVYNN product(s)`,
        details: {
          products: ryvynnProducts.map((p) => p.name).join(', '),
          total_prices: prices.data.length,
        },
      })
    }
  } catch (err: any) {
    log({
      name: 'Stripe Products',
      status: 'warn',
      message: 'Could not fetch products',
      details: { error: err.message },
    })
  }
}

async function validateAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  if (!appUrl) {
    log({
      name: 'App URL',
      status: 'warn',
      message: 'NEXT_PUBLIC_APP_URL not set',
      details: { hint: 'Set this to your Vercel deployment URL or custom domain' },
    })
    return
  }

  try {
    new URL(appUrl)
    log({
      name: 'App URL',
      status: 'pass',
      message: 'Valid URL configured',
      details: { url: appUrl },
    })
  } catch {
    log({
      name: 'App URL',
      status: 'fail',
      message: 'Invalid URL format',
      details: { value: appUrl },
    })
  }
}

async function main() {
  console.log('\n════════════════════════════════════════════════════════════')
  console.log('   RYVYNN OMEGA - Integration Validation')
  console.log('════════════════════════════════════════════════════════════\n')

  // Load .env.local if running locally
  try {
    const { config } = await import('dotenv')
    config({ path: '.env.local' })
    console.log('📁 Loaded .env.local\n')
  } catch {
    console.log('ℹ️  No .env.local found (using environment variables)\n')
  }

  console.log('--- Supabase ---')
  await validateSupabaseConnection()
  await validateSupabaseTables()

  console.log('\n--- Stripe ---')
  await validateStripeConnection()
  await validateStripeProducts()

  console.log('\n--- Application ---')
  await validateAppUrl()

  // Summary
  console.log('\n════════════════════════════════════════════════════════════')
  console.log('   Summary')
  console.log('════════════════════════════════════════════════════════════\n')

  const passed = results.filter((r) => r.status === 'pass').length
  const failed = results.filter((r) => r.status === 'fail').length
  const warned = results.filter((r) => r.status === 'warn').length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warned}`)

  if (failed > 0) {
    console.log('\n❌ Validation FAILED - Fix issues before deploying')
    process.exit(1)
  } else if (warned > 0) {
    console.log('\n⚠️  Validation passed with warnings')
    console.log('   Some features may not work until warnings are resolved')
    process.exit(0)
  } else {
    console.log('\n✅ All validations PASSED - Ready for deployment!')
    process.exit(0)
  }
}

main().catch((err) => {
  console.error('Validation script error:', err)
  process.exit(1)
})
