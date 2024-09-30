import { name, version } from '../package.json';
import type { AnalyticsProps } from './types';
import { isBrowser } from './utils';

const src = 'https://www.dubcdn.com/analytics/script.js';

/**
 * Injects the Dub Web Analytics script into the page head.
 */
function inject(props: AnalyticsProps): void {
  if (!isBrowser()) return;

  if (document.head.querySelector(`script[src*="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  script.setAttribute('data-sdkn', name);
  script.setAttribute('data-sdkv', version);

  if (props.api) {
    script.setAttribute('data-api', props.api);
  }

  if (props.attributionModel) {
    script.setAttribute('data-attribution-model', props.attributionModel);
  }

  if (props.cookieOptions && Object.keys(props.cookieOptions).length > 0) {
    script.setAttribute(
      'data-cookie-options',
      JSON.stringify(props.cookieOptions),
    );
  }

  if (props.queryParam) {
    script.setAttribute('data-query-param', props.queryParam);
  }

  if (props.scriptProps) {
    Object.assign(script, props.scriptProps);
  }

  script.onerror = (): void => {
    // eslint-disable-next-line no-console -- Logging to console is intentional
    console.log(`[Dub Web Analytics] failed to load script from ${src}.`);
  };

  document.head.appendChild(script);
}

export { inject };
export type { AnalyticsProps };

// eslint-disable-next-line import/no-default-export -- Default export is intentional
export default {
  inject,
};
