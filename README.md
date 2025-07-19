# korikosmos.dev

This repo contains the source for **korikosmos.dev**, my personal website built with [Astro](https://astro.build) and Tailwind CSS. Here I share my projects, CV, blog posts and the music I'm currently listening to.

## Setup

1. Install dependencies
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and add my Last.fm credentials
   ```sh
   cp .env.example .env
   ```
   `LASTFM_USER` and `LASTFM_API_KEY` are read automatically by Astro. These values never reach the browser – they're only used server side. Astro loads variables from this file. Access them with `import.meta.env` during the build; `Astro.env` only works when using a server output.

## Development

Start a local server at `http://localhost:4321`:

```sh
npm run dev
```

## Features

- Displays my most recently played tracks with album artwork
- Toggle a little cursor-following cat from the corner button
- Showcases my projects from `src/content/projects`
- Manage posts and projects from Netlify CMS at `/admin`
- Responsive Tailwind styling

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

`src/pages/tunes.astro` now fetches Last.fm data on each visit using client-side JavaScript.

## Commands

Run these from the project root:

| Command             | Action                                        |
| :------------------ | :--------------------------------------------- |
| `npm install`       | Install dependencies                           |
| `npm run dev`       | Start the dev server                           |
| `npm run build`     | Build the production site to `./dist/`         |
| `npm run preview`   | Preview the built site locally                 |
| `npm run astro ...` | Run additional Astro CLI commands              |
