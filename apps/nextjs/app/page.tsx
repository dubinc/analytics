'use client';

// import Script from 'next/script';
import { Analytics as DubAnalytics } from '@dub/analytics/react';

export default function Home() {
  return (
    <main>
      <DubAnalytics />
      {/* <Script
        // src="./js/dubScript.js"
        src="https://www.dubcdn.com/analytics/script.js"
        onLoad={() => console.log('loaded dub')}
        onError={(e: Error) => {
          console.error('Script failed to load', e);
        }}
        strategy="afterInteractive"
      /> */}
    </main>
  );
}
