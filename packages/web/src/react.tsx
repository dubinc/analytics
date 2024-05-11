import { useEffect } from 'react';
import { inject } from './generic';
import type { AnalyticsProps } from './types';

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
function Analytics(): null {
  useEffect(() => {
    inject();
  }, []);

  return null;
}

export { Analytics };
export type { AnalyticsProps };
