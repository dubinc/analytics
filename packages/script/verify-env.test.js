import { describe, expect, it } from 'vitest';
import { verifyEnv } from './verify-env';

const MESSAGE =
  'DUB_FINGERPRINT_PUBLIC_KEY is required for a Cloudflare production build.';

describe('verifyEnv', () => {
  it('fails a Cloudflare production build without the Fingerprint key', () => {
    expect(() =>
      verifyEnv({
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
      }),
    ).toThrow(MESSAGE);

    expect(() =>
      verifyEnv({
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DUB_FINGERPRINT_PUBLIC_KEY: '',
      }),
    ).toThrow(MESSAGE);
  });

  it('passes a Cloudflare production build with the key', () => {
    expect(() =>
      verifyEnv({
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'main',
        DUB_FINGERPRINT_PUBLIC_KEY: 'key',
      }),
    ).not.toThrow();
  });

  it('passes preview and local builds without the key', () => {
    expect(() =>
      verifyEnv({
        CF_PAGES: '1',
        CF_PAGES_BRANCH: 'track-identity',
      }),
    ).not.toThrow();

    expect(() => verifyEnv({})).not.toThrow();
  });
});
