import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import type Stripe from 'stripe'

// Force Node.js runtime for Prisma database access
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      default:
        // Unhandled event type - ignore
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// Helper to extract subscription data
function extractSubscriptionData(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id
  
  // Determine plan from price ID
  let plan: 'CORE' | 'PRO' = 'CORE'
  let billingPeriod: 'FOUR_WEEKS' | 'ANNUAL' = 'FOUR_WEEKS'

  if (priceId === process.env.STRIPE_PRICE_PRO_4WEEKS) {
    plan = 'PRO'
    billingPeriod = 'FOUR_WEEKS'
  } else if (priceId === process.env.STRIPE_PRICE_PRO_ANNUAL) {
    plan = 'PRO'
    billingPeriod = 'ANNUAL'
  } else if (priceId === process.env.STRIPE_PRICE_CORE_ANNUAL) {
    plan = 'CORE'
    billingPeriod = 'ANNUAL'
  } else if (priceId === process.env.STRIPE_PRICE_CORE_4WEEKS) {
    plan = 'CORE'
    billingPeriod = 'FOUR_WEEKS'
  }

  // Map Stripe status to our status
  let status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'UNPAID' = 'ACTIVE'
  switch (subscription.status) {
    case 'trialing':
      status = 'TRIALING'
      break
    case 'active':
      status = 'ACTIVE'
      break
    case 'past_due':
      status = 'PAST_DUE'
      break
    case 'canceled':
      status = 'CANCELED'
      break
    case 'unpaid':
      status = 'UNPAID'
      break
  }

  // Access period dates via type assertion since Stripe types can vary
  const subData = subscription as unknown as {
    trial_end?: number | null
    current_period_start: number
    current_period_end: number
    cancel_at_period_end: boolean
  }

  return {
    priceId,
    plan,
    billingPeriod,
    status,
    trialEndsAt: subData.trial_end ? new Date(subData.trial_end * 1000) : null,
    currentPeriodStart: new Date(subData.current_period_start * 1000),
    currentPeriodEnd: new Date(subData.current_period_end * 1000),
    cancelAtPeriodEnd: subData.cancel_at_period_end,
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!organizationId || !customerId) {
    console.error('Missing organizationId or customerId in checkout session')
    return
  }

  // Retrieve the subscription to get details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const data = extractSubscriptionData(subscription)

  // Create or update subscription record
  await prisma.subscription.upsert({
    where: { organizationId },
    create: {
      organizationId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: data.priceId,
      plan: data.plan,
      billingPeriod: data.billingPeriod,
      status: data.status,
      trialEndsAt: data.trialEndsAt,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    },
    update: {
      stripeSubscriptionId: subscriptionId,
      stripePriceId: data.priceId,
      plan: data.plan,
      billingPeriod: data.billingPeriod,
      status: data.status,
      trialEndsAt: data.trialEndsAt,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
    },
  })

}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const existingSub = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (!existingSub) {
    console.error('Subscription not found for customer:', customerId)
    return
  }

  const data = extractSubscriptionData(subscription)

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      stripePriceId: data.priceId,
      plan: data.plan,
      billingPeriod: data.billingPeriod,
      status: data.status,
      trialEndsAt: data.trialEndsAt,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
    },
  })

}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      status: 'CANCELED',
      cancelAtPeriodEnd: false,
    },
  })

}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  await prisma.subscription.update({
    where: { stripeCustomerId: customerId },
    data: {
      status: 'PAST_DUE',
    },
  })

  // TODO: Send email notification about failed payment
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Only update if currently past due
  const sub = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (sub?.status === 'PAST_DUE') {
    await prisma.subscription.update({
      where: { stripeCustomerId: customerId },
      data: {
        status: 'ACTIVE',
      },
    })
  }

}
