import { useEffect } from 'react';
import { inject } from './generic';
import type { AnalyticsProps, Discount, Partner } from './types';
import { useAnalytics } from './use-analytics';

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

export { Analytics, useAnalytics };
export type { AnalyticsProps, Partner, Discount };
