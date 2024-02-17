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
