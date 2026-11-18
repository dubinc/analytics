import { start } from '@fingerprint/agent';

const FINGERPRINT_PUBLIC_KEY = process.env.DUB_FINGERPRINT_PUBLIC_KEY;
// Dub's Fingerprint custom subdomain, so ad blockers don't stop the agent; Fingerprint's default stays as the fallback
const FINGERPRINT_ENDPOINTS = ['https://identity.dub.co'];

// Loaded on demand by the identity extension; resolves the visitorId once Fingerprint has identified the device
async function identify({ clickId }) {
  if (!FINGERPRINT_PUBLIC_KEY) {
    return null;
  }

  // Needs Sealed Client Results off for the workspace, so visitor_id comes back in plaintext
  const { visitor_id: visitorId } = await start({
    apiKey: FINGERPRINT_PUBLIC_KEY,
    endpoints: FINGERPRINT_ENDPOINTS,
  }).get({
    linkedId: clickId,
  });

  return visitorId || null;
}

window._dubIdentity = {
  identify,
};
