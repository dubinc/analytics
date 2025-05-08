'use client';

import { useAnalytics } from '@dub/analytics/react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export function WithDomainKey() {
  const { trackClick } = useAnalytics();
  const { username } = useParams<{ username: string }>();

  useEffect(() => {
    if (!username) {
      return;
    }

    trackClick({
      domain: 'getacme.link',
      key: username, // `getacme.link/derek`
    });
  }, [trackClick, username]);

  return <div>{username}</div>;
}
