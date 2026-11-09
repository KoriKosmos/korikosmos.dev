---
title: 'Mandy Mode: Borrowing Design from the Coolest Person I Know'
description: >-
  How my girlfriend's site at amandata.dev went from a Carrd mirror we rebuilt
  together to a design system I'm openly envious of — and how it inspired the
  new default skin on korikosmos.dev.
pubDate: 2026-11-08
---
If you visit korikosmos.dev without a saved cookie, you don't land on the modern glass-and-constellation site anymore. Those themes are still one click away in the bottom-left corner, right next to the Web 1.0 retro mode, but the site's new default skin is **Mandy mode**.

It is named after, and unapologetically modelled on, [amandata.dev](https://amandata.dev): my girlfriend Mandy's website.

## From a Carrd mirror to watching her lap me in design

Back in July, at the end of my post about [rebuilding this site with React islands and Keystatic](/blog/rebuilding-react-islands), I shouted out Mandy's Carrd (`tarotamii.carrd.co`) and mentioned she was working on a more permanent home on the web.

What happened next is one of my favourite things we've worked on together. As she documented in her own first blog post (*Making amandata.dev*), her site started on Carrd, where she had already established a strong voice and visual direction. To get her off rented space, I pulled a static mirror of the rendered Carrd site to show that it was just ordinary files underneath, and then we rebuilt it together from scratch as clean, hand-written HTML, CSS, and TypeScript — no bundler, no heavy framework, just thin HTML shells and `.ts` files that GitHub Actions compiles on push so she can even edit her site from her phone. We ended up reusing that exact mirror-to-handbuilt workflow for her academic research portfolio ([amandata.org](https://amandata.org)) and her nonprofit build for The Ground Up Project: San Diego ([tgupsd.org](https://tgupsd.org)).

Once the foundation was in place and Mandy took full control of the creative direction, she completely transformed `amandata.dev` — and honestly left my own site's design in the dust.

I think I'm pretty good at the technical side of building software. Give me an SSR pipeline to wire up, a bounded cache with in-flight request coalescing for Last.fm, a mutex-locked JSON store, a Tetris engine with Super Rotation System wall kicks, or an OAuth redirect bug behind a reverse proxy, and I'm right at home. I love plumbing and systems.

What does not come naturally to me is *design* — not just picking colours that pass contrast checks, but giving a page an unmistakable visual soul. Mandy's design skins are unmatched, and I am openly envious of how effortlessly she does it.

## Why `amandata.dev` (and Mandy) is so cool

Part of why her site works so well is that Mandy herself is endlessly interesting. She isn't a traditional CS major; she's pursuing her B.A. in Psychology at San Diego State University, where she works across neuroscience and public health — collecting and preprocessing EEG datasets on cognitive control in Dr. Emily Kappenman's lab, and researching thirdhand tobacco smoke remediation and state-subsidized housing policies with Dr. Georg Matt and Dr. Lydia Greiner (studying 281 housing developments, cataloguing 100 remediation businesses, and winning the SDSU College of Sciences **Dean's Award for Top Poster Presentation**). When she isn't in the lab, she skates, takes art and web commissions, and builds interactive tools under two lines from her site that sum her up better than I ever could: *"hi i build these things for people to play around with"* and *"Education is for everyone."*

If you poke around her **Creations** and **Learn** pages, every single project has so much personality:

- **An Othello / Reversi Learning System (`/othello.html`):** Othello has been one of her favourite abstract strategy games since childhood. Instead of making just another clickable board, she built the teacher she wished existed when she was learning — inspired by the Japanese app *Hiyoko Reversi (ひよこリバーシ)* and *Reversi Online*. It has a Beginner mode (with a teachable robot that samples a blunder rate, strategy tips adapted from Brian Rose's book, and interactive corner/X-square/C-square exercises) and an Advanced study mode where a negamax alpha-beta engine grades every move you play in real time (`best`, `good`, `okay`, `risky`, `blunder`) complete with board coordinates, undo/redo, and a live evaluation graph. And because it's Mandy's site, the discs aren't plain circles: they are 16px pixel-art cat heads (cream cat for white, black cat with amber eyes for black) that break out of the disc circle *"at my specific request."*
- **Synergy (`/synergy.html` & `/synergy-wiki.html`):** A Turing-complete esoteric programming language she designed where every keyword is a corporate standup buzzword. `move the needle` increments a cell, `take a step back` decrements, `pivot` and `deep dive` move the tape pointer, `sync up` and `circle back` form loops, `herding cats` randomizes a cell, `put a pin in it` / `pull the pin` saves and restores the tape, `per my last email` starts a comment, and `hit a bottleneck` halts the program (because, as her wiki notes, every corporate program ends at a bottleneck). She even built an interactive standup console with a live ASCII tape debugger.
- **Open study hubs (`/psy410-flashcards/` & `/stat200-practice.html`):** A 118-term pixel-art flashcard engine for Myers *Experimental Psychology* (Ch. 1–16) with stepped card flips and keyboard grading, plus a full **STAT 200 R Practice Hub** with flashcards, typing drills, quizzes, and an in-browser R console so her classmates — or anyone on the internet — can study for free.

And then there is her visual system (`styles.css` and `theme.ts`), which is the part I kept staring at with envy:

- **Intentional typography:** `Pixelify Sans` at a 2px stroke for the slanted hero display, `Nunito` 600 for warm body copy, and `VT323` for micro-labels and navigation — chosen specifically at 1:58 AM over `Silkscreen` because `VT323`'s font file contains true lowercase glyphs so her nav renders in proper lowercase.
- **Five handcrafted skins (`dark`, `light`, `white`, `pink`, `blue`):** None of her themes are lazy CSS inversions. Her `dark` theme pairs board-room felt (`#1DA05B`) and muted sand gold (`#D9BE7A`) on near-black; `light` swaps neon green for leaf green (`#2E7B3E`) on warm paper and turns headings leaf instead of black; `pink` (Sakura) softens into cream, muted rose, and champagne gold while turning the sleeping hero cat grey so its pink ears and nose pop; `blue` shifts into deep midnight navy; and `white` uses crisp industry-blue accents with its own blue Othello board. Switching themes even updates `<meta name="theme-color">` for mobile overscroll and swaps the Othello demo GIF to a matching palette variant.

After linking her site in my navbar as **My Wife**, looking back at my own default theme felt a little too safe. Her eye for design is so inspiring to me that I decided the highest form of flattery was to build a **Mandy mode** of my own — and make it the front door of `korikosmos.dev`.

## Translating `amandata.dev` into my own fandoms

I didn't want to copy her content or take her assets — the magic of her site is that every pixel reflects *her*. Instead, I wanted to borrow the architectural bones of her design system and fill them with my own world.

Like Webcore mode, Mandy mode (`kk-skin=mandy`) is a complete third skin with its own layout (`MandyLayout.astro`), its own route components (`src/mandy-components/`), and its own scoped stylesheet (`src/styles/mandy.css`, using `md-*` classes so it never collides with DaisyUI).

If you put the two homepages side by side, you can see how every piece of her structure maps across:

1. **The Hero & Sleeping Mascot:** On `amandata.dev`, a 22×13 pixel cat naps on top of the `.dev` in `amandata.dev`, breathing softly with three floating `z`s. On `korikosmos.dev`, my mascot is a 14×16 pixel bat (`MandyHomePage.tsx`). Because bats don't sit on ledges, mine hangs upside-down by its feet from the bottom of `.dev`, wings folded, breathing from its toes while its `z`s drift up beside its ears.
2. **The Sections & "The Record":** Her two-column `About me | Projects` row, her `Research Activity` (`the record` counting 100 businesses catalogued, 281 housing developments studied, and 57 properties surveyed alongside her R/SPSS/EEG Toolkit), her `Blog | Contact` split, and her timestamped `Changelog` all have counterparts here. In the slot where her homepage highlights her research, mine has a **Fandoms** section (`what I'm into`), and my `By the numbers` section tracks 4 countries lived in (Pakistan, Indonesia, Wales, England), blog posts, portfolio projects, playable games, programming languages on my CV, and the 4 fandom themes in this skin.
3. **From `othello-bg.ts` to `MandyBackdrop.tsx`:** On Mandy's site, `othello-bg.ts` runs a quiet, self-playing Othello study behind the page. It evolved from blurred edge boards to a 3D wooden board with animated strategy notes before she flattened it into a graphic pixel study rendered onto a tiny offscreen canvas (`PIXEL = 3`) and upscaled with `image-rendering: pixelated` and a seeded `mulberry32` PRNG. In `MandyBackdrop.tsx`, I used that exact `PIXEL = 3` offscreen buffer and `mulberry32` trick (plus a "calm column" cut out down the middle so body text stays readable) to drive **four self-playing fandom scenes**, one for each sub-theme in the top bar's **Change Theme** menu:
   - **Gotham (Batman, the default):** Near-black `#0B0C10` with utility-belt gold `#F5C518` playing the role of Mandy's `--green` and Gotham steel blue `#8FA3BF` playing `--sand`. Behind the page, rain falls across a jagged skyline, the Bat-Signal sweeps the low clouds, and tiny pixel bats cross between rooftops.
   - **Basement (The Binding of Isaac):** Warm cellar browns (`#1A110C`) and tear-drop crimson (`#E04A33`). A top-down cellar room plays out in the margins: a crying kid wanders between rocks and pops flies with tears.
   - **Kanto (Pokémon):** Cream paper (`#F6F4EC`), Poké Ball red (`#D7261E`), and Cerulean blue (`#2A62B8`). A trainer wanders through tall grass on a tile grid while a Poké Ball wobbles three times.
   - **Inkwell (Comics):** Warm newsprint (`#F3EBD8`), magenta (`#C8006E`), and cyan (`#00739E`), pairing `Bangers` headings with drifting halftone paper, faint panel gutters, and comic sound-effect bursts (`POW!`, `KRAK!`, `THWIP!`).

## Getting the bat emblem right

While Mandy has her pixel cat across her hero, favicon, and Othello discs, my recurring motif is the bat — and getting it right took a few tries in the commit log.

My first nav mark sat on a 16-pixel-wide grid (which has no centre column, leaving the ears, head, and tail one pixel lopsided relative to the wings) and was rotated `-10deg`, which smeared the crisp edges off the pixel grid. Later, I decoded a 36×12 braille-art bat I had drawn, mirrored the left half so every row was a palindrome, and put it in the Gotham Bat-Signal — only to realise that because the backdrop buffer is upscaled 3× (`PIXEL = 3`), a 36-pixel-wide sprite turned into a 108px monster in the sky, and the searchlight sat right under the sticky navbar on mobile.

Eventually I hand-reduced that braille bat into a symmetrical 20×7 palindromic pixel grid in `src/page-components/PixelBat.tsx`, taught the Gotham backdrop to measure the navbar height on init and resize so the searchlight always clears it, and used `PixelBat` as the single bat emblem across the entire site: the Mandy nav mark (at 2×), the Gotham Bat-Signal, the modern Batman theme swatch, and the Mandy mode button in the corner skin switcher.

## Where my engineering brain met her design

Adapting Mandy's static HTML/TS design into an Astro 5 SSR + React 19 islands architecture also gave me some fun technical problems to solve:

- **No-JS navigation by default:** Because Mandy mode is now `DEFAULT_SKIN`, every first-time visitor lands in it, which means it has to work even if JavaScript never runs. In `MandyNav.tsx`, the top-bar dropdowns (`Me`, `Work`, `Play`) render as native HTML `<details>` disclosures so they open out of the box without scripts (and `tests/render/pages.test.ts` verifies that every menu link is reachable in raw server HTML). Once React hydrates, it takes over the `open` state to add arrow-key navigation, `Escape` handling, and one-menu-at-a-time behaviour. Likewise, `MandyEffects.tsx` (typewriter, stat count-ups, and `<mark class="md-key">` highlight sweeps) fails open: nothing is hidden until the script adds `md-js` to `<html>`.
- **Zero-flash server-rendered sub-themes:** Where `amandata.dev` uses a tiny inline `<head>` script to read `localStorage` on static GitHub Pages, `korikosmos.dev` is server-rendered. Picking Gotham, Basement, Kanto, or Inkwell writes a `kk-mandy-theme` cookie that `src/middleware.ts` resolves before rendering `<html>`, so the very first paint already carries the right `data-theme="mandy-<name>"` attribute and critical background CSS.
- **Wrapping islands without forking them:** I didn't want to maintain three separate copies of Tetris, Star Pairs, Rock Paper Scissors, the Last.fm Tunes dashboard, or the blog reactions. By registering `mandy-gotham`, `mandy-basement`, `mandy-kanto`, and `mandy-inkwell` as DaisyUI themes in `tailwind.config.mjs` alongside their `mandy.css` tokens, `data-theme="mandy-<name>"` does double duty: every interactive React island sits untouched inside `MandyIslandShell.astro` and automatically recolours to match the active fandom.
- **Reduced motion:** Just like `othello-bg.ts`, `MandyBackdrop.tsx` checks `prefers-reduced-motion: reduce` and renders a single representative static frame per fandom theme instead of ticking the 30fps loop, while `mandy.css` silences the blinking cursors, floating `z`s, and typewriter transitions.

## Thank you, Mandy

Working on this skin made me appreciate Mandy's eye for design even more than when we first rebuilt `amandata.dev` together. I can spend all day optimising caches, writing JSDOM render tests, and tweaking server middleware, but her ability to give a website warmth, humour, and a visual identity that feels completely alive is something I look up to endlessly.

If you haven't visited [amandata.dev](https://amandata.dev) yet, go click the **My Wife** link in the navbar — play a round against her Othello coach, write a corporate standup program in Synergy, flip through her psychology flashcards, and check out the original that inspired all of this. She's brilliant, she's the coolest person I know, and I'm very lucky that I get to be inspired by her every day.
