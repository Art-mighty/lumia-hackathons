<p align="center">
  <img src="media/lumia-mark.svg" alt="Lumia" width="120">
</p>

<h1 align="center">Lumia</h1>

<p align="center">
  <b>A multiplayer adventure world where kids learn maths by playing it.</b><br>
  Submission to the <b>Colosseum Crypto World's Fair</b> hackathon (Sep 14 – Oct 12, 2026)
</p>

<p align="center">
  🌐 <b>Website:</b> <a href="https://lumia.game">lumia.game</a> &nbsp;·&nbsp;
  🎮 <b>Play now:</b> <a href="https://game-production-d440.up.railway.app/game.html">game-production-d440.up.railway.app/game.html</a>
</p>

---

## What Lumia is

Lumia is an isometric (2.5D, "seen from above at an angle") online role-playing
game for primary-school children. Kids explore a hand-painted world, meet
characters, go on quests, fight very easy pastel monsters, and team up with
friends.

The maths is **inside the world, not in front of it**. Instead of a quiz that
pops up between fights, every "trial" is a physical puzzle that *is* the maths:

- **Hall of Scales** — put numbered stones on a balance until both sides weigh
  the same. The beam really tips by the difference, so the child *sees* an
  equation.
- **Build the Bridge** — lay stones over a chasm to make a bridge of exactly the
  area the level asks for, then walk across it.
- **The Lantern Table** — a waiter serves equal groups of lanterns (Grade 2
  multiplication).
- **Ice Ruins** — hop only onto the ice floe that continues the number pattern.

Every trial ships in **English and Russian**, with voiced characters, and
works on laptops, tablets and phones (there is also an Android app).

## Why Lumia wins: a learning dataset no quiz can collect

A quiz learns one thing about a child: right or wrong. Lumia records every
round of every trial: correct or not, how long it took, whether the child gave
up, tagged against **192 maths topics for Grades 1–4**. Because the same skill
is measured through many different mechanics (a balance, a river crossing, a
rope trail), we can tell *which kind* of thinking a child is missing, not just
which topic. The server is the referee, so a child can't fake a result.

That dataset drives Lumia's personalisation loop. Each mechanic is
hand-built with difficulty dials, and AI turns the dials for each child. A
child who is strong at number patterns but weak at comparing lengths gets a
next river crossing that eases only the lengths and keeps the number puzzle
at full challenge. Details: [**MOAT.md**](MOAT.md).

## Traction

| | |
|---|---|
| **200** | waitlist spots claimed on [lumia.game](https://lumia.game) |
| **70** | interviews with parents and kids |
| **10** | committed buyers, currently testing with us in a closed beta |

## What we built during the hackathon

Lumia existed before the hackathon. The rules ask us to say exactly what is new,
so [**HACKATHON.md**](HACKATHON.md) splits our history at Sep 14, 2026, with
dates and numbers. In short:

- **1,296 commits** in the hackathon window (54% of all commits ever made),
  adding **~238,000 lines of code** and **~162,000 lines of design and research
  docs**.
- **14 new or rebuilt maths trials**, a paid membership for parents, a
  grown-ups' panel, an in-game Starlight currency, a voiced narration system,
  full Russian translation, the lumia.game waitlist, and the Android app.

## What's in this repository

| Path | What it is |
|---|---|
| [`README.md`](README.md) | This page |
| [`HACKATHON.md`](HACKATHON.md) | What existed before Sep 14 and what we built during the hackathon |
| [`MOAT.md`](MOAT.md) | Our learning dataset and the personalisation loop it powers |
| [`samples/`](samples/) | Real, unedited code from the shipped game, with a guide to each file |
| [`LICENSE`](LICENSE) | All rights reserved; code shown for evaluation only |

**Why only samples?** The full game (a ~234,000-line browser client and a
~50,000-line game server) is closed source. This repository holds hand-picked
files built during the hackathon. They show how we work without publishing the
whole product. The samples are copied byte-for-byte from production.

## Blockchain

Lumia has **no blockchain integration**. We are entering the overall competition.

## Videos and team

The pitch video, the product demo and the team details are attached to our
Colosseum submission form.
