/**
 * Stripe Price ID Mapping
 * Single source of truth for tier/add-on to Stripe price ID mappings
 *
 * CRITICAL: These price IDs must match your Stripe account
 * Create products/prices in Stripe Dashboard first, then update here
 */

import { Tier, BillingCadence } from '@/types/tiers'

// ============================================
// TIER PRICE MAPPINGS
// ============================================

export interface TierPriceMap {
  tier: Tier
  cadence: BillingCadence
  priceId: string
  amount: number // in dollars
}

/**
 * INSTRUCTIONS FOR SETUP:
 *
 * 1. Create 4 Products in Stripe Dashboard (Standard, Enhanced, Pro, Infinite)
 * 2. For each product, create 2 Prices (monthly + annual)
 * 3. Copy the price IDs and paste them below
 * 4. Update TIER_PRICES array with your real price IDs
 *
 * Example:
 * - Product: "RYVYNN Standard"
 * - Price 1: $9/month → price_abc123monthly
 * - Price 2: $90/year → price_abc123annual
 */

export const TIER_PRICES: TierPriceMap[] = [
  // Tier 1: Standard
  {
    tier: 1,
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY || 'price_PLACEHOLDER_standard_monthly',
    amount: 9,
  },
  {
    tier: 1,
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_STANDARD_ANNUAL || 'price_PLACEHOLDER_standard_annual',
    amount: 90,
  },

  // Tier 2: Enhanced
  {
    tier: 2,
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_ENHANCED_MONTHLY || 'price_PLACEHOLDER_enhanced_monthly',
    amount: 24,
  },
  {
    tier: 2,
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_ENHANCED_ANNUAL || 'price_PLACEHOLDER_enhanced_annual',
    amount: 240,
  },

  // Tier 3: Pro
  {
    tier: 3,
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || 'price_PLACEHOLDER_pro_monthly',
    amount: 49,
  },
  {
    tier: 3,
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_PRO_ANNUAL || 'price_PLACEHOLDER_pro_annual',
    amount: 490,
  },

  // Tier 4: Infinite
  {
    tier: 4,
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_INFINITE_MONTHLY || 'price_PLACEHOLDER_infinite_monthly',
    amount: 99,
  },
  {
    tier: 4,
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_INFINITE_ANNUAL || 'price_PLACEHOLDER_infinite_annual',
    amount: 990,
  },
]

// ============================================
// ADD-ON PRICE MAPPINGS
// ============================================

export interface AddOnPriceMap {
  addonKey: string
  priceId: string
  amount: number
  type: 'one_time' | 'monthly'
}

export const ADDON_PRICES: AddOnPriceMap[] = [
  // One-time add-ons
  {
    addonKey: 'avatar_pack_premium',
    priceId: process.env.STRIPE_PRICE_ID_AVATAR_PACK || 'price_PLACEHOLDER_avatar_pack',
    amount: 4.99,
    type: 'one_time',
  },
  {
    addonKey: 'voice_pack_premium',
    priceId: process.env.STRIPE_PRICE_ID_VOICE_PACK || 'price_PLACEHOLDER_voice_pack',
    amount: 7.99,
    type: 'one_time',
  },
  {
    addonKey: 'analytics_report_90day',
    priceId: process.env.STRIPE_PRICE_ID_ANALYTICS_REPORT || 'price_PLACEHOLDER_analytics_report',
    amount: 9.99,
    type: 'one_time',
  },

  // Recurring add-ons
  {
    addonKey: 'community_dashboard',
    priceId: process.env.STRIPE_PRICE_ID_COMMUNITY_DASHBOARD || 'price_PLACEHOLDER_community_dashboard',
    amount: 14,
    type: 'monthly',
  },
  {
    addonKey: 'clinician_dashboard',
    priceId: process.env.STRIPE_PRICE_ID_CLINICIAN_DASHBOARD || 'price_PLACEHOLDER_clinician_dashboard',
    amount: 29,
    type: 'monthly',
  },
]

// ============================================
// LOOKUP FUNCTIONS
// ============================================

/**
 * Get tier from Stripe price ID
 * Used in webhook handlers to determine tier from subscription
 */
export function getTierFromPriceId(priceId: string): Tier | null {
  const mapping = TIER_PRICES.find((p) => p.priceId === priceId)
  return mapping?.tier ?? null
}

/**
 * Get cadence from Stripe price ID
 */
export function getCadenceFromPriceId(priceId: string): BillingCadence | null {
  const mapping = TIER_PRICES.find((p) => p.priceId === priceId)
  return mapping?.cadence ?? null
}

/**
 * Get price ID for a specific tier and cadence
 * Used when creating checkout sessions
 */
export function getPriceIdForTier(tier: Tier, cadence: BillingCadence): string | null {
  const mapping = TIER_PRICES.find((p) => p.tier === tier && p.cadence === cadence)
  return mapping?.priceId ?? null
}

/**
 * Get add-on key from Stripe price ID
 * Used in webhook handlers for one-time purchases
 */
export function getAddOnFromPriceId(priceId: string): string | null {
  const mapping = ADDON_PRICES.find((a) => a.priceId === priceId)
  return mapping?.addonKey ?? null
}

/**
 * Get price ID for an add-on
 */
export function getPriceIdForAddOn(addonKey: string): string | null {
  const mapping = ADDON_PRICES.find((a) => a.addonKey === addonKey)
  return mapping?.priceId ?? null
}

/**
 * Validate that all required price IDs are configured
 * Run this on app startup to catch missing env vars
 */
export function validatePriceConfiguration(): {
  valid: boolean
  missing: string[]
} {
  const missing: string[] = []

  // Check tier prices
  TIER_PRICES.forEach((price) => {
    if (price.priceId.includes('PLACEHOLDER')) {
      missing.push(`Tier ${price.tier} ${price.cadence}`)
    }
  })

  // Check add-on prices
  ADDON_PRICES.forEach((addon) => {
    if (addon.priceId.includes('PLACEHOLDER')) {
      missing.push(`Add-on: ${addon.addonKey}`)
    }
  })

  return {
    valid: missing.length === 0,
    missing,
  }
}

// ============================================
// TIER NAMES (for display)
// ============================================

export const TIER_NAMES: Record<Tier, string> = {
  0: 'Base',
  1: 'Standard',
  2: 'Enhanced',
  3: 'Pro',
  4: 'Infinite',
  5: 'Transcendent',
}

/**
 * Get friendly tier name
 */
export function getTierName(tier: Tier): string {
  return TIER_NAMES[tier]
}
