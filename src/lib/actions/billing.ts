'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { stripe, getPriceId, type BillingPeriodType } from '@/lib/stripe'

export async function createCheckoutSession(
  plan: 'CORE' | 'PRO',
  period: BillingPeriodType
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!dbUser) {
    redirect('/signup')
  }

  const organization = dbUser.organization
  let customerId = organization.subscription?.stripeCustomerId

  // Create Stripe customer if doesn't exist
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: dbUser.name,
      metadata: {
        organizationId: organization.id,
        userId: dbUser.id,
      },
    })
    customerId = customer.id

    // Create initial subscription record
    await prisma.subscription.create({
      data: {
        organizationId: organization.id,
        stripeCustomerId: customerId,
        plan,
        billingPeriod: period === 'fourWeeks' ? 'FOUR_WEEKS' : 'ANNUAL',
        status: 'TRIALING',
      },
    })
  }

  const priceId = getPriceId(plan, period)

  if (!priceId) {
    throw new Error('Price ID not configured')
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_collection: 'always',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 14,
      metadata: {
        organizationId: organization.id,
      },
    },
    metadata: {
      organizationId: organization.id,
      userId: dbUser.id,
      plan,
      period,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    allow_promotion_codes: true,
  })

  if (!session.url) {
    throw new Error('Failed to create checkout session')
  }

  redirect(session.url)
}

export async function createBillingPortalSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!dbUser?.organization.subscription?.stripeCustomerId) {
    redirect('/pricing')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: dbUser.organization.subscription.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  })

  redirect(session.url)
}

export async function getSubscriptionStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!dbUser?.organization.subscription) {
    return null
  }

  const sub = dbUser.organization.subscription

  return {
    plan: sub.plan,
    status: sub.status,
    billingPeriod: sub.billingPeriod,
    trialEndsAt: sub.trialEndsAt,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    isActive: sub.status === 'ACTIVE' || sub.status === 'TRIALING',
    isTrialing: sub.status === 'TRIALING',
    daysUntilTrialEnd: sub.trialEndsAt
      ? Math.ceil((sub.trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  }
}

export async function changePlan(newPlan: 'CORE' | 'PRO', period: BillingPeriodType) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!dbUser?.organization.subscription?.stripeSubscriptionId) {
    // No active subscription, create checkout
    return createCheckoutSession(newPlan, period)
  }

  const sub = dbUser.organization.subscription
  const subscriptionId = sub.stripeSubscriptionId
  
  if (!subscriptionId) {
    // No Stripe subscription yet, create checkout
    return createCheckoutSession(newPlan, period)
  }
  
  const newPriceId = getPriceId(newPlan, period)

  if (!newPriceId) {
    throw new Error('Price ID not configured')
  }

  // Get current subscription from Stripe
  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId)

  // Update subscription with new price
  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: stripeSub.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
    metadata: {
      plan: newPlan,
      period,
    },
  })

  // Update local database
  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      plan: newPlan,
      billingPeriod: period === 'fourWeeks' ? 'FOUR_WEEKS' : 'ANNUAL',
      stripePriceId: newPriceId,
    },
  })

  return { success: true }
}

export async function cancelSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!dbUser?.organization.subscription?.stripeSubscriptionId) {
    return { error: 'No active subscription' }
  }

  const sub = dbUser.organization.subscription
  const subscriptionId = sub.stripeSubscriptionId!

  // Cancel at period end (graceful)
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      cancelAtPeriodEnd: true,
    },
  })

  return { success: true }
}

export async function reactivateSubscription() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      organization: {
        include: {
          subscription: true,
        },
      },
    },
  })

  if (!dbUser?.organization.subscription?.stripeSubscriptionId) {
    return { error: 'No subscription found' }
  }

  const sub = dbUser.organization.subscription
  const subscriptionId = sub.stripeSubscriptionId!

  // Reactivate subscription
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      cancelAtPeriodEnd: false,
    },
  })

  return { success: true }
}

