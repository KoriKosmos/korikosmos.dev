# Copilot Instructions for korikosmos.dev

## Project Overview

Personal portfolio, blog, and games hub at **korikosmos.dev**. Built with Astro 5 (SSR mode) using the Node standalone adapter, styled with Tailwind CSS 3 + DaisyUI 5.

## Tech Stack

- **Framework:** Astro 5 (`output: 'server'`, `@astrojs/node` standalone adapter)
- **Styling:** Tailwind CSS 3.3 + DaisyUI 5.5 (3 custom themes: dark, light, forest)
- **TypeScript:** Strict mode (`astro/tsconfigs/strict`)
- **Deployment:** Docker (multi-stage build, Node 20 Alpine, port 4321)
- **CMS:** Decap CMS (admin at `/admin`, GitHub OAuth backend)
- **Key Features:**
  - Last.fm integration (server-side proxy at `/api/lastfm`)
  - Interactive games (Tetris with SRS rotation, Rock Paper Scissors)
  - Persistent oneko cat cursor companion
  - Theme switcher with localStorage persistence

## Code Style Guidelines

- **Indentation**: Use 2 spaces (no tabs)
- **JavaScript/TypeScript**: Always use semicolons
- **Voice**: Write documentation in first-person perspective
- **Commits**: Use imperative mood (e.g., "Fix navbar links", "Add Tetris game")
- **File Organization**:
  - Pages go in `src/pages/`
  - Reusable components in `src/components/`
  - Game engines and shared logic in `src/lib/`
  - Static data (like CV) in `src/data/`
  - Configuration in `src/config.ts`

## Architecture & Key Patterns

### Directory Structure

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

### Key Files

- `src/layouts/Layout.astro` - Base layout with navigation, theme switcher, oneko cat toggle
- `src/config.ts` - Centralized navigation and site settings
- `src/data/cv.json` - Data-driven CV content
- `src/lib/tetris.js` - Tetris game engine (decoupled from UI)
- `src/pages/api/lastfm.ts` - Server-side proxy for Last.fm API

### Key Architecture Decisions

- **SSR with selective prerendering:** Most pages are server-rendered. Blog and portfolio `[slug]` pages use `export const prerender = true` with `getStaticPaths()` for static generation.
- **Theme system:** DaisyUI themes configured in `tailwind.config.mjs` with `data-theme` attribute on `<html>`. Three themes: dark (default), light, forest. Custom `--surface` and `--accent-dark` CSS vars extend DaisyUI for specific utilities.
- **Layout props:** `Layout.astro` accepts `title`, `description`, `image`, and `isWide` props. Title is auto-formatted as `{title} | KoriKosmos` (homepage uses bare site name).
- **Tunes page pattern:** SSR fetches initial data, passes to client via `<script define:vars>`. Client JS is the single source of truth for rendering artists/albums (avoids template duplication). Client polls for now-playing updates every 30s.
- **Game scores:** Stored as JSON files in `/data/scores/`, accessed via API routes with `async-mutex` for write safety. Leaderboards sync between localStorage and server.
- **Shared code between server and client:** `src/lib/images.ts` and `src/lib/constants.ts` are importable from both Astro frontmatter (server) and `<script>` tags (client bundles). `src/lib/lastfm.ts` is server-only (uses env vars).

### Important Patterns

1. **Content Collections**: Blog and projects use Astro's content collections with `getCollection()` and `getEntryBySlug()`
2. **Data-Driven Components**: CV page uses JSON data with reusable `CvSection` components
3. **Game Engines**: Game logic lives in `/lib` and is decoupled from UI components
4. **API Proxy Pattern**: Last.fm credentials are kept secure via server-side proxy
5. **Client-Side State**: Theme preferences persist via localStorage
6. **Inline Scripts**: Some pages use `define:vars` to inject server-side variables securely
7. **API routes**: Export `APIRoute` type from Astro and return `new Response()`
8. **Modals**: Use `<dialog>` elements instead of `prompt()`/`alert()`
9. **Accessibility**: All interactive elements need `aria-label` if text-only isn't descriptive; canvas elements get `role="img"` + `aria-label`

## Development Workflow

### Setup
```bash
npm install
cp .env.example .env  # Add LASTFM_USER and LASTFM_API_KEY
```

### Commands
- `npm run dev` - Start dev server at http://localhost:4321
- `npm run build` - Build for production (always verify before committing)
- `npm run preview` - Preview production build locally

### Before Committing
- **Always run `npm run build`** to verify no build errors
- There are no automated tests in this project
- Review changes carefully for unintended modifications

### Docker Support
- `docker compose up --build` - Build and run in container (maps port 8484 → 4321)
- Multi-stage build: Node 20 Alpine, runs `node ./dist/server/entry.mjs`
- Scores data persisted via Docker volume

## Content Management

- **Decap CMS**: Access at `/admin` to manage blog posts and projects (GitHub OAuth backend)
- **Blog Posts**: Markdown files in `src/content/blog/`
- **Projects**: Markdown files in `src/content/projects/`
- **CV Data**: Edit `src/data/cv.json` directly

## Style Guidelines

- Use DaisyUI semantic classes (`bg-base-100`, `text-base-content`, `bg-primary`, `text-primary-content`, etc.) for theme-aware colors
- Use `bg-base-200` for card/surface backgrounds, `bg-base-100` for page background
- Use `from-primary to-secondary` for gradient accents
- The custom `hover:bg-accent-dark` utility is defined in `global.css` for the accent dark hover state
- Button style: `bg-neutral text-neutral-content rounded` for game controls, `bg-primary text-primary-content` for CTAs

## Important Notes & Gotchas

### Security & Privacy
- Last.fm API keys are protected via server-side proxy (`/api/lastfm`)
- Never expose API keys in client-side code

### State Persistence
- Oneko cat toggle persists across pages via localStorage
- Theme selection persists across pages via localStorage
- Game high scores sync between localStorage and server-side leaderboards

### Game Features
- **Tetris**:
  - Uses official Super Rotation System (SRS)
  - Seven-piece grab bag for spawning
  - Hold function (C or Shift)
  - Lock delay for piece sliding
  - Level-based speed scaling
  - Official scoring with soft/hard drop bonuses
  - Mobile controls with touch support
- **Rock Paper Scissors**: Simple game with scores synced to server leaderboard

### Known Behaviors
- Tunes page normalizes track names to filter duplicates across different language credits
- `.env` variables are injected at build time for client-side code, available at runtime for server-side code

## Environment Variables

Required in `.env`:
- `LASTFM_USER` - Last.fm username for scrobble data
- `LASTFM_API_KEY` - Last.fm API key

For Decap CMS OAuth:
- `OAUTH_CLIENT_ID` - GitHub OAuth app client ID
- `OAUTH_CLIENT_SECRET` - GitHub OAuth app client secret

## Contributing Best Practices

1. **Minimal Changes**: Make the smallest possible modifications to achieve goals
2. **Update Documentation**:
   - Update `AGENTS.md` when making significant changes
   - Keep `README.md` in sync with features
   - Add notes to the bottom of `AGENTS.md` for qualitative user preferences
3. **No Codex Labels**: Never apply "codex" label to PRs; omit ChatGPT chat links
4. **First-Person Voice**: Write all documentation from my (the owner's) perspective
5. **Verify Builds**: Ensure `npm run build` succeeds before finalizing changes
6. **Consistency**: Match existing patterns and styles in the codebase
