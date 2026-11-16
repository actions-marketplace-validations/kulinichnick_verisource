import React from 'react';
import { PricingLadderSection } from '../../components/PricingLadderSection';

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string; plan?: string; env?: string }>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  return (
    <div className="vs-container" style={{ paddingTop: '20px' }}>
      <PricingLadderSection
        preselectedDomain={params.domain}
        preselectedPlan={params.plan}
        preselectedEnv={params.env}
      />
    </div>
  );
}
