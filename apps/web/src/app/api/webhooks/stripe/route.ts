import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  dispatchPostPurchaseWelcomeEmail,
  normalizePublicDomain,
  resolveCoreGeoEnv,
  type BillingCycle,
  type PlanTier,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getProcessedStripeEventsSet,
  getServiceSupabaseClient,
  mcpLimitForPlan,
  provisionDomainAuditForWorkspace,
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

    let targetHostname: string | null = null;
    if (session.metadata?.domain?.trim()) {
      try {
        targetHostname = normalizePublicDomain(session.metadata.domain).hostname;
      } catch {
        targetHostname = null;
      }
    }

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

    // M25: Auto-provision target domain + >= 9.5/10 Fix Bundle into buyer workspace
    let provisionedScore: number | null = null;
    let provisionedFixCount: number | null = null;
    if (userId && targetHostname) {
      try {
        const provisioned = await provisionDomainAuditForWorkspace({
          domainInput: targetHostname,
          userId,
          planTier,
          supabase,
          bypassPlanCapForPaidPass: planTier === 'tripwire_19',
        });
        if (provisioned.domain) {
          provisionedScore = provisioned.domain.visibility_score;
          provisionedFixCount = provisioned.fixes.length || null;
        }
      } catch {
        // Never block entitlement acknowledgement if live domain crawl times out
      }
    }

    // M25: Send Critic-verified >= 9.5/10 Welcome + 1-Click Magic Sign-In Link
    if (customerEmail) {
      const appBaseUrl = env.appUrl.replace(/\/+$/, '');
      let magicLinkUrl: string | null = null;
      if (supabase) {
        try {
          const redirectTarget = targetHostname
            ? `${appBaseUrl}/dashboard?tab=tab2_fixes&domain=${encodeURIComponent(targetHostname)}`
            : `${appBaseUrl}/dashboard?tab=tab2_fixes`;
          const { data: linkData } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: customerEmail,
            options: { redirectTo: redirectTarget },
          });
          magicLinkUrl = linkData?.properties?.action_link ?? null;
        } catch {
          magicLinkUrl = null;
        }
      }

      try {
        await dispatchPostPurchaseWelcomeEmail({
          recipientEmail: customerEmail,
          bccEmail: process.env.ALERT_FALLBACK_EMAIL,
          planTier,
          targetDomain: targetHostname,
          visibilityScore: provisionedScore,
          fixCount: provisionedFixCount,
          magicLinkUrl,
          consoleBaseUrl: appBaseUrl,
          resendApiKey: process.env.RESEND_API_KEY,
          fromEmail: process.env.ALERT_FROM_EMAIL,
        });
      } catch {
        // Never fail Stripe webhook acknowledgement on transient email error
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
