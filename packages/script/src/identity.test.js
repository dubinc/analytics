import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './identity';

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

function identify() {
  return window._dubIdentity.identify({
    apiHost: 'https://api.example.com',
    clickId: CLICK_ID,
  });
}

describe('identity.js', () => {
  beforeEach(() => {
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
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('identifies with linkedId set to the clickId and posts only the identityToken', async () => {
    await expect(identify()).resolves.toBe(true);

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
  });

  it('skips the request when sealed results are off', async () => {
    get.mockResolvedValue({
      event_id: 'evt_1',
      sealed_result: null,
    });

    await expect(identify()).resolves.toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves false when the request is rejected', async () => {
    fetchMock.mockResolvedValue(
      new Response('Bad Request', {
        status: 400,
      }),
    );

    await expect(identify()).resolves.toBe(false);
  });
});
