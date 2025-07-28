# Development Guidelines

This project contains the source for **korikosmos.dev**, a personal site built with [Astro](https://astro.build/). It serves as a portfolio hub, CV, blog and music showcase.

## Site Structure & Objectives

- `src/pages/index.astro` – Landing page with a short greeting and link to the portfolio.
- `src/pages/about.astro` – Will provide a biography; currently uses the `UnderConstruction` component.
- `src/pages/cv.astro` – Full curriculum vitae including education, skills and work history.
- `src/pages/portfolio.astro` – Lists projects from `src/content/projects`.
- `src/pages/blog/` – Blog posts generated from Markdown content.
- `src/pages/tunes.astro` – Displays recent Last.fm tracks and requires `LASTFM_USER` and `LASTFM_API_KEY` in `.env`.
- `src/layouts/Layout.astro` – Base layout used by pages; includes navigation links and the oneko cat toggle.
- `src/components/UnderConstruction.astro` – Simple component indicating a page is unfinished.
- `src/content/` – Markdown files managed by Netlify CMS at `/admin`.

## Getting Started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and provide your Last.fm credentials.
3. Use `npm run dev` to start the local dev server.
4. Run `npm run build` to generate the production build before committing.

## Contributing

- Follow the existing coding style (two‑space indentation, semicolons in JS/TS).
- Whenever you make a change, add or modify this AGENTS.md file to enhance future updates, refactors and usability. Whether this is instructions, best habits, etc.
- Whenever a change is made, keep a list of notes at the bottom of this AGENTS.md file that tracks the more "qualitative" wants of the user/client, such as themes, experiences, etc.
- Keep commits focused and write a short imperative subject line (e.g. `Fix navbar links`).
- Verify that `npm run build` succeeds; there are no automated tests.
- New pages go in `src/pages`, and reusable pieces belong in `src/components`.

## Useful Commands

- `npm run dev` – start development server at `localhost:4321`.
- `npm run build` – build to `dist/`.
- `npm run preview` – preview the production build locally.


## Notes
- NEVER EVER apply a "codex" label to the PRs you create, and leave out the link to the Codex/ChatGPT chat
- Tunes page loads Last.fm tracks client-side using an inline script with `define:vars` so credentials are inserted at build time.
- Content is edited through Netlify CMS at `/admin`.
- Keep the main `README.md` up to date. Avoid writing documentation changes only in `Astro-README.md`.
- Use a first-person voice in docs. Write from my perspective.
- Sync useful content from Astro-README.md back to README.md when needed.
- Dockerfile and docker-compose.yml allow containerized builds with `docker compose up --build`.
- The container will run `git pull` on startup using `GIT_REPO` and rebuild the site automatically.
- `.env.example` now includes optional `GIT_REPO` and `GIT_BRANCH` variables.
- Docker entrypoint should copy the build output to `/var/www/html` since that's
  the default Nginx root.
- Docker listens on port `8484` by default via `docker-compose.yml`.
- About page now includes a short biography using the same card styling as other pages.

