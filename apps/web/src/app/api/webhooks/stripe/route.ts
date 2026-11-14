import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  resolveCoreGeoEnv,
  type BillingCycle,
  type PlanTier,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getProcessedStripeEventsSet,
  getServiceSupabaseClient,
  mcpLimitForPlan,
} from '../../../../lib/data-store';

const ALLOWED_PLANS = new Set<PlanTier>([
  'tripwire_19',
  'starter_49',
  'pro_99',
  'agency_249',
]);

const ALLOWED_CYCLES = new Set<BillingCycle>(['monthly', 'annual', 'one_time']);

export async function POST(request: Request): Promise<NextResponse> {
  const env = resolveCoreGeoEnv();
  if (!env.stripeSecretKey || !env.stripeWebhookSecret) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json(
      { error: 'MISSING_STRIPE_SIGNATURE' },
      { status: 400 }
    );
  }

  const rawBody = await request.text();
  const stripe = new Stripe(env.stripeSecretKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.stripeWebhookSecret
    );
  } catch {
    return NextResponse.json(
      { error: 'INVALID_STRIPE_SIGNATURE' },
      { status: 400 }
    );
  }

  const processed = getProcessedStripeEventsSet();
  if (processed.has(event.id)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const supabase = getServiceSupabaseClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    let userId = session.metadata?.user_id || undefined;
    const customerEmail =
      session.customer_details?.email?.trim().toLowerCase() ||
      session.customer_email?.trim().toLowerCase();

    const rawPlan = session.metadata?.plan_tier as PlanTier | undefined;
    const rawCycle = session.metadata?.billing_cycle as BillingCycle | undefined;

    const planTier: PlanTier =
      rawPlan && ALLOWED_PLANS.has(rawPlan) ? rawPlan : 'pro_99';
    const billingCycle: BillingCycle =
      rawCycle && ALLOWED_CYCLES.has(rawCycle) ? rawCycle : 'monthly';

    const patch = {
      plan_tier: planTier,
      billing_cycle: billingCycle,
      stripe_customer_id:
        typeof session.customer === 'string' ? session.customer : null,
      stripe_subscription_id:
        typeof session.subscription === 'string' ? session.subscription : null,
      mcp_calls_limit: mcpLimitForPlan(planTier),
      tripwire_paid_at:
        planTier === 'tripwire_19' ? new Date().toISOString() : null,
    };

    if (supabase) {
      // Support frictionless Guest-to-Account checkout via Stripe buyer email
      if (!userId && customerEmail) {
        const { data: existingByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customerEmail)
          .maybeSingle();

        if (existingByEmail) {
          userId = existingByEmail.id;
        } else {
          const { data: createdAuth } = await supabase.auth.admin.createUser({
            email: customerEmail,
            email_confirm: true,
          });
          if (createdAuth?.user) {
            userId = createdAuth.user.id;
            await supabase.from('profiles').upsert(
              {
                id: userId,
                email: customerEmail,
                ...patch,
              },
              { onConflict: 'id' }
            );
          }
        }
      }

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update(patch)
          .eq('id', userId);
        if (error) {
          return NextResponse.json(
            { error: 'PROFILE_UPDATE_FAILED' },
            { status: 500 }
          );
        }
      }
    } else if (userId) {
      const store = getLocalMockStore();
      if (store.profile.id === userId) {
        Object.assign(store.profile, patch);
      }
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    if (supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({
          plan_tier: 'free',
          mcp_calls_limit: 5,
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId);
      if (error) {
        return NextResponse.json(
          { error: 'SUBSCRIPTION_REVOKE_FAILED' },
          { status: 500 }
        );
      }
    }
  } else if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : null;
    if (customerId && supabase) {
      const { error } = await supabase
        .from('profiles')
        .update({ mcp_calls_used_this_month: 0 })
        .eq('stripe_customer_id', customerId);
      if (error) {
        return NextResponse.json(
          { error: 'QUOTA_RESET_FAILED' },
          { status: 500 }
        );
      }
    }
  }

  // Record idempotency key only after DB mutation succeeds
  processed.add(event.id);
  return NextResponse.json({ received: true });
}
