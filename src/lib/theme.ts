/**
 * Theme selection for the modern skin.
 *
 * The choice is stored in localStorage for the navigation reconciler and in
 * a cookie for the server. ThemeBar follows the displayed data-theme attribute.
 * Only the cookie is visible to the server, so `ModernLayout` renders
 * `data-theme` into the HTML from it, so the very first paint is already the
 * right theme without any JavaScript having run.
 *
 * That indirection exists because an inline `<script>` in `<head>` is *not*
 * guaranteed to execute before paint. Cloudflare's Rocket Loader rewrites
 * inline script tags to a token MIME type (`type="<hash>-text/javascript"`) and
 * replays them asynchronously after load, which is exactly how the theme flash
 * came back: the site painted the default blue theme for about a second before
 * the saved one landed. The pre-paint scripts carry `data-cfasync="false"` now
 * so Rocket Loader skips them, but a CSP, another proxy, or plain slow parsing
 * would defer them just the same — a server-rendered attribute cannot be
 * deferred at all, so it is the actual fix and the script is the fallback.
 */

/** Mirrored by the DaisyUI theme list in tailwind.config.mjs. */
export const THEMES = ['dark', 'light', 'forest', 'spider-man', 'batman'] as const;
export type Theme = (typeof THEMES)[number];

/**
 * Changing this means changing the bare `html { background-color }` rule in
 * ModernLayout's critical `<style>` too, which is the no-cookie fallback paint.
 */
export const DEFAULT_THEME: Theme = 'dark';

export const THEME_COOKIE = 'kk-theme';
/** Predates the cookie, so the key is unprefixed — don't rename it, stored values are in the wild. */
export const THEME_STORAGE_KEY = 'theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Values written before the theme was renamed from "spiderman". */
const ALIASES: Record<string, Theme> = { spiderman: 'spider-man' };

export function parseTheme(value: string | undefined | null): Theme {
  if (!value) return DEFAULT_THEME;
  const named = ALIASES[value] ?? value;
  return (THEMES as readonly string[]).includes(named) ? (named as Theme) : DEFAULT_THEME;
}

/**
 * Read the active theme for this request. Prefers `locals` (set by middleware)
 * and falls back to the cookie, so the helper still works on the routes
 * middleware skips.
 */
export function getTheme(ctx: {
  locals: App.Locals;
  cookies: { get(name: string): { value: string } | undefined };
}): Theme {
  if (ctx.locals?.theme) return ctx.locals.theme;
  return parseTheme(ctx.cookies.get(THEME_COOKIE)?.value);
}

/**
 * Persist an applied theme. Browser-only. UI actions must call requestTheme()
 * in themeTransition.ts so queued choices cannot overtake an active reveal.
 *
 * Writes both stores: localStorage for this tab's own reads, and the cookie so
 * the *next* server render already knows the answer. Skipping the cookie here
 * is what would bring the flash back on the following page load.
 */
export function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode / storage disabled — the cookie still carries the choice.
  }
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
}
