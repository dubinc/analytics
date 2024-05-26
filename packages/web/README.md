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
        <DubAnalytics />
      </html>
    );
  }
  ```
  You can all use the `inject()` function to add the tracking script to other frameworks.
