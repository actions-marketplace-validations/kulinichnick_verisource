import { cookies, headers } from 'next/headers';
import React from 'react';
import { PricingLadderSection } from '../../components/PricingLadderSection';
import { resolveConsoleRequestAccess } from '../../lib/data-store';

export const dynamic = 'force-dynamic';

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; plan?: string; env?: string }>;
}): Promise<React.ReactElement> {
  const [params, reqHeaders, reqCookies] = await Promise.all([
    searchParams,
    headers(),
    cookies(),
  ]);

  const forwardedHeaders = new Headers();
  const authHeader = reqHeaders.get('authorization');
  if (authHeader) {
    forwardedHeaders.set('authorization', authHeader);
  }
  const cookieHeader = reqCookies
    .getAll()
    .map((c) => `${c.name}=${encodeURIComponent(c.value)}`)
    .join('; ');
  if (cookieHeader) {
    forwardedHeaders.set('cookie', cookieHeader);
  }

  const syntheticReq = new Request('http://127.0.0.1/pricing', {
    headers: forwardedHeaders,
  });
  const access = await resolveConsoleRequestAccess(syntheticReq);

  const initialSubscriber =
    (access.status === 'authenticated' || access.status === 'mock_owner') &&
    access.profile.plan_tier !== 'free'
      ? {
          email: access.profile.email,
          planTier: access.profile.plan_tier,
          billingCycle: access.profile.billing_cycle ?? 'monthly',
          hasStripeCustomer: Boolean(
            access.profile.stripe_customer_id &&
              !access.profile.stripe_customer_id.startsWith('cus_demo_')
          ),
        }
      : null;

  return (
    <div className="vs-container" style={{ paddingTop: '20px' }}>
      <PricingLadderSection
        preselectedDomain={params.domain}
        preselectedPlan={params.plan}
        preselectedEnv={params.env}
        initialSubscriber={initialSubscriber}
      />
    </div>
  );
}
