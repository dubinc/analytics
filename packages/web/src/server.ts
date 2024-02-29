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
  return _trackConversion(request, apiKey, 'lead', properties);
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
  return _trackConversion(request, apiKey, 'sale', properties);
}

function getClickId(request: Request): string | undefined {
  const cookies = request.headers.get('cookie');
  const clickId = cookies
    ?.split(';')
    .find((c) => c.trim().startsWith('dclid'))
    ?.split('=')[1];

  return clickId;
}

function validateApiKey(apiKey: string): void {
  if (!apiKey) {
    throw new Error('[Dub Web Analytics] Please provide an API key to use.');
  }
}

function ensureServerEnvironment(): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Dub Web Analytics] This function is only meant to be used in a server environment.',
    );
  }
}

async function _trackConversion(
  request: Request,
  apiKey: string,
  eventName: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  ensureServerEnvironment();
  validateApiKey(apiKey);

  const clickId = getClickId(request);
  if (!clickId) {
    console.error(
      '[Dub Web Analytics] The click id cookie is missing. Please make sure that the `dclid` cookie is set on the client side. We will only track events if the `dclid` cookie is present.',
    );
    return;
  }

  try {
    const props = parseProperties(properties, {
      strip: isProduction(),
    });
    const body = {
      eventName,
      properties: props,
      clickId,
      sdkVersion: version,
      timestamp: new Date().getTime(),
    };

    const trackEndpoint =
      process.env.NEXT_PUBLIC_DUB_ANALYTICS_TRACK_ENDPOINT ||
      process.env.DUB_ANALYTICS_TRACK_ENDPOINT ||
      'https://api.dub.co/analytics/track/conversion';
    await fetch(trackEndpoint, {
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
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

async function click(
  request: Request,
  apiKey: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  ensureServerEnvironment();
  validateApiKey(apiKey);

  const clickId = getClickId(request);
  if (!clickId) {
    console.error(
      '[Dub Web Analytics] The click id cookie is missing. Please make sure that the `dclid` cookie is set on the client side. We will only track events if the `dclid` cookie is present.',
    );
    return;
  }

  try {
    const props = parseProperties(properties, {
      strip: isProduction(),
    });
    const body = {
      properties: props,
      clickId,
      sdkVersion: version,
      timestamp: new Date().getTime(),
    };

    const trackEndpoint =
      process.env.NEXT_PUBLIC_DUB_ANALYTICS_TRACK_ENDPOINT ||
      process.env.DUB_ANALYTICS_TRACK_ENDPOINT ||
      'https://api.dub.co/analytics/track/click';
    await fetch(trackEndpoint, {
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
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
  click,
  lead,
  sale,
};

export { track };
