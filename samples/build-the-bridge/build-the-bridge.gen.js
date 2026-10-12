/* ============================================================
   Encounter generator · BUILD THE BRIDGE — the rules, and the levels
   ------------------------------------------------------------
   THE MATHS, AND NOTHING ELSE. Four readers load THIS FILE and no
   other copy of any rule exists:

     the browser     build-the-bridge.js asks evaluate() after every
                     edit, and draws exactly what it answers
     the server      backend/src/trials/load-games.ts runs it in a vm
                     to issue a level and to CHECK the bridge built
     the prover      tools/trials/build-the-bridge-solvable.mjs
     the tests       backend/test/build-the-bridge-levels.test.ts

   So the stones the child sees light up, the route the character
   walks, and the verdict the server records can never disagree:
   they are three readings of one evaluate(). It touches no DOM,
   no GAME, no canvas.

   ── WHAT A BRIDGE IS (the brief, §3) ─────────────────────────
   A board of rows × cols cells over the chasm. Row y = 0 is the
   near bank, where the child stands; row rows-1 is the far bank,
   where the door is. x runs left to right. The ENTRANCE lip is
   cells (e0..e1, 0); the EXIT lip is cells (x0..x1, rows-1).

   A layout is finished when ALL of these hold:
     1  every stone is on the board, off every rock, on no other
        stone (a layout that breaks this is not even legal);
     2  a stone covers an entrance cell;
     3  there is a path through covered cells, moving only across a
        SHARED EDGE — never corner to corner — from the entrance to
        an exit cell;
     4  every covered cell is on that path's connected piece of
        stone (no floating islands, no stranded filler);
     5  every maths goal written for the level holds.
   "Nothing is being held" is the browser's job, not this file's.

   Side branches are fine. A wide rectangle covers cells beside
   the walking route; they still count as bridge area. There is
   no answer key the layout must match — ANY layout that passes
   the five rules wins, and the server checks exactly these rules.

   ── THE THREE MATHS GOALS, KEPT APART ────────────────────────
     max    "at most N squares" — a HARD budget. The browser refuses
            a placement that would pass it; check() refuses a
            layout over it. 0 = no budget.
     exact  "exactly N squares" — over and under are both legal
            arrangements, just not finished ones. 0 = none.
     pmax   "perimeter at most N" — the outline of the whole stone
            shape: every cell edge with no stone on its other side,
            banks and hole edges included. 0 = none.
   An exact target is never turned into a budget, nor the reverse.

   ── THE LEVELS: THREE CHAPTERS OF FIVE ───────────────────────
   Each chapter is its own trial id, because a sitting of four to
   six levels is what docs/research/trial-ladder-progression.md
   found right, and because the original five levels must keep
   the id their results were recorded under.

     build-the-bridge-first   FIRST STONES — join, turn, reach
     build-the-bridge-count   COUNTING STONES — budgets, exact area,
                                first perimeter
     build-the-bridge         THE GREAT SPAN — the ORIGINAL five,
                                same order, same targets, same pass
                                mark; the id past results are under

   Chapter 1 and 2 are the eight calibration boards of the design
   brief (A–H) plus one new board each (1.5, 2.4). Every level's
   `w` is a developer witness — ONE winning layout, replayed by the
   tests through evaluate() — and never an answer key.

   ── IT TERMINATES FOR ANY `rand`, AND RETURNS SANE PARAMS ───
   draw() is a table lookup plus, in chapter 3 only, a bounded
   Fisher-Yates over at most five stones: n-1 passes, no retry.
   The index is COERCED, not just clamped — NaN and negative rand
   walk straight through Math.min into `pieces[undefined]`, which
   is how the first version of this file shipped a blob of nulls.
   evaluate() and check() are bounded by the board (at most 48
   cells). solutions() is a search, so it carries a node budget
   and the server never calls it.

   ── FLAT PARAMS ─────────────────────────────────────────────
   The vm boundary JSON round-trips whatever draw() returns, so
   every value is a number or a flat array of numbers: `pieces` is
   shape numbers in tray order, `turn` their starting turns, and
   `rocks` is [x,y, x,y, …].

   ── THE WIRE: A LAYOUT IS FOUR DIGITS PER STONE ──────────────
   `i x y r` — tray slot, the placed shape's top-left cell after
   turning, and how many quarter turns — joined by '-', in slot
   order: "0100-1120". Five stones is 24 characters, well under the
   server's 64 (backend/src/trials/grade.ts MAX_ANSWER).
   ============================================================ */
(function (root) {
  'use strict';
  const P = root.Prom;
  if (!P || !P.defineTrialGen) return;

  /* ---------------- the stones ----------------
     Cells are [x, y] in the stone's own frame, y toward the far bank.
     A rectangle is written w wide by h deep, which is also how its label
     reads once laid flat: R6 is "2 × 3". L3 is the one stone that is not a
     rectangle, so it is labelled by its squares, never by its bounding box. */
  const rect = (w, h) => {
    const o = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o.push([x, y]);
    return o;
  };
  const SHAPES = [
    { key: 'I2', cells: rect(1, 2) },                  // 0
    { key: 'I3', cells: rect(1, 3) },                  // 1
    { key: 'L3', cells: [[0, 0], [0, 1], [1, 1]] },    // 2  not a rectangle
    { key: 'O4', cells: rect(2, 2) },                  // 3
    { key: 'R6', cells: rect(2, 3) },                  // 4
    { key: 'I6', cells: rect(1, 6) },                  // 5
    { key: 'R12', cells: rect(3, 4) },                 // 6
    { key: 'R10', cells: rect(2, 5) },                 // 7
    { key: 'O9', cells: rect(3, 3) },                  // 8
  ];
  const S = { I2: 0, I3: 1, L3: 2, O4: 3, R6: 4, I6: 5, R12: 6, R10: 7, O9: 8 };

  function num(v) { const x = Number(v); return Number.isFinite(x) ? x : 0; }
  function int(v) { return Math.floor(num(v)); }

  /* One quarter turn is (x, y) -> (y, -x), then the stone is slid back so its
     top-left cell is (0, 0). Turning never changes the NUMBER of cells — the
     area — only which cells, which is the lesson. Cached: 9 shapes × 4 turns. */
  const ORIENT = SHAPES.map((sh) => {
    const out = [];
    let cur = sh.cells.map((c) => [c[0], c[1]]);
    for (let r = 0; r < 4; r++) {
      let mx = Infinity, my = Infinity;
      for (const c of cur) { if (c[0] < mx) mx = c[0]; if (c[1] < my) my = c[1]; }
      const n = cur.map((c) => [c[0] - mx, c[1] - my]);
      n.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
      let w = 0, h = 0;
      for (const c of n) { if (c[0] + 1 > w) w = c[0] + 1; if (c[1] + 1 > h) h = c[1] + 1; }
      out.push({ cells: n, w, h, sig: n.map((c) => c.join(',')).join(';') });
      cur = cur.map((c) => [c[1], -c[0]]);
    }
    return out;
  });
  /** The stone's cells after `r` quarter turns, top-left at (0, 0). */
  function orient(shape, r) {
    const o = ORIENT[int(shape)];
    return o ? o[((int(r) % 4) + 4) % 4] : null;
  }
  const areaOf = (shape) => (SHAPES[int(shape)] ? SHAPES[int(shape)].cells.length : 0);

  /* ---------------- the levels ----------------
     rows × cols · e = entrance lip [e0, e1] on row 0 · x = exit lip [x0, x1]
     on the far row · rocks [[x,y]] · pieces (shape numbers, tray order) ·
     turn (starting quarter turns) · max / exact / pmax (0 = none) ·
     w = developer witness, [shape, x, y, r] per stone used.

     "Ways" below is how many different winning layouts exist, counted
     exhaustively by tools/trials/build-the-bridge-solvable.mjs, which the
     tests pin. Two identical stones swapped count twice. */
  const CHAPTERS = [
    /* `showArea`: while area is being taught (chapters 1 and 2) a stone is
       labelled "2 × 3 = 6 squares"; chapter 3 says only "2 × 3" and leaves
       the multiplying to the child (decision 5a). */
    { id: 'build-the-bridge-first', name: 'First Stones', showArea: true, levels: [
      /* 1.1 · brief A · ways 2. Two stones, already the right way round.
         The first-ever play shows one of them sliding into place, once. */
      { rows: 4, cols: 3, e: [1, 1], x: [1, 1], rocks: [],
        pieces: [S.I2, S.I2], turn: [0, 0], max: 0, exact: 0, pmax: 0,
        w: [[S.I2, 1, 0, 0], [S.I2, 1, 2, 0]] },
      /* 1.2 · brief B · ways 2. The long stone arrives lying sideways and
         cannot reach until it is turned: rotation, taught by need. */
      { rows: 5, cols: 3, e: [1, 1], x: [1, 1], rocks: [],
        pieces: [S.I3, S.I2], turn: [1, 0], max: 0, exact: 0, pmax: 0,
        w: [[S.I3, 1, 0, 0], [S.I2, 1, 3, 0]] },
      /* 1.3 · brief C · ways 4. The door is not straight ahead; the L turns
         the corner toward it. */
      { rows: 4, cols: 4, e: [0, 0], x: [2, 2], rocks: [],
        pieces: [S.I3, S.L3], turn: [0, 0], max: 0, exact: 0, pmax: 0,
        w: [[S.I3, 0, 0, 0], [S.L3, 1, 2, 0]] },
      /* 1.4 · brief D · ways 16. A rock stands on the straight line; go
         round it on EITHER side — both are wins, and the tests say so. */
      { rows: 5, cols: 5, e: [2, 2], x: [2, 2], rocks: [[2, 2]],
        pieces: [S.I2, S.I3, S.I2], turn: [0, 0, 0], max: 0, exact: 0, pmax: 0,
        w: [[S.I2, 2, 0, 0], [S.I3, 1, 1, 0], [S.I2, 2, 3, 0]] },
      /* 1.5 · new · ways 23. Everything chapter 1 taught at once: the door
         is three columns over, a rock sits in the way, the L has to turn,
         and every winning layout uses all three stones. */
      { rows: 5, cols: 4, e: [0, 0], x: [3, 3], rocks: [[2, 2]],
        pieces: [S.I3, S.L3, S.I2], turn: [0, 0, 0], max: 0, exact: 0, pmax: 0,
        w: [[S.I3, 0, 0, 0], [S.L3, 1, 2, 0], [S.I2, 3, 3, 0]] },
    ] },
    { id: 'build-the-bridge-count', name: 'Counting Stones', showArea: true, levels: [
      /* 2.1 · brief E · ways 1 on purpose. Both stones are 6 squares; only
         the 1 × 6 is long enough. Same area, different reach. */
      { rows: 6, cols: 4, e: [1, 1], x: [1, 1], rocks: [],
        pieces: [S.R6, S.I6], turn: [0, 0], max: 6, exact: 0, pmax: 0,
        w: [[S.I6, 1, 0, 0]] },
      /* 2.2 · brief F · ways 2. At most 12 squares: 6 + 6, and the 2 × 2
         stays on the bench. The tray holds 16, so choosing is the point. */
      { rows: 6, cols: 5, e: [1, 1], x: [3, 3], rocks: [],
        pieces: [S.R6, S.R6, S.O4], turn: [0, 0, 0], max: 12, exact: 0, pmax: 0,
        w: [[S.R6, 1, 0, 0], [S.R6, 2, 3, 0]] },
      /* 2.3 · brief G · ways 10. EXACTLY 12. The 1 × 6 plus a 1 × 2 reaches
         the door with 8 squares and must NOT finish: "4 squares short". */
      { rows: 6, cols: 5, e: [1, 1], x: [3, 3], rocks: [],
        pieces: [S.R6, S.R6, S.I6, S.I2], turn: [0, 0, 0, 0], max: 0, exact: 12, pmax: 0,
        w: [[S.R6, 1, 0, 0], [S.R6, 2, 3, 0]] },
      /* 2.4 · new · ways 24. Exactly 10, and three different sets of stones
         make 10: 1 × 6 + 2 × 2, 2 × 3 + 2 × 2, and L + 1 × 3 + 2 × 2. Only the
         last can reach a door three columns over. Right number, wrong shape —
         old level 1's lesson, on a board a child can hold in their head. */
      { rows: 6, cols: 5, e: [0, 0], x: [3, 3], rocks: [],
        pieces: [S.I6, S.R6, S.L3, S.I3, S.O4], turn: [0, 0, 0, 0, 0], max: 0, exact: 10, pmax: 0,
        w: [[S.L3, 0, 0, 0], [S.I3, 2, 1, 0], [S.O4, 2, 4, 0]] },
      /* 2.5 · brief H · ways 6. Exactly 12 AND an outline of at most 14. The
         two 2 × 3 stones touching along one edge still make 12 squares — with
         an outline of 18. Only packing them into a 3 × 4 block measures 14. */
      { rows: 4, cols: 5, e: [2, 2], x: [2, 2], rocks: [],
        pieces: [S.R6, S.R6], turn: [0, 0], max: 0, exact: 12, pmax: 14,
        w: [[S.R6, 1, 0, 1], [S.R6, 1, 2, 1]] },
    ] },
    { id: 'build-the-bridge', name: 'The Great Span', shuffle: true, showArea: false, levels: [
      /* THE ORIGINAL FIVE, unchanged in order, stones and targets — only
         given a double doorway to land on (cells 2 and 3 of both banks), where
         before any cell of the far row would do. Every one stays solvable.

         3.1 · old 1 · 12 · ways 16. THE LESSON OF THE WHOLE TRIAL. 3 × 4 is
         12 on its own — exactly right — and cannot reach: four rows against
         eight, turned either way. 1 × 6 on end plus the 2 × 3 does. */
      { rows: 8, cols: 6, e: [2, 3], x: [2, 3], rocks: [],
        pieces: [S.R6, S.I6, S.R12], turn: [0, 0, 0], max: 0, exact: 12, pmax: 0,
        w: [[S.R6, 1, 0, 0], [S.I6, 3, 2, 0]] },
      /* 3.2 · old 2 · 18 · ways 4. 3 × 4 and a 1 × 6 overlapping in ROWS
         while sitting in different columns. 2 × 5 joins the tray and is a
         distractor from here on: no set containing it makes 18 or 24. */
      { rows: 8, cols: 6, e: [2, 3], x: [2, 3], rocks: [],
        pieces: [S.R6, S.I6, S.R12, S.R10], turn: [0, 0, 0, 0], max: 0, exact: 18, pmax: 0,
        w: [[S.I6, 2, 0, 0], [S.R12, 3, 4, 0]] },
      /* 3.3 · old 3 · 24 · ways 288. 24 = 12 + 6 + 6 and nothing else from
         this tray. You cannot lay it straight. */
      { rows: 8, cols: 6, e: [2, 3], x: [2, 3], rocks: [],
        pieces: [S.R6, S.I6, S.R12, S.R10], turn: [0, 0, 0, 0], max: 0, exact: 24, pmax: 0,
        w: [[S.R6, 0, 0, 0], [S.I6, 2, 0, 0], [S.R12, 3, 4, 0]] },
      /* 3.4 · old 4 · 24, outline ≤ 26, two rocks · ways 16. Round 3's
         sprawling S measures 28 and is turned back; the same stones packed
         tight measure 24. Same area, different perimeter. */
      { rows: 8, cols: 6, e: [2, 3], x: [2, 3], rocks: [[5, 6], [0, 1]],
        pieces: [S.R6, S.I6, S.R12, S.R10], turn: [0, 0, 0, 0], max: 0, exact: 24, pmax: 26,
        w: [[S.R6, 1, 0, 0], [S.I6, 3, 2, 0], [S.R12, 0, 3, 0]] },
      /* 3.5 · old 5 · 28, outline ≤ 26, three rocks · ways 86. 28 = 12 +
         10 + 6 only; 3 × 3 arrives purely to be refused.
         THE CAP WAS 28 UNTIL IT WAS COUNTED: 28 let 56% of correct-area
         bridges through, looser than round 4. Do not raise it without
         re-counting. */
      { rows: 8, cols: 6, e: [2, 3], x: [2, 3], rocks: [[5, 7], [5, 4], [0, 0]],
        pieces: [S.R6, S.I6, S.R12, S.R10, S.O9], turn: [0, 0, 0, 0, 0], max: 0, exact: 28, pmax: 26,
        w: [[S.R10, 1, 0, 0], [S.I6, 0, 1, 0], [S.R12, 1, 5, 1]] },
    ] },
  ];

  /* ---------------- which chapters are open ----------------
     `summary` is the server's per-character record (window.TRIALS: id →
     { plays, won, … }), or null when it has not spoken — a guest, offline,
     not joined yet. `session` lists the chapter numbers won on this page.

       open    chapter 1, or the chapter before it is won, or this child has
               ever won or FINISHED this chapter. Nothing re-locks, and anyone
               who finished the ORIGINAL five-level bridge — the id
               build-the-bridge, now chapter 3 — finds it open on day one.
       sealed  won ON THE SERVER. A win on this page opens the next chapter
               but never draws a seal: a seal says the record holds it, and
               an offline win is not in the record (yet).
       start   the one chapter pressing E begins: the HIGHEST open, not the
               end of the first unbroken run — a child who finished the
               original bridge has 1 and 3 open, 2 shut, and E must bring back
               the Great Span they know.

     Read by the browser only; the server never calls it. */
  function chapterState(summary, session) {
    const rec = (k) => (summary && CHAPTERS[k] && summary[CHAPTERS[k].id]) || null;
    const mine = (k) => !!(session && session.indexOf(k) >= 0);
    const won = (k) => mine(k) || !!(rec(k) && rec(k).won);
    const played = (k) => !!(rec(k) && rec(k).plays > 0);
    const out = CHAPTERS.map((C, k) => ({
      id: C.id,
      name: C.name,
      open: k === 0 || won(k - 1) || won(k) || played(k),
      sealed: !!(rec(k) && rec(k).won),
      start: false,
    }));
    let top = 0;
    out.forEach((c, k) => { if (c.open) top = k; });
    out[top].start = true;
    return out;
  }

  /** The numbers a stone's label is made of; the browser owns the words.
      `rect` is false for the L, which is labelled by its squares and never
      by its 2 × 2 box. */
  function measure(shape, r) {
    const o = orient(shape, r);
    if (!o) return null;
    const n = areaOf(shape);
    return { w: o.w, h: o.h, n, rect: o.w * o.h === n };
  }

  function levelAt(ch, round) {
    const C = CHAPTERS[int(ch)] || CHAPTERS[0];
    let i = int(round);
    if (!(i >= 0)) i = 0;
    if (i > C.levels.length - 1) i = C.levels.length - 1;
    return { C, L: C.levels[i], i };
  }

  /* ---------------- the verdict ----------------
     layout: [{ i, x, y, r }] — tray slot, top-left of the turned stone, turns.
     Returns everything the browser needs to DRAW the state and SAY what is
     wrong, and the one boolean the server needs: `solved`. */
  function evaluate(p, layout) {
    const R = int(p && p.rows), Cn = int(p && p.cols), N = R * Cn;
    const pieces = (p && p.pieces) || [];
    const occ = new Array(Math.max(0, N)).fill(-1);
    const idx = (x, y) => y * Cn + x;
    const inB = (x, y) => x >= 0 && y >= 0 && x < Cn && y < R;
    const rock = new Set();
    const rk = (p && p.rocks) || [];
    for (let k = 0; k + 1 < rk.length; k += 2) if (inB(int(rk[k]), int(rk[k + 1]))) rock.add(idx(int(rk[k]), int(rk[k + 1])));

    const problems = [];
    const used = new Set();
    for (const s of layout || []) {
      const i = int(s && s.i), x = int(s && s.x), y = int(s && s.y), r = int(s && s.r);
      if (!(i >= 0 && i < pieces.length) || used.has(i) || r < 0 || r > 3) {
        problems.push({ kind: used.has(i) ? 'dup' : 'bad', i, cells: [] });
        continue;
      }
      used.add(i);
      const o = orient(pieces[i], r);
      if (!o) { problems.push({ kind: 'bad', i, cells: [] }); continue; }
      const off = [], onRock = [], clash = [];
      for (const c of o.cells) {
        const cx = x + c[0], cy = y + c[1];
        if (!inB(cx, cy)) { off.push([cx, cy]); continue; }
        const k = idx(cx, cy);
        if (rock.has(k)) onRock.push([cx, cy]);
        else if (occ[k] >= 0) clash.push([cx, cy]);
      }
      if (off.length) problems.push({ kind: 'off', i, cells: off });
      if (onRock.length) problems.push({ kind: 'rock', i, cells: onRock });
      if (clash.length) problems.push({ kind: 'overlap', i, cells: clash });
      if (off.length || onRock.length || clash.length) continue;
      for (const c of o.cells) occ[idx(x + c[0], y + c[1])] = i;
    }

    let area = 0, shared = 0;
    for (let y = 0; y < R; y++) for (let x = 0; x < Cn; x++) {
      if (occ[idx(x, y)] < 0) continue;
      area++;
      if (x + 1 < Cn && occ[idx(x + 1, y)] >= 0) shared++;
      if (y + 1 < R && occ[idx(x, y + 1)] >= 0) shared++;
    }
    /* The perimeter of the UNION, not the sum of the stones' own outlines:
       4 per square, minus 2 for every edge two squares share (P = 4N - 2E). */
    const perimeter = 4 * area - 2 * shared;

    const e0 = int(p && p.e0), e1 = int(p && p.e1), x0 = int(p && p.x0), x1 = int(p && p.x1);
    const ents = [], exits = [];
    for (let x = e0; x <= e1; x++) if (inB(x, 0)) ents.push(idx(x, 0));
    for (let x = x0; x <= x1; x++) if (inB(x, R - 1)) exits.push(idx(x, R - 1));

    /* Four-neighbour flood from the covered entrance cells, remembering the
       cell each one was reached from, so the route falls out for free. */
    const joined = new Array(Math.max(0, N)).fill(0);
    const from = new Array(Math.max(0, N)).fill(-1);
    const queue = [];
    for (const k of ents) if (occ[k] >= 0 && !joined[k]) { joined[k] = 1; queue.push(k); }
    for (let q = 0; q < queue.length; q++) {
      const k = queue[q], x = k % Cn, y = (k - x) / Cn;
      const nb = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
      for (const n of nb) {
        if (!inB(n[0], n[1])) continue;
        const m = idx(n[0], n[1]);
        if (occ[m] < 0 || joined[m]) continue;
        joined[m] = 1; from[m] = k; queue.push(m);
      }
    }
    let joinedCount = 0;
    for (let k = 0; k < N; k++) if (joined[k]) joinedCount++;
    let reached = -1;
    for (const k of queue) if (exits.indexOf(k) >= 0) { reached = k; break; }
    const route = [];
    for (let k = reached; k >= 0; k = from[k]) route.unshift([k % Cn, (k - (k % Cn)) / Cn]);

    /* Stones with a square the flood never reached — the not-joined look. */
    const loose = [];
    for (let k = 0; k < N; k++) if (occ[k] >= 0 && !joined[k] && loose.indexOf(occ[k]) < 0) loose.push(occ[k]);
    /* Corner-only contact: a joined square and a loose one meeting at a
       corner. Worth its own sentence — it is the commonest wrong belief. */
    const corners = [];
    for (let k = 0; k < N; k++) {
      if (!joined[k]) continue;
      const x = k % Cn, y = (k - x) / Cn;
      for (const d of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const ax = x + d[0], ay = y + d[1];
        if (!inB(ax, ay)) continue;
        const m = idx(ax, ay);
        if (occ[m] >= 0 && !joined[m]) corners.push([x, y, ax, ay]);
      }
    }
    let farRow = false;
    for (let x = 0; x < Cn; x++) if (joined[idx(x, R - 1)]) farRow = true;

    const unmet = [];
    const max = int(p && p.max), exact = int(p && p.exact), pmax = int(p && p.pmax);
    if (max > 0 && area > max) unmet.push({ kind: 'max', have: area, want: max });
    if (exact > 0 && area !== exact) unmet.push({ kind: 'exact', have: area, want: exact });
    if (pmax > 0 && perimeter > pmax) unmet.push({ kind: 'pmax', have: perimeter, want: pmax });

    const legal = problems.length === 0;
    const touches = ents.some((k) => occ[k] >= 0);
    const reachesExit = reached >= 0;
    const allJoined = area > 0 && joinedCount === area;
    return {
      legal, problems, occ, joined, area, perimeter,
      touches, reachesExit, allJoined, loose, corners,
      wrongDoor: !reachesExit && farRow,
      connected: legal && touches && reachesExit && allJoined,
      unmet,
      solved: legal && area > 0 && touches && reachesExit && allJoined && unmet.length === 0,
      route,
    };
  }

  /* ---------------- the wire ---------------- */
  function encode(layout) {
    return (layout || []).slice().sort((a, b) => a.i - b.i)
      .map((s) => '' + s.i + s.x + s.y + s.r).join('-');
  }
  /** "0100-1120" → [{i,x,y,r}], or null. Strict on purpose: the browser writes
      exactly this shape, so anything else is not an answer. */
  function parse(given) {
    const t = String(given == null ? '' : given).trim();
    if (!/^[0-9]{4}(-[0-9]{4}){0,9}$/.test(t)) return null;
    return t.split('-').map((q) => ({ i: +q[0], x: +q[1], y: +q[2], r: +q[3] }));
  }

  /* ---------------- the search ----------------
     Winning layouts, found by trying every placement of every stone not in
     `keep` (which must stay exactly where it is). Two budgets: `limit` stops
     after that many wins, `budget` after that many tries. `done` says whether
     the search FINISHED — only a finished search may be used to claim "there
     is no way", which is why the browser's second hint checks it.

     Used by the prover, the tests and the second hint press. Never by the
     server. */
  function solutions(p, opts) {
    opts = opts || {};
    const limit = opts.limit > 0 ? opts.limit : Infinity;
    const budget = opts.budget > 0 ? opts.budget : 2e6;
    const R = int(p.rows), Cn = int(p.cols), N = R * Cn;
    const pieces = p.pieces || [];
    const keep = opts.keep || [];
    const out = [];
    let nodes = 0, stopped = false;

    const base = evaluate(p, keep);
    if (!base.legal) return { list: out, done: true, nodes };
    const occ = base.occ.slice();
    const rock = new Set();
    for (let k = 0; k + 1 < (p.rocks || []).length; k += 2) rock.add(int(p.rocks[k + 1]) * Cn + int(p.rocks[k]));
    const kept = new Set(keep.map((s) => int(s.i)));
    const free = [];
    for (let i = 0; i < pieces.length; i++) if (!kept.has(i)) free.push(i);

    /* Every distinct footprint of each free stone, with the lowest turn that
       makes it — a 2 × 2 has one, a 1 × 3 two, the L four. */
    const opt = free.map((i) => {
      const seen = new Set(), list = [];
      for (let r = 0; r < 4; r++) {
        const o = orient(pieces[i], r);
        if (seen.has(o.sig)) continue;
        seen.add(o.sig);
        for (let y = 0; y + o.h <= R; y++) for (let x = 0; x + o.w <= Cn; x++) {
          const cells = o.cells.map((c) => (y + c[1]) * Cn + x + c[0]);
          if (cells.some((k) => rock.has(k))) continue;
          list.push({ i, x, y, r, cells });
        }
      }
      return list;
    });
    const cap = int(p.max) > 0 ? int(p.max) : int(p.exact) > 0 ? int(p.exact) : Infinity;
    const want = int(p.exact);
    const restArea = [];
    let acc = 0;
    for (let j = free.length - 1; j >= 0; j--) { acc += areaOf(pieces[free[j]]); restArea[j] = acc; }
    restArea[free.length] = 0;

    const chosen = keep.slice();
    function rec(j, area) {
      if (stopped) return;
      if (++nodes > budget) { stopped = true; return; }
      if (area > cap) return;
      if (want > 0 && area + restArea[j] < want) return;
      if (j === free.length) {
        if (area > 0 && evaluate(p, chosen).solved) {
          out.push(chosen.map((s) => ({ i: s.i, x: s.x, y: s.y, r: s.r })));
          if (out.length >= limit) stopped = true;
        }
        return;
      }
      rec(j + 1, area);                          // this stone stays on the bench
      for (const pl of opt[j]) {
        if (stopped) return;
        let clash = false;
        for (const k of pl.cells) if (occ[k] >= 0) { clash = true; break; }
        if (clash) continue;
        for (const k of pl.cells) occ[k] = pl.i;
        chosen.push(pl);
        rec(j + 1, area + pl.cells.length);
        chosen.pop();
        for (const k of pl.cells) occ[k] = -1;
      }
    }
    rec(0, base.area);
    return { list: out, done: !stopped || out.length >= limit, nodes };
  }

  /* ---------------- one stone, set down ----------------
     Would stone s = { i, x, y, r } fit into the committed layout? Its own old
     spot is taken out FIRST, so moving a stone already on the bridge never
     charges its squares twice against a budget. `why` is one of
       'off' · 'rock' · 'overlap'   with the offending cells, or
       'budget'                     with `over`, the squares past the limit. */
  function tryPlace(p, layout, s) {
    const next = (layout || []).filter((q) => q.i !== s.i)
      .concat([{ i: s.i, x: s.x, y: s.y, r: s.r }]);
    const ev = evaluate(p, next);
    const mine = ev.problems.filter((q) => q.i === s.i);
    if (mine.length) {
      const cells = [];
      mine.forEach((q) => { q.cells.forEach((c) => cells.push(c)); });
      return { ok: false, why: mine[0].kind, cells, next, ev };
    }
    const max = int(p.max);
    if (max > 0 && ev.area > max) return { ok: false, why: 'budget', over: ev.area - max, cells: [], next, ev };
    return { ok: true, next, ev };
  }

  /* ---------------- the second hint, PROVED ----------------
     What kind of change still leads to a finished bridge from what is on the
     board now. Each answer is a claim the search has just checked, never a
     guess (the user's rule: no hint that is only locally sensible):
       'done'    it is already a bridge
       'start'   nothing is laid yet — every bridge begins at the entrance
       'add'     some finished bridge KEEPS every stone where it is
       'remove'  some finished bridge is a subset of these stones, as they lie
       'change'  the search FINISHED and no bridge keeps them all: at least one
                 stone has to move, turn or go back to the bench
       null      the search ran out of budget — say nothing more than hint 1 */
  function advise(p, layout, budget) {
    layout = layout || [];
    const ev = evaluate(p, layout);
    if (!ev.legal) return null;
    if (ev.solved) return 'done';
    if (!layout.length) return 'start';
    const kept = solutions(p, { keep: layout, limit: 1, budget: budget || 3e5 });
    if (kept.list.length) return 'add';
    if (!kept.done) return null;
    const n = layout.length;
    for (let mask = 1; mask < (1 << n) - 1; mask++) {
      const sub = layout.filter((_, k) => mask & (1 << k));
      if (evaluate(p, sub).solved) return 'remove';
    }
    return 'change';
  }

  /* ---------------- the generator, three times ---------------- */
  /* The witness names SHAPES; the tray may be shuffled, so each witness stone
     takes the first unused slot holding that shape. */
  function witness(p) {
    /* Written down, never searched for: answer() runs on the server, which
       must not run a search. The tests fail any level without one. */
    const w = levelAt(p.ch, p.r).L.w || [];
    const taken = new Set(), out = [];
    for (const [shape, x, y, r] of w) {
      let i = -1;
      for (let k = 0; k < p.pieces.length; k++) if (!taken.has(k) && p.pieces[k] === shape) { i = k; break; }
      if (i < 0) return [];
      taken.add(i);
      out.push({ i, x, y, r });
    }
    return out;
  }

  const RULES = { SHAPES, S, orient, areaOf, measure, evaluate, tryPlace, advise, encode, parse, solutions, witness,
    chapterState, CHAPTERS };
  P.bridgeRules = RULES;

  CHAPTERS.forEach((C, ch) => {
    P.defineTrialGen(C.id, {
      rounds: 5,
      rules: RULES,
      chapter: ch,

      draw(rand, round) {
        const { L, i } = levelAt(ch, round);
        let order = L.pieces.map((_, k) => k);
        if (C.shuffle) {
          /* Which stone sits in which slot, so the answer cannot be learned
             as "the first and the third". Bounded, NaN-proof. */
          const pick = (n) => {
            const v = Math.floor(rand() * n);
            return Number.isFinite(v) ? Math.max(0, Math.min(n - 1, v)) : 0;
          };
          for (let k = order.length - 1; k > 0; k--) {
            const j = pick(k + 1);
            const t = order[k]; order[k] = order[j]; order[j] = t;
          }
        }
        const rocks = [];
        L.rocks.forEach((c) => { rocks.push(c[0], c[1]); });
        return {
          ch, r: i, rows: L.rows, cols: L.cols,
          e0: L.e[0], e1: L.e[1], x0: L.x[0], x1: L.x[1],
          rocks,
          pieces: order.map((k) => L.pieces[k]),
          turn: order.map((k) => L.turn[k]),
          max: L.max, exact: L.exact, pmax: L.pmax,
        };
      },

      /* One canonical key, the level's witness. It is never compared: check()
         below recomputes the verdict, so any winning layout is right. */
      answer(p) { return encode(witness(p)); },

      /* The server's whole judgement: re-run the rules on the bridge the
         child actually built, against the params it issued. */
      check(p, key, given) {
        const layout = parse(given);
        if (!layout) return false;
        return evaluate(p, layout).solved;
      },
    });
  });
})(typeof window !== 'undefined' ? window : globalThis);
