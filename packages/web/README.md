<div align="center"><strong>Dub Web Analytics</strong></div>

## Overview

`@dub/analytics` allows you to track leads and sales conversions for Dub.

## Quick start

  1. Enable Dub conversion tracking in your [Dub Dashboard](https://dub.co).
  2. Get your API key from the Dub Dashboard
  3. Add the `@dub/analytics` package to your project
  4. Inject the Analytics script to your app
  ```tsx
  import { Analytics as DubAnalytics } from '@dub/analytics/react';

  export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="en">
        <body>{children}</body>
        <DubAnalytics apiKey="apiKey" />
      </html>
    );
  }
  ```
  You can all use the `inject({ apiKey })` function to add the tracking script to other frameworks.

  5. Use the `sale` and `lead` functions to track conversions.

  Client side:
  ```tsx
  import { track } from '@dub/analytics';

  export const LeadButton = () => (
    <button onClick={() => track.lead({ property: 'value' })}>
      Track Lead
    </button>
  );

  export const SaleButton = () => (
    <button onClick={() => track.sale({ value: 100, currency: 'USD' })}>
      Track Sale
    </button>
  );
  ```

  Server side:
  ```ts
  import { track } from '@dub/analytics/server';

  export async function GET(request: Request) {
    track.lead(request, 'apiKey', { property: 'value' });

    return Response.json({ message: 'Event tracked' });
  }
  ```

  Note: the SKD also has automatic tracking of "clicks" for affiliate attribution when the via query parameter is present in the URL. It will automatically track the click, store the affiliate ID in a cookie, and be able to associate future leads and sales with the affiliate.
