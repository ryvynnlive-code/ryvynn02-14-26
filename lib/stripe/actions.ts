/**
 * Stripe Server Actions
 * Handle Stripe operations server-side
 */

'use server'

import { stripe, PLANS } from './client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Create Stripe Checkout Session for Premium subscription
 */
export async function createCheckoutSession() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get or create Stripe customer
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, email')
    .eq('user_id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id

  if (!customerId) {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: profile?.email || user.email || undefined,
      metadata: {
        supabase_user_id: user.id,
      },
    })

    customerId = customer.id

    // Save customer ID to profile
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', user.id)
  }

  // Create Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: PLANS.PREMIUM.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?canceled=true`,
    metadata: {
      supabase_user_id: user.id,
    },
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  redirect(session.url)
}

/**
 * Create Stripe Customer Portal Session
 */
export async function createPortalSession() {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Not authenticated')
  }

  // Get Stripe customer ID
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    throw new Error('No Stripe customer found')
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
  })

  redirect(session.url)
}

/**
 * Get current subscription status
 */
export async function getSubscriptionStatus() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  return {
    plan: profile?.plan || 'free',
    subscription,
  }
}
