'use client';

import { useAnalytics } from '@dub/analytics/react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function PageClient() {
  const { username } = useParams();
  const { trackClick } = useAnalytics();

  useEffect(() => {
    trackClick({
      domain: 'example.com',
      key: 'hello',
      url: window.location.href,
      referrer: document.referrer,
    });
  }, [trackClick]);

  return <div>{username}</div>;
}
