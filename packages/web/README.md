<div align="center"><strong>Dub Web Analytics</strong></div>

## Overview

`@dub/analytics` allows you to track leads and sales conversions for Dub.

## Quick start

1. Enable Dub conversion tracking in your [Dub Dashboard](https://dub.co).
2. Get your API key from the Dub Dashboard
3. Add the `@dub/analytics` package to your project
4. Inject the Analytics script to your app

   - If you are using **Next.js** or **React**, you can use the `<Analytics apiKey={apiKey} />` component to inject the script into your app from `@dub/analytics/react`.
   - To add the tracking script for other frameworks, use the `inject({ apiKey })` function from `@dub/analytics`.
   - To add tracking on server side use the `sale` and `lead` functions from `@dub/analytics/server` e.g. `lead(request, apiKey, { name: 'name' })`.

## Proxy

We recommend proxying the analytics requests through your a serverless function to avoid requests being blocked by ad blockers.

Example using Next.js

1. Pass in the trackEndpoint to the Analytics component
```tsx
<Analytics apiKey={apiKey} trackEndpoint={`${process.env.NEXT_PUBLIC_BASE_URL}/api/track`} />
```

1. Create a serverless function to proxy the request. Here is an example:
```ts
export async function POST(request: Request) {
  try {
    const response = await fetch('https://api.dub.co/analytics/track', {
      method: 'POST',
      headers: new Headers(request.headers),
      body: await request.json(),
    });

    const resHeaders = new Headers(response.headers);
    resHeaders.set('Content-Type', 'application/json');
    return new Response(await response.json(), {
      status: response.status,
      headers: resHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'An error occurred' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
```