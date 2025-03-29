'use client';

import { useAnalytics } from '@dub/analytics/react';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function PageClient() {
  const { username } = useParams<{ username: string }>();
  const { trackClick } = useAnalytics();

  useEffect(() => {
    if (!username) {
      return;
    }

    trackClick({
      domain: 'dub.sh',
      key: username, // `dub.sh/username`
    });
  }, [trackClick, username]);

  return <div>{username}</div>;
}
