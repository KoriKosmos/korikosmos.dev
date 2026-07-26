/**
 * Same-origin guard for the public write endpoints (guestbook, reactions).
 *
 * `Request.json()` ignores Content-Type, so a cross-origin
 * `<form enctype="text/plain">` can post a body that parses as valid JSON with
 * no preflight and no consent from the visitor. Every write here is driven by
 * `fetch()` from one of my own islands, and browsers always attach `Origin`
 * (and `Sec-Fetch-Site`) to a POST, so requiring them costs nothing real.
 *
 * The Origin *comparison* is against `site` — the canonical domain from
 * astro.config.mjs — and never against `Astro.url.origin`. This is the same
 * trap src/middleware.ts documents for Keystatic's OAuth callback: behind the
 * container's reverse proxy the Node server sees the internal host, so
 * `url.origin` is `localhost:4321` in production. Trusting it would also let a
 * forged Host header nominate its own allowed origin.
 */
export function isSameOrigin(request: Request, site: URL | undefined, url: URL): boolean {
  // `Sec-Fetch-*` are forbidden header names: script cannot set them, so a
  // cross-site page has no way to make a browser emit `same-origin` here. That
  // makes this stronger evidence than the Origin string, and — unlike the
  // canonical-host comparison below — it is host-agnostic. Without it, a
  // production build reached at anything other than `site` (the container on
  // localhost:8484, a staging host, www) would 403 its own guestbook form.
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin') return true;
  if (fetchSite) return false;

  // Fallback for clients that send no Sec-Fetch-Site.

  const allowed = new Set<string>();
  if (site) allowed.add(site.origin);
  if (import.meta.env.DEV) allowed.add(url.origin);

  const origin = request.headers.get('origin');
  // No Origin at all means a non-browser client. Browsers always send it on a
  // POST, so refusing is the safe default even though it blocks plain curl.
  if (!origin) return false;
  return allowed.has(origin);
}
