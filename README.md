# korikosmos.dev

This repo contains the source for **korikosmos.dev**, my personal website built with [Astro](https://astro.build) and Tailwind CSS. Here I share my projects, CV, blog posts, games and the music I'm currently listening to.

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
   `LASTFM_USER` and `LASTFM_API_KEY` are loaded from this file and then inlined into the tunes page. The script on `/tunes` fetches tracks in the browser whenever the page loads.

## Development

Start a local server at `http://localhost:4321`:

```sh
npm run dev
```

## Features

- Displays my most recently played tracks with album artwork
- Normalizes track names to avoid duplicates credited in different languages
- Toggle a little cursor-following cat from the corner button
- Switch between light, dark and forest themes using the new theme bar
- Showcases my projects from `src/content/projects`
- Manage posts and projects from Netlify CMS at `/admin`
- Responsive Tailwind styling
- Includes dedicated pages for my Final Year Project and Year 2 Java calculator
- Playable Tetris clone on the Games page with a standard seven-piece grab bag randomizer andwith Super Rotation System (SRS) on the Games page

## Project Structure

```
/
├── public/
│   └── admin/           # Netlify CMS
├── src/
│   ├── assets/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   └── content/
│       ├── blog/
│       └── projects/
└── ...
```

`src/pages/tunes.astro` now fetches Last.fm data on each visit using client-side JavaScript. Track names are normalized so the same song isn't listed twice when credits differ.

## Commands

Run these from the project root:

| Command             | Action                                        |
| :------------------ | :--------------------------------------------- |
| `npm install`       | Install dependencies                           |
| `npm run dev`       | Start the dev server                           |
| `npm run build`     | Build the production site to `./dist/`         |
| `npm run preview`   | Preview the built site locally                 |
| `npm run astro ...` | Run additional Astro CLI commands              |

## Docker

Use Docker to build and preview the site without installing Node locally:

```sh
docker compose up --build
```

The site will be available at http://localhost:8484. Can also set `GIT_REPO` to a GitHub URL so the container pulls the latest changes each time it starts. Optionally set `GIT_BRANCH` if a branch other than `main` is needed.
Remember to provide `LASTFM_USER` and `LASTFM_API_KEY` in your environment when building.
