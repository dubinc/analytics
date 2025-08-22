'use client';

import { useAnalytics } from '@dub/analytics/react';

export function ConversionTrackingPageClient() {
  const { trackLead, trackSale } = useAnalytics();

  const handleTrackLead = () => {
    trackLead({
      eventName: 'Account created',
      customerExternalId: '1234567890',
    });
  };

  const handleTrackSale = () => {
    trackSale({
      eventName: 'Purchase completed',
      customerExternalId: 'CXvG5QOLi8QKBA2jYmDh',
      amount: 5000, // defaults to usd cents, use `currency` prop to specify a different currency
    });
  };

  return (
    <div className="flex gap-4 p-4">
      <button
        onClick={handleTrackLead}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Track Lead
      </button>
      <button
        onClick={handleTrackSale}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
      >
        Track Sale
      </button>
    </div>
  );
}
