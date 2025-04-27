'use client';

import { useAnalytics } from '@dub/analytics/react';
import { useEffect } from 'react';

export function DiscountBanner() {
  const { partner, discount } = useAnalytics();

  useEffect(() => {
    if (partner && discount) {
      alert(
        `${partner.name} has gifted you ${discount.amount} ${discount.type === 'percentage' ? '%' : '$'} off for ${discount.maxDuration} months!`,
      );
    }
  }, [partner, discount]);

  return null;
}
