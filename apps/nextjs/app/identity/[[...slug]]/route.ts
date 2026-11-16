import { DUB_ANALYTICS_SCRIPT_URL } from '@/app/constants';

const IDENTITY_SCRIPT_URL = DUB_ANALYTICS_SCRIPT_URL.replace(
  /script[^/]*\.js$/,
  'script.identity.js',
);
const REFER_DOMAIN = process.env.DUB_IDENTITY_REFER_DOMAIN || 'getacme.link';
const API_HOST = process.env.DUB_IDENTITY_API_HOST || '';
const IDENTITY_PATH = '/identity/signup';

// A plain HTML page, outside the root layout, so only the identity variant of the local build loads
function renderPage(pathname: string) {
  const isIdentityPath = pathname === IDENTITY_PATH;
  const apiHostAttribute = API_HOST ? `data-api-host="${API_HOST}"` : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Identity demo</title>
    <script>
      (function (w, da) {
        w[da] = w[da] || function () { (w[da].q = w[da].q || []).push(arguments); };
        ['trackClick', 'trackLead', 'trackSale', 'trackIdentity'].forEach(function (m) {
          w[da][m] = function () { (w[da].q = w[da].q || []).push([m, ...Array.from(arguments)]); };
        });
      })(window, 'dubAnalytics');
      window.__pageStart = performance.now();
    </script>
    <script
      src="${IDENTITY_SCRIPT_URL}"
      defer
      ${apiHostAttribute}
      data-domains='${JSON.stringify({ refer: REFER_DOMAIN })}'
      data-track-identity-paths='${JSON.stringify([IDENTITY_PATH])}'
    ></script>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 16px; }
      pre { background: #f4f4f5; padding: 12px; overflow-x: auto; }
    </style>
  </head>
  <body>
    <h1>Identity demo</h1>
    <p>
      ${
        isIdentityPath
          ? `<code>${IDENTITY_PATH}</code> is an identity path, so a partner click is identified on load.`
          : `Not an identity path, so a partner click only preloads the Fingerprint agent here.`
      }
    </p>
    <p>
      <a href="/identity">Home</a> · <a href="${IDENTITY_PATH}">Sign up</a> ·
      <button id="track-identity" type="button">trackIdentity()</button>
    </p>
    <h2>Cookies</h2>
    <pre id="cookies"></pre>
    <h2>Identity requests (ms after page start)</h2>
    <pre id="timeline"></pre>
    <script>
      function render() {
        var cookies = Object.fromEntries(
          document.cookie.split(';').filter(Boolean).map(function (c) {
            var i = c.indexOf('=');
            return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
          }),
        );
        document.getElementById('cookies').textContent = JSON.stringify(
          { dub_id: cookies.dub_id, dub_partner_data: cookies.dub_partner_data },
          null,
          2,
        );
        document.getElementById('timeline').textContent =
          performance
            .getEntriesByType('resource')
            .filter(function (e) {
              return /identity-agent\\.js|identity\\.dub\\.co|fpjs|\\/track\\/identity/.test(e.name);
            })
            .map(function (e) {
              return Math.round(e.startTime) + ' → ' + Math.round(e.responseEnd) + '  ' + e.name;
            })
            .join('\\n') || '—';
      }
      document.getElementById('track-identity').addEventListener('click', function () {
        Promise.resolve(window.dubAnalytics.trackIdentity()).then(render);
      });
      setInterval(render, 500);
      render();
    </script>
  </body>
</html>`;
}

export function GET(request: Request) {
  return new Response(renderPage(new URL(request.url).pathname), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
