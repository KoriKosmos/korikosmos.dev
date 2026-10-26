/**
 * Skin selection ("modern", "retro", or "mandy").
 *
 * The retro and Mandy skins are *structurally* different documents — table layout,
 * sidebars, marquees, hit counter — not a recolour, so the choice has to be
 * made server-side before rendering. It lives in a cookie that `middleware.ts`
 * reads into `locals.skin`; every `.astro` page branches on `getSkin(Astro)`
 * to pick which page-component to render, and `Layout.astro` dispatches to
 * `ModernLayout`, `RetroLayout`, or `MandyLayout` for the shell.
 *
 * Consequence: routes that need the toggle cannot be `prerender = true` —
 * there's no request at build time, so the cookie would never be seen.
 */

export type Skin = 'modern' | 'retro' | 'mandy';

export const SKIN_COOKIE = 'kk-skin';
/**
 * What a visitor with no kk-skin cookie gets. Mandy mode since it shipped; the
 * modern skin is one click away in the SkinToggle dock.
 */
export const DEFAULT_SKIN: Skin = 'mandy';

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

/**
 * Mandy mode's sub-themes, one per fandom, mirrored in mandy.css as
 * [data-theme="mandy-..."] token blocks and in tailwind.config.mjs as DaisyUI
 * themes of the same name (so the wrapped islands pick up the palette too).
 * Listed default-first.
 *
 * Unlike the retro sub-theme this is cookie-backed and rendered server-side
 * onto <html>, for the same reason the modern theme is: a pre-paint script is
 * not guaranteed to run before paint (see src/lib/theme.ts).
 */
export const MANDY_THEMES = ['gotham', 'basement', 'kanto', 'inkwell'] as const;
export type MandyTheme = (typeof MANDY_THEMES)[number];
/** Changing this also means moving the bare critical-background rule in MandyLayout.astro. */
export const DEFAULT_MANDY_THEME: MandyTheme = 'gotham';
export const MANDY_THEME_COOKIE = 'kk-mandy-theme';

export function parseMandyTheme(value: string | undefined | null): MandyTheme {
  return (MANDY_THEMES as readonly string[]).includes(value ?? '') ? (value as MandyTheme) : DEFAULT_MANDY_THEME;
}

export function parseSkin(value: string | undefined | null): Skin {
  // 'modern' must be listed explicitly: it is no longer the fallback, so a
  // visitor who chose it would otherwise be bounced back to the default.
  return value === 'modern' || value === 'retro' || value === 'mandy' ? value : DEFAULT_SKIN;
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

export function isMandy(ctx: Parameters<typeof getSkin>[0]): boolean {
  return getSkin(ctx) === 'mandy';
}
