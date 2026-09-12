# korikosmos.dev

This repo contains the source for **korikosmos.dev**, my personal website built with [Astro](https://astro.build) (SSR) and [React](https://react.dev) islands, styled with Tailwind CSS + DaisyUI. Astro handles routing and server-side data fetching; every rendered component is React. Here I share my projects, CV, blog posts, games and the music I'm currently listening to.

It ships in **two skins**. The default is the modern one. Click "Back to 20XX" in the corner and the whole site becomes a Web 1.0 personal homepage — tiled backgrounds, 88x31 buttons, blinkies, a marquee, a hit counter, a webring, and a guestbook. It is a parallel set of layouts and page bodies, not a restyle.

## Setup

1. Install dependencies
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and add my Last.fm credentials. I can
   optionally set `GIT_REPO` and `GIT_BRANCH` here if the Docker container
   should pull from a remote repo on startup.
   ```sh
   cp .env.example .env
   ```
   `LASTFM_USER` and `LASTFM_API_KEY` are loaded from this file and used by the server-side proxy at `/api/lastfm`. The tunes page fetches data from this internal API, keeping your keys secure.

## Development

Start a local server at `http://localhost:4321`:

```sh
npm run dev
```

### Content editing (Keystatic CMS)

Content is managed with [Keystatic](https://keystatic.com) — schemas live in
`keystatic.config.ts`, and content stays as Markdown/JSON in the repo.

Keystatic runs in **GitHub mode**: you sign in through the site's GitHub App
and every save lands as a commit on the repo — in dev and production alike.
(`/admin` redirects to `/keystatic`. For offline work, temporarily switch
`storage` to `{ kind: 'local' }` in `keystatic.config.ts`.)

**One-time GitHub App setup** (requires being logged into GitHub):

1. Run `npm run dev`, open `http://localhost:4321/keystatic`, and click
   "Log in with GitHub" — with no credentials configured this lands on the
   Keystatic Setup page. Enter `https://korikosmos.dev` as the **Deployed App
   URL** (this registers the production OAuth callback) and create the app.
   Keystatic writes `KEYSTATIC_GITHUB_CLIENT_ID`,
   `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and
   `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` into `.env`.
2. Install the app on the `KoriKosmos/korikosmos.dev` repo when prompted.
3. Copy the four `KEYSTATIC_*` values into the server's `.env` —
   `docker compose up --build` passes them at build time (which is what
   includes the admin routes in the image) and at runtime.

A production build **without** those env vars ships no admin routes at all.

## Features

- **Star Pairs** at `/games/star-pairs`: My constellation memory game has three board sizes, keyboard and touch controls, automatic pausing when leaving the tab, and personal bests stored on the device. It works in both skins and needs no account or external assets.
- **Blog reading tools**: My posts show publication dates, reading-time estimates and a linked contents list. A progress strip tracks the article, and readers can copy a section link or a code block. The article and contents remain readable without JavaScript in either skin.
- **Searchable blog and portfolio**: I can search titles, descriptions and post bodies, sort the results, and filter projects with public GitHub source. Filters are shareable URLs and work in both skins without JavaScript.
- **Webcore mode** — a full Web 1.0 skin behind a toggle:
  - A `kk-skin` cookie, resolved in `src/middleware.ts` before anything renders. `src/layouts/Layout.astro` is a dispatcher that picks `ModernLayout.astro` or `RetroLayout.astro`, and each route renders either a `src/page-components/*` or a `src/retro-components/Retro*` body.
  - Four sub-themes of its own — y2k (the default), kawaii, geocities, cyber — switched from the retro control panel and remembered in `localStorage`.
  - Every graphic is generated, not hotlinked: `npm run gen:retro` draws all 35 assets in `public/retro/` as animated SVG. The output is committed, so the build never runs the script.
  - The three interactive islands (Tetris, Rock Paper Scissors, Tunes) are the same components, wrapped in `RetroIslandShell.astro` and restyled from outside — not forked.
  - Reduced motion stops everything that blinks, scrolls, sparkles or rainbows, the chiptune never autoplays, and every sub-theme's colour pairs are checked against WCAG contrast ratios.
  - Because the skin lives in a request cookie, no route using `Layout.astro` can be prerendered — the blog and portfolio `[slug]` pages are SSR, and `astro.config.mjs` feeds their URLs to the sitemap via `customPages`.
- **Guestbook** at `/guestbook`, in both skins — persistent (`data/guestbook.json`), with a public `GET /api/guestbook` and a same-origin, rate-limited, body-capped `POST`. The entry cap rejects rather than evicts, so a flood can never destroy signatures, and submitted URLs are allowlisted to `http:`/`https:` before being rendered as links. Per-post emoji reactions use the same guards.
- **Hit counter** on the retro skin, bumped once per visitor session (`data/hits.json`).
- **React islands architecture**:
  - `.astro` pages are thin wrappers: they do the server-side data fetching (content collections, Last.fm, `cv.json`) and render a React component in `src/page-components/` with the result as props.
  - Presentational components render to static HTML with zero client JS; interactive ones (`ThemeBar`, `OnekoToggle`, `Tetris`, `RockPaperScissors`, `Tunes`, the homepage typing heading) hydrate with `client:load`.
  - Reusable components live in `src/components/` (also synced to a Claude Design project via `.design-sync/`); page-specific markup lives in `src/page-components/`.
  - **CV Page**: Fully data-driven using `src/data/cv.json` and reusable `CvSection` components.
  - **Tetris**: Game logic decoupled into a dedicated `src/lib/tetris.js` engine, separating `update()`/`draw()` loops from the UI component; `Tetris.tsx` is a faithful island wrapper around it.
  - **Tunes Page**: Last.fm integration uses a server-side proxy (`src/pages/api/lastfm.ts`) to prevent API key exposure; React state is the source of truth, polling for now-playing updates.
  - **High Scores**: Global leaderboard implemented via server-side API (`src/pages/api/scores/[game].ts`, accessed as `/api/scores/:game`) and persistent JSON storage.
  - **Config**: Centralized navigation and site settings in `src/config.ts`.
- Displays my most recently played tracks with album artwork
- Normalizes track names to avoid duplicates credited in different languages
- Toggle a little cursor-following cat from the corner button
- Switch between five DaisyUI themes (dark, light, forest, spider-man, batman) using the theme bar, or four retro sub-themes in webcore mode
- Showcases my projects from `src/content/projects`
- Manage posts, projects, and CV via **Keystatic** at `/keystatic` (schemas in `keystatic.config.ts`).
- Responsive Tailwind styling
- Includes dedicated pages for my Final Year Project and Year 2 Java calculator
- I built a playable Tetris clone for the Games page with touch controls, SRS rotation, and a **global leaderboard** that persists scores across devices.
- I also added a simple Rock Paper Scissors game that saves scores in `localStorage`.

## Project Structure

```
/
├── keystatic.config.ts  # Keystatic CMS schemas (blog, projects, CV)
├── public/
├── src/
│   ├── components/      # Reusable React components (design-sync surface)
│   ├── page-components/ # Page-body React components (one per route)
│   ├── retro-components/# Web 1.0 skin: a Retro* body per route + SkinToggle, RetroChrome
│   ├── config.ts        # Site configuration & navigation
│   ├── data/            # Static data (CV) + data shared by both skins (uses, links, now)
│   ├── env.d.ts         # Type definitions
│   ├── layouts/         # Layout.astro (dispatcher), ModernLayout.astro, RetroLayout.astro
│   ├── lib/             # Game engines, skin cookie, guestbook, hits, rate limiter, JSON store
│   ├── middleware.ts    # Skin resolution, hit counter, Keystatic OAuth origin fix
│   ├── pages/           # .astro routes: SSR data fetch → render the right body component
│   │   ├── api/         # Server-side API endpoints
│   │   └── ...
│   ├── styles/          # global.css (Tailwind) + retro.css (the rt-* vocabulary)
│   └── content/
│       ├── blog/
│       └── projects/
├── scripts/
│   └── gen-retro-assets.mjs  # Draws public/retro/* — run with `npm run gen:retro`
├── data/                # Runtime state: scores/, guestbook.json, hits.json (volume-mounted)
├── .design-sync/        # Config for syncing src/components/ to Claude Design
└── ...
```

## Commands

Run these from the project root:

| Command             | Action                                 |
| :------------------ | :------------------------------------- |
| `npm install`       | Install dependencies                   |
| `npm run dev`       | Start the dev server                   |
| `npm run build`     | Build the production site to `./dist/` |
| `npm test`          | Run focused regression tests           |
| `npm run test:render` | Check production HTML in both skins (build first) |
| `npm run preview`   | Preview the built site locally         |
| `npm run gen:retro` | Redraw the retro graphics in `public/retro/` |
| `npm run astro ...` | Run additional Astro CLI commands      |

## Docker

Build and run the containerized application (using Node.js adapter):

```sh
docker compose up --build
```

The site will be available at http://localhost:8484.

The container does **not** copy `data/` into the image — the game leaderboards, guestbook, and hit counter all persist through the volume mount defined in `docker-compose.yml`. Without a writable `data/`, the guestbook refuses signatures and the counter falls back to an in-memory count rather than failing the page.

**Note**: This uses a multi-stage `Dockerfile` that builds the Astro project into a standalone Node.js app. The "pull-on-boot" feature has been removed for stability.

### Updating the site

To update the site with the latest changes from git, run:

```sh
./update-deploy.sh
```

This script will:

1. Pull the latest code (`git pull`).
2. Rebuild the Docker image.
3. Restart the container with the new version.
