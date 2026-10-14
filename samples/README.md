# Code samples

Unedited files from the live game, copied Oct 12, 2026. Comments mention files
that are not in this repo.

## Build the Bridge

| File | Lines |
|---|---|
| [build-the-bridge.gen.js](build-the-bridge/build-the-bridge.gen.js) | 643 |
| [build-the-bridge-levels.test.ts](build-the-bridge/build-the-bridge-levels.test.ts) | 450 |

The child lays stones over a chasm to make a bridge of a given area. Any layout
that follows the rules wins.

The `.gen.js` file holds the rules and 15 levels and nothing else. The browser
uses it to light up stones, and the server runs the same file to check the
finished bridge. The tests follow the design brief's acceptance list.

History: first version Sep 12. Rebuilt Sep 25; 633 of the 643 lines were added
in the hackathon window. The test file is new.

## Hall of Scales

| File | Lines |
|---|---|
| [hall-of-scales.js](hall-of-scales/hall-of-scales.js) | 1,017 |
| [hall-of-scales.en.json](hall-of-scales/hall-of-scales.en.json) | 40 |
| [hall-of-scales.ru.json](hall-of-scales/hall-of-scales.ru.json) | 38 |

A slab drops onto one pan of a balance. The child drags numbered stones onto
the other pan, and the beam tips by the real difference. Equal weight opens a
door. 20 levels, two balances.

The trial has no hard-coded text. Every sentence lives in the `.json` files,
in English and Russian.

History: first version Sep 10. In the window: entrance (Sep 21), painted art
(Sep 24), Russian (Sep 27), phone layout and narration (Sep 30), second balance
and 20 levels (Oct 7). 890 of the 1,017 lines were added in the window.
