/* eslint-disable no-console -- Allow logging on the server */
import { version } from '../package.json';
import type { AllowedPropertyValues, ClickApiResponse } from './types';
import {
  CLICK_ID_COOKIE_NAME,
  getClickId,
  getTrackEndpoint,
  isProduction,
  parseProperties,
} from './utils';

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

// Private function to track a conversion event. Not exposed in the SKD.
async function _trackConversion(
  request: Request,
  apiKey: string,
  eventName: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Dub Web Analytics] This function is only meant to be used in a server environment.',
    );
  }

  if (!apiKey) {
    throw new Error('[Dub Web Analytics] Please provide an API key to use.');
  }

  const clickId = getClickId(request);
  if (!clickId) {
    console.error(
      `[Dub Web Analytics] The click id cookie is missing. Please make sure that the '${CLICK_ID_COOKIE_NAME}' cookie is set on the client side. We will only track events if the '${CLICK_ID_COOKIE_NAME}' cookie is present.`,
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

    const trackEndpoint = getTrackEndpoint();
    await fetch(`${trackEndpoint}/conversion`, {
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

/**
 * Tracks a click event.
 * @param request - The request object.
 * @param apiKey - The API key.
 * @param url - The URL of the clicked link.
 * ```ts
 * import { track } from '@dub/analytics/server';
 *
 * track.click(request, apiKey, 'https://example.com');
 * ```
 */
async function click(
  request: Request,
  apiKey: string,
  url: string,
): Promise<{ clickId?: string; success: boolean }> {
  if (typeof window !== 'undefined') {
    throw new Error(
      '[Dub Web Analytics] This function is only meant to be used in a server environment.',
    );
  }

  if (!apiKey) {
    throw new Error('[Dub Web Analytics] Please provide an API key to use.');
  }

  const clickId = getClickId(request);
  if (!clickId) {
    console.error(
      `[Dub Web Analytics] The click id cookie is missing. Please make sure that the '${CLICK_ID_COOKIE_NAME}' cookie is set on the client side. We will only track events if the '${CLICK_ID_COOKIE_NAME}' cookie is present.`,
    );
    return {
      success: false,
    };
  }

  try {
    const body = {
      clickId,
      url,
      sdkVersion: version,
      timestamp: new Date().getTime(),
    };

    const trackEndpoint = getTrackEndpoint();
    const response = await fetch(`${trackEndpoint}/click`, {
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(body),
      method: 'POST',
    });

    if (!response.ok) {
      console.error(response);
      return {
        success: false,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- We trust the server response
    const data: ClickApiResponse = await response.json();
    return {
      success: true,
      clickId: data.clickId,
    };
  } catch (err) {
    console.error(err);
  }

  return {
    success: false,
  };
}

const track = {
  click,
  lead,
  sale,
};

export { track };
