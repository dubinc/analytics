'use client';

import { useAnalytics } from '@dub/analytics/react';

export function DiscountBanner() {
  const { partner } = useAnalytics();

  console.log({ partner });

  return null;
}
