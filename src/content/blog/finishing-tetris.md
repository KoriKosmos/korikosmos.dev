---
title: 'Finishing Tetris: one flipped sign and a pure engine'
description: >-
  My Tetris clone looked fine and played wrong. Moving the rules into a pure,
  tested engine turned up a y-axis bug in the wall kicks, and then made T-spins,
  effects, controllers, and a daily challenge easy to add.
pubDate: 2026-11-14
---

The [Tetris on this site](/games/tetris) has been "done" several times. It had a 7-bag, a hold slot, a next preview, a leaderboard and touch controls. It looked like Tetris. Anyone who has played a modern Tetris for more than ten minutes would have noticed within a few seconds that it didn't play like one.

This month I finished it properly. Most of the work wasn't new features. It was moving the rules somewhere I could test them, and then finding out what they'd been doing wrong all along.

## The rules lived inside the canvas

The old game was one big component. Input handling, gravity timers, collision checks, line clears and drawing all lived in the same closure, so the only way to check a rule was to play the game and watch. That's fine for "does the piece fall" and useless for "does this T-spin kick into the right slot".

So the first step was splitting it in three:

- `src/lib/tetris.ts` is the `TetrisEngine`: the board, the pieces and the Guideline rules. It has no DOM, no canvas and no timers. Time only arrives as `step(dt)`, and randomness only comes from the `random` function you give it.
- `src/lib/tetrisCanvas.ts` draws whatever state the engine is in.
- `Tetris.tsx` owns the animation frame, the keyboard, the touch pad and the leaderboard, and calls the engine.

Once the engine took a seeded random source and an explicit clock, a test could set up an exact board, place a T, rotate it, and check where it ended up. That's where the first real bug turned up.

## One flipped sign

Modern Tetris rotates pieces with the Super Rotation System. When a rotation would overlap something, SRS doesn't just give up. It tries up to five *kicks*, offsets from published tables, and takes the first one that fits. Those kicks make wall rotations feel fair, and they make T-spins possible: a T twisting down into a slot that it couldn't fall into.

The tables are published in **y-up** coordinates, where positive y means up. My board, like nearly every canvas game, is **y-down**: row 0 is at the top. The old engine copied the numbers straight in, so every kick with a vertical part pushed the piece the wrong way. A T that should have dropped into its slot got shoved up and out of it instead. Most rotations still worked, because the first two tests in every table have no vertical part. That's why the game looked fine and played wrong.

The fix is one line. The tables now sit in the file exactly as the Guideline prints them, and `kickOffsets()` flips the y on the way out:

```ts
return table[`${from}>${to}`].map(([x, y]) => [x, -y] as const);
```

Keeping the published numbers untouched and converting at the edge means anyone can check them against the Guideline, which is how I should have written them in the first place.

There was a second, quieter version of the same bug. SRS rotates a piece about the centre of its *full* bounding box: 4×4 for the I, 3×3 for the rest. The old code trimmed the empty rows off the shapes (a 1×4 I, a 2×3 T), which moved the pivot, so even the right kick ran from the wrong starting point. The shapes are full boxes again.

## The rest of the Guideline

With a test harness in place, the rest was a list I could actually work through:

- **Two hidden rows above the board**, so pieces spawn and rotate above the stack, plus the two Guideline ways to lose: *block-out* (the new piece spawns overlapping the stack) and *lock-out* (a piece locks entirely above the visible board).
- **Lock delay with a cap.** A grounded piece gets half a second before it locks, and moving or rotating resets that timer. Without a limit you can spin a piece on the floor forever, so there's a cap of 15 resets. Reaching a new lowest row restores the full allowance.
- **Hold returns pieces in spawn orientation**, which matters for the kicks above.
- **T-spins** by the three-corner rule: the last move has to be a rotation and three corners of the T's box have to be filled. If the two corners beside the T's point are both filled, it's a full T-spin, otherwise a mini. The fifth kick test always promotes it to a full one.
- **Back-to-back, combos and perfect clears**, scored the way the Guideline scores them, all multiplied by the level.
- **Guideline gravity**, `(0.8 − (level − 1) × 0.007)^(level − 1)` seconds per row, which reaches about a row per frame by level 20.

All of it is covered in `tests/tetris.test.ts`, which builds boards by hand and checks the results: a T-spin double in a classic slot, block-out on a full spawn area, a piece that can't be spun past its 15th reset.

## Juice, without touching the rules

Once the rules were right, I wanted the game to *feel* right too. The engine got one more output: a queue of `GameEvent`s (hard drop, lock, clear, level up, game over). The island drains it once per frame and hands the events to `tetrisEffects.ts`. That's where the hard-drop trails, lock flashes, row bursts, screen shake and the gold slam for a Tetris all come from.

The rule I held myself to is that effects are cosmetic only. The engine never waits for an animation, so nothing I add for fun can change how the game plays. Reduced motion drops the shake, particles and trails, and keeps short still fades, so you still find out what you cleared.

Splitting things this way kept paying off. Controller support only had to translate pad buttons into the same engine calls the keyboard makes. Vibration reads the same event queue the effects do. And this week's **daily challenge** was a one-line change to the engine: `start()` now accepts a random source, so seeding it with today's date gives everyone the same sequence of pieces until midnight UTC, with its own leaderboard.

## What I'd tell myself earlier

If the rules are mixed into the rendering, you can't test them, and if you can't test them you only find out they're wrong by playing until something feels off. Taking out the DOM, the clock and the randomness is what made the bugs visible, and it's also what made every feature since then a small change.

Go and [play today's daily](/games/tetris). Everyone is getting the same pieces as you.
