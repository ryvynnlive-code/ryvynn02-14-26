/**
 * Stripe Webhook Handler
 * Processes Stripe events for subscription lifecycle
 *
 * SECURITY NOTES:
 * - Webhook signature verification is REQUIRED
 * - Uses service role to bypass RLS
 * - Idempotent operations (safe to replay)
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Disable body parsing so we can verify webhook signature
export const runtime = 'nodejs'

/**
 * Handle POST requests from Stripe webhooks
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Get admin client (bypasses RLS)
  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string
          const customerId = session.customer as string
          const userId = session.metadata?.supabase_user_id

          if (!userId) {
            console.error('No supabase_user_id in session metadata')
            break
          }

          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any

          // Create subscription record
          await supabase.from('subscriptions').upsert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(
              subscription.current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
          })

          // Update profile plan
          await supabase
            .from('profiles')
            .update({
              plan: 'premium',
              stripe_customer_id: customerId,
            })
            .eq('user_id', userId)

          // Log event
          await supabase.from('events').insert({
            user_id: userId,
            event_type: 'subscription_started',
            metadata: {
              subscription_id: subscriptionId,
            },
          })

          console.log(`Subscription created for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any

        // Find user by subscription ID
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSubscription) {
          // Update subscription record
          await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              stripe_price_id: subscription.items.data[0].price.id,
              current_period_start: new Date(
                subscription.current_period_start * 1000
              ).toISOString(),
              current_period_end: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', subscription.id)

          // Update profile plan based on subscription status
          const newPlan =
            subscription.status === 'active' || subscription.status === 'trialing'
              ? 'premium'
              : 'free'

          await supabase
            .from('profiles')
            .update({ plan: newPlan })
            .eq('user_id', existingSubscription.user_id)

          console.log(`Subscription updated: ${subscription.id}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any

        // Find user by subscription ID
        const { data: existingSubscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (existingSubscription) {
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
            })
            .eq('stripe_subscription_id', subscription.id)

          // Downgrade to free plan
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('user_id', existingSubscription.user_id)

          // Log event
          await supabase.from('events').insert({
            user_id: existingSubscription.user_id,
            event_type: 'subscription_canceled',
            metadata: {
              subscription_id: subscription.id,
            },
          })

          console.log(`Subscription canceled for user ${existingSubscription.user_id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Find user by subscription ID
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (existingSubscription) {
            // Update subscription status
            await supabase
              .from('subscriptions')
              .update({
                status: 'past_due',
              })
              .eq('stripe_subscription_id', subscriptionId)

            console.log(`Payment failed for subscription ${subscriptionId}`)
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription as string

        if (subscriptionId) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any

          // Find user by subscription ID
          const { data: existingSubscription } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single()

          if (existingSubscription) {
            // Update subscription with latest info
            await supabase
              .from('subscriptions')
              .update({
                status: subscription.status,
                current_period_start: new Date(
                  subscription.current_period_start * 1000
                ).toISOString(),
                current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId)

            // Ensure premium access
            await supabase
              .from('profiles')
              .update({ plan: 'premium' })
              .eq('user_id', existingSubscription.user_id)

            console.log(`Invoice paid for subscription ${subscriptionId}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
