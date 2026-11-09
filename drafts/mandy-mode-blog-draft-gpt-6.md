---
title: 'Mandy mode: borrowing some of my favourite person’s design sense'
description: >-
  How my girlfriend’s website inspired a whole new skin for mine, and why I’m
  still envious of how good she is at making things look and feel like her.
pubDate: 2026-11-08
---

I think I’m quite good at technical things. Coding, figuring out why something is broken, getting a few different systems to talk to each other: those are things I’m comfortable with. I can spend ages on how a site works underneath and be very pleased with the result.

Then I look at [my girlfriend Mandy’s website, amandata.dev](https://amandata.dev/), and immediately want to work on mine again.

Her design skins are unmatched as far as I’m concerned. I’m envious of them, and I mean that quite sincerely. She makes choices about colour, layout and little details that I wish I had thought of. I can understand how to implement those things, but deciding what belongs together in the first place is a skill of its own, and she is so good at it.

That is where Mandy mode came from.

## The website that made me want to change mine

There are lots of things I love about her site. The pixel wordmark has a little sleeping cat on it. The introduction types itself out underneath. The sections have these ruled headings and small labels, and the cards give everything a clear place without making it feel crowded. Behind the content, an Othello game quietly plays itself.

The cat is probably enough to get me already, to be fair.

But I also really like how the details follow through when you change themes. Her dark, light, white, pink and blue options have their own palettes, and even the cat changes with the theme. There is a lot of care in choices that are easy to overlook when they all work together. I notice them, though, especially when I’m trying to make my own site feel as good.

And there is so much of her in what the site contains. Research, social science, web projects, Othello, learning tools, and even [a little programming language built around corporate jargon](https://amandata.dev/synergy.html). I love that these things all get to live in the same space. She is a really interesting person, and following the links around her website gives you some idea of why I think that.

I already wrote in my React islands post that she inspires me to work on things and write about them. Apparently the next step was building an entire skin named after her.

## Bringing that structure over

Mandy mode became the third skin on korikosmos.dev, alongside the modern and retro versions. It landed in October, and I made it the default, so it is what you get if you visit without a saved skin choice.

The influence is quite direct. The pixel navigation, dropdowns and search, the slanted wordmark, the sleeping mascot, the typewriter introduction, the ruled sections and the cards all draw from her site. I wanted to bring that structure into mine and fill it with my projects, my interests and my own little details.

Her sleeping cat became a sleeping bat. Her research section gave way to my fandoms. The background was a particularly fun place to take the idea somewhere else: she has Othello playing behind the page, so I gave each of my themes a scene from something I like.

Gotham is Batman: a rainy skyline, bats and a Bat-Signal. Basement takes its cue from The Binding of Isaac, with a crying kid wandering around a cellar and shooting tears. Kanto has a Pokémon trainer moving through tall grass. Inkwell goes for comics, with halftone dots, panel lines and sound effects.

I’m very happy that my personal website now has a perfectly reasonable reason to simulate a tiny Isaac basement in the background.

## The technical part

This was the bit I felt more at home with. The site already had separate modern and retro layouts, so Mandy mode could follow the same approach: its own shell and page bodies, with the skin selected on the server from a cookie.

The games, music page and reactions still use the same interactive components. They sit inside a Mandy wrapper, and the four fandom palettes are also DaisyUI themes, so the existing controls take on the colours without needing another copy of their logic. The background scenes are drawn in code, and reduced motion gets a still frame.

I also wanted the default skin to work before any JavaScript loads. The navigation uses native disclosure menus, the page content stays readable, and the server puts the selected Mandy theme straight into the HTML. There was some satisfying technical work in making all of that fit together.

Those are the kinds of problems I enjoy solving. Having her design to learn from gave me a much clearer idea of what I wanted the result to feel like.

## Why it’s called Mandy mode

I could have called it the pixel skin or picked another technical name, but Mandy mode felt right. Every time I work on it, I know where the inspiration came from.

I admire her taste so much. I like the things she notices, the interests she follows, and how much personality she puts into what she makes. She is cool, awesome and interesting, and I’m very lucky that I get to call her my girlfriend. I’m also still a little jealous of how good her website looks.

Seeing her make things makes me want to make things too. Sometimes that means fixing something I’ve been putting off. Sometimes it means writing a post. This time it meant adding a whole new way to browse my website, complete with a sleeping bat.

Go have a look at [her site](https://amandata.dev/). It deserves the visit, and you might find something there that inspires you as well.

Mandy, if you’re reading this: I think you’re amazing. Thank you for giving me so many reasons to get excited about making stuff. I love you!!!
