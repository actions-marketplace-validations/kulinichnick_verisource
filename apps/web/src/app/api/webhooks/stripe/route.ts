import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  buildAffiliateConversionAlert,
  dispatchPostPurchaseWelcomeEmail,
  normalizePublicDomain,
  resolveCoreGeoEnv,
  sanitizeAffiliateCode,
  type BillingCycle,
  type PlanTier,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  getProcessedStripeEventsSet,
  getServiceSupabaseClient,
  mcpLimitForPlan,
  provisionDomainAuditForWorkspace,
  trialMcpLimitForPlan,
} from '../../../../lib/data-store';

export const maxDuration = 60;

const ALLOWED_PLANS = new Set<PlanTier>([
  'tripwire_19',
  'starter_49',
  'pro_99',
  'agency_249',
]);

const ALLOWED_CYCLES = new Set<BillingCycle>(['monthly', 'annual', 'one_time']);

export async function POST(request: Request): Promise<NextResponse> {
  const env = resolveCoreGeoEnv();
  if (!env.stripeWebhookSecret) {
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

  let event: Stripe.Event;
  try {
    event = Stripe.webhooks.constructEvent(
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

    const isTrialStart =
      session.metadata?.trial_days === '7' ||
      (session.mode === 'subscription' &&
        session.payment_status === 'no_payment_required');

    const patch = {
      plan_tier: planTier,
      billing_cycle: billingCycle,
      stripe_customer_id:
        typeof session.customer === 'string' ? session.customer : null,
      stripe_subscription_id:
        typeof session.subscription === 'string' ? session.subscription : null,
      mcp_calls_limit: isTrialStart
        ? trialMcpLimitForPlan(planTier)
        : mcpLimitForPlan(planTier),
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
          const trialSuffix = isTrialStart ? '&trial=7d' : '';
          const redirectTarget = targetHostname
            ? `${appBaseUrl}/dashboard?tab=tab2_fixes&domain=${encodeURIComponent(targetHostname)}${trialSuffix}`
            : `${appBaseUrl}/dashboard?tab=tab2_fixes${trialSuffix}`;
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
          trialDays: isTrialStart ? 7 : 0,
          resendApiKey: process.env.RESEND_API_KEY,
          fromEmail: process.env.ALERT_FROM_EMAIL,
        });
      } catch {
        // Never fail Stripe webhook acknowledgement on transient email error
      }
    }

    const sessionAffiliateRef = sanitizeAffiliateCode(
      session.metadata?.affiliate_ref
    );
    if (
      sessionAffiliateRef &&
      process.env.RESEND_API_KEY &&
      process.env.ALERT_FALLBACK_EMAIL
    ) {
      try {
        const partnerLedger = buildAffiliateConversionAlert({
          partnerSlug: sessionAffiliateRef,
          planTier,
          billingCycle,
          grossAmountCents:
            typeof session.amount_total === 'number' ? session.amount_total : 0,
          isTrialStart,
          targetDomain: targetHostname,
        });
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from:
              process.env.ALERT_FROM_EMAIL?.trim() ||
              'Verisource Partners <alerts@verisource.dev>',
            to: [process.env.ALERT_FALLBACK_EMAIL.trim()],
            subject: partnerLedger.subject,
            text: partnerLedger.text,
            html: partnerLedger.html,
          }),
        });
      } catch {
        // Non-blocking partner attribution ledger notification
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
    } else {
      const store = getLocalMockStore();
      if (store.profile.stripe_customer_id === customerId) {
        store.profile.plan_tier = 'free';
        store.profile.mcp_calls_limit = 5;
        store.profile.stripe_subscription_id = null;
      }
    }
  } else if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice;
    const customerId =
      typeof invoice.customer === 'string' ? invoice.customer : null;
    const amountPaid =
      typeof invoice.amount_paid === 'number' ? invoice.amount_paid : 0;

    if (customerId && amountPaid > 0) {
      if (supabase) {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('plan_tier')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        const nextLimit = existingProfile?.plan_tier
          ? mcpLimitForPlan(existingProfile.plan_tier)
          : undefined;

        const { error } = await supabase
          .from('profiles')
          .update({
            mcp_calls_used_this_month: 0,
            ...(typeof nextLimit === 'number'
              ? { mcp_calls_limit: nextLimit }
              : {}),
          })
          .eq('stripe_customer_id', customerId);
        if (error) {
          return NextResponse.json(
            { error: 'QUOTA_RESET_FAILED' },
            { status: 500 }
          );
        }
      } else {
        const store = getLocalMockStore();
        if (store.profile.stripe_customer_id === customerId) {
          store.profile.mcp_calls_used_this_month = 0;
          store.profile.mcp_calls_limit = mcpLimitForPlan(
            store.profile.plan_tier
          );
        }
      }
    }
  }

  // Record idempotency key only after DB mutation succeeds
  processed.add(event.id);
  return NextResponse.json({ received: true });
}
