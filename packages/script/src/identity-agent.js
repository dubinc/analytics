import { start } from '@fingerprint/agent';

const FINGERPRINT_PUBLIC_KEY = process.env.DUB_FINGERPRINT_PUBLIC_KEY;
// Dub's Fingerprint custom subdomain, so ad blockers don't stop the agent; Fingerprint's default stays as the fallback
const FINGERPRINT_ENDPOINTS = ['https://identity.dub.co'];

// Started on load so browser signals are collected before identify() asks for the visitorId
const agent = FINGERPRINT_PUBLIC_KEY
  ? start({
      apiKey: FINGERPRINT_PUBLIC_KEY,
      endpoints: FINGERPRINT_ENDPOINTS,
    })
  : null;

// Loaded on demand by the identity extension; resolves the visitorId once Fingerprint has identified the device
async function identify({ clickId }) {
  if (!agent) {
    return null;
  }

  // Needs Sealed Client Results off for the workspace, so visitor_id comes back in plaintext
  const { visitor_id: visitorId } = await agent.get({
    linkedId: clickId,
  });

  return visitorId || null;
}

window._dubIdentity = {
  identify,
};
