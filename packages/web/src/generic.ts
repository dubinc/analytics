import { name, version } from '../package.json';
import type { AnalyticsProps } from './types';
import { isBrowser } from './utils';

/**
 * Injects the Dub Web Analytics script into the page head.
 */
function inject(props: AnalyticsProps): void {
  if (!isBrowser()) return;

  // Initialize analytics queue
  (function (w: Window & typeof globalThis, da: string) {
    (w as any)[da] =
      (w as any)[da] ||
      function () {
        ((w as any)[da].q = (w as any)[da].q || []).push(arguments);
      };
  })(window, 'dubAnalytics');

  // Determine script source based on enabled features
  const baseUrl = 'https://www.dubcdn.com/analytics/script';
  const features = [];

  if (props.domainsConfig?.site) features.push('site-visit');
  if (props.domainsConfig?.outbound) features.push('outbound-domains');

  const src =
    props.scriptProps?.src ||
    (features.length > 0
      ? `${baseUrl}.${features.join('.')}.js`
      : `${baseUrl}.js`);

  if (document.head.querySelector(`script[src*="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.defer = props.scriptProps?.defer ?? true;
  script.setAttribute('data-sdkn', name);
  script.setAttribute('data-sdkv', version);

  if (props.apiHost) {
    script.setAttribute('data-api-host', props.apiHost);
  }

  if (props.domainsConfig) {
    script.setAttribute('data-domains', JSON.stringify(props.domainsConfig));
  }

  if (props.shortDomain) {
    script.setAttribute('data-short-domain', props.shortDomain);
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
    const { src: _, ...restProps } = props.scriptProps; // we already set the src above
    Object.assign(script, restProps);
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
