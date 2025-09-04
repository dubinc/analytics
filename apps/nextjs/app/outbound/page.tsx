export default function Outbound() {
  return (
    <div>
      <a href="https://example.com">Example Link</a>
      <a href="https://other.com?foo=bar">Other Link</a>
      <a href="https://unrelated.com">Unrelated Link</a>

      <iframe src="https://example.com/embed"></iframe>
      <iframe src="https://www.example.com/embed"></iframe>

      <a href="https://getacme.link/about">Internal Link</a>
      <div id="container"></div>

      <a href="https://www.example.com">WWW Link</a>
      <a href="https://sub.example.com">Subdomain Link</a>
      <a href="https://other.example.com">Other Subdomain Link</a>
      <a href="https://www.sub.example.com">WWW Subdomain Link</a>

      {/* Wildcard domain test links */}
      <a href="https://api.wildcard.com">Wildcard API Link</a>
      <a href="https://admin.wildcard.com">Wildcard Admin Link</a>
      <a href="https://deep.nested.wildcard.com">Wildcard Nested Link</a>
      <a href="https://wildcard.com">Wildcard Root Link</a>
      <a href="https://notwildcard.com">Non-Wildcard Link</a>
      <a href="https://www.api.wildcard.com">WWW Wildcard API Link</a>
      <a href="https://www.admin.wildcard.com">WWW Wildcard Admin Link</a>
    </div>
  );
}
