'use client';

// import Script from 'next/script';
import { Analytics as DubAnalytics } from '@dub/analytics/react';

export default function Home() {
  return (
    <main>
      <DubAnalytics />
    </main>
  );
}
