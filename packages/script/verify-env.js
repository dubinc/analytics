const PRODUCTION_BRANCH = 'main';

// Without the key identity-agent.js ships as a no-op, so a Cloudflare production build must have it
function verifyEnv(env) {
  if (
    env.CF_PAGES &&
    env.CF_PAGES_BRANCH === PRODUCTION_BRANCH &&
    !env.DUB_FINGERPRINT_PUBLIC_KEY
  ) {
    throw new Error(
      'DUB_FINGERPRINT_PUBLIC_KEY is required for a Cloudflare production build.',
    );
  }
}

module.exports = {
  verifyEnv,
};
