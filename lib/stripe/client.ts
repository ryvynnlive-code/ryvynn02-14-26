import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export const PLANS = {
  FREE: {
    name: 'Free',
    flameLimit: 5,
  },
  PREMIUM: {
    name: 'Premium',
    priceId: process.env.STRIPE_PRICE_ID_PREMIUM!,
    flameLimit: 100,
    price: 9.99,
  },
}
