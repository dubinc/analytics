/* eslint-disable no-console -- Allow logging on the server */
import { version } from '../package.json';
import type { AllowedPropertyValues } from './types';
import { isProduction, parseProperties } from './utils';

/**
 * Tracks a lead event.
 * @param request - The request object.
 * @param apiKey - The API key.
 * @param properties - Additional properties of the event. Nested objects are not supported. Allowed values are `string`, `number`, `boolean`, and `null`.
 * ```ts
 * import { track } from '@dub/analytics/server';
 *
 * track.lead(request, apiKey, {
 *  cta: 'Sign Up',
 * });
 * ```
 */
async function lead(
  request: Request,
  apiKey: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  return _track(request, apiKey, 'lead', properties);
}

/**
 * Tracks a sale event.
 * @param request - The request object.
 * @param apiKey - The API key.
 * @param properties - Additional properties of the event. Nested objects are not supported. Allowed values are `string`, `number`, `boolean`, and `null`.
 * @param properties.value - The value of the sale in cents.
 * @param properties.currency - The currency of the sale.
 * ```ts
 * import { track } from '@dub/analytics/server';
 *
 * track.sale(request, apiKey, {
 *  value: 1000, // $10.00
 *  currency: 'USD',
 * });
 * ```
 */
async function sale(
  request: Request,
  apiKey: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  return _track(request, apiKey, 'sale', properties);
}

async function _track(
  request: Request,
  apiKey: string,
  eventName: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  if (typeof window !== 'undefined') {
    console.log(
      '[Dub Web Analytics] It seems like you imported the `track` function from `@dub/analytics/server` in a browser environment. This function is only meant to be used in a server environment.',
    );
    return;
  }

  if (!apiKey) {
    throw new Error('[Dub Web Analytics] Please provide an API key to use.');
  }

  const cookies = request.headers.get('cookie');
  const dclid = cookies
    ?.split(';')
    .find((c) => c.trim().startsWith('dclid'))
    ?.split('=')[1];
  if (!dclid) {
    console.error(
      '[Dub Web Analytics] `dclid` cookie is missing. Please make sure that the `dclid` cookie is set on the client side. We will only track events if the `dclid` cookie is present.',
    );
    return;
  }

  try {
    const props = parseProperties(properties, {
      strip: isProduction(),
    });
    const body = {
      event: eventName,
      properties: props,
      dclid,
      apiKey,
      sdkVersion: version,
      timestamp: new Date().getTime(),
    };

    const ENDPOINT = 'https://api.dub.co/analytics/track';
    await fetch(ENDPOINT, {
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
      method: 'POST',
    }).catch((err: unknown) => {
      if (err instanceof Error && 'response' in err) {
        console.error(err.response);
      } else {
        console.error(err);
      }
    });

    return void 0;
  } catch (err) {
    console.error(err);
  }
}

const track = {
  lead,
  sale,
};

export { track };
