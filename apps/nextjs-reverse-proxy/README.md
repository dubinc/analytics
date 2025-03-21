# Dub Analytics with Client-side Click Tracking + Reverse Proxy

This example shows you how you can use the `@dub/analytics` package with:

- [Client-side click tracking](https://dub.co/docs/conversions/clicks/introduction#client-side-click-tracking) for tracking clicks with query parameters in lieu of short links
- A reverse proxy to avoid getting blocked by ad blockers

```ts app/layout.tsx
import { Analytics as DubAnalytics } from '@dub/analytics/react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <DubAnalytics
        apiHost="/_proxy/dub"
        domainsConfig={{
          refer: 'go.company.com',
        }}
      />
    </html>
  );
}
```