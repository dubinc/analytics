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

## Available Props

You can pass the following props to the `Analytics` component to customize the tracking script.


| Option   | Default | Description | Example |
|----------|---------|-------------|---------|
| `domain` | `undefined` | Specifies the value for the `Domain` Set-Cookie attribute. By default, no domain is set, and most clients will consider the cookie to apply to only the current domain. | `domain: 'example.com'` |
| `expires` | `90` days | Specifies the `Date` object to be the value for the `Expires` Set-Cookie attribute. By default, no expiration is set, and most clients will consider this a "non-persistent cookie" and will delete it on a condition like exiting a web browser application. | `expires: new Date('2024-12-31')` |
| `httpOnly` | `undefined` | Specifies the boolean value for the `HttpOnly` Set-Cookie attribute. When truthy, the `HttpOnly` attribute is set; otherwise, it is not. By default, the `HttpOnly` attribute is not set. Be careful when setting this to true, as compliant clients will not allow client-side JavaScript to see the cookie in `document.cookie`. | `httpOnly: true` |
| `maxAge` | `undefined` | Specifies the number (in seconds) to be the value for the `Max-Age` Set-Cookie attribute. The given number will be converted to an integer by rounding down. By default, no maximum age is set. | `maxAge: 3600` |
| `path` | `undefined` | Specifies the value for the `Path` Set-Cookie attribute. By default, the path is considered the "default path". | `path: '/'` |
| `sameSite` | `undefined` | Specifies the boolean or string to be the value for the `SameSite` Set-Cookie attribute. `true` sets it to `Strict`, `false` does not set it, `'lax'` sets it to Lax, `'strict'` sets it to Strict, and `'none'` sets it to None for an explicit cross-site cookie. This attribute has not yet been fully standardized, and many clients may ignore it until they understand it. | `sameSite: 'strict'` |
| `secure` | `undefined` | Specifies the boolean value for the `Secure` Set-Cookie attribute. When truthy, the `Secure` attribute is set; otherwise, it is not. By default, the `Secure` attribute is not set. Be careful when setting this to true, as compliant clients will not send the cookie back to the server in the future if the browser does not have an HTTPS connection. | `secure: true` |