import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackIdentity, watchIdentityPaths } from './identity';

const CLICK_ID = 'kVrpHmuNu8Q9VpBG';
const SEALED_RESULT = 'noXc7Q==';

const { get, start } = vi.hoisted(() => {
  const getMock = vi.fn();

  return {
    get: getMock,
    start: vi.fn(() => ({
      get: getMock,
    })),
  };
});

vi.mock('@fingerprint/agent', () => ({
  start,
}));

const fetchMock = vi.fn();
const { pushState, replaceState } = window.history;

function clearCookies(): void {
  document.cookie.split(';').forEach((cookie) => {
    const [name] = cookie.trim().split('=');
    document.cookie = `${name}=; path=/; max-age=0`;
  });
}

function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function getCookie(name: string): string | undefined {
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
}

describe('trackIdentity', () => {
  beforeEach(() => {
    clearCookies();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    get.mockResolvedValue({
      event_id: 'evt_1',
      sealed_result: {
        base64: () => SEALED_RESULT,
      },
    });

    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          clickIdentificationId: 'cid_1',
        }),
      ),
    );
  });

  afterEach(() => {
    window.history.pushState = pushState;
    window.history.replaceState = replaceState;
    window.history.replaceState(null, '', '/');
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('identifies with linkedId set to the clickId and posts only the identityToken', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    await trackIdentity({
      apiHost: 'https://api.example.com',
    });

    expect(start).toHaveBeenCalledWith({
      apiKey: 'test_public_key',
    });
    expect(get).toHaveBeenCalledWith({
      linkedId: CLICK_ID,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.com/track/identity',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identityToken: SEALED_RESULT,
        }),
      },
    );
    expect(getCookie('dub_fid')).toBe(CLICK_ID);
  });

  it('defaults to the Dub API host', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    await trackIdentity({});

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.dub.co/track/identity',
      expect.anything(),
    );
  });

  it('skips when dub_fid already matches the click', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    document.cookie = `dub_fid=${CLICK_ID}; path=/`;

    await trackIdentity({});

    expect(start).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('identifies again when dub_fid belongs to another click', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    document.cookie = 'dub_fid=otherClickId; path=/';

    await trackIdentity({});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getCookie('dub_fid')).toBe(CLICK_ID);
  });

  it('waits for dub_id set after a client-side click', async () => {
    vi.useFakeTimers();

    const promise = trackIdentity({});
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    await vi.advanceTimersByTimeAsync(1000);
    await promise;

    expect(get).toHaveBeenCalledWith({
      linkedId: CLICK_ID,
    });
  });

  it('skips when there is no dub_id cookie', async () => {
    vi.useFakeTimers();

    const promise = trackIdentity({});
    await vi.advanceTimersByTimeAsync(5000);
    await promise;

    expect(start).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the request when sealed results are off', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    get.mockResolvedValue({
      event_id: 'evt_1',
      sealed_result: null,
    });

    await trackIdentity({});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCookie('dub_fid')).toBeUndefined();
  });

  it('does not set dub_fid when the request is rejected', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    fetchMock.mockResolvedValue(
      new Response('Bad Request', {
        status: 400,
      }),
    );

    await trackIdentity({});

    expect(getCookie('dub_fid')).toBeUndefined();
  });

  it('never throws when Fingerprint fails', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    get.mockRejectedValue(new Error('Network error'));

    await expect(trackIdentity({})).resolves.toBeUndefined();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getCookie('dub_fid')).toBeUndefined();
  });

  it('never throws when the request fails', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(trackIdentity({})).resolves.toBeUndefined();

    expect(getCookie('dub_fid')).toBeUndefined();
  });

  it('shares one identification between concurrent calls', async () => {
    document.cookie = `dub_id=${CLICK_ID}; path=/`;

    await Promise.all([trackIdentity({}), trackIdentity({})]);

    expect(get).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('watchIdentityPaths', () => {
  beforeEach(() => {
    clearCookies();
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    get.mockResolvedValue({
      event_id: 'evt_1',
      sealed_result: {
        base64: () => SEALED_RESULT,
      },
    });

    fetchMock.mockResolvedValue(new Response('{}'));
  });

  afterEach(() => {
    window.history.pushState = pushState;
    window.history.replaceState = replaceState;
    window.history.replaceState(null, '', '/');
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it.each([
    ['/signup', ['/signup']],
    ['/signup/', ['/signup']],
    ['/checkout', ['/checkout/*']],
    ['/checkout/plan/pro', ['/checkout/*']],
    ['/anything', ['/*']],
  ])('identifies on %s for paths %j', async (pathname, paths) => {
    window.history.replaceState(null, '', pathname);

    watchIdentityPaths({
      paths,
    });

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ['/', ['/signup']],
    ['/signup/step-2', ['/signup']],
    ['/signup-old', ['/signup']],
    ['/checkouts', ['/checkout/*']],
  ])('skips %s for paths %j', async (pathname, paths) => {
    window.history.replaceState(null, '', pathname);

    watchIdentityPaths({
      paths,
    });
    await flush();

    expect(start).not.toHaveBeenCalled();
  });

  it('identifies after a client-side navigation to a matching path', async () => {
    watchIdentityPaths({
      paths: ['/signup'],
      apiHost: 'https://api.example.com',
    });
    await flush();

    expect(start).not.toHaveBeenCalled();

    window.history.pushState(null, '', '/signup');

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.example.com/track/identity',
        expect.anything(),
      );
    });
  });

  it('identifies when going back to a matching path', async () => {
    window.history.replaceState(null, '', '/signup');
    watchIdentityPaths({
      paths: ['/signup'],
    });
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    clearCookies();
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    window.history.pushState(null, '', '/pricing');
    await flush();
    replaceState.call(window.history, null, '', '/signup');

    expect(start).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new PopStateEvent('popstate'));

    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('ignores history updates that keep the same path', async () => {
    window.history.replaceState(null, '', '/signup');
    watchIdentityPaths({
      paths: ['/signup'],
    });
    await vi.waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    clearCookies();
    document.cookie = `dub_id=${CLICK_ID}; path=/`;
    window.history.replaceState(null, '', '/signup?step=2');
    await flush();

    expect(start).toHaveBeenCalledTimes(1);
  });
});
