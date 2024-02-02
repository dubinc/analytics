'use client';

import { track } from '@dub/analytics/react';

export default function Home() {
  return (
    <main>
      <button onClick={() => track.lead({ firstName: 'Mylo' })}>
        Track Lead
      </button>
      <button onClick={() => track.sale({ amount: 300 })}>
        Track Purchase
      </button>
    </main>
  );
}
