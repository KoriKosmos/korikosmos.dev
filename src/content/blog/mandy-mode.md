---
title: 'Mandy mode: borrowing design from my favourite person'
description: >-
  How my girlfriend's site at amandata.dev went from a Carrd mirror we rebuilt
  together to a design system I'm openly envious of, and why I rebuilt its
  structure around my own fandoms as the new default skin on korikosmos.dev.
pubDate: 2026-11-08
---
If you've visited korikosmos.dev recently without a saved preference, you didn't land on the modern glass-and-constellation site. That skin is still one click away in the bottom-left dock, right next to the Web 1.0 retro mode, but the front door of this website is now Mandy mode. It has a black pixel nav bar, a slanted pixel wordmark with a little bat asleep on it, a tagline that types itself out, and a small pixel scene playing behind every page.

It has been the default skin since the day I shipped it. I want to explain where it came from, because the honest answer is that the design isn't really mine.

It is named after, and modelled on, [amandata.dev](https://amandata.dev), the personal website of my girlfriend, Amanda Ta. Her bio ends with *"You can also call me Mandy"*, hence the name. If you've ever clicked My Wife in my nav bar, that's her, and the link goes straight to her site.

## The website that made me want to change mine

I think I'm pretty good at the technical side of building software. Give me an SSR pipeline to wire up, a bounded cache with in-flight request coalescing for Last.fm, a mutex-locked JSON store, a Tetris engine with Super Rotation System wall kicks, or an OAuth redirect bug hiding behind a reverse proxy, and I'm right at home. I can spend ages on how a site works underneath and be very pleased with the result.

Then I look at `amandata.dev` and immediately want to work on mine again.

The first time you open her homepage, you notice a dozen small choices working together at once. A little pixel cat crawls out onto the slanted wordmark and curls up to sleep, an introduction types itself out underneath, ruled section headings and tiny micro-labels give every card a clear place without crowding the page, and an Othello board plays a game in the margins. When you flip through her themes, the details follow through: the palette shifts, the board changes, and even the sleeping cat recolours to match.

Her design skins are unmatched as far as I'm concerned, and I'm openly envious of them. I can rebuild her layout piece by piece and explain how every part works, but deciding what belongs together in the first place is a skill of its own. That gap is the reason my site now opens with a skin named after her.

## From a Carrd mirror to watching her lap me in design

Back in July, at the end of my post about [rebuilding this site with React islands and Keystatic](/blog/rebuilding-react-islands), I shouted out Mandy's old Carrd page (`tarotamii.carrd.co`) and mentioned she was working on a more permanent home on the web.

What happened next is one of my favourite things we've worked on together. As she wrote in her first blog post ([Making amandata.dev](https://amandata.dev/blog.html?p=making-amandata-dev)), her site started on Carrd, where she had already worked out a strong voice and visual direction. To get her off rented space, I pulled a static mirror of the rendered Carrd site and hosted it at `/amandata` on my domain to show that her site could be ordinary files she owned. In September we rebuilt it together from scratch as hand-written HTML, CSS, and TypeScript: thin HTML shells and `.ts` files that GitHub Actions compiles on push so she can edit her site from her phone without a local bundler or framework. We ended up reusing that same mirror-to-handbuilt workflow for her academic research portfolio ([amandata.org](https://amandata.org)) and she is hosting the transitional files for her nonprofit The Ground Up Project: San Diego ([tgupsd.org](https://tgupsd.org)).

Once the foundation was in place and Mandy took over the creative direction, she transformed `amandata.dev` across more than 550 commits and left my own site's design in the dust.

## Why `amandata.dev` (and Mandy) is so cool

A big part of why her site works so well is Mandy herself. She is pursuing her B.A. in Psychology at San Diego State University, working across neuroscience and public health. In Dr. Emily Kappenman's lab she collected and preprocesses EEG datasets on cognitive control, and with Dr. Georg Matt and Dr. Lydia Greiner she researches thirdhand tobacco smoke remediation and state-subsidised housing policies, studying 281 housing developments, cataloguing 100 remediation businesses, and winning the SDSU College of Sciences Dean's Award for Top Poster Presentation. Outside the lab, she skates, ideates, and builds interactive tools under two lines from her bio that sum her up better than I ever could: *"hi i build these things for people to play around with"* and *"Education is for everyone."*

If you poke around her Creations and Learn pages, every project has her personality all over it.

Othello has been one of her favourite abstract strategy games since childhood, and on [`/othello.html`](https://amandata.dev/othello.html) she built the teacher she wished existed when she was learning, inspired by the Japanese app *Hiyoko Reversi (ひよこリバーシ)* and *Reversi Online*. Beginner mode pairs a teachable robot that samples a blunder rate with strategy tips adapted from Brian Rose's book and interactive corner, X-square, and C-square exercises. Advanced study mode runs a negamax alpha-beta engine that grades every move you play in real time (`best`, `good`, `okay`, `risky`, `blunder`) alongside board coordinates, undo and redo, and a live evaluation graph. Because it's Mandy's site, the discs are 16px pixel-art cat heads (a cream cat for white and a black cat with amber eyes for black) that poke out of the disc circle *"at my specific request."*

Then there is Synergy ([`/synergy.html`](https://amandata.dev/synergy.html) and [`/synergy-wiki.html`](https://amandata.dev/synergy-wiki.html)), a Turing-complete esoteric programming language based on [Brainfuck](https://en.wikipedia.org/wiki/Brainfuck) she designed where every keyword is a corporate standup buzzword. `move the needle` increments a cell, `take a step back` decrements, `pivot` and `deep dive` move the tape pointer, `sync up` and `circle back` form loops, `herding cats` randomises a cell, `put a pin in it` and `pull the pin` save and restore the tape, `per my last email` starts a comment, and `hit a bottleneck` halts the program because, as her wiki notes, every corporate program ends at a bottleneck. She also built an interactive standup console with a live ASCII tape debugger, and [her blog post about it](https://amandata.dev/blog.html?p=synergy-corporate-buzzword-esolang) is one of the funniest things on her site.

Alongside those, she built open study hubs for her classes (`/psy410-flashcards/` and `/stat200-practice.html`): a 118-term pixel-art flashcard engine for Myers *Experimental Psychology* (chapters 1 to 16) with stepped card flips and keyboard grading, plus a STAT 200 R Practice Hub with flashcards, typing drills, quizzes, and an in-browser R console so her classmates and anyone else online can study for free.

Her visual system in `styles.css` and `theme.ts` is the part I kept staring at with envy. She pairs `Pixelify Sans` at a 2px stroke for the slanted hero display with `Nunito` 600 for warm body copy and `VT323` for micro-labels and navigation, which she picked over `Silkscreen` because `VT323`'s font file contains true lowercase glyphs so her nav renders in proper lowercase. Her five themes (`dark`, `light`, `white`, `pink`, and `blue`) each have their own palette: `dark` pairs board-room felt (`#1DA05B`) and muted sand gold (`#D9BE7A`) on near-black; `light` swaps neon green for leaf green (`#2E7B3E`) on warm paper and turns headings leaf green instead of black; `pink` (Sakura) softens into cream, muted rose, and champagne gold while turning the sleeping hero cat grey so its pink ears and nose stand out; `blue` shifts into deep midnight navy; and `white` uses crisp industry-blue accents with its own blue Othello board. Switching themes also updates `<meta name="theme-color">` for mobile overscroll and swaps the Othello demo GIF to a matching palette variant.

After linking her site in my navbar as My Wife, looking back at my own default theme felt a little too safe. By late October I stopped pretending I wasn't trying to copy her homework and decided to build a Mandy mode of my own as the front door of `korikosmos.dev`.

## Translating `amandata.dev` into my own fandoms

The magic of her site is that every pixel belongs to her, so I left her content and assets alone and borrowed the structure of her layout to fill with my own interests.

If you put the two homepages side by side, you can see how the pieces map across. On `amandata.dev`, her 22×13 pixel cat naps curled up on top of `.dev`. On `korikosmos.dev`, her cat became a 14×16 pixel bat. Because bats don't sit on ledges, mine hangs upside down by its feet from underneath `.dev`, wings folded, breathing from its toes while its `z`s drift up beside its ears.

The page rhythm carries over too: the same three typefaces (loaded only in this skin), the black pixel bar with dropdown menus, page search, and a Change Theme menu, the typewriter tagline, the ruled section headings, and the left-bordered cards that keep every page calm and easy to scan. Where her homepage covers her research and academic record, mine has a Fandoms section (`what I'm into`) and a By the numbers section tracking the four countries I've lived in (Pakistan, Indonesia, Wales, and England), my blog posts, portfolio projects, playable games, CV languages, and the four fandom themes in this skin.

My favourite piece to adapt was her self-playing Othello backdrop (`othello-bg.ts`). She renders the game into a tiny offscreen buffer and upscales it three times (`PIXEL = 3`) with smoothing turned off so every pixel stays crisp, seeding the layout with a deterministic `mulberry32` generator so a resize keeps the same scene. In `MandyBackdrop.tsx`, I borrowed that `PIXEL = 3` buffer and `mulberry32` seed, cut a calm column down the middle so body copy stays easy to read, and pointed it at four scenes for my own fandoms:

- Gotham (Batman, the default) uses near-black and utility-belt gold, with rain falling across a jagged skyline, the Bat-Signal sweeping the low clouds, and tiny pixel bats crossing between rooftops.
- Basement (The Binding of Isaac) uses warm cellar browns and tear-drop crimson, where a crying kid wanders between rocks in a top-down cellar room and pops flies with tears. I'm very happy that my personal website now has a reasonable excuse to simulate a tiny Isaac basement in the background.
- Kanto (Pokémon) pairs cream paper, Poké Ball red, and Cerulean blue while a trainer wades through tall grass on a tile grid and a Poké Ball wobbles three times.
- Inkwell (comics) uses warm newsprint, magenta, and cyan, pairing `Bangers` headings with halftone dots, faint panel gutters, and comic sound-effect bursts (`POW!`, `KRAK!`, `THWIP!`).

## The engineering is easy; the taste is not

Getting Mandy mode wired into an Astro 5 SSR and React 19 islands architecture gave me the kind of technical problems I enjoy solving.

Both the active skin (`kk-skin`) and the chosen fandom palette (`kk-mandy-theme`) live in cookies that `src/middleware.ts` resolves before anything renders. The server writes `data-skin="mandy"` and `data-theme="mandy-<name>"` straight onto `<html>` alongside critical background CSS, so the first paint lands in the right palette without flashing.

Because Mandy mode is the default skin, every first-time visitor lands in it, which means it has to work before any script runs or if JavaScript is disabled. The top-bar dropdowns (`Me`, `Work`, `Play`) in `MandyNav.tsx` are native `<details>` disclosures that open out of the box, and my post-build render tests verify that every menu link is reachable in raw server HTML. React only takes over the `open` state after hydration to add arrow-key navigation, `Escape` handling, and one-menu-at-a-time behaviour. The typewriter and highlight animations also fail open so no content is ever stuck hidden.

I also wanted to avoid maintaining three separate copies of Tetris, Star Pairs, Rock Paper Scissors, the Last.fm Tunes page, and the blog reactions. By registering `mandy-gotham`, `mandy-basement`, `mandy-kanto`, and `mandy-inkwell` as DaisyUI themes in `tailwind.config.mjs` alongside their `mandy.css` tokens, `data-theme="mandy-<name>"` does double duty: the interactive islands sit untouched inside `MandyIslandShell.astro` and take on the active fandom's colours automatically. Under `prefers-reduced-motion`, the backdrop draws a single static frame and the blinking cursors and floating `z`s stay still.

None of that plumbing is why Mandy mode feels good to use, though. That comes from decisions Mandy made first: which font does which job, how much air a section gets, where a rule sits, and how a card leans on its left border.

My bat emblem is the clearest proof. Early in November I made six commits in a single day about one bat. My first nav mark sat on a 16-pixel-wide grid, which has no centre column, leaving the ears and tail one pixel lopsided relative to the wings, and was tilted `-10deg`, smearing the crisp pixel edges. I replaced it with a pixel version of a 36×12 braille-art bat I'd drawn and put it in the Gotham Bat-Signal, only to realise that because the backdrop canvas is upscaled 3×, a 36-pixel sprite became a 108-pixel monster in the sky that hid right behind the sticky navbar on mobile. I scaled it down, scaled the Bat-Signal back up, nudged it clear of the nav bar, and finally hand-reduced the whole thing into a symmetrical 20×7 palindromic grid in `src/page-components/PixelBat.tsx` so the Mandy nav mark, the Bat-Signal, the modern Batman theme swatch, and the skin switcher button all share one crisp definition.

That is what design looks like when I do it: six commits and an afternoon of trial and error to land somewhere her cat seems to have walked to on the first try. Every row of my bat has to be a palindrome or it comes out lopsided, and the only reason I know that is that I built it wrong first.

## Why it's called Mandy mode (and why it's the default)

I could have called this the pixel skin or picked a technical name, but Mandy mode felt right. I made it the default on the day I finished it. The modern skin is still one click away in the dock, and the retro skin is still there for anyone who misses 2003, but this is the version of my site I'm proudest of, and it's the one I want people to see first. Every time I open my own site now, or work on it, I see something I learned from someone I admire.

Working on this skin made me appreciate Mandy's eye for design even more than when we first rebuilt `amandata.dev` together. I can spend all day optimising caches, writing JSDOM render tests, and tweaking server middleware, but her ability to give a website warmth, humour, and a visual identity of its own is something I look up to endlessly. I admire her taste so much: I love the tiny things she notices, the interests she follows, and how much of her personality she pours into everything she makes.

She is clever, funny, cool, awesome, and genuinely one of the most interesting people I know. She can move from psychometrics and EEG preprocessing to Othello engines to a joke programming language in a single (very convoluted and hard to follow) conversation, and her whole site lives up to the *"Education is for everyone"* line in her bio: everything she builds has that same signature of wanting other people to get it and have fun learning from it. She's brilliant, she's the coolest person I know, and I'm so lucky that I get to call her my girlfriend (even if I'm still a little jealous of how good her website looks).

Seeing her make things makes me want to make things too, and watching her work has made me want to get better at building places on the web that people actually enjoy being around. Sometimes that means fixing something I've been putting off. Sometimes it means writing a post. This time it meant adding a whole new way to browse my website, complete with a sleeping bat.

So: thank you, Mandy. If Mandy mode looks good, that's down to you. Any bugs are mine.

If you haven't visited [amandata.dev](https://amandata.dev) yet, go click the My Wife link in the navbar: start with the cat, stay for a round against her Othello coach, please go write a corporate standup in Synergy, flip through her psychology flashcards, and see the original that inspired all of this. It deserves the visit, and you might find something there that inspires you as well.

Mandy, if you're reading this: I think you're amazing. Thank you for giving me so many reasons to get excited about making stuff, and for inspiring me every single day. I love you!!!
