import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  normalizePublicDomain,
  resolveCoreGeoEnv,
  type AiRemediationTargetEnv,
  type BillingCycle,
  type PlanTier,
} from '@verisource/core-geo';
import {
  getLocalMockStore,
  isMockOwnerRequest,
  isPlanEligibleFor7DayTrial,
  mcpLimitForPlan,
  provisionDomainAuditForWorkspace,
  resolveAuthenticatedProfile,
  trialMcpLimitForPlan,
} from '../../../lib/data-store';

const VALID_PLANS = new Set<PlanTier>([
  'tripwire_19',
  'starter_49',
  'pro_99',
  'agency_249',
]);

const VALID_PROMPT_ENVS = new Set<AiRemediationTargetEnv>([
  'coding_agent',
  'wordpress_cms',
  'webflow_cms',
  'wix_squarespace_framer',
  'shopify_liquid',
  'chat_assistant',
]);

function getPricingCents(
  plan: PlanTier,
  cycle: BillingCycle
): { amountCents: number; productName: string } {
  if (plan === 'tripwire_19') {
    return {
      amountCents: 1900,
      productName: 'Verisource $19 One-Time Domain Audit Pass',
    };
  }
  if (plan === 'starter_49') {
    return {
      amountCents: cycle === 'annual' ? 3900 * 12 : 4900,
      productName: `Verisource Starter Brand (${cycle})`,
    };
  }
  if (plan === 'pro_99') {
    return {
      amountCents: cycle === 'annual' ? 7900 * 12 : 9900,
      productName: `Verisource Pro + MCP Engine (${cycle})`,
    };
  }
  return {
    amountCents: cycle === 'annual' ? 19900 * 12 : 24900,
    productName: `Verisource Agency White-Label (${cycle})`,
  };
}

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const rawPlan = (url.searchParams.get('plan') ?? 'pro_99') as PlanTier;
  const rawCycle = (url.searchParams.get('cycle') ?? 'monthly') as BillingCycle;
  const rawDomainParam = (url.searchParams.get('domain') ?? '').trim();
  const rawEnvParam = (url.searchParams.get('env') ?? '').trim();
  const rawSlugParam = (url.searchParams.get('slug') ?? '').trim();
  const queryToken = url.searchParams.get('access_token');

  if (!VALID_PLANS.has(rawPlan)) {
    return NextResponse.json({ error: 'INVALID_PLAN' }, { status: 400 });
  }

  let safePromptEnv: AiRemediationTargetEnv | null = null;
  if (rawEnvParam) {
    if (!VALID_PROMPT_ENVS.has(rawEnvParam as AiRemediationTargetEnv)) {
      return NextResponse.json({ error: 'INVALID_TARGET_ENV' }, { status: 400 });
    }
    safePromptEnv = rawEnvParam as AiRemediationTargetEnv;
  }

  let safeHostname: string | null = null;
  if (rawDomainParam) {
    try {
      safeHostname = normalizePublicDomain(rawDomainParam).hostname;
    } catch {
      return NextResponse.json(
        {
          error: 'INVALID_TARGET_DOMAIN',
          message:
            'Target checkout domain must be a valid public HTTP/HTTPS hostname.',
        },
        { status: 400 }
      );
    }
  }

  const safeSlug = /^[a-z0-9-]{3,120}$/i.test(rawSlugParam) ? rawSlugParam : '';

  const cycle: BillingCycle =
    rawPlan === 'tripwire_19'
      ? 'one_time'
      : rawCycle === 'annual'
        ? 'annual'
        : 'monthly';

  const env = resolveCoreGeoEnv();
  const auth = await resolveAuthenticatedProfile(request, queryToken);
  const store = getLocalMockStore();
  const isAuthenticatedMockOwner =
    !env.hasStripe && isMockOwnerRequest(request, queryToken);

  const tripwirePaidAt = auth
    ? auth.profile.tripwire_paid_at
    : env.hasStripe
      ? null
      : store.profile.tripwire_paid_at;

  const isEligibleFor19Credit =
    rawPlan !== 'tripwire_19' &&
    Boolean(
      tripwirePaidAt &&
        Date.now() - Date.parse(tripwirePaidAt) <= 7 * 86400 * 1000
    );

  const hasPriorBillingHistory = auth
    ? Boolean(
        (auth.profile.stripe_customer_id &&
          !auth.profile.stripe_customer_id.startsWith('cus_demo_')) ||
          auth.profile.stripe_subscription_id ||
          auth.profile.tripwire_paid_at
      )
    : isAuthenticatedMockOwner
      ? Boolean(
          (store.profile.stripe_customer_id &&
            !store.profile.stripe_customer_id.startsWith('cus_demo_')) ||
            (store.profile.stripe_subscription_id &&
              !store.profile.stripe_subscription_id.startsWith('sub_demo_')) ||
            store.profile.tripwire_paid_at
        )
      : !env.hasStripe
        ? Boolean(store.profile.tripwire_paid_at)
        : false;

  const isEligibleFor7DayTrial =
    isPlanEligibleFor7DayTrial(rawPlan, cycle) &&
    !isEligibleFor19Credit &&
    !hasPriorBillingHistory &&
    url.searchParams.get('trial') !== '0';

  // Live Stripe Checkout Session when STRIPE_SECRET_KEY is configured
  if (env.hasStripe && env.stripeSecretKey) {
    const stripe = new Stripe(env.stripeSecretKey);
    const { amountCents, productName } = getPricingCents(rawPlan, cycle);
    const checkoutTitle = safeHostname
      ? `${productName} — ${safeHostname}`
      : productName;

    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
    if (isEligibleFor19Credit) {
      const coupon = await stripe.coupons.create({
        amount_off: 1900,
        currency: 'usd',
        duration: 'once',
        name: '$19 Audit Pass 7-Day Upgrade Credit',
      });
      discounts = [{ coupon: coupon.id }];
    }

    const isOneTime = rawPlan === 'tripwire_19';
    const existingCustomerId =
      auth?.profile.stripe_customer_id &&
      !auth.profile.stripe_customer_id.startsWith('cus_demo_')
        ? auth.profile.stripe_customer_id
        : undefined;

    const successDest = new URL('/dashboard', url.origin);
    successDest.searchParams.set('upgraded', rawPlan);
    successDest.searchParams.set('credit_applied', String(isEligibleFor19Credit));
    if (isEligibleFor7DayTrial) {
      successDest.searchParams.set('trial', '7d');
    }
    if (safeHostname) {
      successDest.searchParams.set('domain', safeHostname);
      successDest.searchParams.set('tab', 'tab2_fixes');
    }
    if (safePromptEnv) {
      successDest.searchParams.set('env', safePromptEnv);
    }

    const cancelDest = new URL('/pricing', url.origin);
    if (safeHostname) {
      cancelDest.searchParams.set('domain', safeHostname);
      cancelDest.searchParams.set('plan', rawPlan);
    }
    if (safePromptEnv) {
      cancelDest.searchParams.set('env', safePromptEnv);
    }

    const baseSessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: isOneTime ? 'payment' : 'subscription',
      ...(isEligibleFor7DayTrial
        ? {
            payment_method_collection: 'always',
            subscription_data: {
              trial_period_days: 7,
              metadata: {
                ...(auth ? { user_id: auth.profile.id } : {}),
                plan_tier: rawPlan,
                billing_cycle: cycle,
                trial_days: '7',
              },
            },
          }
        : {}),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: amountCents,
            product_data: { name: checkoutTitle },
            ...(isOneTime
              ? {}
              : {
                  recurring: {
                    interval: cycle === 'annual' ? 'year' : 'month',
                  },
                }),
          },
        },
      ],
      discounts,
      metadata: {
        ...(auth ? { user_id: auth.profile.id } : {}),
        plan_tier: rawPlan,
        billing_cycle: cycle,
        domain: safeHostname ?? '',
        audit_slug: safeSlug,
        trial_days: isEligibleFor7DayTrial ? '7' : '0',
      },
      success_url: successDest.toString(),
      cancel_url: cancelDest.toString(),
    };

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create({
        ...baseSessionParams,
        ...(existingCustomerId
          ? { customer: existingCustomerId }
          : auth?.profile.email
            ? { customer_email: auth.profile.email }
            : {}),
      });
    } catch (err) {
      // Auto-heal if profile holds a stale sk_test_ customer ID after sk_live_ cutover
      if (existingCustomerId) {
        session = await stripe.checkout.sessions.create({
          ...baseSessionParams,
          ...(auth?.profile.email
            ? { customer_email: auth.profile.email }
            : {}),
        });
      } else {
        throw err;
      }
    }

    if (session.url) {
      return NextResponse.redirect(session.url, { status: 303 });
    }
  }

  // Zero-Key Local Mock Checkout Simulation
  store.profile.plan_tier = rawPlan;
  store.profile.billing_cycle = cycle;
  store.profile.mcp_calls_limit = isEligibleFor7DayTrial
    ? trialMcpLimitForPlan(rawPlan)
    : mcpLimitForPlan(rawPlan);
  if (rawPlan === 'tripwire_19') {
    store.profile.tripwire_paid_at = new Date().toISOString();
  } else if (isEligibleFor19Credit) {
    store.profile.tripwire_paid_at = null;
  }

  if (safeHostname) {
    try {
      await provisionDomainAuditForWorkspace({
        domainInput: safeHostname,
        userId: store.profile.id,
        planTier: rawPlan,
        bypassPlanCapForPaidPass: true,
      });
    } catch {
      // Keep checkout redirect resilient even if offline mock probe fails
    }
  }

  const dest = new URL('/dashboard', url.origin);
  dest.searchParams.set('upgraded', rawPlan);
  if (isEligibleFor19Credit) {
    dest.searchParams.set('credit_applied', 'true');
  }
  if (isEligibleFor7DayTrial) {
    dest.searchParams.set('trial', '7d');
  }
  if (safeHostname) {
    dest.searchParams.set('domain', safeHostname);
    dest.searchParams.set('tab', 'tab2_fixes');
  }
  if (safePromptEnv) {
    dest.searchParams.set('env', safePromptEnv);
  }

  if ( dest.searchParams.get('upgraded') ) {
    // No-op marker
  }
  const response = NextResponse.redirect(dest.toString(), { status: 303 });
  response.cookies.set('vs_mock_session', 'owner', {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
  });
  return response;
}
