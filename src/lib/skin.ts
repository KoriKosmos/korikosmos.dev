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

/**
 * Retro sub-themes, mirrored in retro.css as [data-retro-theme="..."].
 * Listed default-first, which is also the order the swatches render in.
 */
export const RETRO_THEMES = ['y2k', 'kawaii', 'geocities', 'cyber'] as const;
export type RetroTheme = (typeof RETRO_THEMES)[number];
/**
 * Changing this means changing four things together, or the page flashes the
 * old default before the pre-paint script runs: this constant, the bare
 * `[data-skin='retro']` var block in retro.css §2 (the no-attribute fallback),
 * the `data-retro-theme` attribute in RetroLayout.astro, and the bare
 * `html[data-skin="retro"]` critical-background rule in that same file.
 */
export const DEFAULT_RETRO_THEME: RetroTheme = 'y2k';

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
