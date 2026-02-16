# CLAUDE.md

## Project Overview

Personal portfolio, blog, and games hub at **korikosmos.dev**. Built with Astro 5 (SSR mode) using the Node standalone adapter, styled with Tailwind CSS 3 + DaisyUI 5.

## Tech Stack

- **Framework:** Astro 5 (`output: 'server'`, `@astrojs/node` standalone adapter)
- **Styling:** Tailwind CSS 3.3 + DaisyUI 5.5 (3 custom themes: dark, light, forest)
- **TypeScript:** Strict mode (`astro/tsconfigs/strict`)
- **Deployment:** Docker (multi-stage build, Node 20 Alpine, port 4321)
- **CMS:** Decap CMS (admin at `/admin`, GitHub OAuth backend)

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (outputs to `dist/`)
- `npm run preview` — preview production build locally

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
│   └── lastfm.ts     # Last.fm API wrapper (server-side, uses env vars)
├── pages/         # File-based routing
│   ├── api/       # API routes (lastfm, scores/[game], auth callbacks)
│   ├── games/     # Tetris, Rock Paper Scissors
│   └── ...        # index, about, cv, portfolio, blog, tunes, 404
└── styles/        # global.css (Tailwind directives + custom utilities)
public/            # Static assets (favicon.svg, robots.txt, oneko.js, admin config)
data/scores/       # Persistent game leaderboard data (JSON files, written by API)
```

## Key Architecture Decisions

- **SSR with selective prerendering:** Most pages are server-rendered. Blog and portfolio `[slug]` pages use `export const prerender = true` with `getStaticPaths()` for static generation.
- **Theme system:** DaisyUI themes configured in `tailwind.config.mjs` with `data-theme` attribute on `<html>`. Three themes: dark (default), light, forest. Custom `--surface` and `--accent-dark` CSS vars extend DaisyUI for specific utilities.
- **Layout props:** `Layout.astro` accepts `title`, `description`, `image`, and `isWide` props. Title is auto-formatted as `{title} | KoriKosmos` (homepage uses bare site name).
- **Tunes page pattern:** SSR fetches initial data, passes to client via `<script define:vars>`. Client JS is the single source of truth for rendering artists/albums (avoids template duplication). Client polls for now-playing updates every 30s.
- **Game scores:** Stored as JSON files in `/data/scores/`, accessed via API routes with `async-mutex` for write safety. Leaderboards sync between localStorage and server.
- **Shared code between server and client:** `src/lib/images.ts` and `src/lib/constants.ts` are importable from both Astro frontmatter (server) and `<script>` tags (client bundles). `src/lib/lastfm.ts` is server-only (uses env vars).

## Environment Variables

- `LASTFM_USER` — Last.fm username for scrobble data
- `LASTFM_API_KEY` — Last.fm API key

## Style Guidelines

- Use DaisyUI semantic classes (`bg-base-100`, `text-base-content`, `bg-primary`, `text-primary-content`, etc.) for theme-aware colors
- Use `bg-base-200` for card/surface backgrounds, `bg-base-100` for page background
- Use `from-primary to-secondary` for gradient accents
- The custom `hover:bg-accent-dark` utility is defined in `global.css` for the accent dark hover state
- Button style: `bg-neutral text-neutral-content rounded` for game controls, `bg-primary text-primary-content` for CTAs

## Common Patterns

- Content collections use `getCollection()` and `getEntryBySlug()` from `astro:content`
- API routes export `APIRoute` type from Astro and return `new Response()`
- Client-side scripts in `.astro` files are ES modules by default (can use imports)
- Use `<dialog>` elements for modals instead of `prompt()`/`alert()`
- Accessibility: all interactive elements need `aria-label` if text-only isn't descriptive; canvas elements get `role="img"` + `aria-label`
