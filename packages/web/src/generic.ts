import { version } from '../package.json';
import type {
  AllowedPropertyValues,
  AnalyticsProps,
  TrackEventProperties,
} from './types';
import { isBrowser, parseProperties } from './utils';

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
function track(
  eventName: string,
  properties?: Record<string, AllowedPropertyValues>,
): void {
  if (!isBrowser()) {
    const msg =
      '[Dub Web Analytics] is currently only supported in the browser environment. The server tracking is coming soon.';
    console.warn(msg);
    return;
  }

  if (!properties) {
    window.da?.track?.('event', { eventName });
    return;
  }

  try {
    const cleanedProperties = parseProperties(properties, {
      strip: true,
    });

    window.da?.track?.('event', {
      eventName,
      properties: cleanedProperties,
    });
  } catch (err) {
    console.error(err);
  }
}

track.lead = (properties: TrackEventProperties) => {
  track('lead', properties);
};

track.sale = (properties: TrackEventProperties) => {
  track('sale', properties);
};

export { inject, track };
export type { AnalyticsProps };

// eslint-disable-next-line import/no-default-export -- Default export is intentional
export default {
  inject,
  track,
};
