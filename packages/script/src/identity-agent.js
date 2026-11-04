import { start } from '@fingerprint/agent';

const FINGERPRINT_PUBLIC_KEY = process.env.DUB_FINGERPRINT_PUBLIC_KEY;

// Loaded on demand by the identity extension; resolves the visitorId once the device is identified
async function identify({ apiHost, clickId }) {
  if (!FINGERPRINT_PUBLIC_KEY) {
    return null;
  }

  // Needs Sealed Client Results off for the workspace, so visitor_id comes back in plaintext
  const { visitor_id: visitorId, event_id: eventId } = await start({
    apiKey: FINGERPRINT_PUBLIC_KEY,
  }).get({
    linkedId: clickId,
  });

  if (!visitorId || !eventId) {
    return null;
  }

  fetch(`${apiHost}/track/identity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventId,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        console.warn(
          `[dubAnalytics] trackIdentity failed with status ${response.status}.`,
        );
      }
    })
    .catch((error) => {
      console.warn('[dubAnalytics] trackIdentity failed.', error);
    });

  return visitorId;
}

window._dubIdentity = {
  identify,
};
