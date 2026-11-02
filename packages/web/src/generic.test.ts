import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { inject } from './generic';

const { trackIdentity, watchIdentityPaths } = vi.hoisted(() => ({
  trackIdentity: vi.fn(() => Promise.resolve()),
  watchIdentityPaths: vi.fn(),
}));

vi.mock('./identity', () => ({
  trackIdentity,
  watchIdentityPaths,
}));

function loadScript(): void {
  const script = document.head.querySelector('script');

  window.dubAnalytics = Object.assign(() => undefined, {
    trackClick: vi.fn(),
    trackLead: vi.fn(),
    trackSale: vi.fn(),
  });
  script?.dispatchEvent(new Event('load'));
}

describe('inject', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    delete (window as Partial<Window>).dubAnalytics;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exposes trackIdentity before and after the script replaces window.dubAnalytics', async () => {
    inject({
      apiHost: 'https://api.example.com',
    });

    await window.dubAnalytics.trackIdentity?.();

    loadScript();
    await window.dubAnalytics.trackIdentity?.();

    expect(trackIdentity).toHaveBeenCalledTimes(2);
    expect(trackIdentity).toHaveBeenCalledWith({
      apiHost: 'https://api.example.com',
    });
  });

  it('watches the trackIdentity paths once the script loads', () => {
    inject({
      apiHost: 'https://api.example.com',
      trackIdentity: {
        paths: ['/signup'],
      },
    });

    expect(watchIdentityPaths).not.toHaveBeenCalled();

    loadScript();

    expect(watchIdentityPaths).toHaveBeenCalledWith({
      paths: ['/signup'],
      apiHost: 'https://api.example.com',
    });
  });

  it('does not watch paths without trackIdentity', () => {
    inject({});
    loadScript();

    expect(watchIdentityPaths).not.toHaveBeenCalled();
  });
});
