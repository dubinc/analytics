'use client';

import { Discount, Partner, useAnalytics } from '@dub/analytics/react';
import { useEffect } from 'react';

export function DiscountBanner() {
  const { partner, discount } = useAnalytics();

  useEffect(() => {
    if (partner && discount) {
      alert(discountBannerText(partner, discount));
    }
  }, [partner, discount]);

  return null;
}

function discountBannerText(partner: Partner, discount: Discount) {
  return `${partner.name} has gifted you ${discount.amount} ${discount.type === 'percentage' ? '%' : '$'} off for ${discount.maxDuration} months!`;
}
