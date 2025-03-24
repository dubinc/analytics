import { useCallback, useEffect } from 'react';
import { inject } from './generic';
import type { AnalyticsProps, TrackClickInput } from './types';

/**
 * Injects the Dub Web Analytics script into the page head.
 * @param props - Analytics options.
 * ```js
 * import { Analytics as DubAnalytics } from '@dub/analytics/react';
 *
 * export default function App() {
 *  return (
 *    <div>
 *      <DubAnalytics />
 *      <h1>My App</h1>
 *    </div>
 *  );
 * }
 * ```
 */
function Analytics(props: AnalyticsProps): null {
  useEffect(() => {
    inject(props);
  }, [props]);

  return null;
}

/**
 * React hook for tracking analytics events.
 * @returns Analytics tracking methods.
 * ```js
 * import { useAnalytics as useDubAnalytics } from '@dub/analytics/react';
 *
 * export default function MyComponent() {
 *   const { trackClick } = useDubAnalytics();
 *
 *   useEffect(() => {
 *     trackClick({
 *       domain: 'example.com',
 *       key: 'hello',
 *       url: 'https://example.com/hello',
 *       referrer: 'https://example.com',
 *     });
 *   }, [trackClick]);
 *
 *   return <div>My Component</div>;
 * }
 * ```
 */
function useAnalytics() {
  const trackClick = useCallback((event: TrackClickInput) => {
    console.log('trackClick', event);
  }, []);

  return {
    trackClick,
  };
}

export { Analytics, useAnalytics };
export type { AnalyticsProps };
