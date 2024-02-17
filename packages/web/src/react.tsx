import { useEffect } from 'react';
import { inject, track } from './generic';
import type { AnalyticsProps } from './types';

/**
 * Injects the Dub Web Analytics script into the page head.
 * @param props - Analytics options.
 * @param props.apiKey - Your project's API key. If not provided, the API key will be read from the `NEXT_PUBLIC_DUB_ANALYTICS_API_KEY` environment variable.
 * @param props.trackEndpoint - The endpoint to send tracking events to. If not provided, the endpoint will be read from the `NEXT_PUBLIC_DUB_ANALYTICS_TRACK_ENDPOINT` environment variable or fall back to the default.
 * ```js
 * import { Analytics as DubAnalytics } from '@dub/analytics/react';
 *
 * export default function App() {
 *  return (
 *   <div>
 *    <DubAnalytics apiKey={API_KEY} />
 *    <h1>My App</h1>
 *  </div>
 * );
 * }
 * ```
 */
function Analytics({ apiKey, trackEndpoint }: AnalyticsProps): null {
  useEffect(() => {
    inject({ apiKey, trackEndpoint });
  }, [apiKey, trackEndpoint]);

  return null;
}

export { track, Analytics };
export type { AnalyticsProps };
