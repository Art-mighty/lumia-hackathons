// BUILD THE BRIDGE: the rules, the fifteen levels, and the design brief's
// acceptance list (§12), checked against the file the server actually grades.
// ----------------------------------------------------------------------------
// build-the-bridge.gen.js is loaded by the SERVER (load-games.ts vm-loads it)
// and its check() re-runs evaluate() on every bridge a child submits. So a rule
// that is wrong here is wrong in the record: a corner-only bridge marked right,
// or a real one marked wrong. These tests hold the rules to the brief, in the
// brief's own coordinates, and hold the level count to a LITERAL — three
// source files agreeing with each other proves nothing if they agree on 5.
//
// The controller (editor.js — hold, move, cancel, undo, reset, and "never
// finish while a stone is held") is tested below the rules, the same way
// two-stalls.test.ts drives its counter: the real file, no browser.
import { describe, it } from "mocha";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ENC = path.join(ROOT, "frontend/game/encounters");
const TOOL = path.join(ROOT, "tools/trials/build-the-bridge-solvable.mjs");

type Stone = { i: number; x: number; y: number; r: number };
type Params = {
  ch: number; r: number; rows: number; cols: number; e0: number; e1: number; x0: number; x1: number;
  rocks: number[]; pieces: number[]; turn: number[]; max: number; exact: number; pmax: number;
};
type Verdict = {
  legal: boolean; problems: { kind: string; i: number; cells: number[][] }[];
  area: number; perimeter: number; touches: boolean; reachesExit: boolean; allJoined: boolean;
  loose: number[]; corners: number[][]; wrongDoor: boolean; connected: boolean;
  unmet: { kind: string; have: number; want: number }[]; solved: boolean; route: number[][];
};
type Summary = Record<string, { plays: number; won: boolean; best?: number; needed?: number }> | null;
type Rules = {
  S: Record<string, number>;
  CHAPTERS: { id: string; name: string; showArea?: boolean }[];
  orient(shape: number, r: number): { cells: number[][]; w: number; h: number };
  areaOf(shape: number): number;
  measure(shape: number, r: number): { w: number; h: number; n: number; rect: boolean } | null;
  chapterState(summary: Summary, session: number[]): { id: string; open: boolean; sealed: boolean; start: boolean }[];
  evaluate(p: Params, layout: Stone[]): Verdict;
  tryPlace(p: Params, layout: Stone[], s: Stone): { ok: boolean; why?: string; over?: number; next: Stone[] };
  advise(p: Params, layout: Stone[]): string | null;
  encode(layout: Stone[]): string;
};
type Gen = { rounds: number; draw(rand: () => number, round: number): Params; answer(p: Params): string;
  check(p: Params, key: string, given: unknown): boolean };

/* Load the kit and the generator the way load-games.ts does. */
const sandbox: Record<string, unknown> = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of ["_kit/trial-gen.js", "build-the-bridge/build-the-bridge.gen.js", "build-the-bridge/editor.js"]) {
  new vm.Script(readFileSync(path.join(ENC, f), "utf8"), { filename: f }).runInContext(sandbox);
}
type Editor = {
  layout(): Stone[]; held(): (Stone & { from: string; aimed: boolean }) | null;
  slotTap(i: number): string;
  pick(i: number): boolean; lift(i: number): boolean; aim(x: number, y: number): boolean; turn(): boolean;
  place(): { ok: boolean; why?: string }; cancel(): boolean; putBack(): boolean; undo(): boolean; reset(): boolean;
  canUndo(): boolean; onBoard(i: number): boolean; turnOf(i: number): number; finished(): boolean;
  ev(): Verdict;
};
const Prom = sandbox.Prom as { bridgeRules: Rules; trialGen(id: string): Gen | null; trialGenIds(): string[];
  btbEditor: { create(rules: Rules, p: Params): Editor; grip(cells: number[][]): number[] } };
const R = Prom.bridgeRules;
const out = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const ev = (p: Params, layout: Stone[]) => out(R.evaluate(p, layout));
const level = (id: string, round: number) => out(Prom.trialGen(id)!.draw(() => 0.5, round));

/* The brief's rect(x, y, w, h) as a stone in slot `i`: the turn that makes it. */
function stone(p: Params, i: number, x: number, y: number, w: number, h: number): Stone {
  for (let r = 0; r < 4; r++) {
    const o = R.orient(p.pieces[i], r);
    if (o.w === w && o.h === h && o.cells.length === w * h) return { i, x, y, r };
  }
  throw new Error(`slot ${i} cannot be ${w}x${h}`);
}

const CHAPTERS = ["build-the-bridge-first", "build-the-bridge-count", "build-the-bridge"];

describe("Build the Bridge — the levels", () => {
  it("is three chapters of exactly five levels: fifteen in all", () => {
    // ⚠ A LITERAL, on purpose (see the header).
    const LEVELS = 15;
    assert.deepEqual(out(Prom.trialGenIds()).filter((id) => id.startsWith("build-the-bridge")).sort(), [...CHAPTERS].sort());
    assert.equal(CHAPTERS.reduce((n, id) => n + Prom.trialGen(id)!.rounds, 0), LEVELS);
  });

  it("keeps the original five as the original id, in their original order and targets", () => {
    // 12, 18, 24, 24, 28 — and the outline is judged only on the last two.
    const targets = [0, 1, 2, 3, 4].map((r) => level("build-the-bridge", r));
    assert.deepEqual(targets.map((p) => p.exact), [12, 18, 24, 24, 28]);
    assert.deepEqual(targets.map((p) => p.pmax), [0, 0, 0, 26, 26]);
    assert.deepEqual(targets.map((p) => [p.rows, p.cols]), Array(5).fill([8, 6]));
    // The old round 1 lesson survives: the 3x4 alone is 12 squares and can never reach.
    const p = targets[0];
    const r12 = p.pieces.indexOf(R.S.R12);
    for (let r = 0; r < 4; r++) {
      const o = R.orient(R.S.R12, r);
      for (let x = 0; x + o.w <= p.cols; x++) {
        assert.equal(ev(p, [{ i: r12, x, y: 0, r }]).reachesExit, false, "a lone 3 x 4 must never reach");
      }
    }
  });

  it("proves every level winnable, pins how many ways, and refuses its wrong bridges (the tool)", () => {
    let text = "";
    try {
      text = execFileSync("node", [TOOL], { encoding: "utf8", timeout: 120000 });
    } catch (e) {
      const err = e as { stdout?: string; stderr?: string };
      assert.fail(`the level prover failed:\n${err.stdout ?? ""}${err.stderr ?? ""}`);
    }
    assert.match(text, /self-test: 10 wrong or illegal bridges refused/,
      "the prover's self-test did not run — it may no longer be checking anything");
    assert.match(text, /every level of every chapter is winnable, and only by a real bridge \(15 levels\)/);
  });
});

describe("Build the Bridge — the brief's acceptance list (§12, logic)", () => {
  it("1 · every level's witness wins through the server's own check()", () => {
    for (const id of CHAPTERS) {
      const g = Prom.trialGen(id)!;
      for (let r = 0; r < g.rounds; r++) {
        for (const s of [0, 0.3, 0.7, 0.99]) {
          const p = out(g.draw(() => s, r));
          assert.ok(g.check(p, "", g.answer(p)), `${id} level ${r + 1}`);
        }
      }
    }
  });

  it("2 · both routes round board D's rock are accepted", () => {
    const p = level("build-the-bridge-first", 3);
    for (const col of [1, 3]) {
      const v = ev(p, [stone(p, 0, 2, 0, 1, 2), stone(p, 1, col, 1, 1, 3), stone(p, 2, 2, 3, 1, 2)]);
      assert.ok(v.solved, `round the rock via column ${col}`);
    }
  });

  it("3 · stone in every row without a continuous route does not win", () => {
    const p = level("build-the-bridge-first", 3);         // 5 x 5, rock at (2,2)
    const v = ev(p, [stone(p, 0, 2, 0, 1, 2), stone(p, 1, 0, 2, 1, 3), stone(p, 2, 2, 3, 1, 2)]);
    assert.ok(v.legal && !v.solved && !v.reachesExit);
  });

  it("4 · touching only at a corner is not a path", () => {
    const p = level("build-the-bridge-first", 0);         // 4 x 3, door straight ahead
    const v = ev(p, [stone(p, 0, 1, 0, 1, 2), { i: 1, x: 2, y: 2, r: 0 }]);
    assert.ok(!v.solved && v.corners.length > 0 && v.loose.includes(1));
  });

  it("5 · reaching the far bank beside the door does not win", () => {
    const p = level("build-the-bridge-first", 2);         // 4 x 4, entrance 0, door at 2
    // The L turned once covers (1,2), (0,3), (1,3): joined, on the far bank,
    // one cell short of the door.
    const v = ev(p, [stone(p, 0, 0, 0, 1, 3), { i: 1, x: 0, y: 2, r: 1 }]);
    assert.ok(!v.solved && v.wrongDoor, JSON.stringify(v.route));
  });

  it("6 · a bridge that misses the entrance does not win", () => {
    const p = level("build-the-bridge-first", 0);
    const v = ev(p, [{ i: 0, x: 0, y: 0, r: 0 }, { i: 1, x: 1, y: 2, r: 0 }]);
    assert.ok(!v.solved && !v.touches);
  });

  it("7 · stranded filler cannot make up an exact area", () => {
    const p = level("build-the-bridge-count", 2);         // exactly 12
    // 1x6 up the entrance column reaches row 5 but not the door at x=3; a
    // 2x3 floats elsewhere to bring the count to 12. Not a bridge.
    const i6 = p.pieces.indexOf(R.S.I6), r6 = p.pieces.indexOf(R.S.R6);
    const v = ev(p, [{ i: i6, x: 1, y: 0, r: 0 }, { i: r6, x: 3, y: 0, r: 0 }]);
    assert.equal(v.area, 12);
    assert.ok(!v.solved);
  });

  it("8 · G's eight-square route and H's outline-18 layout do not win, and say why", () => {
    const g = level("build-the-bridge-count", 2);
    const v = ev(g, [stone(g, 2, 1, 0, 1, 6), stone(g, 3, 2, 5, 2, 1)]);
    assert.ok(v.connected && !v.solved);
    assert.deepEqual(v.unmet, [{ kind: "exact", have: 8, want: 12 }]);
    const h = level("build-the-bridge-count", 4);
    const w = ev(h, [stone(h, 0, 0, 0, 3, 2), stone(h, 1, 2, 2, 3, 2)]);
    assert.ok(w.connected && !w.solved && w.area === 12);
    assert.deepEqual(w.unmet, [{ kind: "pmax", have: 18, want: 14 }]);
  });

  it("9 · turning keeps a stone's area; the L is three squares, not its box", () => {
    for (let s = 0; s <= 8; s++) {
      for (let r = 0; r < 4; r++) assert.equal(R.orient(s, r).cells.length, R.areaOf(s));
    }
    const l = R.orient(R.S.L3, 0);
    assert.equal(R.areaOf(R.S.L3), 3);
    assert.equal(l.w * l.h, 4, "its bounding box is 2 x 2, which is NOT its area");
  });

  it("10 · overlap, rocks, the edge of the board and a stone used twice are refused", () => {
    const d = level("build-the-bridge-first", 3);
    const kinds = (layout: Stone[]) => ev(d, layout).problems.map((q) => q.kind);
    assert.deepEqual(kinds([{ i: 1, x: 2, y: 1, r: 0 }]), ["rock"]);
    assert.deepEqual(kinds([{ i: 1, x: 4, y: 3, r: 0 }]), ["off"]);
    assert.deepEqual(kinds([{ i: 0, x: 0, y: 0, r: 0 }, { i: 2, x: 0, y: 1, r: 0 }]), ["overlap"]);
    assert.deepEqual(kinds([{ i: 0, x: 0, y: 0, r: 0 }, { i: 0, x: 3, y: 0, r: 0 }]), ["dup"]);
    const g = Prom.trialGen("build-the-bridge-first")!;
    assert.equal(g.check(d, "", "1210"), false, "the server refuses a stone on a rock");
  });

  it("11 · moving a laid stone never charges its squares twice", () => {
    const f = level("build-the-bridge-count", 1);         // at most 12; R6, R6, O4
    const laid: Stone[] = [{ i: 0, x: 1, y: 0, r: 0 }, { i: 1, x: 2, y: 3, r: 0 }];
    // 12 of 12 used. Sliding one of those two stones is still 12, not 18.
    const moved = out(R.tryPlace(f, laid, { i: 1, x: 3, y: 3, r: 0 }));
    assert.ok(moved.ok, JSON.stringify(moved));
    assert.equal(ev(f, moved.next).area, 12);
    assert.deepEqual(ev(f, moved.next).problems, []);
  });

  it("14 · a hard budget refuses the placement and says by how much", () => {
    const f = level("build-the-bridge-count", 1);
    const laid: Stone[] = [{ i: 0, x: 1, y: 0, r: 0 }, { i: 1, x: 2, y: 3, r: 0 }];
    const extra = out(R.tryPlace(f, laid, { i: 2, x: 0, y: 3, r: 0 }));
    assert.equal(extra.ok, false);
    assert.equal(extra.why, "budget");
    assert.equal(extra.over, 4);
    // And the server agrees: a layout over the budget is never a win.
    const g = Prom.trialGen("build-the-bridge-count")!;
    assert.equal(g.check(f, "", R.encode(extra.next)), false);
  });

  it("the server's parser takes only the browser's exact shape", () => {
    const g = Prom.trialGen("build-the-bridge-first")!;
    const p = level("build-the-bridge-first", 0);
    for (const junk of ["", "0100", "0100-1120-", "01001120", "0100 - 1120", "0104-1120", "__abandoned__", null, 7]) {
      assert.equal(g.check(p, "", junk), false, JSON.stringify(junk));
    }
    assert.equal(g.check(p, "", " 0100-1120 "), true, "surrounding whitespace is not a wrong answer");
    assert.equal(g.check(p, "", "1120-0100"), true, "slot order on the wire does not matter");
  });
});

describe("Build the Bridge — the second hint only says what it has proved", () => {
  it("says 'start' on an empty board and 'done' on a finished one", () => {
    const a = level("build-the-bridge-first", 0);
    assert.equal(R.advise(a, []), "start");
    assert.equal(R.advise(a, [stone(a, 0, 1, 0, 1, 2), stone(a, 1, 1, 2, 1, 2)]), "done");
  });
  it("says 'add' when every stone can stay", () => {
    const a = level("build-the-bridge-first", 0);
    assert.equal(R.advise(a, [stone(a, 0, 1, 0, 1, 2)]), "add");
  });
  it("says 'remove' when a subset, as it lies, is already a bridge", () => {
    const g = level("build-the-bridge-count", 2);         // exactly 12
    // The two 2 x 3 stones are a finished 12; the 1 x 2 beside them makes 14,
    // and adding anything only makes more. Taking the 1 x 2 back finishes it.
    const layout = [{ i: 0, x: 1, y: 0, r: 0 }, { i: 1, x: 2, y: 3, r: 0 }, { i: 3, x: 0, y: 0, r: 0 }];
    assert.equal(ev(g, layout).area, 14);
    assert.equal(R.advise(g, layout), "remove");
  });
  it("says 'change' when the search finished and no bridge keeps them all", () => {
    const g = level("build-the-bridge-count", 2);
    assert.equal(R.advise(g, [stone(g, 2, 1, 0, 1, 6), stone(g, 3, 2, 5, 2, 1)]), "change");
    const h = level("build-the-bridge-count", 4);
    assert.equal(R.advise(h, [stone(h, 0, 0, 0, 3, 2), stone(h, 1, 2, 2, 3, 2)]), "change");
    const e = level("build-the-bridge-count", 0);
    assert.equal(R.advise(e, [{ i: 0, x: 1, y: 0, r: 0 }]), "change", "the 2 x 3 must go back for the 1 x 6");
  });
});

describe("Build the Bridge — the editor (the brief's acceptance list §12, hands)", () => {
  const make = (id: string, round: number) => {
    const p = level(id, round);
    return { p, ed: Prom.btbEditor.create(R, p) };
  };
  const lay = (ed: Editor) => out(ed.layout());
  /* aim() holds a stone by its GRIP (its middle square); this aims the held
     stone's top-left corner instead, which is how the layouts above are written. */
  const aimTop = (ed: Editor, p: Params, x: number, y: number) => {
    const h = ed.held()!;
    const g = Prom.btbEditor.grip(R.orient(p.pieces[h.i], h.r).cells);
    ed.aim(x + g[0], y + g[1]);
  };

  it("12 · a refused placement keeps the stone in hand and the bridge untouched", () => {
    const { ed } = make("build-the-bridge-first", 0);   // 4 x 3
    ed.pick(0); ed.aim(1, 0); assert.ok(ed.place().ok);
    const before = lay(ed);
    ed.pick(1); ed.aim(2, 3);                            // hangs off the far edge
    const r = out(ed.place());
    assert.equal(r.ok, false); assert.equal(r.why, "off");
    assert.deepEqual(lay(ed), before);
    assert.ok(ed.held(), "the stone is still in hand");
    ed.cancel();
    assert.equal(ed.held(), null);
    assert.deepEqual(lay(ed), before);
    assert.equal(ed.onBoard(1), false, "and it is back on the bench");
  });

  it("12 · lifting a laid stone and cancelling restores it exactly", () => {
    const { ed } = make("build-the-bridge-first", 0);
    ed.pick(0); ed.aim(1, 0); ed.place();
    const before = lay(ed);
    ed.lift(0); ed.turn(); ed.aim(0, 2);
    assert.deepEqual(lay(ed), before, "the committed bridge does not move mid-gesture");
    ed.cancel();
    assert.deepEqual(lay(ed), before);
  });

  it("13 · undo steps back over whole edits and restores position, turn and bench", () => {
    const { ed } = make("build-the-bridge-first", 1);   // I3 (starts turned), I2
    ed.pick(0); ed.turn(); ed.turn(); ed.turn(); ed.aim(1, 1);
    assert.equal(ed.canUndo(), false, "turning in the hand is not an edit");
    assert.ok(ed.place().ok);
    const one = lay(ed);
    ed.lift(0); ed.turn(); ed.aim(1, 2);
    const moved = out(ed.place());
    assert.ok(moved.ok || moved.why, "a move is an edit whether or not it lands");
    ed.pick(1); ed.aim(1, 3); ed.place();
    ed.undo();
    assert.equal(ed.onBoard(1), false, "undo returned the last stone to the bench");
    while (ed.canUndo()) ed.undo();
    assert.deepEqual(lay(ed), []);
    assert.ok(one.length === 1);
  });

  it("13 · start over is local and itself undoable; put-back from the bridge is an edit", () => {
    const { ed } = make("build-the-bridge-first", 0);
    ed.pick(0); ed.aim(1, 0); ed.place();
    ed.pick(1); ed.aim(1, 2); ed.place();
    const full = lay(ed);
    assert.ok(ed.reset());
    assert.deepEqual(lay(ed), []);
    ed.undo();
    assert.deepEqual(lay(ed), full, "undo brings the whole layout back");
    ed.lift(1); ed.putBack();
    assert.equal(ed.onBoard(1), false);
    ed.undo();
    assert.equal(ed.onBoard(1), true, "and putting a stone back can be undone too");
  });

  it("15 · a bridge is never finished while a stone is in hand", () => {
    const { ed } = make("build-the-bridge-first", 0);
    ed.pick(0); ed.aim(1, 0); ed.place();
    ed.pick(1); ed.aim(1, 2); ed.place();
    assert.equal(ed.finished(), true);
    ed.lift(1);
    assert.equal(ed.finished(), false, "lifting a stone off a finished bridge un-finishes it");
    ed.cancel();
    assert.equal(ed.finished(), true);
    ed.pick(0);                                          // already laid: refused
    assert.equal(ed.held(), null);
  });

  it("11/14 · a move inside a full budget is allowed; a new stone over it is refused", () => {
    const { p, ed } = make("build-the-bridge-count", 1);   // at most 12
    ed.pick(0); aimTop(ed, p, 1, 0); assert.ok(ed.place().ok);
    ed.pick(1); aimTop(ed, p, 2, 3); assert.ok(ed.place().ok);
    assert.equal(ed.ev().area, 12);
    ed.lift(1); aimTop(ed, p, 3, 3);
    assert.ok(ed.place().ok, "sliding a laid stone does not pay for it again");
    ed.pick(2); aimTop(ed, p, 0, 4);
    const r = out(ed.place());
    assert.equal(r.why, "budget");
    assert.equal(ed.ev().area, 12);
  });
});

describe("Build the Bridge — the tray's one verb (slotTap)", () => {
  const make = (id: string, round: number) => {
    const p = level(id, round);
    return { p, ed: Prom.btbEditor.create(R, p) };
  };
  it("picks from the bench, returns on a second tap, and lifts a laid stone where it lies", () => {
    const { ed } = make("build-the-bridge-first", 0);
    assert.equal(ed.slotTap(0), "picked");
    assert.equal(ed.slotTap(0), "returned");
    assert.equal(ed.held(), null);
    ed.slotTap(0); ed.aim(1, 0); assert.ok(ed.place().ok);
    const laid = out(ed.layout());
    assert.equal(ed.slotTap(0), "lifted", "a stone on the bridge is found again from its button");
    assert.deepEqual(out(ed.layout()), laid, "lifting is a transaction: the bridge has not changed yet");
    assert.equal(ed.slotTap(0), "returned");
    assert.equal(ed.onBoard(0), false, "a second tap takes it off the bridge");
    ed.undo();
    assert.deepEqual(out(ed.layout()), laid, "and that return is undoable");
  });
  it("tapping another stone cancels the one in hand, putting a lifted stone back exactly", () => {
    const { ed } = make("build-the-bridge-first", 0);
    ed.slotTap(0); ed.aim(1, 0); ed.place();
    const laid = out(ed.layout());
    ed.slotTap(0); ed.aim(0, 2);                      // lifted and dragged elsewhere, not set down
    assert.equal(ed.slotTap(1), "picked");
    assert.deepEqual(out(ed.layout()), laid);
    assert.equal(ed.held()!.i, 1);
    assert.equal(ed.slotTap(9), "none");
  });
});

describe("Build the Bridge — which chapters are open, and which are sealed", () => {
  const open = (s: Summary, session: number[] = []) => out(R.chapterState(s, session)).map((c) => c.open);
  const sealed = (s: Summary, session: number[] = []) => out(R.chapterState(s, session)).map((c) => c.sealed);
  const starts = (s: Summary, session: number[] = []) => out(R.chapterState(s, session)).map((c) => c.start);

  it("a new child, a guest or an offline page: only chapter 1", () => {
    assert.deepEqual(open(null), [true, false, false]);
    assert.deepEqual(open({}), [true, false, false]);
  });
  it("a child who played the ORIGINAL five-level bridge keeps it, even without winning it", () => {
    // The original id is chapter 3. Nothing re-locks: finishing it once is enough.
    assert.deepEqual(open({ "build-the-bridge": { plays: 2, won: false } }), [true, false, true]);
    assert.deepEqual(open({ "build-the-bridge": { plays: 1, won: true } }), [true, false, true]);
    assert.deepEqual(sealed({ "build-the-bridge": { plays: 1, won: true } }), [false, false, true]);
    // And pressing E brings back the Great Span they know, not chapter 1.
    assert.deepEqual(starts({ "build-the-bridge": { plays: 2, won: false } }), [false, false, true]);
  });
  it("E starts the highest chapter open", () => {
    assert.deepEqual(starts(null), [true, false, false]);
    assert.deepEqual(starts({ "build-the-bridge-first": { plays: 1, won: true } }), [false, true, false]);
    assert.deepEqual(starts(null, [0, 1]), [false, false, true]);
  });
  it("winning a chapter opens the next one", () => {
    assert.deepEqual(open({ "build-the-bridge-first": { plays: 1, won: true } }), [true, true, false]);
    assert.deepEqual(open({ "build-the-bridge-first": { plays: 3, won: true }, "build-the-bridge-count": { plays: 1, won: true } }),
      [true, true, true]);
    // Played but not won opens nothing further.
    assert.deepEqual(open({ "build-the-bridge-first": { plays: 4, won: false } }), [true, false, false]);
  });
  it("a win on this page opens the next chapter but NEVER draws a seal the server does not hold", () => {
    assert.deepEqual(open(null, [0]), [true, true, false]);
    assert.deepEqual(sealed(null, [0]), [false, false, false], "offline: no seal");
    assert.deepEqual(sealed({}, [0, 1]), [false, false, false]);
    assert.deepEqual(open(null, [0, 1]), [true, true, true]);
  });
});

describe("Build the Bridge — the numbers a stone's label is made of", () => {
  it("chapters 1 and 2 teach area on the label; chapter 3 leaves it to the child", () => {
    assert.deepEqual(out(R.CHAPTERS.map((C) => !!C.showArea)), [true, true, false]);
  });
  it("a rectangle is its sides, turned or not; the L is its squares, never its box", () => {
    assert.deepEqual(out(R.measure(R.S.R6, 0)), { w: 2, h: 3, n: 6, rect: true });
    assert.deepEqual(out(R.measure(R.S.R6, 1)), { w: 3, h: 2, n: 6, rect: true });
    assert.deepEqual(out(R.measure(R.S.L3, 0)), { w: 2, h: 2, n: 3, rect: false });
    assert.deepEqual(out(R.measure(R.S.I6, 3)), { w: 6, h: 1, n: 6, rect: true });
  });
});
