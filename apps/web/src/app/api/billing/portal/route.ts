import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { resolveCoreGeoEnv } from '@verisource/core-geo';
import {
  getLocalMockStore,
  resolveAuthenticatedProfile,
} from '../../../../lib/data-store';

export async function POST(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const env = resolveCoreGeoEnv();

  let formToken: string | null = null;
  const contentType = request.headers.get('content-type') ?? '';
  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData().catch(() => null);
    const raw = form?.get('access_token');
    if (typeof raw === 'string' && raw.trim()) {
      formToken = raw.trim();
    }
  }

  const auth = await resolveAuthenticatedProfile(request, formToken);
  const store = getLocalMockStore();
  const stripeCustomerId = auth
    ? auth.profile.stripe_customer_id
    : store.profile.stripe_customer_id;

  if (
    env.hasStripe &&
    env.stripeSecretKey &&
    stripeCustomerId &&
    !stripeCustomerId.startsWith('cus_demo_')
  ) {
    try {
      const stripe = new Stripe(env.stripeSecretKey);
      const portal = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${url.origin}/dashboard`,
      });
      return NextResponse.redirect(portal.url, { status: 303 });
    } catch {
      // Gracefully redirect to /pricing if customer ID belongs to prior test mode or portal is unconfigured
      return NextResponse.redirect(`${url.origin}/pricing`, { status: 303 });
    }
  }

  return NextResponse.redirect(`${url.origin}/pricing`, { status: 303 });
}
