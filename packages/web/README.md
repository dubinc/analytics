## Overview

`@dub/analytics` allows you to track leads and sales conversions for Dub.

## Quick start

  1. Enable conversion tracking for your Dub link.
  2. Install the `@dub/analytics` package to your project

  ```bash
  npm install @dub/analytics
  ```

  3. Inject the Analytics script to your app

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

## Available Props

You can pass the following props to the `Analytics` component to customize the tracking script.

### `apiHost`

The API host to use for tracking. The default is `https://api.dub.co`.

### `apiKey`

The publishable API key to use for tracking. Get your publishable API key from your [Dub workspace's token settings page](https://app.dub.co/settings/tokens).

### `attributionModel`

Decide the attribution model to use for tracking. The default is `last-click`.

- `first-click` - The first click model gives all the credit to the first touchpoint in the customer journey.
- `last-click` - The last click model gives all the credit to the last touchpoint in the customer journey.


### `cookieOptions`

The `cookieOptions` prop accepts the following keys:

| Key   | Default | Description | Example |
|----------|---------|-------------|---------|
| `domain` | `null` | Specifies the value for the `Domain` Set-Cookie attribute. | `example.com` |
| `expires` | 90 days from now | Specifies the `Date` object to be the value for the `Expires` Set-Cookie attribute. | `new Date('2024-12-31')` |
| `expiresInDays` | `90` | Specifies the number (in days) to be the value for the `Expires` Set-Cookie attribute. | `90` |
| `path` | `/` | Specifies the value for the `Path` Set-Cookie attribute. By default, the path is considered the "default path". | `/` |

For example, to set a cross domain cookie, you can use the following code:

```tsx
import { Analytics as DubAnalytics } from "@dub/analytics"

<DubAnalytics
   cookieOptions={{
      domain: process.env.IS_PRODUCTION_ENV
        ? ".yourdomain.com" // for cross-domain tracking
        : undefined,
   }}
/>
```

### `queryParam`

The query parameter to listen to for client-side click-tracking (e.g. `?ref=abc123`). The default is `ref`.

### `scriptProps`

Custom properties to pass to the script tag. Refer to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement) for all available options.