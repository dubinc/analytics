'use client';

import { track } from '@dub/analytics';

export default function Home() {
  return (
    <main>
      <button onClick={() => track.lead({ firstName: 'Mylo' })}>
        Track Lead
      </button>
      <button onClick={() => track.sale({ value: 300, currency: 'USD' })}>
        Track Purchase
      </button>
    </main>
  );
}
