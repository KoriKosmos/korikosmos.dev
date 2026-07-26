# CLAUDE.md

## Project Overview

Personal portfolio, blog, and games hub at **korikosmos.dev**. Built with Astro 5 (SSR mode) using the Node standalone adapter, with React islands (`@astrojs/react`) for components and interactivity, styled with Tailwind CSS 3 + DaisyUI 5.

## Tech Stack

- **Framework:** Astro 5 (`output: 'server'`, `@astrojs/node` standalone adapter) for routing, SSR data fetching, content collections, and API routes
- **UI:** React 19 via `@astrojs/react` — all component and page-body markup is `.tsx`; Astro `.astro` pages are thin wrappers that fetch data server-side and render a React component with the result as props
- **Styling:** Tailwind CSS 3.3 + DaisyUI 5.5 (5 custom themes: dark, light, forest, spider-man, batman)
- **TypeScript:** Strict mode (`astro/tsconfigs/strict`)
- **Deployment:** Docker (multi-stage build, Node 20 Alpine, port 4321)
- **CMS:** Keystatic (admin at `/keystatic`; schemas in `keystatic.config.ts`). GitHub mode everywhere: edits authenticate via a GitHub App and land as commits (`KEYSTATIC_GITHUB_CLIENT_ID`/`KEYSTATIC_GITHUB_CLIENT_SECRET`/`KEYSTATIC_SECRET` + `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`). In production the admin routes are only built when the client id is present at build time (guard in `astro.config.mjs`; Dockerfile passes it as a build arg). `keystatic.config.ts` is imported by the browser — only `import.meta.env`, never `process.env`. `/admin` 301-redirects to `/keystatic`. `src/middleware.ts` forces the request origin on `/api/keystatic/github/*` routes to the canonical `site` (only in `import.meta.env.PROD`): behind the container's reverse proxy the Node server sees the internal host (`localhost:4321`), so Keystatic would otherwise build `redirect_uri=https://localhost/...` and GitHub rejects the OAuth sign-in. The GitHub App must have both `https://korikosmos.dev/api/keystatic/github/oauth/callback` (prod) and `http://127.0.0.1:4321/api/keystatic/github/oauth/callback` (dev) registered as callback URLs.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run preview` — preview production build locally

## Project Structure

```
src/
├── components/        # Reusable React components (CvSection, ProjectCard, ThemeBar, OnekoToggle)
│                      #   — also the design-sync surface synced to claude.ai/design (see .design-sync/)
├── page-components/   # Page-body React components (one per route), kept separate from src/components/
│                      #   so design-sync's scope doesn't pick up page-specific, non-reusable markup
├── retro-components/  # Web 1.0 skin: a Retro* body per route, plus SkinToggle/RetroChrome and
│                      #   RetroIslandShell.astro. See "The retro skin" below
├── content/       # Content collections (blog posts, projects) as Markdown
│   ├── blog/      # Blog posts with frontmatter: title, description, pubDate
│   └── projects/  # Project entries with frontmatter: title, summary, description, github?
├── data/          # Static data (cv.json) + data shared by BOTH skins (uses.ts, links.ts, now.ts)
├── fonts/         # Vendored Noto Sans TTFs (400 + 800) used by the OG image endpoint
├── layouts/       # Layout.astro — skin dispatcher; ModernLayout.astro (original shell),
│                  #   RetroLayout.astro (Web 1.0 shell)
├── lib/           # Shared utilities
│   ├── constants.ts      # Shared constants (BLOCKED_ITEMS for Last.fm filtering)
│   ├── images.ts         # getBestImage() — shared between server and client code
│   ├── lastfm.ts         # Last.fm API wrapper (server-side, uses env vars)
│   ├── skin.ts           # modern/retro skin cookie + getSkin()/isRetro()
│   ├── guestbook.ts      # guestbook persistence + URL sanitising (server-only)
│   ├── hits.ts           # retro hit counter persistence (server-only)
│   ├── tetris.js         # TetrisGame — vanilla canvas game engine, driven from Tetris.tsx
│   └── rockPaperScissors.ts  # initRockPaperScissors() — imperative game logic, driven from RockPaperScissors.tsx
├── pages/         # File-based routing — .astro files fetch data server-side, render page-components/*.tsx
│   ├── api/       # API routes (lastfm, scores/[game], guestbook, auth callbacks)
│   ├── games/     # Tetris, Rock Paper Scissors
│   ├── og/        # [...route].ts — prerendered OG image endpoint (astro-og-canvas)
│   └── ...        # index, about, cv, portfolio, blog, tunes, now, uses, links, 404
└── styles/        # global.css (Tailwind directives + custom utilities)
                   #   retro.css — the retro skin's whole class vocabulary
public/            # Static assets (favicon.svg, robots.txt, oneko.js)
└── retro/         # Generated retro graphics — see scripts/gen-retro-assets.mjs
data/scores/       # Persistent game leaderboard data (JSON files, written by API)
keystatic.config.ts  # Keystatic CMS schemas (blog, projects collections + cv singleton)
.design-sync/      # Config/notes/previews for syncing src/components/ to a Claude Design project
```

## Key Architecture Decisions

- **Astro for routing/SSR, React for everything rendered:** `.astro` pages do server-side data fetching (content collections, `lastfm.ts`, `cv.json`) and render a `page-components/*.tsx` component with the result as props. Purely presentational components (no interactivity) need no `client:*` directive — Astro renders them to static HTML with zero client JS. Interactive ones (`ThemeBar`, `OnekoToggle`, `Tetris`, `RockPaperScissors`, `Tunes`, `TypingHeading`) use `client:load`.
- **Faithful-port islands, not redesigns:** `Tetris.tsx` and `RockPaperScissors.tsx` wrap pre-existing imperative game logic (`src/lib/tetris.js`'s `TetrisGame` class, `src/lib/rockPaperScissors.ts`'s `initRockPaperScissors()`) inside a single mount `useEffect`, using `document.getElementById` against the JSX-rendered markup exactly as the old inline `<script>` tags did. The game/business logic itself was not rewritten when migrating off Astro scripts.
- **SSR everywhere for page routes:** every route that renders `Layout.astro` is server-rendered. Blog and portfolio `[slug]` pages were prerendered until the retro skin landed; they can't be, because the skin lives in a request cookie a build-time render can't see. `src/pages/og/[...route].ts` is the one remaining prerendered route (request-independent).
- **Theme system:** DaisyUI themes configured in `tailwind.config.mjs` with `data-theme` attribute on `<html>`. Five themes: dark (default), light, forest, spider-man, batman. New themes need an entry in `tailwind.config.mjs`, a critical-background line in `ModernLayout.astro`'s inline `<style>`, a `ThemeBar.tsx` swatch, and a `CommandPalette.tsx` theme action. Custom `--surface` and `--accent-dark` CSS vars extend DaisyUI for specific utilities. `ThemeBar.tsx` reads/writes `data-theme` + `localStorage` directly — no theme provider/context. Theme switching animates via a `startViewTransition` circular reveal (CSS hooks under `html[data-theme-switching]` in `global.css`), with a CSS color-fade fallback (`data-theme-fade`) and instant switch under reduced motion.
- **View transitions / no-FOUC:** `ModernLayout.astro` uses Astro's `<ClientRouter />` for SPA-style navigation. Anti-flash relies on three head pieces: critical inline `<style>` with per-theme `html` backgrounds (correct first paint before the stylesheet loads), an inline script that applies the saved theme pre-paint **and** re-applies it on `astro:after-swap` (the router resets `<html>` attributes on every swap), and page animations in `global.css` (`vt-page-out`/`vt-page-in` on the root group). Header/footer have `transition:name` so they stay static during navigation; `ThemeBar`/`OnekoToggle` use `transition:persist`. The oneko cat is mounted *inside* the persisted OnekoToggle island (oneko.js appends next to its own script tag) so it survives navigations; islands that attach global listeners or rAF loops must clean up on unmount since navigation no longer reloads the page (Tetris does this via `game.running = false` + `removeEventListener`).
- **Layout props:** `Layout.astro` (and both shells behind it) accepts `title`, `description`, `image`, and `isWide` props. Title is auto-formatted as `{title} | KoriKosmos` (homepage uses bare site name).
- **Navigation progress bar:** `NavigationProgress.tsx` (`client:load` + `transition:persist` in `ModernLayout.astro`) shows a slim top bar during ClientRouter navigations, driven by `astro:before-preparation` / `astro:page-load`. A 150ms grace period keeps fast navigations from flashing it; it mainly covers pages with slow SSR fetches (Tunes → Last.fm).
- **Tunes page pattern:** SSR fetches initial data, passed as props to `Tunes.tsx`. React state (not `<script define:vars>`/manual DOM writes) is the source of truth for rendering artists/albums and period switching. Client polls for now-playing updates every 30s via a ref-tracked key to avoid stale-closure bugs.
- **OG / social images:** `src/pages/og/[...route].ts` uses `astro-og-canvas` (prerendered) to generate cards for the site default (`/og/site.png`), every blog post (`/og/blog/<slug>.png`), and every project (`/og/portfolio/<slug>.png`). `Layout.astro` falls back to `/og/site.png` when no `image` prop is passed; blog/portfolio `[slug]` pages pass their generated card. Fonts are vendored in `src/fonts/` so builds don't hit a font CDN; note the 800-weight TTF registers as the separate family `'Noto Sans ExtraBold'`, not as a weight of `'Noto Sans'`. New content collection entries get OG cards automatically.
- **Header nav:** `NAV_ITEMS` in `src/config.ts` mixes plain links and categorised groups (Me / Work / Blog / Tunes / Play); groups render as CSS-only DaisyUI `dropdown-hover` menus in `ModernLayout.astro` (and as a grouped sidebar list in `RetroLayout.astro`) (no JS island), with the brand wordmark linking home and active link/category highlighted server-side from `Astro.url.pathname`.
- **Command palette:** `CommandPalette.tsx` (`client:load` + `transition:persist` in `ModernLayout.astro`) is a hand-rolled ⌘K/Ctrl-K fuzzy launcher (no kbar dependency) over a `<dialog>`. Link items (pages from `NAV_ITEMS`, blog posts, projects) are built server-side in ModernLayout frontmatter; theme actions live in the component. It opens via the shortcut or any `[data-palette-trigger]` element (delegated listener; the visible trigger button lives in `ThemeBar.tsx`, left of the theme swatches) and navigates with `navigate()` from `astro:transitions/client` to keep view transitions.
- **/now and /uses pages:** Indie-web convention pages, in the header nav under the "Me" dropdown. `/now` fetches the latest scrobble via `getRecentTracks(1)` server-side. Both skins render these, so their **data lives in `src/data/`** — `now.ts` (the `NOW_UPDATED` date), `uses.ts` (the `USES` array), `links.ts` (the `LINKS` array). Edit there, not in a component. The prose in the `/now` sections still lives in `NowPage.tsx` / `RetroNowPage.tsx` and has to be edited in both.
- **Constellation background:** `ConstellationField.tsx` (`client:load` + `transition:persist` in `ModernLayout.astro`, so it runs on every page and survives navigations) draws a full-viewport canvas starfield behind the content — stars link into constellations and to the cursor. It samples theme colors from the DOM (body color + a `text-primary` probe, re-sampled via a `data-theme` MutationObserver) and draws one static frame under `prefers-reduced-motion`. It relies on `bg-base-100` living on `<html>` (not `<body>`) so its fixed `-z-10` canvas paints above the page background — don't move that class back. The canvas needs explicit `w-full h-full` (replaced element: `inset-0` alone doesn't stretch it, which misaligns drawing from the cursor at dpr > 1). It stays in `page-components/` (not `components/`) to keep it out of the design-sync surface.
- **Game scores:** Stored as JSON files in `/data/scores/`, accessed via API routes with `async-mutex` for write safety. Leaderboards sync between localStorage and server.
- **Shared code between server and client:** `src/lib/images.ts` and `src/lib/constants.ts` are importable from both Astro frontmatter (server) and React components (client bundles). `src/lib/lastfm.ts` is server-only (uses env vars).
- **design-sync scope:** Only `src/components/` (the 4 reusable components) is synced to Claude Design — `src/page-components/` is deliberately a separate directory so page-specific markup doesn't get pulled into that surface. See `.design-sync/NOTES.md` for sync-specific gotchas (the `node_modules/korikosmos-dev` self-symlink, synth-entry mode, etc.).

## The retro skin (Web 1.0 / webcore mode)

The site ships two skins. `SkinToggle.tsx` (rendered in both shells) writes a `kk-skin` cookie and does a **full** `location.reload()`, never a ClientRouter navigation — the two skins are different documents, so swapping one shell's markup into the other's would break.

- **Skin resolution:** `src/lib/skin.ts` defines the cookie and `getSkin`/`isRetro`. `src/middleware.ts` resolves it into `Astro.locals.skin` before anything renders (and bumps the hit counter there, since setting cookies from layout frontmatter races the streamed response). `App.Locals` is declared in `src/env.d.ts`.
- **Layout dispatch:** `Layout.astro` is now a thin dispatcher that picks `ModernLayout.astro` (the original) or `RetroLayout.astro`. Pages keep importing `Layout.astro` unchanged.
- **Page bodies:** each `.astro` route branches on `isRetro(Astro)` and renders either `page-components/*` or `retro-components/Retro*`. Retro components are a parallel set, not a restyle.
- **No `prerender = true` on any route using `Layout.astro`.** A build-time render has no request, so the cookie is invisible and the toggle silently does nothing. `blog/[slug]` and `portfolio/[slug]` were converted to SSR for this reason (content collections are in-memory at runtime, so it's ~free). `src/pages/og/[...route].ts` stays prerendered — it's request-independent.
- **`src/styles/retro.css` is the single shared vocabulary.** Every retro class is `rt-*` and every rule is scoped under `[data-skin="retro"]`, because `Layout.astro` statically imports both shells and Astro therefore bundles `global.css` (Tailwind + DaisyUI) onto retro pages too. Section 1 is an **un-reset**: Tailwind's Preflight strips list bullets, heading sizes, `hr`/table borders, and inline images — exactly the browser defaults this aesthetic is built from — so they're handed back explicitly. Add primitives centrally here; page components use the vocabulary and inline styles, never their own CSS.
- **Retro sub-themes:** `y2k` (default), `kawaii`, `geocities`, `cyber`, set as `data-retro-theme` on `<html>` from `localStorage` by an inline pre-paint script in `RetroLayout.astro`, switched by `RetroChrome.tsx`. Each needs a var block in `retro.css` §2, a critical-background line in `RetroLayout.astro`, and a swatch in `RetroChrome.tsx`. `RETRO_THEMES`/`DEFAULT_RETRO_THEME` in `src/lib/skin.ts` are the source of truth — the layout's `<html>` attribute and its pre-paint script take them via `define:vars` rather than re-typing them. Changing the default also means moving the bare `[data-skin='retro']` var block in `retro.css` §2 and the bare `html[data-skin="retro"]` critical-background rule, which are the no-attribute fallbacks.
- **No `<ClientRouter />` in the retro shell.** Full page loads are period-accurate and avoid cross-skin swap bugs. Consequence: the chiptune in `RetroChrome.tsx` stops on navigation (a fresh page can't resume audio without a new user gesture) and islands remount every page.
- **The three interactive islands are wrapped, never forked.** `Tetris.tsx`, `RockPaperScissors.tsx`, and `Tunes.tsx` render unchanged inside `RetroIslandShell.astro` and are restyled from outside by `retro.css` §17. Their logic drives the DOM via `document.getElementById` against that exact markup — a retro rewrite would render fine and silently stop working. `RetroIslandShell` is `.astro`, not React, because Astro pre-renders content slotted into a framework component to static HTML, which would strip the island's hydration.
- **Generated graphics:** `scripts/gen-retro-assets.mjs` (`npm run gen:retro`) draws all 35 assets in `public/retro/` — tiles, 88×31 buttons, blinkies, dividers, mascot, cursors — as SVG with animation from CSS embedded in each file (which does run inside an `<img>`). Nothing is downloaded or hotlinked. Output is committed, so the build never runs the script.
- **Guestbook + hit counter:** `src/lib/guestbook.ts` and `src/lib/hits.ts` persist to `data/guestbook.json` / `data/hits.json` with the same mutex + atomic-rename pattern as `data/scores/`. The guestbook `url` field is rendered as an `href`, so `sanitizeUrl()` allowlists `http:`/`https:` only and links get `rel="nofollow ugc noopener"`. **The Dockerfile does not `COPY data/`** — both depend on the same volume mount the game leaderboards already use, and degrade to an in-memory count if the directory isn't writable.
- **Shared page data:** `src/data/uses.ts`, `src/data/links.ts`, and `src/data/now.ts` hold the `/uses` list, `/links` list, and the `/now` "updated" date, because **both** skins render them. Edit the data there, never in a component — a copy in one component updates only one skin. The retro components keep their period flavour (fake window captions, `NEW!` badges) in local lookups keyed by section title/label, so an entry added to the shared data still renders, just without flavour.
- **Accessibility is deliberately not period-accurate:** skip link, real `alt` text, `aria-label`s, and a `prefers-reduced-motion` block in `retro.css` §18 that stops every animation (blink, marquee, rainbow, sparkles). The chiptune defaults to off and only starts from a click. Use the CSS marquee (`.rt-marquee__track`), **not** a real `<marquee>` element — the element scrolls from the browser's layout engine, so no CSS rule can stop it and it keeps moving under reduced motion.
- **Generated-asset gotchas:** graphics with text labels need an opaque plate behind the label — they're drawn on `--rt-panel`, which is near-white in kawaii/y2k and near-black in geocities/cyber, so bare dark text vanishes in half the themes. Keep explanatory comments in `gen-retro-assets.mjs`, not in the emitted SVG: an XML comment may not contain a double hyphen, so a CSS custom property name inside one is a parse error. The script writes in place and prunes stale files rather than deleting `public/retro/`, which would make a running `astro dev` 404 every asset until restarted.

## Environment Variables

- `LASTFM_USER` — Last.fm username for scrobble data
- `LASTFM_API_KEY` — Last.fm API key
- `KEYSTATIC_GITHUB_CLIENT_ID` / `KEYSTATIC_GITHUB_CLIENT_SECRET` / `KEYSTATIC_SECRET` / `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` — Keystatic GitHub mode; client id + public slug are needed at build time (route guard, client inline), all four at runtime. Written to `.env` by the /keystatic setup flow in dev

## Style Guidelines

- Use DaisyUI semantic classes (`bg-base-100`, `text-base-content`, `bg-primary`, `text-primary-content`, etc.) for theme-aware colors
- Use `bg-base-200` for card/surface backgrounds, `bg-base-100` for page background
- Use `from-primary to-secondary` for gradient accents
- The custom `hover:bg-accent-dark` utility is defined in `global.css` for the accent dark hover state
- Button style: `bg-neutral text-neutral-content rounded` for game controls, `bg-primary text-primary-content` for CTAs

## Common Patterns

- Content collections use `getCollection()` and `getEntryBySlug()` from `astro:content`; fetch in `.astro` frontmatter and pass to the page's `page-components/*.tsx` as props (not inside the React component)
- API routes export `APIRoute` type from Astro and return `new Response()`
- Components in `src/components/` and `src/page-components/` export both a named export and `export default <Name>` — `export *` (used by design-sync's synth-entry bundler) does not forward default exports, so the named export must exist for any component that might be synced
- `ProjectCard`'s `project` prop is typed `CollectionEntry<"projects">` (from `astro:content`) for real use in the site. That type isn't resolvable outside Astro's build, so `.design-sync/config.json`'s `dtsPropsFor.ProjectCard` hand-writes an equivalent plain shape for the synced artifact — keep both in sync if the `projects` content schema changes
- Astro `<Content />` (from `entry.render()`) and other Astro-rendered markup can be passed as `children` to a React component from `.astro` templates — Astro pre-renders slotted content to static HTML before handing it to the framework component
- Use `<dialog>` elements for modals instead of `prompt()`/`alert()` for new code — `RockPaperScissors`'s blocking `prompt()` username flow is legacy, preserved as-is during the React port rather than redesigned
- Accessibility: all interactive elements need `aria-label` if text-only isn't descriptive; canvas elements get `role="img"` + `aria-label`
