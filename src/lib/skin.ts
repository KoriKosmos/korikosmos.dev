/**
 * Skin selection ("modern" vs "retro").
 *
 * The retro skin is a *structurally* different document — table layout,
 * sidebars, marquees, hit counter — not a recolour, so the choice has to be
 * made server-side before rendering. It lives in a cookie that `middleware.ts`
 * reads into `locals.skin`; every `.astro` page branches on `getSkin(Astro)`
 * to pick which page-component to render, and `Layout.astro` dispatches to
 * `ModernLayout` or `RetroLayout` for the shell.
 *
 * Consequence: routes that need the toggle cannot be `prerender = true` —
 * there's no request at build time, so the cookie would never be seen.
 */

export type Skin = 'modern' | 'retro';

export const SKIN_COOKIE = 'kk-skin';
export const DEFAULT_SKIN: Skin = 'modern';

/** Retro sub-themes, mirrored in retro.css as [data-retro-theme="..."]. */
export const RETRO_THEMES = ['kawaii', 'geocities', 'cyber', 'y2k'] as const;
export type RetroTheme = (typeof RETRO_THEMES)[number];
export const DEFAULT_RETRO_THEME: RetroTheme = 'kawaii';

export function parseSkin(value: string | undefined | null): Skin {
  return value === 'retro' ? 'retro' : DEFAULT_SKIN;
}

/**
 * Read the active skin for this request. Prefers `locals` (set by middleware)
 * and falls back to the cookie so the helper still works if middleware is
 * bypassed.
 */
export function getSkin(ctx: {
  locals: App.Locals;
  cookies: { get(name: string): { value: string } | undefined };
}): Skin {
  if (ctx.locals?.skin) return ctx.locals.skin;
  return parseSkin(ctx.cookies.get(SKIN_COOKIE)?.value);
}

export function isRetro(ctx: Parameters<typeof getSkin>[0]): boolean {
  return getSkin(ctx) === 'retro';
}
