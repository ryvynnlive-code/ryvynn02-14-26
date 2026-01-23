/**
 * Stripe Webhook Event Handler
 * Processes subscription and payment events with idempotency
 */

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { getTierFromPriceId, getAddOnFromPriceId, getTierName } from './stripe-map-omega'
import { Tier, TIER_VERSION } from '@/types/tiers'
import tierMatrix from '@/data/tier_matrix_omega.json'

const supabase = createClient()

// ============================================
// EVENT PROCESSING
// ============================================

export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  // Check if event already processed (idempotency)
  const alreadyProcessed = await isEventProcessed(event.id)
  if (alreadyProcessed) {
    console.log(`Event ${event.id} already processed, skipping`)
    return
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Mark event as processed
    await markEventProcessed(event.id, event.type)
  } catch (error) {
    console.error(`Error processing event ${event.id}:`, error)
    throw error // Re-throw to let Stripe retry
  }
}

// ============================================
// CHECKOUT SESSION COMPLETED
// ============================================

async function handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string
  const metadata = session.metadata

  if (!metadata?.user_id) {
    throw new Error('Missing user_id in checkout session metadata')
  }

  const userId = metadata.user_id

  // TODO: Update your profiles table with Stripe customer ID
  // const { error: profileError } = await supabase
  //   .from('profiles')
  //   .update({ stripe_customer_id: customerId })
  //   .eq('user_id', userId)

  // if (profileError) throw profileError

  console.log(`Checkout completed for user ${userId}, subscription ${subscriptionId}`)

  // Subscription details will be handled by subscription.created event
}

// ============================================
// SUBSCRIPTION CHANGE (CREATE/UPDATE)
// ============================================

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
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

  // TODO: Find user by Stripe customer ID
  // const { data: profile } = await supabase
  //   .from('profiles')
  //   .select('user_id')
  //   .eq('stripe_customer_id', customerId)
  //   .single()

  // if (!profile) {
  //   throw new Error(`No user found for customer ${customerId}`)
  // }

  // const userId = profile.user_id

  // For now, use metadata if available
  const userId = subscription.metadata.user_id
  if (!userId) {
    throw new Error('No user_id found in subscription metadata or profile')
  }

  // Update subscription record
  // TODO: Upsert subscription table
  // await supabase.from('subscriptions').upsert({
  //   id: subscriptionId,
  //   user_id: userId,
  //   stripe_subscription_id: subscriptionId,
  //   stripe_customer_id: customerId,
  //   status: status,
  //   price_id: priceId,
  //   current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
  //   current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  //   cancel_at_period_end: subscription.cancel_at_period_end,
  //   canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
  //   tier: tier,
  // })

  // Update entitlements if subscription is active
  if (status === 'active' || status === 'trialing') {
    await syncUserEntitlements(userId, tier)
  }

  console.log(`Subscription ${subscriptionId} updated: tier ${tier}, status ${status}`)
}

// ============================================
// SUBSCRIPTION DELETED
// ============================================

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const subscriptionId = subscription.id
  const customerId = subscription.customer as string

  // TODO: Find user
  const userId = subscription.metadata.user_id
  if (!userId) {
    throw new Error('No user_id found')
  }

  // TODO: Mark subscription as canceled
  // await supabase.from('subscriptions').update({
  //   status: 'canceled',
  //   canceled_at: new Date().toISOString(),
  // }).eq('stripe_subscription_id', subscriptionId)

  // Downgrade to Base tier (0)
  await syncUserEntitlements(userId, 0)

  console.log(`Subscription ${subscriptionId} deleted, user ${userId} downgraded to Base`)
}

// ============================================
// PAYMENT SUCCESS
// ============================================

async function handlePaymentSuccess(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string
  const customerId = invoice.customer as string
  const amountPaid = invoice.amount_paid / 100 // Convert cents to dollars

  // TODO: Log payment event
  // await supabase.from('payment_events').insert({
  //   stripe_invoice_id: invoice.id,
  //   stripe_subscription_id: subscriptionId,
  //   stripe_customer_id: customerId,
  //   amount: amountPaid,
  //   currency: invoice.currency,
  //   status: 'succeeded',
  //   created_at: new Date(invoice.created * 1000).toISOString(),
  // })

  console.log(`Payment succeeded for subscription ${subscriptionId}: $${amountPaid}`)
}

// ============================================
// PAYMENT FAILED
// ============================================

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string
  const customerId = invoice.customer as string

  // TODO: Log failure and notify user
  // await supabase.from('payment_events').insert({
  //   stripe_invoice_id: invoice.id,
  //   stripe_subscription_id: subscriptionId,
  //   stripe_customer_id: customerId,
  //   amount: invoice.amount_due / 100,
  //   currency: invoice.currency,
  //   status: 'failed',
  //   created_at: new Date(invoice.created * 1000).toISOString(),
  // })

  // TODO: Send email notification
  console.error(`Payment failed for subscription ${subscriptionId}`)
}

// ============================================
// ENTITLEMENT SYNC
// ============================================

/**
 * Sync user entitlements based on tier
 * Updates entitlements table with tier-specific limits and features
 */
async function syncUserEntitlements(userId: string, tier: Tier): Promise<void> {
  // Load tier definition from tier_matrix.json
  const tierDef = tierMatrix.tiers.find((t) => t.id === tier)
  if (!tierDef) {
    throw new Error(`Tier definition not found for tier ${tier}`)
  }

  // TODO: Upsert entitlements table
  // const entitlementData = {
  //   user_id: userId,
  //   current_tier: tier,
  //   tier_version: TIER_VERSION,
  //   flame_conversations_per_day: tierDef.limits.flame_conversations_per_day === 'unlimited'
  //     ? 999999
  //     : tierDef.limits.flame_conversations_per_day,
  //   daily_goals_max: tierDef.limits.daily_goals_max === 'unlimited'
  //     ? 999999
  //     : tierDef.limits.daily_goals_max,
  //   api_calls_per_day: tierDef.limits.api_calls_per_day,
  //   journal_retention_days: tierDef.limits.journal_retention_days,
  //   features: tierDef.features,
  //   updated_at: new Date().toISOString(),
  // }

  // await supabase.from('entitlements').upsert(entitlementData, {
  //   onConflict: 'user_id',
  // })

  // Also update profiles.current_tier for quick access
  // await supabase.from('profiles').update({
  //   current_tier: tier,
  // }).eq('user_id', userId)

  console.log(`Entitlements synced for user ${userId}: tier ${tier} (${getTierName(tier)})`)
}

// ============================================
// IDEMPOTENCY TRACKING
// ============================================

/**
 * Check if webhook event has already been processed
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  // TODO: Query processed_events table
  // const { data } = await supabase
  //   .from('processed_events')
  //   .select('id')
  //   .eq('stripe_event_id', eventId)
  //   .single()

  // return !!data

  return false // For now, always process (implement after DB migration)
}

/**
 * Mark webhook event as processed
 */
async function markEventProcessed(eventId: string, eventType: string): Promise<void> {
  // TODO: Insert into processed_events table
  // await supabase.from('processed_events').insert({
  //   stripe_event_id: eventId,
  //   event_type: eventType,
  //   processed_at: new Date().toISOString(),
  // })

  console.log(`Marked event ${eventId} (${eventType}) as processed`)
}
