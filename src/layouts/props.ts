/**
 * The props every page passes to Layout.astro, which forwards them verbatim to
 * whichever shell the skin cookie selects.
 *
 * Declared here rather than in each shell because the dispatcher spreads
 * `{...Astro.props}` into the shell: without a declared type the whole set is
 * implicitly `any`, so a typo in `ogType` would emit a bogus `og:type` and
 * still build clean.
 */
export type OgType = 'website' | 'article';

export interface LayoutProps {
  /** Page title, formatted as `{title} | KoriKosmos` by the shell. */
  title?: string;
  description?: string;
  /** Path to the social card, defaulting to /og/site.png. */
  image?: string;
  /** Modern skin only — the retro shell has one column width. */
  isWide?: boolean;
  ogType?: OgType;
  /** ISO 8601. Only meaningful when `ogType` is `article`. */
  publishedTime?: string;
  modifiedTime?: string;
}
