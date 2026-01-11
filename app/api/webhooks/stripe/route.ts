import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { addCredits } from '@/lib/services/credit-service';
import { handlePaymentFailure, markRetrySucceeded } from '@/lib/services/payment-retry-service';
import type Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('Missing STRIPE_WEBHOOK_SECRET environment variable');
    return NextResponse.json(
      { error: 'Webhook configuration error' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${errorMessage}` },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook handler error: ${errorMessage}`);
    
    Sentry.captureException(err, {
      tags: {
        component: 'stripe',
        operation: 'webhook_handler',
      },
      extra: {
        eventType: event?.type,
      },
    });
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const packageId = session.metadata?.package_id;
  const creditsStr = session.metadata?.credits;

  if (!userId || !packageId || !creditsStr) {
    throw new Error('Missing required metadata in checkout session');
  }

  const credits = parseInt(creditsStr, 10);
  if (isNaN(credits) || credits <= 0) {
    throw new Error(`Invalid credits value: ${creditsStr}`);
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 12);

  const stripePaymentId = session.payment_intent as string | null;

  await addCredits(userId, credits, 'purchase', stripePaymentId, expiresAt);

  console.log(`Added ${credits} credits to user ${userId} (package: ${packageId}, payment: ${stripePaymentId})`);
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const userId = paymentIntent.metadata?.user_id;
  const packageId = paymentIntent.metadata?.package_id || null;

  if (!userId) {
    console.log('Payment intent failed without user_id metadata, skipping retry logic');
    return;
  }

  const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

  await handlePaymentFailure(userId, paymentIntent.id, packageId, errorMessage);

  console.log(`Payment failed for user ${userId}, payment intent ${paymentIntent.id}: ${errorMessage}`);
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  await markRetrySucceeded(paymentIntent.id);
  console.log(`Payment intent succeeded: ${paymentIntent.id}`);
}
