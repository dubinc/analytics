import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { trackIdentity } from './identity';

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

function clearCookies(): void {
  document.cookie.split(';').forEach((cookie) => {
    const [name] = cookie.trim().split('=');
    document.cookie = `${name}=; path=/; max-age=0`;
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
          clickIdentityId: 'cid_1',
        }),
      ),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('identifies with linkedId set to the clickId and posts only the sealed result', async () => {
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
          sealedResult: SEALED_RESULT,
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
});
