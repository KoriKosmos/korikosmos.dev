---
title: 'Rebuilding korikosmos.dev: React Islands and Keystatic'
description: >-
  Porting the site to React islands and swapping Decap for Keystatic in GitHub
  mode.
pubDate: 2026-07-10
---
I spent a chunk of this week rebuilding korikosmos.dev from the inside out. The site looks much the same as it did before, but almost everything underneath has changed. Three pieces landed together: a move to React islands, a swap from Decap to Keystatic for the CMS, and a new way of running the whole thing on my homelab. Here is how it went.

## React islands

The first phase was pulling the site onto React. Astro lets you sprinkle interactive framework components into otherwise static pages and only hydrate the bits that actually need to run in the browser, which is the whole idea behind islands. That fits my site well, because most of it is plain content and only a handful of corners are genuinely interactive.

I started small, converting a few components to `.tsx`: the CV section, the project card, the theme bar, and the oneko toggle. The theme bar and the oneko toggle hydrate on load because they need client-side state, while the CV section and project card stay static since they need no JavaScript at all. From there I ported the rest of the page templates and the interactive scripts across.

The interactive pages were the interesting ones. Tetris, Rock Paper Scissors, the Tunes page, and the homepage typing animation all used to be imperative scripts. They are now `useEffect`-driven islands, but the actual logic underneath, the Tetris engine, the scoring, the Last.fm polling and caching, is unchanged. Pages still keep their Astro frontmatter for server-side data fetching and simply pass the results down as props. I checked each one in a headless browser to make sure nothing regressed, and everything still builds and behaves.

## From Decap to Keystatic

With the front end sorted, I turned to the CMS. The old setup was Decap, loaded from a CDN, with a set of hand-rolled GitHub OAuth routes under `/api/oauth` doing the login dance. It worked, but it was a lot of moving parts to maintain, and a 117-line `config.yml` describing the content model in YAML.

Keystatic replaces all of that. The content model now lives in a typed `keystatic.config.ts`, so my blog and projects collections and the CV singleton are defined in code I can read and refactor. The admin is served by the app itself at `/keystatic`, with `/admin` left as a redirect out of habit. The nicest part of the migration was how little it disturbed. Using `fields.markdoc` with a `md` extension keeps posts as plain Markdown, and saving an existing entry round-trips it byte for byte, so my Astro content collections were left completely untouched. No content rewrite, no reformatting, just a cleaner editor sitting on top of the same files.

## GitHub mode

Keystatic can edit files directly on disk in local mode, which is lovely for offline work, but that is not what I wanted in production. So storage is set to GitHub mode everywhere. Edits authenticate through a GitHub App tied to the repo, and every save lands as a real commit, in development and production alike. That means my history stays honest: content changes show up in the log next to code changes, with no separate publishing pipeline to reason about.

Setup was a one-time thing. Visiting `/keystatic/setup` in dev walks through creating the GitHub App and writes the credentials into `.env`. The admin routes only get built when those credentials are present, so a normal production build with no secrets ships no admin at all. None of the keys ever touch the repo, and I had to repair a mangled `.gitignore` line to be sure of exactly that.

## Worth it

None of this was strictly necessary, the old site worked. But the new stack is easier to reason about: interactivity is proper components instead of loose scripts, the content model is typed instead of YAML, publishing is just committing, and this fixed one of my main activity starting blockers: not actually being able to quickly and efficiently write and publish. That is a much better place to build from, at least for me right now.

## Shout out

I'd like to shout out my beautiful, smart and amazing girlfriend Mandy for inspiring me to do this mini-write-up / blog post / whatever because she really does make me inspired to work on stuff,  and be better! She's currently building a more professional card that I may update here in the future, but for now you can find her at [her carrd!](https://tarotamii.carrd.co) (she does not have the mandy.com domain - she wishes!). I feel really bad for her, especially since I locked in on writing this post while she's in pain, but I love her so much and it's only through her that I found the will to write this in the first place. If you're reading this, I know you'll get through it, and I love you!!!
