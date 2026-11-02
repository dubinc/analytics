const DEFAULT_API_HOST = 'https://api.dub.co';
const DUB_ID_COOKIE = 'dub_id';
const DUB_FID_COOKIE = 'dub_fid';
const DUB_FID_MAX_AGE_SECONDS = 30 * 60;
const CLICK_ID_POLL_ATTEMPTS = 5;
const CLICK_ID_POLL_INTERVAL_MS = 1000;
const FINGERPRINT_PUBLIC_KEY = process.env.DUB_FINGERPRINT_PUBLIC_KEY;

let pendingIdentity: Promise<void> | undefined;

function getCookie(name: string): string | undefined {
  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([key]) => key === name)?.[1];
}

// The script sets dub_id asynchronously for ?via= clicks, so give it a few seconds
async function waitForClickId(
  attemptsLeft = CLICK_ID_POLL_ATTEMPTS,
): Promise<string | undefined> {
  const clickId = getCookie(DUB_ID_COOKIE);

  if (clickId || attemptsLeft <= 1) {
    return clickId;
  }

  await new Promise((resolve) => {
    setTimeout(resolve, CLICK_ID_POLL_INTERVAL_MS);
  });

  return waitForClickId(attemptsLeft - 1);
}

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function matchesIdentityPath(pathname: string, paths: string[]): boolean {
  const current = normalizePath(pathname);

  return paths.some((path) => {
    if (path.endsWith('/*')) {
      const base = normalizePath(path.slice(0, -2));

      return base === '' || current === base || current.startsWith(`${base}/`);
    }

    return current === normalizePath(path);
  });
}

async function identify(apiHost: string): Promise<void> {
  try {
    if (!FINGERPRINT_PUBLIC_KEY) {
      return;
    }

    const clickId = await waitForClickId();

    if (!clickId || getCookie(DUB_FID_COOKIE) === clickId) {
      return;
    }

    const { start } = await import('@fingerprint/agent');

    // The server reads the click from linkedId
    const { sealed_result: sealedResult } = await start({
      apiKey: FINGERPRINT_PUBLIC_KEY,
    }).get({
      linkedId: clickId,
    });

    if (!sealedResult) {
      return;
    }

    const response = await fetch(`${apiHost}/track/identity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sealedResult: sealedResult.base64(),
      }),
    });

    if (!response.ok) {
      // eslint-disable-next-line no-console -- Logging to console is intentional
      console.warn(
        `[Dub Web Analytics] identity tracking failed with status ${response.status}.`,
      );
      return;
    }

    document.cookie = `${DUB_FID_COOKIE}=${clickId}; path=/; max-age=${DUB_FID_MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch (error) {
    // eslint-disable-next-line no-console -- Logging to console is intentional
    console.warn('[Dub Web Analytics] identity tracking failed.', error);
  }
}

/**
 * Identifies the visitor's device and links it to their Dub click.
 * Runs only for visitors with a `dub_id` cookie, at most once per click every 30 minutes.
 */
export function trackIdentity({
  apiHost = DEFAULT_API_HOST,
}: {
  apiHost?: string;
}): Promise<void> {
  pendingIdentity ??= identify(apiHost).finally(() => {
    pendingIdentity = undefined;
  });

  return pendingIdentity;
}

/**
 * Runs trackIdentity on the current page and on every client-side navigation to one of the paths.
 */
export function watchIdentityPaths({
  paths,
  apiHost,
}: {
  paths: string[];
  apiHost?: string;
}): void {
  let lastPathname: string | undefined;

  const check = (): void => {
    const { pathname } = window.location;

    if (pathname === lastPathname) {
      return;
    }

    lastPathname = pathname;

    if (matchesIdentityPath(pathname, paths)) {
      void trackIdentity({
        apiHost,
      });
    }
  };

  const pushState = window.history.pushState.bind(window.history);
  const replaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = (...args) => {
    pushState(...args);
    check();
  };

  window.history.replaceState = (...args) => {
    replaceState(...args);
    check();
  };

  window.addEventListener('popstate', check);

  check();
}
