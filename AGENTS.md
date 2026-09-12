# Development Guidelines

This project contains the source for **korikosmos.dev**, a personal portfolio, blog, and games hub built with [Astro](https://astro.build/) 5 (SSR mode), styled with Tailwind CSS 3 + DaisyUI 4.

## Tech Stack

- **Framework:** Astro 5 (`output: 'server'`, `@astrojs/node` standalone adapter)
- **UI:** React 19 via `@astrojs/react` — `.astro` pages fetch data server-side and render a `.tsx` body component
- **Styling:** Tailwind CSS 3.3 + DaisyUI 4.12 (5 custom themes: dark, light, forest, spider-man, batman) for the modern skin; `src/styles/retro.css` for the retro one
- **TypeScript:** Strict mode (`astro/tsconfigs/strict`)
- **Deployment:** Docker (multi-stage build, Node 20 Alpine, port 4321)
- **CMS:** Keystatic (admin at `/keystatic`, GitHub mode; `/admin` redirects there)

## Site Structure & Objectives

- `src/pages/index.astro` – Landing page with a short greeting and link to the portfolio.
- `src/pages/about.astro` – Short biography using card styling.
- `src/pages/cv.astro` – Full curriculum vitae including education, skills and work history.
- `src/pages/portfolio.astro` – Lists projects from `src/content/projects`.
- `src/pages/portfolio/[slug].astro` – Individual project pages (SSR — see the skin note below).
- `src/pages/blog/` – Blog posts generated from Markdown content.
- `src/pages/blog/[slug].astro` – Individual blog post pages (SSR — see the skin note below).
- `src/pages/tunes.astro` – Displays recent Last.fm tracks, top artists and albums. SSR fetches initial data, client JS renders and polls for updates every 30s.
- `src/pages/games/index.astro` – Games listing page.
- `src/pages/games/tetris.astro` – Tetris game with SRS rotation, hold, and leaderboards.
- `src/pages/games/rock-paper-scissors.astro` – Rock Paper Scissors game with leaderboards.
- `src/pages/404.astro` – Custom 404 page.
- `src/pages/guestbook.astro` – My guestbook. Both skins render it, backed by `src/lib/guestbook.ts` and `POST /api/guestbook`.
- `src/pages/now.astro`, `uses.astro`, `links.astro` – Indie-web convention pages. Their data lives in `src/data/` so both skins share it.
- `src/layouts/Layout.astro` – Thin dispatcher: picks `ModernLayout.astro` or `RetroLayout.astro` from the resolved skin. Accepts `title`, `description`, `image`, and `isWide` props.
- `src/layouts/ModernLayout.astro` – The normal shell: SEO meta, skip link, nav, theme switcher, oneko toggle, command palette, `<ClientRouter />`, footer.
- `src/layouts/RetroLayout.astro` – The Web 1.0 shell: table layout, badge sidebars, marquee, hit counter, webring. No `<ClientRouter />`.
- `src/config.ts` – Centralized site config and navigation links.
- `src/content/` – Markdown content managed via Decap CMS at `/admin`.

## Project Structure

```
src/
├── components/    # Reusable React components (CvSection, ProjectCard, ThemeBar, OnekoToggle)
│                  #   — also the design-sync surface synced to claude.ai/design
├── page-components/   # One React body component per route, kept out of the design-sync scope
├── retro-components/  # Web 1.0 skin: a Retro* body per route, plus SkinToggle/RetroChrome
├── content/       # Content collections (blog posts, projects) as Markdown
│   ├── blog/      # Blog posts with frontmatter: title, description, pubDate
│   └── projects/  # Project entries with frontmatter: title, summary, description, github?
├── data/          # Static data (cv.json) + data shared by BOTH skins (uses.ts, links.ts, now.ts)
├── layouts/       # Layout.astro (skin dispatcher), ModernLayout.astro, RetroLayout.astro
├── lib/           # Shared utilities
│   ├── constants.ts  # Shared constants (BLOCKED_ITEMS for Last.fm filtering)
│   ├── images.ts     # getBestImage() — shared between server and client code
│   ├── lastfm.ts     # Last.fm API wrapper (server-side, uses env vars)
│   ├── skin.ts       # modern/retro skin cookie + getSkin()/isRetro()
│   ├── guestbook.ts  # guestbook persistence + URL sanitising (server-only)
│   ├── hits.ts       # retro hit counter persistence (server-only)
│   ├── rateLimit.ts  # in-process sliding-window limiter (guestbook, reactions)
│   ├── sameOrigin.ts # same-origin guard shared by the public write endpoints
│   ├── jsonStore.ts  # read/lock/atomic-write helper for the small data/ JSON files
│   └── tetris.js     # Tetris game engine (decoupled from UI)
├── middleware.ts  # Keystatic OAuth origin fix + skin resolution + hit counter
├── pages/         # File-based routing
│   ├── api/       # API routes (lastfm, scores/[game], guestbook, auth callbacks)
│   ├── games/     # Tetris, Rock Paper Scissors
│   ├── og/        # [...route].ts — prerendered OG image endpoint
│   └── ...        # index, about, cv, portfolio, blog, tunes, now, uses, links, guestbook, 404
├── styles/        # global.css (Tailwind + custom utilities), retro.css (the whole rt-* vocabulary)
└── config.ts      # Centralized site config & navigation
public/            # Static assets (favicon.svg, robots.txt, oneko.js)
└── retro/         # Generated retro graphics — `npm run gen:retro`, output is committed
data/scores/       # Persistent game leaderboard data (JSON files, written by API)
data/guestbook.json, data/hits.json  # Guestbook + hit counter, same volume mount as scores
```

## Key Architecture Decisions

- **Two skins, one site:** I ship a normal modern skin and a Web 1.0 "retro" skin. Which one renders is a `kk-skin` cookie, resolved in `src/middleware.ts` into `Astro.locals.skin` before anything renders. `Layout.astro` dispatches to `ModernLayout.astro` or `RetroLayout.astro`, and each route branches on `isRetro(Astro)` to render either a `page-components/*` or a `retro-components/Retro*` body. See "The retro skin" below.
- **No `prerender = true` on any route that uses `Layout.astro`:** a build-time render has no request, so the cookie is invisible and the skin toggle silently does nothing. That is why blog and portfolio `[slug]` pages are now SSR — content collections are in memory at runtime, so it costs nothing. `src/pages/og/[...route].ts` stays prerendered because it is request-independent.
- **Sitemap:** because those slug routes are no longer prerendered, `@astrojs/sitemap` cannot discover them. `astro.config.mjs` feeds them back in via `customPages`, derived from the filenames in `src/content/`. If I ever override `slug` in frontmatter, that helper has to read frontmatter instead.
- **Theme system:** DaisyUI themes configured in `tailwind.config.mjs` with `data-theme` attribute on `<html>`. Five themes: dark (default), light, forest, spider-man, batman. Custom `--surface` and `--accent-dark` CSS vars extend DaisyUI for specific utilities. The retro skin has its own four sub-themes (`data-retro-theme`), unrelated to these.
- **Tunes page pattern:** SSR fetches initial data, passes to client via `<script define:vars>`. Client JS is the single source of truth for rendering artists/albums (avoids template duplication). Client polls for now-playing updates every 30s.
- **Game scores:** Stored as JSON files in `/data/scores/`, accessed via API routes with `async-mutex` for write safety. Leaderboards sync between localStorage and server.
- **Guestbook + hit counter:** `src/lib/guestbook.ts` and `src/lib/hits.ts` use the same mutex + write-temp-then-rename pattern as the scores, writing `data/guestbook.json` and `data/hits.json`. The Dockerfile does not `COPY data/` — both rely on the volume mount the leaderboards already use, and degrade gracefully if it is not writable.
- **Anything unauthenticated that writes needs abuse controls:** `POST /api/guestbook` and the reaction endpoints are same-origin only (`isSameOrigin()` compares `Origin` against `site`, never `Astro.url.origin`, which is the internal proxy host in production), body-capped, and rate limited via `lib/rateLimit.ts`. The control that actually matters for the guestbook is structural: `signGuestbook()` **rejects** when the book is full instead of evicting the oldest entry, so no volume of spam can destroy a real signature. Rate limiting alone would not have closed that — the key is best-effort and resets on restart.
- **Shared code between server and client:** `src/lib/images.ts` and `src/lib/constants.ts` are importable from both Astro frontmatter (server) and `<script>` tags (client bundles). `src/lib/lastfm.ts` is server-only (uses env vars).
- **Content Collections**: Use `getCollection()` and `getEntry()` from `astro:content` — *not* `getEntryBySlug()`, which is deprecated and throws for these collections instead of returning undefined, so a miss branch written after it never runs and an unknown slug 500s. A dynamic route that misses should `return Astro.rewrite('/404')` so the visitor gets the real 404 page, in whichever skin, with a 404 status.
- **API routes**: Export `APIRoute` type from Astro and return `new Response()`.
- **Modals**: Use `<dialog>` elements instead of `prompt()`/`alert()`.
- **Accessibility**: All interactive elements need `aria-label` if text-only isn't descriptive; canvas elements get `role="img"` + `aria-label`.

## The retro skin (Web 1.0 / webcore mode)

The whole point is that this is a *different site*, not a restyle — the layout, the chrome, and the page bodies are all separate. `SkinToggle.tsx` writes the `kk-skin` cookie and does a full `location.reload()`, never a ClientRouter navigation, because the two skins are different documents.

- **`src/styles/retro.css` is the single shared vocabulary.** Every class is `rt-*` and every rule is scoped under `[data-skin="retro"]`, because `Layout.astro` statically imports both shells so Astro bundles `global.css` (Tailwind + DaisyUI) onto retro pages too. Section 1 is a deliberate **un-reset**: Tailwind's Preflight strips list bullets, heading sizes, `hr`/table borders and inline images — exactly the browser defaults this aesthetic is built from — so they are handed back, wrapped in `:where()` so the `rt-*` classes still win. Add primitives here centrally; page components use the vocabulary plus inline styles, never their own CSS.
- **Colour goes through variables, never literals.** Section 2 defines each sub-theme (`kawaii`, `geocities`, `cyber`, `y2k`), including the *derived* inks: `--rt-on-accent` / `--rt-on-accent-2` for text sitting on an accent, `--rt-link-hover-ink`, `--rt-focus`, `--rt-heading-ink`, and a per-theme `--rt-rainbow` ramp. Those exist because a single hard-coded `#ffffff` or a reused `--rt-accent` is legible in two themes and invisible in the other two — white on geocities' yellow is 1.07:1. A new sub-theme needs a full var block, a critical-background line in `RetroLayout.astro`, and a swatch in `RetroChrome.tsx`.
- **No `<ClientRouter />` in the retro shell.** Full page loads are period-accurate and avoid cross-skin swap bugs. The consequence is that the chiptune stops on navigation and islands remount every page.
- **The interactive islands are wrapped, never forked.** `Tetris.tsx`, `RockPaperScissors.tsx` and `Tunes.tsx` render unchanged inside `RetroIslandShell.astro` and are restyled from outside by retro.css §17. Their logic drives the DOM through `document.getElementById` against that exact markup, so a retro rewrite would render fine and silently stop working. `RetroIslandShell` is `.astro` rather than React because Astro pre-renders content slotted into a framework component to static HTML, stripping the island's hydration.
- **Graphics are generated, never hotlinked.** `scripts/gen-retro-assets.mjs` (`npm run gen:retro`) draws every asset in `public/retro/` as SVG with its animation CSS embedded in the file — external CSS does not apply inside an `<img>`. Output is committed so the build never runs the script. Two traps: an `<img>` is a separate document, so the page's `prefers-reduced-motion` cannot reach inside it and each file needs its own media query; and an XML comment may not contain a double hyphen, so a CSS custom property name inside emitted SVG is a parse error.
- **Data that both skins render lives in `src/data/`.** `uses.ts`, `links.ts`, `now.ts`. Editing a copy inside one component updates only one skin. The retro components keep their period flavour (fake window captions, `NEW!` badges) in local lookups keyed by title/label, so a new entry still renders, just without flavour.
- **Accessibility is deliberately not period-accurate.** Skip link, real `alt` text, `aria-label`s, and a reduced-motion block in §18 that stops every animation. Use the CSS marquee (`.rt-marquee__track`), never a real `<marquee>` — the element scrolls from the browser's layout engine, so no CSS rule can stop it. The chiptune defaults to off and only starts from a click.
- **`SkinToggle.tsx` lives in `retro-components/` even though both shells use it.** `src/components/` is the design-sync surface (`.design-sync/config.json` globs that whole directory), and a control whose entire job is to set a cookie and reload the page is meaningless in a design tool — syncing it would also drag `src/lib/skin.ts` into that bundle.

## Getting Started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and provide your Last.fm credentials.
3. Use `npm run dev` to start the local dev server.
4. Run `npm run build` to generate the production build before committing.

## Useful Commands

- `npm run dev` – start development server at `localhost:4321`.
- `npm run build` – build to `dist/`.
- `npm run check` – I check TypeScript and checked JavaScript without emitting files. This does not type-check `.astro` templates, so I also run the build and production-render checks.
- `npm test` – run my focused regression checks with Node's test runner via `tsx` (Node 20 compatible).
- `npm run test:render` – after a build, I check real production responses in both skins without starting a server. React interaction checks use JSDOM and do not replace a visual browser pass.
- `npm run preview` – preview the production build locally.
- `docker compose up --build` – build and run in container (maps port 8484 → 4321).

## Environment Variables

Required in `.env`:
- `LASTFM_USER` – Last.fm username for scrobble data
- `LASTFM_API_KEY` – Last.fm API key

For Decap CMS OAuth:
- `OAUTH_CLIENT_ID` – GitHub OAuth app client ID
- `OAUTH_CLIENT_SECRET` – GitHub OAuth app client secret

## Style Guidelines

- Use DaisyUI semantic classes (`bg-base-100`, `text-base-content`, `bg-primary`, `text-primary-content`, etc.) for theme-aware colors
- Use `bg-base-200` for card/surface backgrounds, `bg-base-100` for page background
- Use `from-primary to-secondary` for gradient accents
- The custom `hover:bg-accent-dark` utility is defined in `global.css` for the accent dark hover state
- Button style: `bg-neutral text-neutral-content rounded` for game controls, `bg-primary text-primary-content` for CTAs

## Contributing

- Follow the existing coding style (two-space indentation, semicolons in JS/TS).
- Whenever you make a change, add or modify this AGENTS.md file to enhance future updates, refactors and usability. Whether this is instructions, best habits, etc.
- Whenever a change is made, keep a list of notes at the bottom of this AGENTS.md file that tracks the more "qualitative" wants of the user/client, such as themes, experiences, etc.
- Keep commits focused and write a short imperative subject line (e.g. `Fix navbar links`).
- I run `npm run check`, `npm test`, `npm run build` and `npm run test:render` before committing.
- New pages go in `src/pages`, and reusable pieces belong in `src/components`.
- Never apply a "codex" label to PRs; omit ChatGPT chat links.
- Write documentation in first-person voice, from my perspective.
- Keep `README.md` in sync with features.
- GitHub Copilot instructions are configured in `.github/copilot-instructions.md`.

## Notes
- I give each Star Pairs start a new round identifier and include it in the clock effect's dependencies. The interval resets on New game, including during active play, but does not restart on card flips. I check the first full second after a restart and the time saved with a completed personal best.
- I derive the retro blog's newest post from the full collection in its Astro route and pass it separately from filtered results. The NEW! badge, modem caption, update date and entry total describe the whole blog, so filtering and sorting cannot make an old post look newly published.
- I retain Tunes chart data by period, including SSR results. Artist and album refreshes settle independently, so one failure cannot discard the other chart; retries request only failed sections. I show an unavailable message only for a failed section with no retained data, and never reuse another period's chart under the active label.
- I use `trackArtistName` for recent-track artist credits in duplicate filtering, Tunes and `/now`. It prefers `#text`, falling back to `name` when the former is missing or empty, so songs with the same title by different artists remain separate.
- I keep strict TypeScript checks clean alongside the build. Canvas and typing callbacks are initialised after the DOM guards so they retain non-null types; persisted hit-counter JSON starts as `unknown` and is narrowed before use. This keeps my homepage effects and visitor counter working without weakening strict mode.
- I load Tunes periods on demand instead of prefetching every chart. The active period owns its abortable request so slower responses cannot overwrite a newer selection. Live polling refreshes the whole recent list, updates playback even when the track name is unchanged, pauses in hidden tabs, and removes its timers/listeners on navigation. Missing cover art uses my local record illustration.
- I share successful Last.fm requests across visitors, with a bounded cache and in-flight coalescing. Recent tracks expire after 15 seconds; charts after 15 minutes. I keep a five-second upstream timeout, validate public query parameters, return uncached 503s for outages, and let `/now` and `/tunes` render with empty music data when Last.fm is unavailable. I never log URLs containing my API key.
- I added Star Pairs as a gentle cosmic memory game with three board sizes. Both skins wrap the same island, and the pure rules live in `src/lib/starPairs.ts`. I keep its scores on the visitor's device, pause when the tab is hidden, and support arrow keys plus Enter/Space. I never randomise the SSR board; it is dealt after Start to avoid hydration mismatches.
- I give readers a table of contents from Astro's rendered heading slugs, an estimated reading time, and optional progress/copy tools in both skins. I keep article bodies static; `ReadingTools` only adds controls and cleans up its observers, scroll listener and injected code buttons on navigation.
- I want my blog and portfolio to be easy to explore in either skin. Search and sorting live in URL query parameters and work without JavaScript; `src/lib/contentDiscovery.ts` owns filtering and ordering, so page components must preserve the supplied order. I keep full Markdown bodies on the server instead of shipping a search index to every visitor.
- Tunes page normalizes track names to filter out duplicates across different language credits.
- Cat toggle persists across pages so Oneko can follow you site-wide.
- Theme bar allows switching between "dark", "light", and "forest" themes using a fixed selector on every page.
- Portfolio includes pages for my Final Year Project and Year 2 Java calculator.
- Games page lists playable Tetris and Rock Paper Scissors subpages.
- Tetris game supports on-screen mobile controls for touch devices.
- Tetris shows the next piece and lets me hold one with C or Shift.
- The site has a "webcore mode" toggle: one click swaps the whole thing for a Web 1.0 personal homepage — tiled backgrounds, 88x31 buttons, blinkies, a marquee, a real hit counter, a webring, a waving cat mascot, and a guestbook. It is meant to feel like a different site I made in 2003, not like a theme.
- Retro mode has four moods of its own: y2k (chrome and Windows blue, the default), kawaii (pink), geocities (starfield on navy), and cyber (green-on-black terminal).
- Every retro graphic is drawn by `npm run gen:retro` rather than downloaded, so nothing is hotlinked from a dead GeoCities mirror.
- The guestbook is real and persistent, and it is the one thing I most want people to actually use.
- The nostalgia stops at accessibility: reduced motion silences everything that blinks, scrolls, sparkles or rainbows, the chiptune never autoplays, and every sub-theme is checked for WCAG contrast rather than eyeballed.
- Tetris game uses a standard seven-piece grab bag for spawning tetrominoes.
- Tetris uses the official Super Rotation System (SRS) for piece rotation.
- Tetris next-piece preview reflects the grab bag and held pieces keep their type so they rotate correctly.
- Tetris mobile controls include hold and counter-clockwise rotation buttons.
- Piece speed scales with level and the HUD shows the current level.
- Pieces have a lock delay so I can slide them before they settle.
- Tetris saves high scores and shows leaderboards synced between localStorage and server.
- Tetris scoring follows the official guidelines with soft and hard drop bonuses.
- Rock Paper Scissors game with scores synced to server leaderboard.
