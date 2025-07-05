# korikosmos.dev
Personal Website

## Setup

Copy `.env.example` to `.env` inside `korikosmos-dev` and fill in your Last.fm credentials:

```
cp korikosmos-dev/.env.example korikosmos-dev/.env
```

Edit the new `.env` file and set `LASTFM_USER` and `LASTFM_API_KEY`.

Astro will read variables from this `.env` file automatically. These values can
be accessed in server-side code through `Astro.env`. Note that `Astro.env` is
not a file; it is the object representing your environment variables at runtime.
