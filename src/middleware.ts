import { defineMiddleware } from 'astro:middleware';

// Keystatic GitHub OAuth redirect_uri fix.
//
// Keystatic builds its GitHub OAuth redirect_uri from the *request* origin
// (`new URL(req.url).origin` in @keystatic/core's API handler). In production
// the Node standalone server runs inside the container and the reverse proxy
// in front of it forwards requests over an internal host (localhost:4321), so
// Astro's request URL — and therefore Keystatic's redirect_uri — comes out as
// `https://localhost/api/keystatic/github/oauth/callback`. GitHub then rejects
// the sign-in with "The redirect_uri is not associated with this application".
//
// This site lives permanently on a single canonical domain (astro.config.mjs's
// `site`), so we force that origin onto the request for the Keystatic GitHub
// routes instead of trusting whatever host the proxy happens to pass. Astro
// hands a `Request` passed to `next()` straight to the endpoint (render-context
// sets `this.request = payload` for a Request rewrite), and Keystatic reads
// `context.request.url` — so the corrected origin lands exactly where the
// redirect_uri is built.
//
// Only runs in production builds: in dev the request origin is already the
// registered 127.0.0.1 callback, so the middleware is a no-op there.
export const onRequest = defineMiddleware((context, next) => {
  const canonical = context.site; // = astro.config.mjs `site`

  if (
    import.meta.env.PROD &&
    canonical &&
    context.url.pathname.startsWith('/api/keystatic/github/') &&
    context.url.origin !== canonical.origin
  ) {
    const correctedUrl = new URL(context.url);
    correctedUrl.protocol = canonical.protocol;
    correctedUrl.host = canonical.host;
    return next(new Request(correctedUrl, context.request));
  }

  return next();
});
