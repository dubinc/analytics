# Dub Analytics with Geolocation

This example shows you how you can use the `x-vercel-ip-country` header ([docs](https://vercel.com/docs/edge-network/headers#x-vercel-ip-country)) with a lazy loaded server component to conditionally `@dub/analytics` based on the visitor's country.

E.g. if you want to load Dub Analytics only for visitors outside of the EU, you can do the following:

```ts
import { Analytics as DubAnalytics } from '@dub/analytics/react';

export default function Analytics() {
  const countryCode = headers().get('x-vercel-ip-country') || 'US'

  if (EU_COUNTRY_CODES.includes(countryCode)) {
    return null
  }

  return (
    <DubAnalytics />
  )
}
```