---
title: 'Mandy Mode: Borrowing From the Best Designer I Know'
description: >-
  Why korikosmos.dev now opens in a skin modelled on amandata.dev, and what
  building it taught me about the difference between engineering and design.
pubDate: 2026-11-08
---
If you've visited korikosmos.dev recently without a saved preference, you landed in Mandy mode. It has a black pixel nav bar, a slanted pixel wordmark with a little bat asleep on it, a tagline that types itself out, and a small pixel scene playing behind everything. It's been the default skin since the day I shipped it. In this post I want to explain where it came from, because the honest answer is: it isn't really mine.

## Where it comes from

Mandy mode is modelled on [amandata.dev](https://amandata.dev), the personal site of my girlfriend, Amanda Ta. Her bio ends with "You can also call me Mandy", hence the name. She's studying psychology at San Diego State University, and she's interested in how public health, AI, and neuroimaging play into clinical psychology and mental health. She skates, she's played Othello since she was a kid, and she builds and runs websites in her spare time, and not only her own. If you've ever clicked "My Wife" in my nav bar, that's her. It goes straight to her site.

Her site is a better piece of design than anything I've made on my own, and it's worth a proper look.

## How her site came to be

My part in the story starts small. Her site began life on Carrd, a hosted site builder. Back in July I made a static mirror of it, the whole rendered page as plain files, and hosted it at `/amandata` on my domain. It showed that her site could be ordinary files she owned instead of something rented from a builder, and it became the starting point when the two of us rebuilt it by hand in September.

Then she took it over, and that's when it got good. She calls herself a social scientist rather than a trained programmer, and she leads her site's creative direction. In her own post, [Making amandata.dev](https://amandata.dev/blog.html?p=making-amandata-dev), she writes that she "wanted my own little place on the internet". In the six weeks after the rebuild, she built:

- **A type system.** Three faces with a clear job each: Pixelify Sans for display type, VT323 for labels, and Nunito for body text. She picked VT323 because its font file has true lowercase, so her lowercase nav renders correctly. I would never have noticed that.
- **Four complete themes.** Dark ("clinical cyber-pop" black, turquoise, and magenta), light, sakura pink, and midnight blue. Her light theme is a separate leaf-green palette, not an inverted dark one, and her nav bar darkens to suit each theme.
- **A sleeping cat.** A pixel-art cat crawls in and falls asleep on top of the slanted, lowercase `amandata.dev` title, recoloured for every theme.
- **An Othello board that plays itself.** Othello runs through the whole site. Behind every page there's a quiet, abstract game in progress, cycling through think, place, and flip. On her Learn page you can play the real thing, with discs drawn as little pixel cat heads. There's a beginner mode against a robot that blunders on purpose so you can learn from watching it, and an advanced study mode where an engine grades every move as you play it.
- **The rest of it.** Flashcard decks for her research-methods class, a working R console in the browser, and Synergy, an esoteric programming language made entirely of corporate buzzwords. [Her blog post about it](https://amandata.dev/blog.html?p=synergy-corporate-buzzword-esolang) is one of the funniest things on her site.

Her site's repo has more than 550 commits since July. It's not a portfolio template she filled in. It's a place she keeps building.

## What Mandy mode borrows

By late October I'd stopped pretending I wasn't trying to copy her homework. Mandy mode takes the *structure* of amandata.dev and rebuilds it around my own interests:

- **The same three typefaces**, loaded only in this skin.
- **The nav.** A black pixel bar with dropdown menus, a page search, and a "Change Theme" menu, like hers, plus a reading-progress strip on the homepage.
- **The wordmark.** A slanted pixel logotype with a sleeping mascot on it. Her mascot is a cat. Mine is a bat.
- **The rhythm of the page.** A typewriter tagline, ruled sections, and left-bordered cards that make every page feel calm and easy to scan.
- **The living backdrop.** Her self-playing Othello board became a pixel scene per theme. I borrowed her technique as well as the idea: draw the scene into a tiny buffer and scale it up three times with smoothing off, so every pixel stays crisp. Under reduced motion it settles on a single still frame, like hers does.

The four Mandy themes are my fandoms:

- **Gotham** (Batman, the default): a Bat-Signal over a rainy skyline.
- **Basement** (The Binding of Isaac): a crying kid clearing out a cellar.
- **Kanto** (Pokémon): a trainer wading through tall grass.
- **Inkwell** (comics): halftone paper with POW! bursts.

The content is all mine: the bio, the projects, the CV, the posts. Her site gave me the frame. What goes inside it had to come from me, or it would just be her site with my name on it.

## The engineering is the easy part

This is the bit I actually wanted to write about.

I'm pretty confident on the technical side. Mandy mode is the third skin on this site, next to the modern one and the Web 1.0 retro one. Under the hood it's a cookie read on the server before anything renders, so the right theme is there on the first paint with no flash. The nav dropdowns are native `<details>` elements, so they still open with JavaScript turned off, and my render tests check that every menu link shows up in the server HTML. The games, the Tunes page, and the post reactions are the same components in every skin, recoloured from outside instead of copied. I like that kind of problem, and I'm good at it.

But none of that is what makes Mandy mode feel good to use. That comes from decisions I didn't make: which font does which job, how much space a section gets, where a rule goes, how a card leans on its left border, whether a sleeping cat on the title is charming or too much (charming, obviously). Mandy just *knows* these things. I can rebuild her layout piece by piece and explain how every piece works, but I couldn't have come up with it. Honestly, I'm envious.

The bat is the perfect example. On one day in early November I made six commits about a single bat. I fixed it because it looked lopsided. Then I replaced it with a pixel version of a braille-art bat I'd drawn. Then I scaled it down, scaled the Bat-Signal back up, and nudged it off the nav bar. Finally I made that one 20×7 pixel bat the single emblem shared by the nav mark, the Bat-Signal, the modern Batman theme, and the skin button. That's what design looks like when I do it: a day of trial and error to land somewhere her cat seems to have gone straight to.

## Why it's the default

I made Mandy mode the default skin on the day I finished it. The modern skin is still one click away in the dock, and the retro skin is still there for anyone who misses 2003. But this is the version of my site I'm proudest of, and it's the one I want people to see first.

Part of that is simply that it's the best-looking thing here. The bigger part is what it stands for. Every time I open my own site now, I see something I learned from someone I admire. Mandy is clever, funny, and genuinely one of the most interesting people I know. She can go from psychometrics to Othello engines to a joke programming language in one conversation. Her bio signs off with "Education is for everyone", and her whole site lives up to it: it's full of things she built so other people could learn. Watching her work has made me want to be better at this. Not only at writing code that works, but at making things people actually enjoy being around.

So: thank you, Mandy. If Mandy mode looks good, that's down to you. Any bugs are mine.

Go and see the original at [amandata.dev](https://amandata.dev). Start with the cat.
