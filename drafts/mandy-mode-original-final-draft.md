---
title: 'Mandy Mode: Borrowing Design from My Favourite Person'
description: >-
  How my girlfriend's site at amandata.dev went from a Carrd mirror we rebuilt
  together to a design system I'm openly envious of — and why I rebuilt its
  bones around my own fandoms as the new default skin on korikosmos.dev.
pubDate: 2026-11-08
---
If you've visited korikosmos.dev recently without a saved preference, you didn't land on the modern glass-and-constellation site. That skin is still one click away in the bottom-left dock, right next to the Web 1.0 retro mode, but the front door of this website is now **Mandy mode**: a black pixel nav bar, a slanted pixel wordmark with a little bat asleep on it, a tagline that types itself out, and a small pixel scene playing quietly behind every page.

It has been the default skin since the day I shipped it. In this post I want to explain where it came from, because the honest answer is: it isn't really mine.

It is named after, and unapologetically modelled on, [amandata.dev](https://amandata.dev) — the personal website of my girlfriend, Amanda Ta. Her bio ends with *"You can also call me Mandy"*, hence the name. If you've ever clicked **My Wife** in my nav bar, that's her; it goes straight to her site.

## The website that made me want to change mine

I think I'm pretty good at the technical side of building software. Give me an SSR pipeline to wire up, a bounded cache with in-flight request coalescing for Last.fm, a mutex-locked JSON store, a Tetris engine with Super Rotation System wall kicks, or an OAuth redirect bug hiding behind a reverse proxy, and I'm right at home. I can spend ages on how a site works underneath and be very pleased with the result.

Then I look at `amandata.dev` and immediately want to work on mine again.

The first time you open her homepage, you notice a dozen small choices working together at once: a little pixel cat crawls out onto the slanted wordmark and curls up to sleep; an introduction types itself out underneath; ruled section headings and tiny micro-labels give every card a clear place without ever making the page feel crowded; and behind all of it, an Othello board quietly plays itself out in the margins. (The cat is probably enough to get me already, to be fair.) When you flip through her themes, the details follow through — the palette shifts, the board changes, and even the sleeping cat recolours to match.

Her design skins are unmatched as far as I'm concerned, and I'm openly envious of them. I can rebuild her layout piece by piece and explain how every part works, but deciding what belongs together in the first place — giving a page an unmistakable visual soul — is a skill of its own. That gap is the reason my site now opens with a skin named after her.

## From a Carrd mirror to watching her lap me in design

Back in July, at the end of my post about [rebuilding this site with React islands and Keystatic](/blog/rebuilding-react-islands), I shouted out Mandy's old Carrd page (`tarotamii.carrd.co`) and mentioned she was working on a more permanent home on the web.

What happened next is one of my favourite things we've worked on together. As she documented in her own first blog post ([Making amandata.dev](https://amandata.dev/blog.html?p=making-amandata-dev)), her site started on Carrd, where she had already established a strong voice and visual direction. To get her off rented space, I pulled a static mirror of the rendered Carrd site and hosted it at `/amandata` on my domain to show that it was just ordinary files underneath, and in September we rebuilt it together from scratch as clean, hand-written HTML, CSS, and TypeScript — no bundler, no heavy framework, just thin HTML shells and `.ts` files that GitHub Actions compiles on push so she can even edit her site from her phone. We ended up reusing that exact mirror-to-handbuilt workflow for her academic research portfolio ([amandata.org](https://amandata.org)) and she's also hosting transitional files for her nonprofit The Ground Up Project: San Diego ([tgupsd.org](https://tgupsd.org)).

Once the foundation was in place and Mandy took full control of the creative direction, she completely transformed `amandata.dev` over more than 550 commits — and honestly left my own site's design in the dust.

## Why `amandata.dev` (and Mandy) is so cool

Part of why her site works so well is that Mandy herself is endlessly interesting. She isn't a traditional CS major; she's pursuing her B.A. in Psychology at San Diego State University, where she works across neuroscience and public health — collecting and preprocessing EEG datasets on cognitive control in Dr. Emily Kappenman's lab, and researching thirdhand tobacco smoke remediation and state-subsidised housing policies with Dr. Georg Matt and Dr. Lydia Greiner (studying 281 housing developments, cataloguing 100 remediation businesses, and winning the SDSU College of Sciences **Dean's Award for Top Poster Presentation**). When she isn't in the lab, she skates, takes art and web commissions, and builds interactive tools under two lines from her site that sum her up better than I ever could: *"hi i build these things for people to play around with"* and *"Education is for everyone."*

If you poke around her **Creations** and **Learn** pages, every single project has so much personality:

- **An Othello / Reversi Learning System ([`/othello.html`](https://amandata.dev/othello.html)):** Othello has been one of her favourite abstract strategy games since childhood. Instead of making just another clickable board, she built the teacher she wished existed when she was learning — inspired by the Japanese app *Hiyoko Reversi (ひよこリバーシ)* and *Reversi Online*. It has a Beginner mode (with a teachable robot that samples a blunder rate, strategy tips adapted from Brian Rose's book, and interactive corner/X-square/C-square exercises) and an Advanced study mode where a negamax alpha-beta engine grades every move you play in real time (`best`, `good`, `okay`, `risky`, `blunder`) complete with board coordinates, undo/redo, and a live evaluation graph. And because it's Mandy's site, the discs aren't plain circles: they are 16px pixel-art cat heads (cream cat for white, black cat with amber eyes for black) that break out of the disc circle *"at my specific request."*
- **Synergy ([`/synergy.html`](https://amandata.dev/synergy.html) & [`/synergy-wiki.html`](https://amandata.dev/synergy-wiki.html)):** A Turing-complete esoteric programming language she designed where every keyword is a corporate standup buzzword. `move the needle` increments a cell, `take a step back` decrements, `pivot` and `deep dive` move the tape pointer, `sync up` and `circle back` form loops, `herding cats` randomises a cell, `put a pin in it` / `pull the pin` saves and restores the tape, `per my last email` starts a comment, and `hit a bottleneck` halts the program (because, as her wiki notes, every corporate program ends at a bottleneck). She even built an interactive standup console with a live ASCII tape debugger, and [her blog post about it](https://amandata.dev/blog.html?p=synergy-corporate-buzzword-esolang) is one of the funniest things on her site.
- **Open study hubs (`/psy410-flashcards/` & `/stat200-practice.html`):** A 118-term pixel-art flashcard engine for Myers *Experimental Psychology* (Ch. 1–16) with stepped card flips and keyboard grading, plus a full **STAT 200 R Practice Hub** with flashcards, typing drills, quizzes, and an in-browser R console so her classmates — or anyone on the internet — can study for free.

And then there is her visual system (`styles.css` and `theme.ts`), which is the part I kept staring at with envy:

- **Intentional typography:** `Pixelify Sans` at a 2px stroke for the slanted hero display, `Nunito` 600 for warm body copy, and `VT323` for micro-labels and navigation — chosen over `Silkscreen` because `VT323`'s font file contains true lowercase glyphs so her nav renders in proper lowercase.
- **Five handcrafted skins (`dark`, `light`, `white`, `pink`, `blue`):** None of her themes are lazy CSS inversions. Her `dark` theme pairs board-room felt (`#1DA05B`) and muted sand gold (`#D9BE7A`) on near-black; `light` swaps neon green for leaf green (`#2E7B3E`) on warm paper and turns headings leaf instead of black; `pink` (Sakura) softens into cream, muted rose, and champagne gold while turning the sleeping hero cat grey so its pink ears and nose pop; `blue` shifts into deep midnight navy; and `white` uses crisp industry-blue accents with its own blue Othello board. Switching themes even updates `<meta name="theme-color">` for mobile overscroll and swaps the Othello demo GIF to a matching palette variant.

After linking her site in my navbar as **My Wife**, looking back at my own default theme felt a little too safe. Her eye for design is so inspiring to me that I decided the highest form of flattery was to build a **Mandy mode** of my own — and make it the front door of `korikosmos.dev`.

## Translating `amandata.dev` into my own fandoms

I didn't want to copy her content or lift her assets — if I did that, it would just be her site with my name on it. What I wanted was to borrow the architectural bones of her design system and fill them with my own world.

If you put the two homepages side by side, you can see how every piece of her structure maps across:

1. **The wordmark and sleeping mascot:** On `amandata.dev`, her pixel cat naps curled up on top of `.dev`. On `korikosmos.dev`, her cat became a 14×16 pixel bat. Because bats don't sit on ledges, mine hangs upside down by its feet from underneath `.dev`, wings folded, breathing from its toes while its `z`s drift up beside its ears.
2. **The rhythm of the page:** The same three typefaces (loaded only in this skin), the black pixel bar with dropdown menus, page search, and a **Change Theme** menu, the typewriter tagline, the ruled section headings, and the left-bordered cards that make every page feel calm and easy to scan. Where her homepage highlights her research and academic record, mine has a **Fandoms** section (`what I'm into`) and a **By the numbers** record tracking the four countries I've lived in, my posts, portfolio projects, playable games, CV languages, and the four fandom themes in this skin.
3. **From `othello-bg.ts` to `MandyBackdrop.tsx`:** Her self-playing Othello backdrop is a genuine technical idea, not just a vibe. She renders the game into a tiny offscreen buffer and upscales it three times (`PIXEL = 3`) with smoothing turned off so every pixel stays crisp, seeding the layout with a deterministic `mulberry32` generator so a resize keeps the same scene. I borrowed that technique whole — plus a calm column down the middle so body copy stays readable — and pointed it at four scenes from my own fandoms:
   - **Gotham (Batman, the default):** Near-black and utility-belt gold. Behind the page, rain falls across a jagged skyline, the Bat-Signal sweeps the low clouds, and tiny pixel bats cross between rooftops.
   - **Basement (The Binding of Isaac):** Warm cellar browns and tear-drop crimson, with a crying kid wandering between rocks in a top-down cellar room and popping flies with tears. I'm very happy that my personal website now has a perfectly reasonable excuse to simulate a tiny Isaac basement in the background.
   - **Kanto (Pokémon):** Cream paper, Poké Ball red, and Cerulean blue, where a trainer wades through tall grass on a tile grid while a Poké Ball wobbles three times.
   - **Inkwell (comics):** Warm newsprint, magenta, and cyan, pairing `Bangers` headings with halftone dots, faint panel gutters, and comic bursts (`POW!`, `KRAK!`, `THWIP!`).

## The engineering is easy; the taste is not

Getting Mandy mode wired into an Astro 5 SSR and React 19 islands architecture gave me the kind of technical problems I enjoy solving:

- **Zero-flash server-rendered themes:** Both the active skin (`kk-skin`) and the chosen fandom palette (`kk-mandy-theme`) live in cookies that `src/middleware.ts` resolves before anything renders. The server writes `data-skin="mandy"` and `data-theme="mandy-<name>"` straight onto `<html>` alongside critical background CSS, so the first paint is always right with no flash.
- **Working without JavaScript:** Because Mandy mode is the default skin, every first-time visitor lands in it, which means it has to work before any script runs — or if JavaScript is off entirely. The top-bar dropdowns (`Me`, `Work`, `Play`) in `MandyNav.tsx` are native `<details>` disclosures that open out of the box (and my post-build render tests assert that every menu link is reachable in the raw server HTML). React only takes over the `open` state after hydration to add arrow-key navigation, `Escape` handling, and one-menu-at-a-time behaviour. Likewise, the typewriter and highlight animations fail open so no content is ever stuck hidden.
- **Wrapping islands without forking them:** I didn't want three separate copies of Tetris, Star Pairs, Rock Paper Scissors, the Last.fm Tunes page, or the blog reactions. By registering `mandy-gotham`, `mandy-basement`, `mandy-kanto`, and `mandy-inkwell` as DaisyUI themes in `tailwind.config.mjs` alongside their `mandy.css` tokens, `data-theme="mandy-<name>"` does double duty: the interactive islands sit untouched inside `MandyIslandShell.astro` and automatically take on the active fandom's palette. Under `prefers-reduced-motion`, the backdrop settles on a single static frame and every blinking cursor or floating `z` goes quiet.

I like all of that plumbing. It's my wheelhouse.

But none of it is why Mandy mode feels good to use. It feels good because of decisions I didn't make — which font does which job, how much air a section gets, where a rule sits, how a card leans on its left border.

My bat emblem is the clearest proof. Early in November I made six commits in a single day about one bat. My first nav mark sat on a 16-pixel-wide grid — which has no centre column, leaving the ears and tail one pixel lopsided relative to the wings — and was tilted `-10deg`, smearing the crisp pixel edges. So I replaced it with a pixel version of a 36×12 braille-art bat I'd drawn and put it in the Gotham Bat-Signal, only to realise that because the backdrop canvas is upscaled 3×, a 36-pixel sprite became a 108-pixel monster in the sky that hid right behind the sticky navbar on mobile. I scaled it down, scaled the Bat-Signal back up, nudged it clear of the nav bar, and finally hand-reduced the whole thing into a symmetrical 20×7 palindromic grid in `src/page-components/PixelBat.tsx` so the Mandy nav mark, the Bat-Signal, the modern Batman theme swatch, and the skin switcher button all share one crisp definition.

That is what design looks like when I do it: six commits and an afternoon of trial and error to land somewhere her cat seems to have walked to on the first try. Every row of my bat has to be a palindrome or it comes out lopsided — and the only reason I know that is that I built it wrong first.

## Why it's called Mandy mode (and why it's the default)

I could have called this the pixel skin or picked a technical name, but Mandy mode felt right. I made it the default on the day I finished it. The modern skin is still one click away in the dock, and the retro skin is still there for anyone who misses 2003, but this is the version of my site I'm proudest of, and it's the one I want people to see first.

Part of that is simply that it's the best-looking thing here. The bigger part is what it stands for. Every time I open my own site now, or work on it, I see something I learned from someone I admire.

Working on this skin made me appreciate Mandy's eye for design even more than when we first rebuilt `amandata.dev` together. I can spend all day optimising caches, writing JSDOM render tests, and tweaking server middleware, but her ability to give a website warmth, humour, and a visual identity that feels completely alive is something I look up to endlessly. I admire her taste so much — I love the tiny things she notices, the interests she follows, and how much of her personality she pours into everything she makes.

She is clever, funny, cool, awesome, and genuinely one of the most interesting people I know. She can move from psychometrics and EEG preprocessing to Othello engines to a joke programming language in a single conversation, and her whole site lives up to the *"Education is for everyone"* line in her bio: everything she builds has that same signature of wanting other people to *get it* and have fun learning from it. She's brilliant, she's the coolest person I know, and I'm so lucky that I get to call her my girlfriend (even if I'm still a little jealous of how good her website looks).

Seeing her make things makes me want to make things too, and watching her work has genuinely made me want to be better — not only at writing code that works, but at making places on the web that people actually enjoy being around. Sometimes that means fixing something I've been putting off. Sometimes it means writing a post. This time it meant adding a whole new way to browse my website, complete with a sleeping bat.

If you haven't visited [amandata.dev](https://amandata.dev) yet, go click the **My Wife** link in the navbar — start with the cat, stay for a round against her Othello coach, please go write a corporate standup in Synergy, flip through her psychology flashcards, and see the original that inspired all of this. It deserves the visit, and you might find something there that inspires you as well.

So: thank you, Mandy. If Mandy mode looks good, that's down to you. Any bugs are mine.

Mandy, if you're reading this: I think you're amazing. Thank you for giving me so many reasons to get excited about making stuff, and for inspiring me every single day. I love you!!!
