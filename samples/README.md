# Code samples

These are real files from the shipped game, copied **unchanged** from our
private repository on Oct 12, 2026. They are here so you can judge how we
build, not just what we say. Comments in them refer to files that are not in
this repository. That is expected: each sample is one piece of a larger game.

Both samples were **mostly written during the hackathon**. Each one says
exactly what existed before Sep 14.

---

## 1. Build the Bridge: one rulebook for browser, server and tests

| File | Lines | What it is |
|---|---|---|
| [`build-the-bridge/build-the-bridge.gen.js`](build-the-bridge/build-the-bridge.gen.js) | 643 | The trial's rules and its fifteen levels |
| [`build-the-bridge/build-the-bridge-levels.test.ts`](build-the-bridge/build-the-bridge-levels.test.ts) | 450 | The automated tests that hold those rules to the design |

**The trial:** the child lays stone slabs over a chasm to build a bridge
with exactly the area the level asks for, then walks across it. Any
bridge that follows the rules wins. There is no single answer key, so a
child who finds their own solution is never marked wrong.

**What it proves:** the rules file contains *only* the maths. It never
draws anything. The same file is loaded by:

1. **the browser**, which asks it after every move which stones to light up;
2. **the game server**, which runs it again on the finished bridge before
   recording a win, so a child cannot fake a result;
3. **the tests** in this folder;
4. **a solver tool** (not included) that proves every level can be won.

The header comment (first ~60 lines) explains this in plain English and is
worth reading on its own. The test file shows the other half: tests
named after the design brief's acceptance list, so "done" means "matches
what we promised", not "it compiles".

**Before / during the hackathon:** a first version of the trial existed on
Sep 12. On **Sep 25** we rebuilt it in three steps around this shared rules
file. In the window, 633 lines of the current 643-line rules file were
added, and the test file is entirely new.

---

## 2. Hall of Scales: an equation you can see

| File | Lines | What it is |
|---|---|---|
| [`hall-of-scales/hall-of-scales.js`](hall-of-scales/hall-of-scales.js) | 1,017 | The whole trial: two balances, twenty levels, four doors |
| [`hall-of-scales/hall-of-scales.en.json`](hall-of-scales/hall-of-scales.en.json) | 40 | Every English sentence the trial shows |
| [`hall-of-scales/hall-of-scales.ru.json`](hall-of-scales/hall-of-scales.ru.json) | 38 | The same sentences in Russian |

**The trial:** in a temple, a heavy slab drops onto the left pan of a
balance. The child drags numbered stones into the right pan. The beam
tips by the **real** difference, so the child sees "too heavy" or "too
light" instead of being told "wrong". When both sides weigh the same, the
beam locks and a door opens a notch. Twenty levels across two balances
open four doors.

**What it proves:**

- **Teaching through feedback, not red crosses.** The physics of the beam
  is the hint.
- **Accessible on any device.** Stones can be tapped *or* dragged, are sized
  for small phone screens, and follow the web accessibility guidelines for
  touch input (comments cite WCAG, the international web accessibility
  standard).
- **Every word is translatable.** The trial never contains English text
  directly. It looks up each sentence by name in the two `.json` files.
  The `context` field tells a translator what each line is for. Our tests
  fail if a sentence has no Russian.

**Before / during the hackathon:** a first version existed on Sep 10. During
the window we added the way into the hall (Sep 21), painted art for every
piece of the machine (Sep 24), the Russian translation (Sep 27), phone
layouts and character narration (Sep 30), and the second balance with
twenty levels and four doors (Oct 7). In the window, 890 lines of the
current 1,017-line file were added, and both language files are new.
