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
      key: username,
    });

    // trackClick({
    //   linkId: 'link_1JQDZZCW3VF4DHMR3F7KF81CD',
    // });

    // trackClick({
    //   externalId: 'Q0weDNCOyt41fRdt',
    //   workspaceId: 'ws_cl7pj5kq4006835rbjlt2ofka',
    // });
  }, [trackClick, username]);

  return <div>{username}</div>;
}
