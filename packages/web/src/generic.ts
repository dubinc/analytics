import { version } from '../package.json';
import type { AnalyticsProps } from './types';
import { getScriptSrc, isBrowser } from './utils';

/**
 * Injects the Dub Web Analytics script into the page head.
 */
function inject(props: AnalyticsProps): void {
  if (!isBrowser()) return;

  const src = getScriptSrc();

  if (document.head.querySelector(`script[src*="${src}"]`)) return;

  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  script.setAttribute('data-sdkv', version);
  script.setAttribute(
    'data-cookie-options',
    JSON.stringify(props.cookieOptions),
  );

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
