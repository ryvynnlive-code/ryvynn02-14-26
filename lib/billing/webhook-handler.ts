/**
 * Stripe Webhook Event Handler
 * Processes subscription and payment events with idempotency
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getTierFromPriceId, getAddOnFromPriceId, getTierName } from './stripe-map-omega'
import { Tier, TIER_VERSION } from '@/types/tiers'
import tierMatrix from '@/data/tier_matrix_omega.json'

// ============================================
// EVENT PROCESSING
// ============================================

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  const supabase = await createClient()

  // Check if event already processed (idempotency)
  const alreadyProcessed = await isEventProcessed(supabase, event.id)
  if (alreadyProcessed) {
    console.log(`Event ${event.id} already processed, skipping`)
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(supabase, event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(supabase, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(supabase, event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await markEventProcessed(supabase, event.id, event.type)
  } catch (error) {
    console.error(`Error processing event ${event.id}:`, error)
    throw error // Re-throw to let Stripe retry
  }
}

// ============================================
// CHECKOUT SESSION COMPLETED
// ============================================

async function handleCheckoutComplete(supabase: any, session: Stripe.Checkout.Session): Promise<void> {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const metadata = session.metadata

  if (!metadata?.user_id) {
    throw new Error('Missing user_id in checkout session metadata')
  }

  const userId = metadata.user_id

  // Update profiles table with Stripe customer ID
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ stripe_customer_id: customerId })
    .eq('user_id', userId)

  if (profileError) {
    console.error('Error updating profile with customer ID:', profileError)
    // Don't throw - subscription.created will handle the rest
  }

  console.log(`Checkout completed for user ${userId}, subscription ${subscriptionId}`)

  // Subscription details will be handled by subscription.created event
}

// ============================================
// SUBSCRIPTION CHANGE (CREATE/UPDATE)
// ============================================

async function handleSubscriptionChange(supabase: any, subscription: Stripe.Subscription): Promise<void> {
  const customerId = subscription.customer as string
  const subscriptionId = subscription.id
  const status = subscription.status

  // Get tier from price ID
  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) {
    throw new Error('No price ID found in subscription')
  }

  const tier = getTierFromPriceId(priceId)
  if (tier === null) {
    throw new Error(`Unknown price ID: ${priceId}`)
  }

  // Try to find user by Stripe customer ID first
  let userId: string | undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    userId = profile.user_id
  } else {
    // Fallback to metadata if customer ID lookup fails
    userId = subscription.metadata.user_id
  }

  if (!userId) {
    throw new Error(`No user_id found for customer ${customerId}`)
  }

  // Upsert subscription record
  const { error: subError } = await supabase.from('subscriptions').upsert({
    id: subscriptionId,
    user_id: userId,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    status: status,
    price_id: priceId,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    tier: tier,
  }, {
    onConflict: 'id'
  })

  if (subError) {
    console.error('Error upserting subscription:', subError)
    throw subError
  }

  // Update entitlements if subscription is active
  if (status === 'active' || status === 'trialing') {
    await syncUserEntitlements(supabase, userId, tier)
  }

  console.log(`Subscription ${subscriptionId} updated: tier ${tier}, status ${status}`)
}

// ============================================
// SUBSCRIPTION DELETED
// ============================================

async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription): Promise<void> {
  const subscriptionId = subscription.id
  const customerId = subscription.customer as string

  // Try to find user
  let userId: string | undefined

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profile) {
    userId = profile.user_id
  } else {
    userId = subscription.metadata.user_id
  }

  if (!userId) {
    throw new Error('No user_id found')
  }

  // Mark subscription as canceled
  const { error: subError } = await supabase.from('subscriptions').update({
    status: 'canceled',
    canceled_at: new Date().toISOString(),
  }).eq('stripe_subscription_id', subscriptionId)

  if (subError) {
    console.error('Error updating subscription status:', subError)
  }

  // Downgrade to Base tier (0)
  await syncUserEntitlements(supabase, userId, 0)

  console.log(`Subscription ${subscriptionId} deleted, user ${userId} downgraded to Base`)
}

// ============================================
// PAYMENT SUCCESS
// ============================================

async function handlePaymentSuccess(supabase: any, invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as any).subscription as string
  const customerId = (invoice as any).customer as string
  const amountPaid = invoice.amount_paid / 100 // Convert cents to dollars

  // Log payment event
  const { error } = await supabase.from('payment_events').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    amount: amountPaid,
    currency: invoice.currency,
    status: 'succeeded',
    created_at: new Date((invoice.created ?? Date.now() / 1000) * 1000).toISOString(),
  })

  if (error) {
    // Log but don't throw - payment tracking is not critical
    console.error('Error logging payment event:', error)
  }

  console.log(`Payment succeeded for subscription ${subscriptionId}: $${amountPaid}`)
}

// ============================================
// PAYMENT FAILED
// ============================================

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as any).subscription as string
  const customerId = (invoice as any).customer as string

  // Log failure
  const { error } = await supabase.from('payment_events').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    amount: invoice.amount_due / 100,
    currency: invoice.currency,
    status: 'failed',
    created_at: new Date((invoice.created ?? Date.now() / 1000) * 1000).toISOString(),
  })

  if (error) {
    console.error('Error logging payment failure:', error)
  }

  // TODO: Send email notification via preferred email service
  console.error(`Payment failed for subscription ${subscriptionId}`)
}

// ============================================
// ENTITLEMENT SYNC
// ============================================

/**
 * Sync user entitlements based on tier
 * Updates entitlements table with tier-specific limits and features
 */
async function syncUserEntitlements(supabase: any, userId: string, tier: Tier): Promise<void> {
  // Load tier definition from tier_matrix.json
  const tierDef = tierMatrix.tiers.find((t) => t.id === tier)
  if (!tierDef) {
    throw new Error(`Tier definition not found for tier ${tier}`)
  }

  // Upsert entitlements table
  const entitlementData = {
    user_id: userId,
    current_tier: tier,
    tier_version: TIER_VERSION,
    flame_conversations_per_day: tierDef.limits.flame_conversations_per_day === 999999
      ? 999999
      : tierDef.limits.flame_conversations_per_day,
    daily_goals_max: tierDef.limits.daily_goals_max === -1
      ? 999999
      : tierDef.limits.daily_goals_max,
    api_calls_per_day: tierDef.limits.api_calls_per_day,
    journal_retention_days: tierDef.limits.journal_retention_days,
    features: tierDef.features,
    updated_at: new Date().toISOString(),
  }

  const { error: entError } = await supabase.from('entitlements').upsert(entitlementData, {
    onConflict: 'user_id',
  })

  if (entError) {
    console.error('Error upserting entitlements:', entError)
    // Continue - we still want to update the profile
  }

  // Also update profiles.current_tier for quick access
  const { error: profileError } = await supabase.from('profiles').update({
    current_tier: tier,
  }).eq('user_id', userId)

  if (profileError) {
    console.error('Error updating profile tier:', profileError)
  }

  console.log(`Entitlements synced for user ${userId}: tier ${tier} (${getTierName(tier)})`)
}

// ============================================
// IDEMPOTENCY TRACKING
// ============================================

/**
 * Check if webhook event has already been processed
 */
async function isEventProcessed(supabase: any, eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('processed_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is expected for new events
    console.error('Error checking processed events:', error)
  }

  return !!data
}

/**
 * Mark webhook event as processed
 */
async function markEventProcessed(supabase: any, eventId: string, eventType: string): Promise<void> {
  const { error } = await supabase.from('processed_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
    processed_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Error marking event as processed:', error)
    // Don't throw - event was already processed successfully
  }

  console.log(`Marked event ${eventId} (${eventType}) as processed`)
}
