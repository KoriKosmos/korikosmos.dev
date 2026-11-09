---
title: 'Mandy mode: the design I am envious of, shipped as my front door'
description: >-
  My girlfriend's site at amandata.dev has design sense I can't match, so I
  rebuilt its bones around my own fandoms and made it the default skin here.
pubDate: 2026-11-08
---
There is a line in my girlfriend's changelog that has stuck with me more than anything else I've read this year:

> 1:58 AM — VT323 replaces Silkscreen — secondary font swapped to VT323 (whose file has true lowercase) so the nav renders in correct lowercase.

Most of her changelog reads like that. Timestamped entries, one after another, each one a tiny judgement call that almost nobody would ever notice on its own, and each one absolutely right. The reason her nav is in lowercase is that she checked whether the font file *contains lowercase*, and swapped the whole type system because the first one didn't. At 1:58 in the morning.

I think I'm quite good at the technical side of building things. I can wire up an SSR pipeline, coalesce in-flight requests, write a mutex-locked JSON store, keep a Tetris rotation system spec-correct. Give me a bug behind a reverse proxy and I'll happily chase it for an afternoon. But I do not have what she has. I can rebuild her site piece by piece and explain how every piece works — and I still could not have *decided* any of it. That gap is the subject of this post, and the reason my site now opens with a skin named after her.

## The site that made me want to change mine

[Mandy](https://amandata.dev) is my girlfriend. Her bio ends with "You can also call me Mandy" and "Education is for everyone," and those two lines basically *are* her. She's studying psychology at San Diego State, and everything she builds has the same shape: a thing made so someone else could learn from it. There's an Othello study system where an engine grades every move you play, a flashcard deck for her research-methods class, a whole R console running in the browser so her classmates can practice statistics for free, and — my favourite — [Synergy](https://amandata.dev/synergy.html), an esoteric programming language whose only keywords are corporate buzzwords. `move the needle` increments a cell. `circle back` ends a loop. `hit a bottleneck` halts the program, because, as her wiki puts it, every corporate program ends at a bottleneck.

The thing is, none of this reads as "a developer's portfolio." It reads as *her*. The sleeping pixel cat that crawls onto the wordmark. The Othello game playing itself quietly behind every page. The way the light theme isn't an inverted dark theme but its own leaf-green palette with its own decisions. The way her discs in Othello aren't circles at all — they're tiny pixel cat heads, cream for white and black-with-amber-eyes for black, poking out of the disc "at my specific request."

I remember exactly when this stopped being a nice observation and became a project. Her site began life on Carrd, a hosted builder. Back in July I made a static mirror of it — the whole rendered page as plain files — to show her it was just files she could own, and we rebuilt it by hand in September. Then she took the creative direction over, and in about six weeks she left my own site's design in the dust. I was watching her changelog fill up with entries like the VT323 one, and I had to admit the truth: I wanted to copy her homework.

## So I did, out loud

Mandy mode is the third skin on korikosmos.dev, next to the modern one and the Web 1.0 retro one. I made it the default, which is to say it is now the *front door* of my website, and I didn't even pretend otherwise: there's a link in my nav labelled **My Wife**, and it goes straight to her site. This skin is named after her because the honest answer to "where did this come from" is "not me."

The borrowing is structural, and I want to be clear about that. Her three typefaces — Pixelify Sans for the display type, VT323 for the labels, Nunito for the body — come over, loaded only in this skin. Her pixel nav with dropdowns and a page search, her slanted wordmark with a sleeping mascot on it, her typewriter tagline, her ruled sections and left-bordered cards. And the piece I'm proudest of stealing: her self-playing Othello backdrop.

That backdrop is a genuine technical idea, not just a vibe. She renders the game into a tiny offscreen buffer and upscales it three times with smoothing turned off, so every pixel stays crisp, and she seeds the whole thing with a deterministic random function so a resize lays out the same scene. I borrowed the technique whole — same `PIXEL = 3` buffer, same `mulberry32` seed — and pointed it at my own world instead of a board game.

Her Othello became four scenes, one per fandom theme:

- **Gotham** (Batman, the default): rain falling over a jagged skyline, the Bat-Signal sweeping the low clouds, tiny bats crossing between rooftops.
- **Basement** (The Binding of Isaac): a crying kid wandering a cellar, popping flies with tears.
- **Kanto** (Pokémon): a trainer wading through tall grass while a Poké Ball wobbles three times.
- **Inkwell** (comics): halftone newsprint, panel gutters, and `POW!` bursts.

Her sleeping cat became my sleeping bat. Her research section became my fandoms. The content is all mine — the bio, the projects, the CV — because if I'd copied her *content* too, it would just be her site with my name on it, and that's not the point.

## The engineering is easy; the taste is not

Here's the part that humbled me. Getting the skin *working* was the kind of problem I'm comfortable with: it's a cookie read on the server before anything renders, so the right theme lands on the first paint with no flash. The nav dropdowns are native `<details>` elements, so they still open with JavaScript turned off, and my render tests assert every menu link is reachable in raw server HTML. The games, the Tunes page, the post reactions — they're the *same* components in every skin, recoloured from outside by registering the four fandom palettes as DaisyUI themes, instead of forking the logic three times. I liked all of that. It's my wheelhouse.

None of it is why the skin feels good. It feels good because of decisions I didn't make — which font does which job, how much air a section gets, whether a sleeping animal on the title is charming or too much.

The bat is my proof. Early in November I made six commits about a single bat. I fixed it because it looked lopsided. I replaced it with a pixel version of a braille-art bat I'd drawn. I scaled it down, scaled the Bat-Signal back up, and nudged it off the nav bar. Eventually I hand-reduced the whole thing to a 20×7 palindromic grid and made it the one emblem the whole site shares — nav mark, Bat-Signal, modern Batman theme swatch, and the skin button. That's what design looks like when *I* do it: six commits and an afternoon of trial and error to land somewhere her cat seems to have walked to on the first try. Every row of my bat has to be a palindrome or it comes out a pixel lopsided — and the only reason I know that is that I built it wrong first.

## Why it's the default

I made it the default because it's the version of this site I'm proudest of, and because of what it stands for every time I open it. Mandy is clever and funny and one of the most interesting people I know; she can move from psychometrics to Othello engines to a joke programming language in a single conversation, and everything she makes has the same signature of wanting other people to *get it*. Watching her work has genuinely made me want to be better — not just at code that runs, but at making things people like being around.

So: thank you, Mandy. If Mandy mode looks good, that's your fault. Any bugs are mine.

Go and see the original at [amandata.dev](https://amandata.dev). Start with the cat, stay for the Othello coach, and please go write a standup in Synergy.
