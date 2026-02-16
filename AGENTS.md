# Development Guidelines

This project contains the source for **korikosmos.dev**, a personal portfolio, blog, and games hub built with [Astro](https://astro.build/) 5 (SSR mode), styled with Tailwind CSS 3 + DaisyUI 5.

## Tech Stack

- **Framework:** Astro 5 (`output: 'server'`, `@astrojs/node` standalone adapter)
- **Styling:** Tailwind CSS 3.3 + DaisyUI 5.5 (3 custom themes: dark, light, forest)
- **TypeScript:** Strict mode (`astro/tsconfigs/strict`)
- **Deployment:** Docker (multi-stage build, Node 20 Alpine, port 4321)
- **CMS:** Decap CMS (admin at `/admin`, GitHub OAuth backend)

## Site Structure & Objectives

- `src/pages/index.astro` – Landing page with a short greeting and link to the portfolio.
- `src/pages/about.astro` – Short biography using card styling.
- `src/pages/cv.astro` – Full curriculum vitae including education, skills and work history.
- `src/pages/portfolio.astro` – Lists projects from `src/content/projects`.
- `src/pages/portfolio/[slug].astro` – Individual project pages (prerendered).
- `src/pages/blog/` – Blog posts generated from Markdown content.
- `src/pages/blog/[slug].astro` – Individual blog post pages (prerendered).
- `src/pages/tunes.astro` – Displays recent Last.fm tracks, top artists and albums. SSR fetches initial data, client JS renders and polls for updates every 30s.
- `src/pages/games/index.astro` – Games listing page.
- `src/pages/games/tetris.astro` – Tetris game with SRS rotation, hold, and leaderboards.
- `src/pages/games/rock-paper-scissors.astro` – Rock Paper Scissors game with leaderboards.
- `src/pages/404.astro` – Custom 404 page.
- `src/layouts/Layout.astro` – Base layout with SEO meta, skip link, navigation, theme switcher, oneko cat toggle, and footer. Accepts `title`, `description`, `image`, and `isWide` props.
- `src/config.ts` – Centralized site config and navigation links.
- `src/content/` – Markdown content managed via Decap CMS at `/admin`.

## Project Structure

```
src/
├── components/    # Reusable Astro components (CvSection, ProjectCard, ThemeBar, OnekoToggle)
├── content/       # Content collections (blog posts, projects) as Markdown
│   ├── blog/      # Blog posts with frontmatter: title, description, pubDate
│   └── projects/  # Project entries with frontmatter: title, summary, description, github?
├── data/          # Static data (cv.json)
├── layouts/       # Layout.astro — single layout with SEO meta, skip link, nav, footer
├── lib/           # Shared utilities
│   ├── constants.ts  # Shared constants (BLOCKED_ITEMS for Last.fm filtering)
│   ├── images.ts     # getBestImage() — shared between server and client code
│   ├── lastfm.ts     # Last.fm API wrapper (server-side, uses env vars)
│   └── tetris.js     # Tetris game engine (decoupled from UI)
├── pages/         # File-based routing
│   ├── api/       # API routes (lastfm, scores/[game], auth callbacks)
│   ├── games/     # Tetris, Rock Paper Scissors
│   └── ...        # index, about, cv, portfolio, blog, tunes, 404
├── styles/        # global.css (Tailwind directives + custom utilities)
└── config.ts      # Centralized site config & navigation
public/            # Static assets (favicon.svg, robots.txt, oneko.js, admin config)
data/scores/       # Persistent game leaderboard data (JSON files, written by API)
```

## Key Architecture Decisions

- **SSR with selective prerendering:** Most pages are server-rendered. Blog and portfolio `[slug]` pages use `export const prerender = true` with `getStaticPaths()` for static generation.
- **Theme system:** DaisyUI themes configured in `tailwind.config.mjs` with `data-theme` attribute on `<html>`. Three themes: dark (default), light, forest. Custom `--surface` and `--accent-dark` CSS vars extend DaisyUI for specific utilities.
- **Tunes page pattern:** SSR fetches initial data, passes to client via `<script define:vars>`. Client JS is the single source of truth for rendering artists/albums (avoids template duplication). Client polls for now-playing updates every 30s.
- **Game scores:** Stored as JSON files in `/data/scores/`, accessed via API routes with `async-mutex` for write safety. Leaderboards sync between localStorage and server.
- **Shared code between server and client:** `src/lib/images.ts` and `src/lib/constants.ts` are importable from both Astro frontmatter (server) and `<script>` tags (client bundles). `src/lib/lastfm.ts` is server-only (uses env vars).
- **Content Collections**: Use `getCollection()` and `getEntryBySlug()` from `astro:content`.
- **API routes**: Export `APIRoute` type from Astro and return `new Response()`.
- **Modals**: Use `<dialog>` elements instead of `prompt()`/`alert()`.
- **Accessibility**: All interactive elements need `aria-label` if text-only isn't descriptive; canvas elements get `role="img"` + `aria-label`.

## Getting Started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and provide your Last.fm credentials.
3. Use `npm run dev` to start the local dev server.
4. Run `npm run build` to generate the production build before committing.

## Useful Commands

- `npm run dev` – start development server at `localhost:4321`.
- `npm run build` – build to `dist/`.
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
- Verify that `npm run build` succeeds; there are no automated tests.
- New pages go in `src/pages`, and reusable pieces belong in `src/components`.
- Never apply a "codex" label to PRs; omit ChatGPT chat links.
- Write documentation in first-person voice, from my perspective.
- Keep `README.md` in sync with features.
- GitHub Copilot instructions are configured in `.github/copilot-instructions.md`.

## Notes
- Tunes page normalizes track names to filter out duplicates across different language credits.
- Cat toggle persists across pages so Oneko can follow you site-wide.
- Theme bar allows switching between "dark", "light", and "forest" themes using a fixed selector on every page.
- Portfolio includes pages for my Final Year Project and Year 2 Java calculator.
- Games page lists playable Tetris and Rock Paper Scissors subpages.
- Tetris game supports on-screen mobile controls for touch devices.
- Tetris shows the next piece and lets me hold one with C or Shift.
- Tetris game uses a standard seven-piece grab bag for spawning tetrominoes.
- Tetris uses the official Super Rotation System (SRS) for piece rotation.
- Tetris next-piece preview reflects the grab bag and held pieces keep their type so they rotate correctly.
- Tetris mobile controls include hold and counter-clockwise rotation buttons.
- Piece speed scales with level and the HUD shows the current level.
- Pieces have a lock delay so I can slide them before they settle.
- Tetris saves high scores and shows leaderboards synced between localStorage and server.
- Tetris scoring follows the official guidelines with soft and hard drop bonuses.
- Rock Paper Scissors game with scores synced to server leaderboard.
