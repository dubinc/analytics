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

The API host to use for tracking. This is useful for setting up reverse proxies to avoid adblockers. The default is `https://api.dub.co`.

### `domainsConfig`

This is a JSON object that configures the domains that Dub will track.

- `refer`: The Dub short domain for [referral program client-side click tracking](https://d.to/clicks/refer) (previously `shortDomain`).
- `site`: The Dub short domain for [tracking site visits](https://d.to/clicks/site).
- `outbound`: An array of domains for cross-domain tracking. When configured, the existing `dub_id` cookie will be automatically appended to all outbound links targeting these domains to enable cross-domain tracking across different applications.

### `shortDomain`

[DEPRECATED: use `domainsConfig.refer` instead] The custom short domain you're using on Dub for your short links (for client-side click tracking).

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

For example, to set a 60-day cookie window, you can use the following code:

```tsx
import { Analytics as DubAnalytics } from "@dub/analytics"

<DubAnalytics
   cookieOptions={{
      expiresInDays: 60,
   }}
/>
```

### `queryParam`

The query parameter to listen to for client-side click-tracking (e.g. `?via=john`, `?ref=jane`). The default is `via`.

### `trackIdentity`

Identifies the visitor's device on the given paths and links it to their Dub click, for partner risk monitoring.

A path matches exactly (a trailing slash is ignored). A trailing `/*` also matches everything under the path, so `/checkout/*` matches `/checkout` and `/checkout/plan`. It runs on the first page load and on client-side navigation to a matching path.

It only runs for partner clicks tracked with `?via=` (so set `domainsConfig.refer`). That click sets the `dub_partner_data` cookie, and the script identifies only while that cookie belongs to the click in `dub_id`. Ad and site-visit clicks are skipped, so they never use Fingerprint.

It runs once per click: after identifying, it appends the device's visitor ID to the cookie (`dub_id=<clickId>_<visitorId>`). A new click replaces the cookie and gets identified again. `trackLead` and `trackSale` send the full value, so Dub can link the customer to the device; pass the cookie as is when you track conversions from your server too. The script strips the suffix for outbound links, and anywhere else you read the `dub_id` cookie yourself, the click ID is the part before `_`. The device identification agent is loaded only when identification runs, and failures never throw or block the page.

Identification needs Sealed Client Results turned off in the Fingerprint workspace, so the agent returns the visitor ID.

```tsx
<DubAnalytics trackIdentity={{ paths: ['/signup', '/checkout/*'] }} />
```

To identify conditionally instead, call `trackIdentity` yourself. It follows the same `dub_id` rules, and needs the `trackIdentity` prop to load the identity variant (`paths: []` turns off automatic identification).

Where the law requires consent for device fingerprinting, use `paths: []` and call `trackIdentity()` only after the visitor gives consent. The script has no consent or opt-out setting of its own. A call first waits for a pending `?via=` click, and it can't be canceled, so identification can still start if consent is withdrawn during that wait.

```tsx
const { trackIdentity } = useAnalytics();

await trackIdentity();
```

Without React, use the `identity` script variant (`script.identity.js`, or combined like `script.site-visit.identity.js`). Set the paths with a `data-identity-paths` attribute, and call `dubAnalytics.trackIdentity()`. To queue calls made before the script loads, add `trackIdentity` to the snippet's method list.

```html
<script
  src="https://www.dubcdn.com/analytics/script.identity.js"
  data-identity-paths='["/signup", "/checkout/*"]'
  defer
></script>
```

The device identification agent loads from `identity-agent.js` next to the script. If you serve the script from your own domain or a proxy, serve `identity-agent.js` from the same folder.

### `scriptProps`

Custom properties to pass to the script tag. Refer to [MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement) for all available options.