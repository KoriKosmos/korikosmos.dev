# Copilot Instructions for korikosmos.dev

## Project Overview

Personal portfolio, blog, and games hub at **korikosmos.dev**, with three switchable skins: Mandy mode (my default), the modern skin, and a Web 1.0 "retro" skin. Built with Astro 5 (SSR mode) using the Node standalone adapter and React 19 islands (`@astrojs/react`), styled with Tailwind CSS 3 + DaisyUI 4.

For full architectural details, always consult `AGENTS.md` and `CLAUDE.md` in the repository root.

## Tech Stack

- **Framework:** Astro 5 (`output: 'server'`, `@astrojs/node` standalone adapter)
- **UI:** React 19 via `@astrojs/react` — `.astro` pages fetch data server-side and render a `.tsx` body component for the active skin (`mandy-components/Mandy*`, `page-components/*`, or `retro-components/Retro*`)
- **Styling:** Tailwind CSS 3.3 + DaisyUI 4.12 (5 custom themes: `dark`, `light`, `forest`, `spider-man`, `batman` for the modern skin; `src/styles/retro.css` (`rt-*`) for the retro skin; `src/styles/mandy.css` (`md-*`) plus four `mandy-*` DaisyUI themes for Mandy mode)
- **TypeScript:** Strict mode (`astro/tsconfigs/strict`)
- **Deployment:** Docker (multi-stage build, Node 22 Alpine, port 4321); the final image installs only `dependencies`, so build-only packages (Tailwind, Fontsource, `canvaskit-wasm`, test tooling) go in `devDependencies`
- **CMS:** Keystatic (admin at `/keystatic`, GitHub mode; schemas in `keystatic.config.ts`; `/admin` 301-redirects there)
- **Key Features:**
  - Three parallel skins resolved via `kk-skin` cookie in `src/middleware.ts` (`mandy` default, `modern`, `retro`)
  - Last.fm integration (server-side proxy at `/api/lastfm` with bounded cache + request coalescing, and a stale fallback after a 750ms deadline so a slow Last.fm never stalls `/tunes` or `/now`)
  - Live heart rate from Health Display with a Pulsoid fallback (`/api/heartrate`, footer pill, `/about` ECG card with today's stats and a seven-day sparkline from `/api/vitals`, draggable floating Vitals window)
  - Interactive games (Guideline Tetris with a pure, tested engine in `src/lib/tetris.ts`, Rock Paper Scissors, Star Pairs constellation memory game), each with a seeded daily challenge (`src/lib/daily.ts`), wrapped in `MandyIslandShell.astro` and `RetroIslandShell.astro` without forking
  - Persistent guestbook (`/guestbook`), per-post emoji reactions, per-post comments (display name only, no account), and retro hit counter with same-origin, body-cap, and rate-limit guards
  - URL-driven blog & portfolio search/filtering (`src/lib/contentDiscovery.ts`) and blog reading tools (`src/lib/reading.ts`, `ReadingTools.tsx`)
  - Prerendered Open Graph cards in Mandy mode's gotham style, one per page (`src/pages/og/[...route].ts`, `src/lib/ogCard.ts`, `src/data/pageMeta.ts`, `src/layouts/SeoHead.astro`)
  - RSS feed (newest first, advertised in every skin's head) and `h-entry` microformats on posts
  - Prerendered `/content-index.json` (posts + projects) that Mandy's nav search and the modern ⌘K palette fetch on first use, instead of embedding it in every page

## Code Style Guidelines

- **Indentation**: Use 2 spaces (no tabs)
- **JavaScript/TypeScript**: Always use semicolons
- **Voice**: Write documentation in first-person perspective
- **Commits**: Use imperative mood (e.g., "Fix navbar links")
- **File Organization**:
  - Pages go in `src/pages/`
  - Reusable modern components in `src/components/` (design-sync surface — export both named and default)
  - Modern page bodies and shared interactive islands in `src/page-components/`
  - Mandy mode components in `src/mandy-components/`
  - Web 1.0 retro components in `src/retro-components/`
  - Game engines and shared logic in `src/lib/`
  - Static and multi-skin data in `src/data/` (`cv.json`, `uses.ts`, `links.ts`, `now.ts`)
  - Configuration in `src/config.ts`

## Key Architecture Decisions

- **No `prerender = true` on any route using `Layout.astro`**: Skin selection lives in a request cookie (`kk-skin`), so all page routes (including `blog/[slug]` and `portfolio/[slug]`) are SSR. Sitemap entries for dynamic routes are supplied via `customPages` in `astro.config.mjs`. Only `src/pages/og/[...route].ts` is prerendered.
- **Content Collections**: Use `getCollection()` and `getEntry()` from `astro:content` — **never `getEntryBySlug()`** (deprecated and throws on unknown slugs). Missing dynamic routes should `return Astro.rewrite('/404')`.
- **Server-rendered themes**: Modern theme (`kk-theme` cookie + `localStorage` via `persistTheme()` in `src/lib/theme.ts`) and Mandy sub-theme (`kk-mandy-theme` cookie in `src/lib/skin.ts`) are rendered onto `<html>` server-side to prevent FOUC. Pre-paint scripts carry `data-cfasync="false"`.
- **Hydration schedule**: `client:load` only for what a visitor came for or what would flicker if late (games, Tunes, guestbook bodies, `ReadingTools`, `TypingHeading`, `MandyEffects`); `client:idle` for shell chrome that works without JS until hydrated (backdrops, nav, toggles, palette, theme bar); `client:visible` for below-the-fold islands that always render an element (`HeartRateCard`, `PostReactions`). Never `client:visible` on a component that can SSR `null`: Astro observes the island's children, so it would never hydrate. That's why the footer `HeartRate` pill is `client:idle`.
- **Self-hosted Mandy fonts**: Fontsource Latin-subset files imported in `MandyLayout.astro` — never Google Fonts, and never the all-subset per-weight files (+25 KB gzipped of `@font-face` on every skin's stylesheet).
- **Islands are wrapped, never forked**: `Tetris.tsx`, `RockPaperScissors.tsx`, `StarPairs.tsx`, `Tunes.tsx`, and `PostReactions.tsx` are wrapped in `MandyIslandShell.astro` / `RetroIslandShell.astro` (`.astro` so slotted islands retain hydration).
- **Single bat emblem**: `src/page-components/PixelBat.tsx` (`BAT_ROWS`, 20×7 palindromic pixel bat) is shared across the Mandy nav mark, Gotham Bat-Signal, modern Batman theme swatch, and skin toggle button.
- **Modals & Accessibility**: Use `<dialog>` elements instead of `prompt()`/`alert()`. All interactive elements need `aria-label` if text-only isn't descriptive; canvas elements get `role="img"` + `aria-label`; respect `prefers-reduced-motion`.

## Verification & Commands

Before committing, always run all four verification commands:
- `npm run check` — TypeScript check (`tsc --noEmit`)
- `npm test` — Unit/integration tests (`tests/*.test.ts`)
- `npm run build` — Production build to `dist/`
- `npm run test:render` — Production SSR render & JSDOM checks across all three skins (`tests/render/*.test.ts`)

## Contributing Best Practices

1. **Minimal Changes**: Make the smallest possible modifications to achieve goals.
2. **Update Documentation**: Keep `AGENTS.md`, `CLAUDE.md`, and `README.md` in sync, and append qualitative notes to the bottom of `AGENTS.md`.
3. **No Codex Labels**: Never apply a "codex" label to PRs; omit ChatGPT chat links.
4. **First-Person Voice**: Write all documentation from my (the owner's) perspective.
