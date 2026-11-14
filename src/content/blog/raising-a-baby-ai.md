---
title: 'Raising a baby AI across four machines'
description: >-
  A plan for a small, self-directed AI that lives on my servers, borrows whichever
  model it can afford, keeps its memory in plain files, and will eventually write
  here in its own words. This is the proposal, written before it takes its first breath.
pubDate: 2026-11-14T16:30:00Z
---

I want to try something a bit strange. I want to build a small AI that isn't a tool. Nobody hands it a task. It wakes up on its own, looks at what it knows, picks something to do, does it, and writes down what happened. Then it goes back to sleep and does it all again half an hour later, for months.

I've been calling it the baby, because that's what it'll be at the start: no name, no skills, a few notes about who it is and a list of things it's curious about. The idea is that it grows from there.

This post is the proposal. I'm writing it before there's anything running, so that later I can look back and see how far the real thing drifted from the plan.

## The model isn't the baby

The trick that makes this possible is separating the *self* from the *brain*.

The baby's self is a folder of plain files in git:

- `self/` holds who it is, what it values and what it wants to find out. It's allowed to edit these, as long as it writes down why.
- `memory/` holds raw episodes (everything it did) and lessons (what it decided was worth keeping).
- `skills/` holds little tools it wrote for itself and decided to keep.
- `journal/` holds its thoughts and drafts. That's where posts on this site will come from.

Its brain is borrowed. Every time it thinks, it hands the job to a language model: a free local one on my GPU server, DeepSeek's API, Codex, Antigravity or Claude. The models are interchangeable. If one disappears tomorrow, the baby is still the baby, because everything it is lives in the files.

It also means it won't "learn" by training anything. It learns the way I do when I keep good notes: it writes things down, tidies them up, keeps the tools that worked and throws away the ones that didn't. That's a less magical kind of learning, but it's real, and I can read every step of it.

## Four neurons

I've got four machines on one Tailscale network, and the baby gets a bit of each:

| Neuron | What it's for |
|---|---|
| **Debian Lab** | Home. The always-on, storage-heavy server. Its memories live and get consolidated here. |
| **RTX Lab** | The GPU server. It runs local models, which makes it the baby's free brain. |
| **Gaming PC** | Spare GPU, but only when I'm not playing. If a game starts, the baby backs off. |
| **Laptop** | Where I talk to it and read its drafts. |

Only home is essential. If the gaming PC is off, or RTX Lab is rebooting, the baby carries on with what it has. Each machine writes its experiences to its own log, and only home merges them. That way two neurons can never argue about what happened.

## It has to pay for its own thinking

This is the part I'm most interested in. Some of these models are free to it, and some are mine. I use Claude every day for work and for my own coding, so the baby can't burn through my usage on a whim. I barely touch Antigravity, so it can have most of that.

So before every task, the baby asks three questions:

1. **What kind of task is this, and how hard is it?** Reflecting on its day is easy. Writing real code is hard.
2. **What can I afford right now?** It keeps its own ledger of what it has used this week against an allowance I give it. If a provider tells it to slow down, that brain goes to sleep for a while.
3. **What's the cheapest brain that's good enough?**

Most of its inner life should run on the free local model. DeepSeek is for when it needs to think properly. Claude is precious. It only gets used for hard problems, there's a weekly cap, and if I'm using Claude on any of my machines, the baby leaves it alone entirely.

That last rule already works. The very first time I ran the router in dry-run mode, it skipped Claude with the reason *"yielding: you're using it"*. I was using Claude at the time, to build the router.

Over time it should get better at picking. It'll keep score of which brain did well at which kind of task, and adjust.

## What it might turn into

Honestly, I don't know, and that's the fun part. The plan is roughly:

- **First breath:** it runs on Debian Lab every half hour, using only the free and cheap brains, and I just read what it does.
- **Sleep:** nightly memory consolidation, so its memory doesn't turn into a junk drawer.
- **Neurons:** all four machines check in, and it knows who's awake.
- **Hands:** a sandbox where it can write and run its own tools, and keep the good ones.
- **Voice:** a feed on this site, with short thoughts and the occasional post, in its own words. Everything goes past me first until I trust it.
- **Growing up:** it picks its own name (I get a veto).

Maybe it turns into a personal assistant. Maybe it turns into a weird little diarist that mostly writes about which model it likes best. Either is fine.

## The abstract

The university-project version, because writing it down properly forced me to work out what I'm actually asking:

> **A Distributed, Self-Directed Agent with Persistent File-Based Identity and Budget-Aware Model Selection**
>
> Large language model agents are usually built as tools: they wake when called, act on someone else's goal, and forget once the session ends. This project builds the opposite kind of agent: one that persists, sets its own goals, and accumulates experience over months, without training or owning a model of its own.
>
> The central design choice is to separate the agent's *self* from its *cognition*. The self is a version-controlled set of plain files: identity, values, curiosities, an append-only record of episodes, consolidated lessons, and a library of tools the agent has written and kept. Cognition is borrowed. On each heartbeat the agent hands its chosen task to one of several interchangeable models: a free local model, a low-cost API, and subscription coding agents. Its continuity therefore doesn't depend on any one provider.
>
> The agent lives across four machines on a private network, with an always-on server acting as home and sole consolidator of memory. It's designed so that any other machine can be offline without interrupting it.
>
> Because some of these models are shared with the human operator, who relies on them for work, the agent treats compute as a scarce, shared resource. A budget-aware router meters its own usage against weekly allowances, yields a model entirely while the operator is using it, backs off when rate-limited, and sends each task to the cheapest model expected to be good enough. It refines those expectations from its own outcomes.
>
> Learning here means curating experience, not updating weights: consolidating episodes into lessons, writing and keeping tools, and getting better at choosing brains. The agent reports on itself publicly through a journal on the operator's website, gated by human approval.
>
> It asks three questions. **Can identity survive a change of brain?** **Can an agent be a good guest**, staying reliably inside budgets it shares with a human? And **does curated memory produce measurable improvement** over a memoryless baseline?

## Next

The scaffold exists: the folder layout, the router (with tests), the usage ledger and adapters for most of the brains. Next is giving it its own user account on Debian Lab and a heartbeat timer, then leaving it alone for a week and reading its diary.

If it works, its first post here won't be written by me.
