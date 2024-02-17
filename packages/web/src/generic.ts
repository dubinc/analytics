import { version } from '../package.json';
import type {
  AllowedPropertyValues,
  AnalyticsProps,
  SaleEventProperties,
  TrackEventProperties,
} from './types';
import { isBrowser, isProduction, parseProperties } from './utils';

/**
 * Injects the Dub Web Analytics script into the page head.
 */
function inject(props: AnalyticsProps = {}): void {
  if (!isBrowser()) return;

  const apiKey =
    props.apiKey ||
    process.env.NEXT_PUBLIC_DUB_ANALYTICS_API_KEY ||
    process.env.DUB_ANALYTICS_API_KEY;
  if (!apiKey) {
    throw new Error('[Dub Web Analytics] Please provide an API key to use.');
  }

  const src =
    process.env.NEXT_PUBLIC_DUB_ANALYTICS_SCRIPT_SRC ||
    process.env.DUB_ANALYTICS_SCRIPT_SRC ||
    'https://dubcdn.com/analytics/dubScript.js';
  if (document.head.querySelector(`script[src*="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  script.setAttribute('data-sdkv', version);
  script.setAttribute('data-api-key', apiKey);

  script.onerror = (): void => {
    // eslint-disable-next-line no-console -- Logging to console is intentional
    console.log(`[Dub Web Analytics] failed to load script from ${src}.`);
  };

  document.head.appendChild(script);
}

/**
 * Tracks a custom event.
 * @param eventName - The name of the event.
 * @param [properties] - Additional properties of the event. Nested objects are not supported. Allowed values are `string`, `number`, `boolean`, and `null`.
 */
function _track(
  eventName: string,
  properties?: Record<string, AllowedPropertyValues>,
): void {
  if (!isBrowser()) {
    const msg =
      '[Dub Web Analytics] is currently only supported in the browser environment. The server tracking is coming soon.';
    // eslint-disable-next-line no-console -- Logging to console is intentional
    console.warn(msg);
    return;
  }

  if (!properties) {
    window.da?.track('event', { eventName });
    return;
  }

  try {
    const cleanedProperties = parseProperties(properties, {
      strip: isProduction(),
    });

    window.da?.track('event', {
      eventName,
      properties: cleanedProperties,
    });
  } catch (err) {
    // eslint-disable-next-line no-console -- Logging to console is intentional
    console.error(err);
  }
}

/**
 * Tracks a lead event.
 * @param properties - Additional properties of the event. Nested objects are not supported. Allowed values are `string`, `number`, `boolean`, and `null`.
 *
 * @example
 * ```ts
 * import { track } from '@dub/analytics';
 *
 * track.lead({
 *  cta: 'Sign Up',
 * });
 * ```
 */
const lead = (properties: TrackEventProperties): void => {
  _track('lead', properties);
};

/**
 * Tracks a sale event.
 * @param properties - Additional properties of the event. Nested objects are not supported. Allowed values are `string`, `number`, `boolean`, and `null`.
 * @param properties.value - The value of the sale in cents.
 * @param properties.currency - The currency of the sale.
 * @example
 * ```ts
 * import { track } from '@dub/analytics';
 *
 * track.sale({
 *  value: 1000, // $10.00
 *  currency: 'USD',
 * });
 * ```
 */
const sale = (properties: SaleEventProperties): void => {
  _track('sale', properties);
};

const track = {
  lead,
  sale,
};

export { inject, track };
export type { AnalyticsProps };

// eslint-disable-next-line import/no-default-export -- Default export is intentional
export default {
  inject,
  track,
};
