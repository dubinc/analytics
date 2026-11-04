import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './identity-agent';

const CLICK_ID = 'kVrpHmuNu8Q9VpBG';
const VISITOR_ID = 'Uxk0Swb1Ofgfq2Jcg1cV';
const EVENT_ID = '1708102555327.NLOjmg';

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

describe('identity-agent.js', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    get.mockResolvedValue({
      event_id: EVENT_ID,
      visitor_id: VISITOR_ID,
      sealed_result: null,
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

  it('identifies with linkedId set to the clickId and posts only the eventId', async () => {
    await expect(identify()).resolves.toBe(VISITOR_ID);

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
          eventId: EVENT_ID,
        }),
      },
    );
  });

  it('skips the request without a visitor_id, as when Sealed Client Results are on', async () => {
    get.mockResolvedValue({
      event_id: EVENT_ID,
      sealed_result: {
        base64: () => 'noXc7Q==',
      },
    });

    await expect(identify()).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves the visitorId without waiting for the request', async () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    await expect(identify()).resolves.toBe(VISITOR_ID);
  });

  it('warns when the request is rejected', async () => {
    fetchMock.mockResolvedValue(
      new Response('Bad Request', {
        status: 400,
      }),
    );

    await expect(identify()).resolves.toBe(VISITOR_ID);

    await vi.waitFor(() => {
      expect(console.warn).toHaveBeenCalledWith(
        '[dubAnalytics] trackIdentity failed with status 400.',
      );
    });
  });
});
