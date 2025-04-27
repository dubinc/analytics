'use client';

import { Analytics as DubAnalytics, useAnalytics } from '@dub/analytics/react';

export function DiscountBanner() {
  const { partner, discount } = useAnalytics();

  console.log('Analytics Data:', {
    partner,
    discount,
  });

  return null;
}
