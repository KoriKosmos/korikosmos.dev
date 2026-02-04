# Copilot Instructions for korikosmos.dev

## Project Overview

This is **korikosmos.dev**, a personal portfolio website built with [Astro](https://astro.build) and Tailwind CSS. The site serves as a portfolio hub, CV, blog, games showcase, and music listening tracker via Last.fm integration.

## Tech Stack

- **Framework**: Astro 5.x (SSG with partial SSR for API routes)
- **Styling**: Tailwind CSS with custom themes (dark, light, forest)
- **Content Management**: Netlify CMS for blog posts and projects
- **Deployment**: Docker-ready with Nginx, deployable to any static host
- **Key Features**: 
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
├── pages/           # Astro pages and API routes
│   ├── api/        # Server-side endpoints (Last.fm proxy)
│   ├── blog/       # Blog posts from content collections
│   ├── games/      # Game pages (Tetris, RPS)
│   └── ...
├── components/      # Reusable UI components
├── layouts/         # Base layouts (includes nav & oneko toggle)
├── content/         # Markdown content (blog, projects)
├── lib/            # Game engines and shared utilities
├── data/           # JSON data (CV information)
├── config.ts       # Centralized site config & navigation
└── env.d.ts        # TypeScript environment definitions
```

### Key Files

- `src/layouts/Layout.astro` - Base layout with navigation, theme switcher, oneko cat toggle
- `src/config.ts` - Centralized navigation and site settings
- `src/data/cv.json` - Data-driven CV content
- `src/lib/tetris.js` - Tetris game engine (decoupled from UI)
- `src/pages/api/lastfm.ts` - Server-side proxy for Last.fm API

### Important Patterns

1. **Content Collections**: Blog and projects use Astro's content collections
2. **Data-Driven Components**: CV page uses JSON data with reusable `CvSection` components
3. **Game Engines**: Game logic lives in `/lib` and is decoupled from UI components
4. **API Proxy Pattern**: Last.fm credentials are kept secure via server-side proxy
5. **Client-Side State**: Theme preferences and game scores persist via localStorage
6. **Inline Scripts**: Some pages use `define:vars` to inject build-time variables securely

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
- `docker compose up --build` - Build and run in container on port 8484
- Container auto-pulls from `GIT_REPO` if configured in `.env`
- Build output is copied to `/var/www/html` for Nginx

## Content Management

- **Netlify CMS**: Access at `/admin` to manage blog posts and projects
- **Blog Posts**: Markdown files in `src/content/blog/`
- **Projects**: Markdown files in `src/content/projects/`
- **CV Data**: Edit `src/data/cv.json` directly

## Important Notes & Gotchas

### Security & Privacy
- Last.fm API keys are protected via server-side proxy (`/api/lastfm`)
- Never expose API keys in client-side code
- Rock Paper Scissors moved logic to `/js/rock-paper-scissors.js` for CSP compliance

### State Persistence
- Oneko cat toggle persists across pages via localStorage
- Theme selection persists across pages via localStorage
- Game high scores saved in localStorage (Tetris, Rock Paper Scissors)

### Game Features
- **Tetris**: 
  - Uses official Super Rotation System (SRS)
  - Seven-piece grab bag for spawning
  - Hold function (C or Shift)
  - Lock delay for piece sliding
  - Level-based speed scaling
  - Official scoring with soft/hard drop bonuses
  - Mobile controls with touch support
- **Rock Paper Scissors**: Simple game with localStorage scores

### Known Behaviors
- Tunes page normalizes track names to filter duplicates across different language credits
- Docker entrypoint performs `git pull` if `GIT_REPO` is set
- `.env` variables are injected at build time, not runtime

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

## Environment Variables

Required in `.env`:
- `LASTFM_USER` - Last.fm username
- `LASTFM_API_KEY` - Last.fm API key

Optional (for Docker):
- `GIT_REPO` - GitHub repository URL for auto-pull
- `GIT_BRANCH` - Git branch to pull (defaults to main)
