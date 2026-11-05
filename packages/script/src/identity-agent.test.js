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

  it('waits for the request before resolving the visitorId', async () => {
    let respond = (_response) => undefined;

    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        respond = resolve;
      }),
    );

    const pending = identify();
    let settled = false;
    pending.then(() => {
      settled = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).toBe(false);

    respond(new Response('{}'));

    await expect(pending).resolves.toBe(VISITOR_ID);
  });

  it('resolves the visitorId after a 4xx, since retrying would fail again', async () => {
    fetchMock.mockResolvedValue(
      new Response('Bad Request', {
        status: 400,
      }),
    );

    await expect(identify()).resolves.toBe(VISITOR_ID);

    expect(console.warn).toHaveBeenCalledWith(
      '[dubAnalytics] trackIdentity failed with status 400.',
    );
  });

  it.each([429, 500, 503])(
    'resolves null after a %i so the next page load retries',
    async (status) => {
      fetchMock.mockResolvedValue(
        new Response('Error', {
          status,
        }),
      );

      await expect(identify()).resolves.toBeNull();
    },
  );

  it('resolves null when the request fails to send', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(identify()).resolves.toBeNull();
  });
});
