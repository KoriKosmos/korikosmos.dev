# korikosmos.dev

This repo contains the source for **korikosmos.dev**, my personal website built with [Astro](https://astro.build) (SSR) and [React](https://react.dev) islands, styled with Tailwind CSS + DaisyUI. Astro handles routing and server-side data fetching; every rendered component is React. Here I share my projects, CV, blog posts, games and the music I'm currently listening to.

It ships in **three skins**, switched from the buttons in the bottom-left corner. The default is **Mandy mode**: the structure of [amandata.dev](https://amandata.dev), my girlfriend's site, rebuilt around my own fandoms, with a pixel scene playing behind every page. There is also the modern skin, and a Web 1.0 personal homepage with tiled backgrounds, 88x31 buttons, blinkies, a marquee, a hit counter, a webring and a guestbook. Each skin is a parallel set of layouts and page bodies, not a restyle.

## Setup

1. Install dependencies
   ```sh
   npm install
   ```
2. Copy `.env.example` to `.env` and add my Last.fm credentials, plus the
   the optional Pulsoid (live heart rate) and Keystatic (CMS) values.
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

- **Saved themes on first paint**: I keep my modern theme in a cookie as well as local storage, so the server sends the selected theme in the HTML. Legacy choices migrate automatically. The picker follows the displayed theme, and cookie restoration still works during client navigation when local storage is blocked. Retro keeps its own independent scheme.
- **Live Tunes updates**: The playing badge and recent history update together, including when the same song stops. Period changes cancel obsolete requests, charts load when selected, and live polling pauses in background tabs. Missing artwork has a local fallback.
- **Resilient music loading**: I fetch independent Last.fm sections together and share cached requests between visitors. Recent tracks refresh quickly, charts are cached for 15 minutes, and a slow or unavailable Last.fm service cannot hold the page open indefinitely: once I have a good answer, a refresh that takes longer than 750ms (or fails) is answered from that last good copy instead. API failures with nothing cached return an uncached retry response.
- **Star Pairs** at `/games/star-pairs`: My constellation memory game has three board sizes, keyboard and touch controls, automatic pausing when leaving the tab, and personal bests stored on the device. It works in all three skins and needs no account or external assets.
- **Blog reading tools**: My posts show publication dates, reading-time estimates and a linked contents list. A progress strip tracks the article, and readers can copy a section link or a code block. The article and contents remain readable without JavaScript in every skin.
- **Searchable blog and portfolio**: I can search titles, descriptions and post bodies, sort the results, and filter projects with public GitHub source. Filters are shareable URLs and work in all three skins without JavaScript.
- **Live heart rate**: When Pulsoid is configured (`PULSOID_ACCESS_TOKEN` or `PULSOID_WIDGET_URL`), I show my live heart rate in every skin's footer, an `/about` box with a sweeping ECG trace, and a draggable floating monitor toggled from the ♥ dock button that remembers its open state and position across pages. `/api/heartrate` shares a 3-second cache across visitors, hides the widget when the strap is off, and falls back to the free Pulsoid widget iframe if the token is missing or lapses.
- **Mandy mode**, my default skin:
  - It follows amandata.dev's layout: a pixel nav with dropdowns, page search and a "Change Theme" menu, a slanted pixel wordmark with a sleeping pixel bat hanging from it (its coat changes with each theme, the way amandata's cat does: the classic dark Batman bat in Gotham, tan in Basement, Poké Ball red in Kanto, and comic-age gold and silver in Inkwell), a typewriter tagline, ruled sections and left-bordered cards.
  - Its four themes are my fandoms, and each one draws its own self-playing pixel scene in place of her Othello board. Gotham (Batman) has a bat-signal over a rainy skyline, Basement (The Binding of Isaac) has a crying kid clearing a cellar, Kanto (Pokémon) has a trainer in tall grass, and Inkwell (comics) has halftone paper with POW! bursts.
  - The 20×7 pixel bat in `src/page-components/PixelBat.tsx` is the site's single bat emblem, shared by the Mandy nav mark, the Gotham Bat-Signal, the modern Batman theme swatch, and the Mandy skin button.
  - The theme is a cookie rendered on the server, so the first paint is already right. Reduced motion gets a single still frame.
  - It works without JavaScript: the nav menus are native disclosures, and every section stays readable if scripts never run.
  - The interactive islands are the same components, wrapped in `MandyIslandShell.astro`; each theme is also a DaisyUI theme, so they recolour without being forked. All the art is drawn in code.
- **Webcore mode** — a full Web 1.0 skin behind a toggle:
  - A `kk-skin` cookie, resolved in `src/middleware.ts` before anything renders. `src/layouts/Layout.astro` is a dispatcher that picks `MandyLayout.astro`, `ModernLayout.astro` or `RetroLayout.astro`, and each route renders the matching `src/mandy-components/Mandy*`, `src/page-components/*` or `src/retro-components/Retro*` body.
  - Four sub-themes of its own — y2k (the default), kawaii, geocities, cyber — switched from the retro control panel and remembered in `localStorage`.
  - Every graphic is generated, not hotlinked: `npm run gen:retro` draws all 35 assets in `public/retro/` as animated SVG. The output is committed, so the build never runs the script.
  - The interactive islands (Tetris, Rock Paper Scissors, Star Pairs, Tunes, Reactions) are the same components, wrapped in `RetroIslandShell.astro` and restyled from outside — not forked.
  - Reduced motion stops everything that blinks, scrolls, sparkles or rainbows, the chiptune never autoplays, and every sub-theme's colour pairs are checked against WCAG contrast ratios.
  - Because the skin lives in a request cookie, no route using `Layout.astro` can be prerendered — the blog and portfolio `[slug]` pages are SSR, and `astro.config.mjs` feeds their URLs to the sitemap via `customPages`.
- **Guestbook** at `/guestbook`, in all three skins — persistent (`data/guestbook.json`), with a public `GET /api/guestbook` and a same-origin, rate-limited, body-capped `POST`. The entry cap rejects rather than evicts, so a flood can never destroy signatures, and submitted URLs are allowlisted to `http:`/`https:` before being rendered as links. Per-post emoji reactions use the same guards.
- **Hit counter** on the retro skin, bumped once per visitor session (`data/hits.json`).
- **React islands architecture**:
  - `.astro` pages are thin wrappers: they do the server-side data fetching (content collections, Last.fm, `cv.json`) and render the active skin's React body (`src/mandy-components/`, `src/page-components/` or `src/retro-components/`) with the result as props.
  - Presentational components render to static HTML with zero client JS; interactive ones (the games, Tunes, reactions, reading tools, heart-rate widgets, guestbook forms, theme and skin switchers, the oneko toggle, and each shell's own chrome such as the command palette or the Mandy nav and backdrop) hydrate on a schedule: `client:load` for the games and what each page is about, `client:idle` for shell chrome (which works without JS until then), and `client:visible` for below-the-fold widgets like reactions and the `/about` heart card.
  - Mandy mode's fonts are self-hosted (Fontsource, Latin subset) rather than loaded from Google Fonts, and the nav search and ⌘K palette fetch posts and projects from a prerendered `/content-index.json` on first use instead of carrying them in every page.
  - Reusable components live in `src/components/` (also synced to a Claude Design project via `.design-sync/`); page-specific markup lives in `src/page-components/`.
  - **CV Page**: Fully data-driven using `src/data/cv.json` and reusable `CvSection` components.
  - **Tetris**: The rules live in a pure, unit-tested engine (`src/lib/tetris.ts`) with no DOM; `src/lib/tetrisCanvas.ts` draws it, and `Tetris.tsx` owns the animation loop, input, and leaderboard.
  - **Tunes Page**: Last.fm integration uses a server-side proxy (`src/pages/api/lastfm.ts`) to prevent API key exposure; React state is the source of truth, polling for now-playing updates.
  - **High Scores**: Global leaderboard implemented via server-side API (`src/pages/api/scores/[game].ts`, accessed as `/api/scores/:game`) and persistent JSON storage. Like the guestbook, it only accepts same-origin, size-capped, rate-limited posts.
  - **Config**: Centralized navigation and site settings in `src/config.ts`.
- Displays my most recently played tracks with album artwork
- I recognise both Last.fm artist credit formats in `/now` and Tunes, including recent history and duplicate filtering.
- I keep usable Tunes charts visible when a refresh fails, preserve each period separately, and retry only the charts that failed.
- My retro blog's newest-post badge, update date and entry total always describe the full blog, even when I filter or reorder the results.
- Each Star Pairs round starts with a fresh timer, so restarting during play cannot carry an old timer tick into a new personal best.
- Normalizes track names to avoid duplicates credited in different languages
- Toggle a little cursor-following cat from the corner button
- Switch between five DaisyUI themes (dark, light, forest, spider-man, batman) using the theme bar, four retro sub-themes in webcore mode, or four fandom themes in Mandy mode
- Showcases my projects from `src/content/projects`
- Manage posts, projects, and CV via **Keystatic** at `/keystatic` (schemas in `keystatic.config.ts`).
- Responsive Tailwind styling
- Includes dedicated pages for my Final Year Project and Year 2 Java calculator
- I built a Guideline-style Tetris for the Games page: SRS rotation with wall kicks, hold, a ghost piece, a three-piece queue, T-spins, back-to-back and combo scoring, pause (P/Esc, or automatically when I leave the tab), touch controls on phones and tablets, a controls legend under the board that matches the device I'm on, and a **global leaderboard**. It has juice too: hard-drop trails, line-clear bursts, a gold slam for a Tetris, purple for T-spins, a rainbow sweep for perfect clears, combo callouts that heat up as the combo grows, screen shake that scales with the moment, and a grey-out when I top out — all toned down to still fades under reduced motion. It waits for me to press Start and only asks for a name when there's a score to save.
- I also added a simple Rock Paper Scissors game that keeps my running score in `localStorage` and submits it to the same server leaderboard.

## Project Structure

```
/
├── keystatic.config.ts  # Keystatic CMS schemas (blog, projects, CV)
├── public/
├── src/
│   ├── assets/og/       # Generated OG card artwork (starfields + site mark)
│   ├── components/      # Reusable React components (design-sync surface)
│   ├── page-components/ # Modern page bodies + shared interactive islands & widgets
│   ├── retro-components/# Web 1.0 skin: a Retro* body per route + SkinToggle, RetroChrome
│   ├── mandy-components/# Mandy mode: a Mandy* body per route + nav, effects, backdrop, island shell
│   ├── config.ts        # Site configuration & navigation
│   ├── data/            # Static data (CV) + data shared by all three skins (uses, links, now)
│   ├── env.d.ts         # Type definitions
│   ├── fonts/           # Vendored Noto Sans TTFs (400 + 800) for OG cards
│   ├── layouts/         # Layout.astro (dispatcher), ModernLayout, RetroLayout, MandyLayout, SeoHead
│   ├── lib/             # Game engines, skin/theme cookies, Last.fm, Pulsoid, guestbook, hits, rate limiter, JSON store
│   ├── middleware.ts    # Skin/theme resolution, hit counter, Keystatic OAuth origin fix
│   ├── pages/           # .astro routes: SSR data fetch → render the right body component
│   │   ├── api/         # Server-side API endpoints
│   │   ├── games/       # Tetris, Rock Paper Scissors, Star Pairs
│   │   ├── og/          # Prerendered OG image endpoint
│   │   ├── content-index.json.ts # Prerendered posts+projects index for search
│   │   └── ...
│   ├── styles/          # global.css (Tailwind), retro.css (rt-*), mandy.css (md-*)
│   └── content/
│       ├── blog/
│       └── projects/
├── scripts/
│   ├── gen-retro-assets.mjs  # Draws public/retro/* — run with `npm run gen:retro`
│   ├── gen-og-assets.mjs     # Draws src/assets/og/* — run with `npm run gen:og`
│   └── new-post.js           # Scaffolds a new blog post — run with `npm run new-post`
├── data/                # Runtime state: scores/, guestbook.json, hits.json, reactions.json (volume-mounted)
├── drafts/              # Unpublished / model-specific blog drafts kept outside src/content/blog/
├── tests/               # Unit tests + post-build SSR render tests
├── .design-sync/        # Config for syncing src/components/ to Claude Design
└── ...
```

## Commands

Run these from the project root:

| Command             | Action                                 |
| :------------------ | :------------------------------------- |
| `npm install`       | Install dependencies                   |
| `npm run dev`       | Start the dev server                   |
| `npm run check`     | Check TypeScript without emitting files |
| `npm run build`     | Build the production site to `./dist/` |
| `npm test`          | Run focused regression tests           |
| `npm run test:render` | Check production HTML in all three skins (build first) |
| `npm run preview`   | Preview the built site locally         |
| `npm run gen:retro` | Redraw the retro graphics in `public/retro/` |
| `npm run gen:og`    | Redraw the OG card artwork in `src/assets/og/` |
| `npm run new-post`  | Scaffold a new blog post in `src/content/blog/` |
| `npm run astro ...` | Run additional Astro CLI commands      |

I run `npm run check`, `npm test`, `npm run build` and `npm run test:render`
before committing. The TypeScript check covers my TS/TSX files and checked
JavaScript configuration; the build and render checks also exercise Astro pages.

## Docker

Build and run the containerized application (using Node.js adapter):

```sh
docker compose up --build
```

The site will be available at http://localhost:8484.

The container does **not** copy `data/` into the image — the game leaderboards, guestbook, post reactions, and hit counter all persist through the volume mount defined in `docker-compose.yml`. Without a writable `data/`, the guestbook refuses signatures and the counter falls back to an in-memory count rather than failing the page.

**Note**: This uses a multi-stage `Dockerfile` that builds the Astro project into a standalone Node.js app. The final image only installs runtime `dependencies`, so build-only packages belong in `devDependencies`. The "pull-on-boot" feature has been removed for stability.

### Updating the site

To update the site with the latest changes from git, run:

```sh
./update-deploy.sh
```

This script will:

1. Pull the latest code (`git pull`).
2. Rebuild the Docker image.
3. Restart the container with the new version.
