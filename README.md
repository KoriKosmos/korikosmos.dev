# korikosmos.dev

This repo contains the source for **korikosmos.dev**, my personal website built with [Astro](https://astro.build) (SSR) and [React](https://react.dev) islands, styled with Tailwind CSS + DaisyUI. Astro handles routing and server-side data fetching; every rendered component is React. Here I share my projects, CV, blog posts, games and the music I'm currently listening to.

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

### CMS (Local Development)

To edit content locally with Decap CMS:

1.  Run the proxy server in a separate terminal:
    ```sh
    npx decap-server
    ```
2.  Navigate to `http://localhost:4321/admin`.
3.  Click "Login with Local Backend".

_Note: In production, the CMS authenticates via GitHub._

## Features

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
- Switch between four DaisyUI themes (dark, light, forest, batman) using the theme bar
- Showcases my projects from `src/content/projects`
- Manage posts, projects, and CV via **Decap CMS** at `/admin`.
- Responsive Tailwind styling
- Includes dedicated pages for my Final Year Project and Year 2 Java calculator
- I built a playable Tetris clone for the Games page with touch controls, SRS rotation, and a **global leaderboard** that persists scores across devices.
- I also added a simple Rock Paper Scissors game that saves scores in `localStorage`.

## Project Structure

```
/
├── public/
│   └── admin/           # Decap CMS
├── src/
│   ├── components/      # Reusable React components (design-sync surface)
│   ├── page-components/ # Page-body React components (one per route)
│   ├── config.ts        # Site configuration & navigation
│   ├── data/            # Static data (e.g., CV)
│   ├── env.d.ts         # Type definitions
│   ├── layouts/
│   ├── lib/             # Game engines & shared logic
│   ├── pages/           # .astro routes: SSR data fetch → render page-components/*.tsx
│   │   ├── api/         # Server-side API endpoints
│   │   └── ...
│   ├── styles/
│   └── content/
│       ├── blog/
│       └── projects/
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
| `npm run preview`   | Preview the built site locally         |
| `npm run astro ...` | Run additional Astro CLI commands      |

## Docker

Build and run the containerized application (using Node.js adapter):

```sh
docker compose up --build
```

The site will be available at http://localhost:8484.

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
