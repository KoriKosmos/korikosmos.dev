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
├── content/       # Content collections (blog posts, projects) as Markdown
│   ├── blog/      # Blog posts with frontmatter: title, description, pubDate
│   └── projects/  # Project entries with frontmatter: title, summary, description, github?
├── data/          # Static data (cv.json)
├── fonts/         # Vendored Noto Sans TTFs (400 + 800) used by the OG image endpoint
├── layouts/       # Layout.astro — single layout with SEO meta, skip link, nav, footer
├── lib/           # Shared utilities
│   ├── constants.ts      # Server+client shared constants/types (Last.fm BLOCKED_ITEMS, guestbook
│   │                     #   length caps + GuestbookEntry, REACTIONS allowlist + ReactionCounts)
│   ├── images.ts         # getBestImage() — shared between server and client code
│   ├── jsonStore.ts      # readJson/updateJson — mutex + atomic write over ./data (server-only)
│   ├── guestbook.ts      # Guestbook store + validateEntry() (server-only)
│   ├── reactions.ts      # Per-post reaction counts (server-only)
│   ├── rateLimit.ts      # getClientKey() + checkRateLimit() for public POST routes (server-only)
│   ├── lastfm.ts         # Last.fm API wrapper (server-side, uses env vars)
│   ├── tetris.js         # TetrisGame — vanilla canvas game engine, driven from Tetris.tsx
│   └── rockPaperScissors.ts  # initRockPaperScissors() — imperative game logic, driven from RockPaperScissors.tsx
├── pages/         # File-based routing — .astro files fetch data server-side, render page-components/*.tsx
│   ├── api/       # API routes (lastfm, scores/[game], guestbook, reactions/[slug], auth callbacks)
│   ├── games/     # Tetris, Rock Paper Scissors
│   ├── og/        # [...route].ts — prerendered OG image endpoint (astro-og-canvas)
│   └── ...        # index (hero + guestbook), about, cv, portfolio, blog, tunes, now, uses, links, 404
└── styles/        # global.css (Tailwind directives + custom utilities)
public/            # Static assets (favicon.svg, robots.txt, oneko.js)
data/scores/       # Persistent game leaderboard data (JSON files, written by API)
data/guestbook.json, data/reactions.json  # Visitor-submitted data, created on first write
keystatic.config.ts  # Keystatic CMS schemas (blog, projects collections + cv singleton)
.design-sync/      # Config/notes/previews for syncing src/components/ to a Claude Design project
```

## Key Architecture Decisions

- **Astro for routing/SSR, React for everything rendered:** `.astro` pages do server-side data fetching (content collections, `lastfm.ts`, `cv.json`) and render a `page-components/*.tsx` component with the result as props. Purely presentational components (no interactivity) need no `client:*` directive — Astro renders them to static HTML with zero client JS. Interactive ones (`ThemeBar`, `OnekoToggle`, `Tetris`, `RockPaperScissors`, `Tunes`, `TypingHeading`) use `client:load`.
- **Faithful-port islands, not redesigns:** `Tetris.tsx` and `RockPaperScissors.tsx` wrap pre-existing imperative game logic (`src/lib/tetris.js`'s `TetrisGame` class, `src/lib/rockPaperScissors.ts`'s `initRockPaperScissors()`) inside a single mount `useEffect`, using `document.getElementById` against the JSX-rendered markup exactly as the old inline `<script>` tags did. The game/business logic itself was not rewritten when migrating off Astro scripts.
- **SSR with selective prerendering:** Most pages are server-rendered. Blog and portfolio `[slug]` pages use `export const prerender = true` with `getStaticPaths()` for static generation.
- **Theme system:** DaisyUI themes configured in `tailwind.config.mjs` with `data-theme` attribute on `<html>`. Five themes: dark (default), light, forest, spider-man, batman. New themes need an entry in `tailwind.config.mjs`, a critical-background line in `Layout.astro`'s inline `<style>`, a `ThemeBar.tsx` swatch, and a `CommandPalette.tsx` theme action. Custom `--surface` and `--accent-dark` CSS vars extend DaisyUI for specific utilities. `ThemeBar.tsx` reads/writes `data-theme` + `localStorage` directly — no theme provider/context. Theme switching animates via a `startViewTransition` circular reveal (CSS hooks under `html[data-theme-switching]` in `global.css`), with a CSS color-fade fallback (`data-theme-fade`) and instant switch under reduced motion.
- **View transitions / no-FOUC:** `Layout.astro` uses Astro's `<ClientRouter />` for SPA-style navigation. Anti-flash relies on three head pieces: critical inline `<style>` with per-theme `html` backgrounds (correct first paint before the stylesheet loads), an inline script that applies the saved theme pre-paint **and** re-applies it on `astro:after-swap` (the router resets `<html>` attributes on every swap), and page animations in `global.css` (`vt-page-out`/`vt-page-in` on the root group). Header/footer have `transition:name` so they stay static during navigation; `ThemeBar`/`OnekoToggle` use `transition:persist`. The oneko cat is mounted *inside* the persisted OnekoToggle island (oneko.js appends next to its own script tag) so it survives navigations; islands that attach global listeners or rAF loops must clean up on unmount since navigation no longer reloads the page (Tetris does this via `game.running = false` + `removeEventListener`).
- **Layout props:** `Layout.astro` accepts `title`, `description`, `image`, and `isWide` props. Title is auto-formatted as `{title} | KoriKosmos` (homepage uses bare site name).
- **Navigation progress bar:** `NavigationProgress.tsx` (`client:load` + `transition:persist` in `Layout.astro`) shows a slim top bar during ClientRouter navigations, driven by `astro:before-preparation` / `astro:page-load`. A 150ms grace period keeps fast navigations from flashing it; it mainly covers pages with slow SSR fetches (Tunes → Last.fm).
- **Tunes page pattern:** SSR fetches initial data, passed as props to `Tunes.tsx`. React state (not `<script define:vars>`/manual DOM writes) is the source of truth for rendering artists/albums and period switching. Client polls for now-playing updates every 30s via a ref-tracked key to avoid stale-closure bugs.
- **OG / social images:** `src/pages/og/[...route].ts` uses `astro-og-canvas` (prerendered) to generate cards for the site default (`/og/site.png`), every blog post (`/og/blog/<slug>.png`), and every project (`/og/portfolio/<slug>.png`). `Layout.astro` falls back to `/og/site.png` when no `image` prop is passed; blog/portfolio `[slug]` pages pass their generated card. Fonts are vendored in `src/fonts/` so builds don't hit a font CDN; note the 800-weight TTF registers as the separate family `'Noto Sans ExtraBold'`, not as a weight of `'Noto Sans'`. New content collection entries get OG cards automatically.
- **Header nav:** `NAV_ITEMS` in `src/config.ts` mixes plain links and categorised groups (Me / Work / Blog / Tunes / Play); groups render as CSS-only DaisyUI `dropdown-hover` menus in `Layout.astro` (no JS island), with the brand wordmark linking home and active link/category highlighted server-side from `Astro.url.pathname`.
- **Command palette:** `CommandPalette.tsx` (`client:load` + `transition:persist` in `Layout.astro`) is a hand-rolled ⌘K/Ctrl-K fuzzy launcher (no kbar dependency) over a `<dialog>`. Link items (pages from `NAV_ITEMS`, blog posts, projects) are built server-side in Layout frontmatter; theme actions live in the component. It opens via the shortcut or any `[data-palette-trigger]` element (delegated listener; the visible trigger button lives in `ThemeBar.tsx`, left of the theme swatches) and navigates with `navigate()` from `astro:transitions/client` to keep view transitions.
- **/now and /uses pages:** Indie-web convention pages, in the header nav under the "Me" dropdown. `/now` fetches the latest scrobble via `getRecentTracks(1)` server-side; its editable content (and the `NOW_UPDATED` date) lives in `NowPage.tsx`. `/uses` is fully static with a data-driven `USES` array in `UsesPage.tsx`.
- **Constellation background:** `ConstellationField.tsx` (`client:load` + `transition:persist` in `Layout.astro`, so it runs on every page and survives navigations) draws a full-viewport canvas starfield behind the content — stars link into constellations and to the cursor. It samples theme colors from the DOM (body color + a `text-primary` probe, re-sampled via a `data-theme` MutationObserver) and draws one static frame under `prefers-reduced-motion`. It relies on `bg-base-100` living on `<html>` (not `<body>`) so its fixed `-z-10` canvas paints above the page background — don't move that class back. The canvas needs explicit `w-full h-full` (replaced element: `inset-0` alone doesn't stretch it, which misaligns drawing from the cursor at dpr > 1). It stays in `page-components/` (not `components/`) to keep it out of the design-sync surface.
- **Game scores:** Stored as JSON files in `/data/scores/`, accessed via API routes with `async-mutex` for write safety. Leaderboards sync between localStorage and server.
- **Guestbook and post reactions:** Two public write surfaces sharing `src/lib/jsonStore.ts` (per-file mutex + `tmp`/`rename` atomic write over `./data`, the docker-compose volume mount). The guestbook is a section of the **homepage** (`id="guestbook"`, hence the `/#guestbook` nav entry) rather than its own route — `index.astro` imports `getEntries()` **directly** rather than fetching its own `/api/guestbook`, since an SSR self-fetch would hit the container's internal origin, not the canonical one (the same class of problem `src/middleware.ts` documents). `TypingHeading` owns the homepage `h1`, so `GuestbookPage` starts at `h2`. Blog `[slug]` pages are prerendered, so `PostReactions.tsx` instead fetches counts on mount; its buttons toggle (POST to add, DELETE to take back) and counts floor at zero, because the per-browser localStorage guard can't stop a removal that has no matching addition. Every reader tolerates a missing file and returns empty — the data files don't exist until the first write. Note that a committed `data/*.json` never reaches production: the Dockerfile's runner stage copies only `dist` + `node_modules`, and compose mounts a volume over `/app/data`, so the deployed files live solely in that volume (the same reason the committed `data/scores/*.json` doesn't seed anything). Pull real data with `docker compose cp web:/app/data/<file> data/<file>`; committing a local dev run instead just captures test entries.
- **Public POST hardening:** Guestbook writes are gated by a honeypot field (`website`, off-screen; a filled one returns 200 without storing so bots have nothing to retry), length caps, whitespace collapsing, http(s)-only URL normalisation, and a 30s per-client cooldown; reactions are gated by a fixed emoji allowlist, a slug checked against the blog collection (so `data/reactions.json` can't grow unbounded keys), and a 1s cooldown. `getClientKey()` reads `x-forwarded-for` before `clientAddress`, because behind the proxy `clientAddress` is the same loopback address for every visitor — if the proxy doesn't set the header, the limit degrades to one global bucket, which is why the windows are deliberately short. Rate-limit state is in-memory (single container, safe to lose on restart).
- **Shared code between server and client:** `src/lib/images.ts` and `src/lib/constants.ts` are importable from both Astro frontmatter (server) and React components (client bundles). `src/lib/lastfm.ts` is server-only (uses env vars). Guestbook/reaction constants and types live in `constants.ts` rather than beside their stores precisely because the islands import them — importing from `guestbook.ts`/`reactions.ts` would pull `jsonStore.ts` and `node:fs` into the browser bundle.
- **design-sync scope:** Only `src/components/` (the 4 reusable components) is synced to Claude Design — `src/page-components/` is deliberately a separate directory so page-specific markup doesn't get pulled into that surface. See `.design-sync/NOTES.md` for sync-specific gotchas (the `node_modules/korikosmos-dev` self-symlink, synth-entry mode, etc.).

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
