/* eslint-disable no-console -- Allow logging on the server */
import { version } from '../package.json';
import type { AllowedPropertyValues } from './types';
import { isProduction, parseProperties } from './utils';

export async function lead(
  request: Request,
  apiKey: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  return track(request, apiKey, 'lead', properties);
}

export async function sale(
  request: Request,
  apiKey: string,
  properties?: Record<string, AllowedPropertyValues>,
): Promise<void> {
  return track(request, apiKey, 'sale', properties);
}

async function track(
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
