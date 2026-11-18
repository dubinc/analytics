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
    clickId: CLICK_ID,
  });
}

describe('identity-agent.js', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);

    get.mockResolvedValue({
      visitor_id: VISITOR_ID,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('identifies with linkedId set to the clickId and resolves the visitorId without a fetch request', async () => {
    await expect(identify()).resolves.toBe(VISITOR_ID);

    expect(start).toHaveBeenCalledWith({
      apiKey: 'test_public_key',
      endpoints: ['https://identity.dub.co'],
    });
    expect(get).toHaveBeenCalledWith({
      linkedId: CLICK_ID,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves the visitorId without a fetch request when the result also has an event_id', async () => {
    get.mockResolvedValue({
      event_id: EVENT_ID,
      visitor_id: VISITOR_ID,
    });

    await expect(identify()).resolves.toBe(VISITOR_ID);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('resolves null without a visitor_id, as when Sealed Client Results are on', async () => {
    get.mockResolvedValue({
      event_id: EVENT_ID,
      sealed_result: {
        base64: () => 'noXc7Q==',
      },
    });

    await expect(identify()).resolves.toBeNull();
  });
});
