import { start } from '@fingerprint/agent';

const FINGERPRINT_PUBLIC_KEY = process.env.DUB_FINGERPRINT_PUBLIC_KEY;

// Loaded on demand by base.js; resolves true once Dub has linked the device to the click
async function identify({ apiHost, clickId }) {
  if (!FINGERPRINT_PUBLIC_KEY) {
    return false;
  }

  // The server reads the click from linkedId
  const { sealed_result: sealedResult } = await start({
    apiKey: FINGERPRINT_PUBLIC_KEY,
  }).get({
    linkedId: clickId,
  });

  if (!sealedResult) {
    return false;
  }

  const response = await fetch(`${apiHost}/track/identity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identityToken: sealedResult.base64(),
    }),
  });

  if (!response.ok) {
    console.warn(
      `[dubAnalytics] trackIdentity failed with status ${response.status}.`,
    );
    return false;
  }

  return true;
}

window._dubIdentity = {
  identify,
};
