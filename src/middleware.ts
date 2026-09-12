import { defineMiddleware, sequence } from 'astro:middleware';
import { parseSkin, SKIN_COOKIE } from './lib/skin';
import { parseTheme, THEME_COOKIE } from './lib/theme';
import { bumpHits, getHits } from './lib/hits';

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
const keystaticOrigin = defineMiddleware((context, next) => {
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

// Skin + theme resolution, and the retro hit counter.
//
// The skin has to be known before any component renders (Layout.astro picks a
// whole different shell, and each page picks a different body component), so it
// is resolved here into `locals` rather than read ad hoc. The theme rides along
// for the same reason: ModernLayout renders it as `data-theme` on <html>, which
// is what makes the first paint correct without waiting for a script. Doing it
// in middleware also means the hit counter can bump *before* rendering starts —
// setting cookies from layout frontmatter races with Astro's streamed response.
const SESSION_COOKIE = 'kk-seen';
const SESSION_MAX_AGE = 60 * 30; // 30 minutes — one "visit"

/** Only count real page views: no assets, API calls, or the CMS. */
function isCountablePageView(pathname: string): boolean {
  if (pathname.startsWith('/api/') || pathname.startsWith('/keystatic') || pathname.startsWith('/og/')) {
    return false;
  }
  if (pathname.startsWith('/_')) return false;
  // Anything with a file extension is an asset, not a page.
  return !/\.[a-z0-9]+$/i.test(pathname);
}

const skinAndHits = defineMiddleware(async (context, next) => {
  // Prerendered routes (/og/*) are rendered at build time with no real request.
  // Reading cookies there touches Astro.request.headers, which warns on every
  // generated card — and the skin is meaningless for an image endpoint anyway.
  if (context.isPrerendered) return next();

  const skin = parseSkin(context.cookies.get(SKIN_COOKIE)?.value);
  context.locals.skin = skin;
  context.locals.theme = parseTheme(context.cookies.get(THEME_COOKIE)?.value);
  context.locals.hits = 0;

  if (skin !== 'retro' || !isCountablePageView(context.url.pathname)) {
    return next();
  }

  // One increment per visitor session, not per page view — the counter should
  // read as "visitors", and a rolling cookie keeps a click-happy reader from
  // inflating it.
  const alreadySeen = context.cookies.get(SESSION_COOKIE)?.value === '1';
  try {
    context.locals.hits = alreadySeen ? await getHits() : await bumpHits();
  } catch (error) {
    console.error('[hits] counter unavailable', error);
  }

  context.cookies.set(SESSION_COOKIE, '1', {
    path: '/',
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    sameSite: 'lax',
  });

  return next();
});

export const onRequest = sequence(keystaticOrigin, skinAndHits);
