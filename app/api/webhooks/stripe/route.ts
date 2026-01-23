/**
 * Stripe Webhook Endpoint
 * Receives and processes Stripe events
 *
 * SECURITY:
 * - Signature verification required
 * - Service role for database operations
 * - Idempotent event processing
 *
 * SETUP:
 * 1. Deploy to Vercel
 * 2. Add webhook endpoint in Stripe Dashboard: https://yourdomain.com/api/webhooks/stripe
 * 3. Select events: checkout.session.completed, customer.subscription.*, invoice.payment_*
 * 4. Copy signing secret to STRIPE_WEBHOOK_SECRET in .env.local
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { handleWebhookEvent } from '@/lib/billing/webhook-handler'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

// Disable body parsing for signature verification
export const runtime = 'nodejs'

/**
 * POST /api/webhooks/stripe
 * Handles incoming Stripe webhook events
 */
export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    // Process event using centralized handler
    await handleWebhookEvent(event)

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error processing webhook:', error)

    // Return 500 to trigger Stripe retry
    return NextResponse.json(
      { error: 'Processing failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/stripe
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    webhook: 'stripe',
    env: {
      secret_key_configured: !!process.env.STRIPE_SECRET_KEY,
      webhook_secret_configured: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
  })
}
