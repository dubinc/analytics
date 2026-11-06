import { start } from '@fingerprint/agent';

const FINGERPRINT_PUBLIC_KEY = process.env.DUB_FINGERPRINT_PUBLIC_KEY;
// Dub's Fingerprint custom subdomain, so ad blockers don't stop the agent; Fingerprint's default stays as the fallback
const FINGERPRINT_ENDPOINTS = ['https://identity.dub.co'];

// Loaded on demand by the identity extension; resolves the visitorId once Dub has accepted or rejected the identification
async function identify({ apiHost, clickId }) {
  if (!FINGERPRINT_PUBLIC_KEY) {
    return null;
  }

  // Needs Sealed Client Results off for the workspace, so visitor_id comes back in plaintext
  const { visitor_id: visitorId, event_id: eventId } = await start({
    apiKey: FINGERPRINT_PUBLIC_KEY,
    endpoints: FINGERPRINT_ENDPOINTS,
  }).get({
    linkedId: clickId,
  });

  if (!visitorId || !eventId) {
    return null;
  }

  try {
    const response = await fetch(`${apiHost}/track/identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        eventId,
      }),
    });

    if (response.ok) {
      return visitorId;
    }

    console.warn(
      `[dubAnalytics] trackIdentity failed with status ${response.status}.`,
    );

    // A 4xx won't succeed on retry, so the click is done; a 5xx or 429 is left for the next page load
    if (
      response.status >= 400 &&
      response.status < 500 &&
      response.status !== 429
    ) {
      return visitorId;
    }

    return null;
  } catch (error) {
    console.warn('[dubAnalytics] trackIdentity failed.', error);

    return null;
  }
}

window._dubIdentity = {
  identify,
};
