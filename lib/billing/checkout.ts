/**
 * Stripe Checkout Session Creation
 * Handles subscription upgrades, downgrades, and one-time purchases
 */

'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getPriceIdForTier, getPriceIdForAddOn, getTierName } from './stripe-map-omega'
import { Tier, BillingCadence } from '@/types/tiers'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
})

// ============================================
// CREATE CHECKOUT SESSION
// ============================================

export interface CreateCheckoutSessionParams {
  userId: string
  tier: Tier
  cadence: BillingCadence
  successUrl?: string
  cancelUrl?: string
}

export async function createCheckoutSession(
  params: CreateCheckoutSessionParams
): Promise<{ url: string | null; error?: string }> {
  try {
    const { userId, tier, cadence, successUrl, cancelUrl } = params

    // Get price ID from mapping
    const priceId = getPriceIdForTier(tier, cadence)
    if (!priceId) {
      return { url: null, error: `Price not found for tier ${tier} ${cadence}` }
    }

    if (priceId.includes('PLACEHOLDER')) {
      return { url: null, error: 'Stripe prices not configured. See .env.local' }
    }

    // Get user profile
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('user_id', userId)
      .single()

    // Create or reuse Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: {
          user_id: userId,
        },
      })
      customerId = customer.id

      // TODO: Save customer ID to profile
      // await supabase.from('profiles').update({
      //   stripe_customer_id: customerId,
      // }).eq('user_id', userId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app?upgrade=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?upgrade=cancel`,
      metadata: {
        user_id: userId,
        tier: tier.toString(),
        cadence,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          tier: tier.toString(),
          tier_name: getTierName(tier),
        },
      },
    })

    return { url: session.url }
  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return { url: null, error: error.message }
  }
}

// ============================================
// CREATE CUSTOMER PORTAL SESSION
// ============================================

export interface CreatePortalSessionParams {
  userId: string
  returnUrl?: string
}

export async function createPortalSession(
  params: CreatePortalSessionParams
): Promise<{ url: string | null; error?: string }> {
  try {
    const { userId, returnUrl } = params

    // Get user's Stripe customer ID
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single()

    if (!profile?.stripe_customer_id) {
      return { url: null, error: 'No active subscription found' }
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
    })

    return { url: session.url }
  } catch (error: any) {
    console.error('Error creating portal session:', error)
    return { url: null, error: error.message }
  }
}

// ============================================
// ONE-TIME ADD-ON PURCHASE
// ============================================

export interface PurchaseAddOnParams {
  userId: string
  addonKey: string
  successUrl?: string
  cancelUrl?: string
}

export async function purchaseAddOn(
  params: PurchaseAddOnParams
): Promise<{ url: string | null; error?: string }> {
  try {
    const { userId, addonKey, successUrl, cancelUrl } = params

    // Get price ID for add-on
    const priceId = getPriceIdForAddOn(addonKey)
    if (!priceId) {
      return { url: null, error: `Add-on not found: ${addonKey}` }
    }

    if (priceId.includes('PLACEHOLDER')) {
      return { url: null, error: 'Add-on prices not configured' }
    }

    // Get user profile
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('user_id', userId)
      .single()

    // Create or reuse Stripe customer
    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email,
        metadata: {
          user_id: userId,
        },
      })
      customerId = customer.id
    }

    // Determine if add-on is one-time or recurring
    // For simplicity, check if it's a recurring add-on based on key
    const isRecurring = addonKey.includes('dashboard')

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isRecurring ? 'subscription' : 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app?addon=success`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/app/settings?addon=cancel`,
      metadata: {
        user_id: userId,
        addon_key: addonKey,
        type: 'addon',
      },
    })

    return { url: session.url }
  } catch (error: any) {
    console.error('Error creating add-on checkout:', error)
    return { url: null, error: error.message }
  }
}

// ============================================
// GET CURRENT SUBSCRIPTION
// ============================================

export async function getCurrentSubscription(userId: string): Promise<{
  tier: Tier
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: Date | null
} | null> {
  try {
    const supabase = await createClient()

    // TODO: Query subscriptions table
    // const { data } = await supabase
    //   .from('subscriptions')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('status', 'active')
    //   .single()

    // if (!data) return null

    // return {
    //   tier: data.tier,
    //   status: data.status,
    //   cancelAtPeriodEnd: data.cancel_at_period_end,
    //   currentPeriodEnd: new Date(data.current_period_end),
    // }

    return null // Placeholder until DB migration
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return null
  }
}
