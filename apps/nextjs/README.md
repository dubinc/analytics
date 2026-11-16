# Dub Analytics with Next.js

This example shows you how you can use the `@dub/analytics` package with Next.js.


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
      <DubAnalytics />
    </html>
  );
}
```
## Identity demo

`/identity` and `/identity/signup` load the `script.identity.js` build next to `DUB_ANALYTICS_SCRIPT_URL`, with `/identity/signup` as the only identity path. Each page shows the `dub_id` cookies and when the Fingerprint agent and `/track/identity` requests ran.

1. Build the script with a Fingerprint key: `DUB_FINGERPRINT_PUBLIC_KEY=<key> pnpm --filter @dub/analytics-script build`.
2. Serve it: `cd packages/script/dist && python3 -m http.server 4000`.
3. Start the app with `DUB_ANALYTICS_SCRIPT_URL=http://localhost:4000/analytics/script.js`. Set `DUB_IDENTITY_API_HOST` (e.g. `http://localhost:8888/api`) and `DUB_IDENTITY_REFER_DOMAIN` for a local Dub app.
4. Open `/identity?via=<partner>`, then `/identity/signup`.
