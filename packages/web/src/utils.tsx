import type { AllowedPropertyValues } from './types';

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function removeKey(
  key: string,
  { [key]: _, ...rest },
): Record<string, unknown> {
  return rest;
}

export function parseProperties(
  properties: Record<string, unknown> | undefined,
  options: {
    strip?: boolean;
  },
): Error | Record<string, AllowedPropertyValues> | undefined {
  if (!properties) return undefined;
  let props = properties;
  const errorProperties: string[] = [];
  // @ts-ignore
  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'object' && value !== null) {
      if (options.strip) {
        props = removeKey(key, props);
      } else {
        errorProperties.push(key);
      }
    }
  }

  if (errorProperties.length > 0 && !options.strip) {
    throw Error(
      `The following properties are not valid: ${errorProperties.join(
        ', ',
      )}. Only strings, numbers, booleans, and null are allowed.`,
    );
  }
  return props as Record<string, AllowedPropertyValues>;
}
