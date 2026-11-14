'use client';

import React from 'react';

export function PrintAuditBriefButton(): React.ReactElement {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }}
      className="vs-btn vs-btn-secondary vs-no-print"
    >
      Print / Save PDF
    </button>
  );
}
