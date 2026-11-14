import React from 'react';
import {
  DashboardConsoleClient,
  type WorkspacePayload,
} from '../../components/DashboardConsoleClient';
import { getLocalMockStore } from '../../lib/data-store';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    domain?: string;
    tab?: string;
    upgraded?: string;
    credit_applied?: string;
  }>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const store = getLocalMockStore();

  const initialData: WorkspacePayload = {
    mode: 'mock',
    profile: store.profile,
    domains: store.domains,
    prompts: store.prompts,
    snapshots: store.snapshots,
    fixes: store.fixes,
    attributionEvents: store.attributionEvents,
    pitchReports: store.pitchReports,
    mcpApiKeys: store.mcpApiKeys,
  };

  return (
    <DashboardConsoleClient
      initialData={initialData}
      initialDomainQuery={params.domain}
      initialTab={params.tab}
      upgradedPlan={params.upgraded}
      creditApplied={params.credit_applied === 'true'}
    />
  );
}
