/**
 * Stripe Price ID Mapping - RYVYNN OMEGA
 * Single source of truth for RYVYNN OMEGA tier pricing
 */

import { Tier, BillingCadence } from '@/types/tiers'

// ============================================
// TIER PRICE MAPPINGS (OMEGA)
// ============================================

export interface TierPriceMap {
  tier: Tier
  tierName: string
  cadence: BillingCadence
  priceId: string
  amount: number // in dollars
}

/**
 * RYVYNN OMEGA PRICING
 *
 * Tier 0 (Free): $0
 * Tier 1 (Spark): $12/mo or $120/yr
 * Tier 2 (Blaze): $36/mo or $360/yr
 * Tier 3 (Radiance): $64/mo or $640/yr
 * Tier 4 (Sovereign): $96/mo or $960/yr
 * Tier 5 (Transcendent): $936/mo or $9360/yr
 */

export const TIER_PRICES: TierPriceMap[] = [
  // Tier 1: Spark
  {
    tier: 1,
    tierName: 'Spark',
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_SPARK_MONTHLY || 'price_PLACEHOLDER_spark_monthly',
    amount: 12,
  },
  {
    tier: 1,
    tierName: 'Spark',
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_SPARK_ANNUAL || 'price_PLACEHOLDER_spark_annual',
    amount: 120,
  },

  // Tier 2: Blaze
  {
    tier: 2,
    tierName: 'Blaze',
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_BLAZE_MONTHLY || 'price_PLACEHOLDER_blaze_monthly',
    amount: 36,
  },
  {
    tier: 2,
    tierName: 'Blaze',
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_BLAZE_ANNUAL || 'price_PLACEHOLDER_blaze_annual',
    amount: 360,
  },

  // Tier 3: Radiance
  {
    tier: 3,
    tierName: 'Radiance',
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_RADIANCE_MONTHLY || 'price_PLACEHOLDER_radiance_monthly',
    amount: 64,
  },
  {
    tier: 3,
    tierName: 'Radiance',
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_RADIANCE_ANNUAL || 'price_PLACEHOLDER_radiance_annual',
    amount: 640,
  },

  // Tier 4: Sovereign
  {
    tier: 4,
    tierName: 'Sovereign',
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_SOVEREIGN_MONTHLY || 'price_PLACEHOLDER_sovereign_monthly',
    amount: 96,
  },
  {
    tier: 4,
    tierName: 'Sovereign',
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_SOVEREIGN_ANNUAL || 'price_PLACEHOLDER_sovereign_annual',
    amount: 960,
  },

  // Tier 5: Transcendent
  {
    tier: 5,
    tierName: 'Transcendent',
    cadence: 'monthly',
    priceId: process.env.STRIPE_PRICE_ID_TRANSCENDENT_MONTHLY || 'price_PLACEHOLDER_transcendent_monthly',
    amount: 936,
  },
  {
    tier: 5,
    tierName: 'Transcendent',
    cadence: 'annual',
    priceId: process.env.STRIPE_PRICE_ID_TRANSCENDENT_ANNUAL || 'price_PLACEHOLDER_transcendent_annual',
    amount: 9360,
  },
]

// ============================================
// LOOKUP FUNCTIONS
// ============================================

/**
 * Get tier from Stripe price ID
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
 */
export function getPriceIdForTier(tier: Tier, cadence: BillingCadence): string | null {
  const mapping = TIER_PRICES.find((p) => p.tier === tier && p.cadence === cadence)
  return mapping?.priceId ?? null
}

/**
 * Validate that all required price IDs are configured
 */
export function validatePriceConfiguration(): {
  valid: boolean
  missing: string[]
} {
  const missing: string[] = []

  TIER_PRICES.forEach((price) => {
    if (price.priceId.includes('PLACEHOLDER')) {
      missing.push(`${price.tierName} ${price.cadence}`)
    }
  })

  return {
    valid: missing.length === 0,
    missing,
  }
}

// ============================================
// TIER NAMES
// ============================================

export const TIER_NAMES: Record<Tier, string> = {
  0: 'Free',
  1: 'Spark',
  2: 'Blaze',
  3: 'Radiance',
  4: 'Sovereign',
  5: 'Transcendent',
}

/**
 * Get friendly tier name
 */
export function getTierName(tier: Tier): string {
  return TIER_NAMES[tier] || 'Unknown'
}

// ============================================
// ADD-ON SUPPORT (STUB)
// ============================================

/**
 * Get add-on from price ID
 * NOTE: Add-ons not yet implemented in OMEGA
 */
export function getAddOnFromPriceId(priceId: string): string | null {
  // TODO: Implement add-ons for OMEGA
  return null
}

/**
 * Get price ID for add-on
 * NOTE: Add-ons not yet implemented in OMEGA
 */
export function getPriceIdForAddOn(addonKey: string): string | null {
  // TODO: Implement add-ons for OMEGA
  return null
}
