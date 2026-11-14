import React from 'react';
import { PricingLadderSection } from '../../components/PricingLadderSection';

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  return (
    <div className="vs-container" style={{ paddingTop: '20px' }}>
      <PricingLadderSection preselectedDomain={params.domain} />
    </div>
  );
}
