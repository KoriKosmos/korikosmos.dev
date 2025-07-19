# korikosmos.dev
Personal Website

## Setup

Copy `.env.example` to `.env` inside `korikosmos-dev` and fill in your Last.fm credentials:

```
cp korikosmos-dev/.env.example korikosmos-dev/.env
```

Edit the new `.env` file and set `LASTFM_USER` and `LASTFM_API_KEY`.

Astro will read variables from this `.env` file automatically. For static
builds, use `import.meta.env` to access these values in your server-side code.
`Astro.env` is only available when running with a server output.

## Features

- Displays your most recently played tracks with accompanying album artwork.

- Toggle a cute cursor-following cat using the corner button.
