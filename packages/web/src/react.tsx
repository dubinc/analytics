import { useCallback, useEffect } from 'react';
import { inject } from './generic';
import type { AnalyticsProps, TrackClickInput } from './types';
import { trackClick } from './track-click';

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
 *     });
 *   }, [trackClick]);
 *
 *   return <div>My Component</div>;
 * }
 * ```
 */
function useAnalytics() {
  const trackClickFn = useCallback((event: TrackClickInput) => {
    trackClick(event);
  }, []);

  return {
    trackClick: trackClickFn,
  };
}

export { Analytics, useAnalytics };
export type { AnalyticsProps };
