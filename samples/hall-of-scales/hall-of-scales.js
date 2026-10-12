/* ============================================================
   Encounter · THE HALL OF SCALES — make both sides the same
   ------------------------------------------------------------
   TWO balances in the Temple of Balance's hub room
   (room:temple-of-balance), one engine, twenty levels:

     the first scale    stands on the carved floor medallion and
                        plays levels 1–5 as trial `hall-of-scales`.
                        Winning it opens the sealed stone door.
     the court scale    stands on the geometric floor inlay in
                        the north court and plays levels 6–20 as
                        THREE CHAPTERS of five, each its own trial
                        id (hall-of-scales-door-1..3). Each
                        chapter lights five lamps over one crimson
                        door and opens it; a chapter opens when the
                        one before it is won. [E] starts the first
                        chapter this child has not won yet — all
                        three won, it replays the last.

   One play of either scale:
     roam    the balance stands idle and level. Walk near and a
             gold pill offers [E].
     play    a fixed slab thuds onto the left pan and the beam
             swings down. Numbered stones rise onto the pedestals.
             Tap or drag a stone into the right pan; the beam eases
             to the REAL difference. When the two sides weigh the
             same the beam locks and the door moves a notch — one
             bar or one lamp per level. Five levels, and on the
             fifth the door opens wide.

   ── WON, AND WHAT A DOOR DOES ABOUT IT ──────────────────────
   NEED first-try levels of the five win the run. A win opens its
   door for this child for good — the server's record keeps it —
   and the server tells everyone else in the room, whose door
   then stands open for a minute. A run with more mistakes than
   that still finishes, and the door stays where the run left it.
   All of that is doors.js next door, which owns the four doors,
   the lamps and the walls; this file only tells it how far a run
   has got. frontend/docs/hall-of-scales-two-trials.md is the
   record of how fifteen levels became two trials of twenty.

   ── THE REVEAL ──────────────────────────────────────────────
   The doors stand nine to eleven tiles from their balances, off
   the edge of the screen while a child plays, so the FIRST win of
   a door flies the camera over to it, opens it there with its
   sound, and flies back; the end card follows. A run during the
   level only creeps the slab (CREEP), so the opening is still to
   come when the camera arrives. Short, first-time-only, and any
   key, tap or click skips it — it never takes the input lock, so
   a child who walks simply walks out of it. Under reduced motion
   the camera cuts instead of gliding.
   frontend/docs/hall-of-scales-door-reveal.md is the record.

   ── WHERE THE SET-PIECES STAND ──────────────────────────────
   Their props are RUNTIME props — not map rows, so Creator
   cannot select them and there is no placement to save. Each
   balance hangs off the SHIPPED prop it is anchored on (`anchor`
   in its station), with its five pedestals a row in front and
   the camera's focus. Drag the anchor in Creator and they walk
   over in the SAME FRAME: `reanchor()` compares its cell every
   tick. No anchor, no balance — it fails CLOSED with a console
   warning, and the other one still works. The two anchors must
   be different KINDS: a balance finds its anchor by kind.

   ── NO WORDS, AND WHAT THAT COSTS ───────────────────────────
   By design there is no guide, no intro dialogue and no
   explanation: the room states the problem. TrialUI.rounds()
   works with no dialogue bar open, so the diamonds and the
   learning record survive that — but TrialUI.quit() begins
   `if (!barOpen())` and therefore does NOTHING when the bar was
   never opened, so Escape would not work. onKey() below is that
   missing exit, and the [E] pill turns into "Stop weighing"
   while a run is live so a child with no keyboard has one too.

   TrialUI.end() is the ONE place words appear, at the very end.
   It is also the only call that files the attempt as FINISHED
   rather than abandoned (report(false) vs report(true)) and the
   only place the child is shown what the spirits paid — and a
   reward never seen does no motivational work
   (frontend/docs/gamification/05).

   ── WITNESSED, NOT GRADED, AND THAT IS DELIBERATE ───────────
   There is no <id>.gen.js and no entry in load-games.ts's
   ENCOUNTERS. minigame-creator's stop rule: grade a trial only
   if a round has exactly ONE scalar answer submitted ONCE. Here
   a round is many placements and the balance itself is the
   verdict — there is nothing to submit and no commit step to
   invent. twin-scales and door-of-ten, the two closest shipped
   relatives, are witnessed for the same reason. If this ever
   grows a lever, the generator goes in a .gen.js next door and
   the ids go in ENCOUNTERS with a termination review.

   ── THE INPUT LOCK IS NEVER TAKEN ───────────────────────────
   Unlike every other click-play trial here, the child keeps
   walking for the whole run. What buys the readable stone size
   instead is the ZOOM: Prom.scene.setSceneZoom holds ~1.4 while
   the run is live, which turns props.js's 42-unit stone into 59
   CSS px and its 17-unit numeral into 24 — over the child floor
   in docs/gamification/03. The cost is that a tap which misses
   a stone falls through to click-to-move; onDown() calls
   stopPropagation() on every hit, and Prom.hos's boxes are
   padded hard, which is as far as that can be mitigated while
   the player still walks.

   Scenery is the Hall's own manifest (backend/content/locations/
   tob-hall.js) plus Creator rows; this file adds only runtime
   props and removes them all again. It NEVER writes to the map.
   Art and the shared pan geometry are props.js, the doors are
   doors.js; both must load first. Registered via
   Prom.defineEncounter with ONE zoneTick for the room that ticks
   both balances and the doors; the zone is named LITERALLY,
   because attachEncounters in game.html is only ever called with
   the meadow.
   ============================================================ */
Prom.defineEncounter('hall-of-scales', { attach() {
  const msg = key => ({i18n: 'hall-of-scales.' + key});

  const ZONE = 'room:temple-of-balance';
  /* ⚠ `R` STAYS A WRITTEN-OUT NUMBER. backend/test/world-rounds.test.ts reads
     this file as TEXT and pulls the run length out with a pattern match,
     because the server's own copy of it (src/trials/world-rounds.ts) decides
     whether the run is paid — and it is the length of EVERY run here, the
     first scale's and each chapter's alike. A computed length would match
     nothing and fail the extractor, and the test also refuses a SECOND
     `R = <int>` binding anywhere in the file. NEED is mirrored by the server
     in src/trials/temple-doors.ts, which decides who else a win opens a door
     for; the same test holds the two equal. */
  const R = 5, NEED = 4;
  /* The bronze bars on the stone door (and the lamps over each crimson one):
     one per level. props.js's drawDoorSlab draws exactly five. */
  const BARS = 5;
  const DOORS = Prom.hosDoors;
  const LOCK = 'trial:hall-of-scales';   // only ever used to CLEAR a stray lock
  const FLY_S = 0.28;                    // seconds a stone spends in the air
  const ARC = 34;                        // how high it arcs, in screen px
  const TAP_SLOP = 6;                    // CSS px of travel before a press is a drag
  /* ── HEAVY BRONZE ────────────────────────────────────────
     The beam is a damped SPRING, not an ease. An ease slides to the new angle
     and stops, which reads as a slider; a heavy bronze beam swings past the
     mark and rocks back a few times, slower each swing. K is the stiffness and
     C the damping: K 34 gives a period of about 1.1 s, and C 3.4 puts the
     damping ratio near 0.29, so the child sees two or three swings settle over
     roughly a second and a half. LAND is the extra kick a landing stone gives
     the pan it drops into — the pan dips hard and recovers, which is the thing
     that makes a placement feel like it weighed something. */
  const K = 34, C = 3.4, LAND = 1.9;
  const SWAY = 9;                        // px of chain lag per unit of beam speed
  /* How far the camera leans off the player toward the scale. The set-piece is
     four tiles across and the camera follows the player, so without this the
     balance spends most of the run half off the screen — which is exactly what
     the first production play-through looked like. The lean fades out past
     FAR tiles so a child who walks away is never left off-screen. */
  const LEAN = 0.62, NEAR = 3, FAR = 8, START_RADIUS = 3.2;
  /* ── THE REVEAL'S BEATS, in ms of the room's own tick ─────
     Glide out over GLIDE_MS; the door opens at OPEN_MS, when the camera is
     nearly there; the camera starts home at BACK_MS and the end card comes
     at DONE_MS. About 2.5 s in all — the one measured switch-to-door figure
     in the research is 2 s for the whole transition, and frequent motion
     must be shorter still, which is why it never repeats. Ticked, not
     timed: a paused or hidden tab holds the reveal where it is.
     CREEP is how far a run lifts the stone slab before the win (a fifth of
     it per level solved): "every level opens the door a little further",
     with the big sink saved for the camera. */
  const GLIDE_MS = 650, OPEN_MS = 700, BACK_MS = 1900, DONE_MS = 2550;
  const CREEP = 0.3;
  /* The ghost hand (Prom.trialKit.guide): it first shows the move on level
     one of the first balance, for a child who has never opened its door,
     then returns only after this long untouched — never after a mistake
     (design rule 8; wordless-machine-legibility: idle, not error). */
  const HAND_AFTER = 8000, HAND_AGAIN = 15000;
  const reduced = () => !!(Prom.trialKit && Prom.trialKit.reduced && Prom.trialKit.reduced());
  const ease = (p) => { p = Math.max(0, Math.min(1, p)); return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; };
  const mix = (a, b, k) => ({ gx: a.gx + (b.gx - a.gx) * k, gy: a.gy + (b.gy - a.gy) * k, z: 0 });
  const sound = (what) => { if (window.SOUND && SOUND.weighed) SOUND.weighed(what); };

  /* ── THE TWENTY LEVELS ───────────────────────────────────
     One table, in playing order. Levels 1–5 are the first scale; 6–10,
     11–15 and 16–20 are the court's three chapters (`from` in STATIONS).
     `left` is what the fixed pan already holds; `face` overrides what is cut
     into a slab when the number and the writing differ. `stones` are the
     loose weights on the pedestals, laid out left to right and CENTRED on
     the five plinths by newRound(). `id` is a stable label so a test can say
     "original 1's content is still here" after a reordering — nothing at
     runtime addresses a level by name.

     EVERY LEVEL HAS AT LEAST TWO SOLUTIONS. That is the lesson of the whole
     temple — set the weights out one way or set them out another and the
     beam comes level all the same — so a level with a single answer would
     teach the opposite of what this place is for. world-rounds.test.ts
     enumerates every subset of all twenty on every commit.

       1   3      = 3 · 1+2               (one stone answers a slab)
       2   4      = 4 · 1+3
       3   5      = 1+4 · 2+3             (first level no one stone can answer)
       4   6      = 2+4 · 1+5
       5   7      = 1+6 · 3+4             (two clean pairs: the whole lesson)
       6   8      = 3+5 · 1+2+5           (a pair OR a three)
       7   9      = 3+6 · 2+3+4
       8  10      = 4+6 · 1+4+5           (reaching ten exactly)
       9  11      = 5+6 · 2+3+6           (first crossing PAST ten)
      10  12      = 8+4 · 6+4+2 · 2+4+6   ORIGINAL 1
      11  12      = 5+7 · 2+3+7           (same target, no pair leaps out)
      12  20      = 9+11 · 3+6+11 · 3+8+9 ORIGINAL 2
      13  25      = 9+16 · 5+9+11         ORIGINAL 3 (7+9+11 = 27, near miss)
      14  14+9=23 = 8+15 · 10+13 · 5+8+10 ORIGINAL 4 (add the LEFT side first)
      15  4x8 =32 = 20+7+5 · 5+7+9+11     ORIGINAL 5 (fixed side is a sum)
      16  18+17=35 = 9+12+14 · 6+9+20     (two slabs, a carry)
      17  6x7 =42 = 7+15+20 · 7+12+23
      18  50-9=41 = 8+15+18 · 8+13+20     (the first take-away on a slab)
      19  3x8+15=39 = 9+14+16 · 14+25     (a product AND a slab)
      20  7x8 =56 = 14+17+25 · 9+22+25

     ⚠ ORIGINAL 1 SITS AT 10, AHEAD OF THE OTHER TWELVE AT 11, and that is not
     a slip. Both ask for twelve; the original offers it from a tidy 2/4/6/8
     set where 4+8 leaps out, the other from 2/3/5/7 where 5+7 has to be
     looked for. Numeric target is not difficulty.

     Every number is under 100, there is no division and no two-digit
     multiplier, and none of the five added on 7 Oct 2026 has a one-stone
     answer. */
  const ROUNDS = [
    /* the first scale: one stone, then pairs */
    { id: 'hos-01', left: [{ v: 3 }], stones: [1, 2, 3] },
    { id: 'hos-02', left: [{ v: 4 }], stones: [1, 3, 4] },
    { id: 'hos-03', left: [{ v: 5 }], stones: [1, 2, 3, 4] },
    { id: 'hos-04', left: [{ v: 6 }], stones: [1, 2, 4, 5] },
    { id: 'hos-05', left: [{ v: 7 }], stones: [1, 3, 4, 6] },
    /* chapter 1: a pair or a three, and then across ten */
    { id: 'hos-06', left: [{ v: 8 }], stones: [1, 2, 3, 5] },
    { id: 'hos-07', left: [{ v: 9 }], stones: [2, 3, 4, 6] },
    { id: 'hos-08', left: [{ v: 10 }], stones: [1, 4, 5, 6] },
    { id: 'hos-09', left: [{ v: 11 }], stones: [2, 3, 5, 6] },
    { id: 'hos-orig-1', left: [{ v: 12 }], stones: [2, 4, 6, 8] },
    /* chapter 2: the rest of the original five, in their own order */
    { id: 'hos-10', left: [{ v: 12 }], stones: [2, 3, 5, 7] },
    { id: 'hos-orig-2', left: [{ v: 20 }], stones: [3, 6, 8, 9, 11] },
    { id: 'hos-orig-3', left: [{ v: 25 }], stones: [5, 7, 9, 11, 16] },
    { id: 'hos-orig-4', left: [{ v: 14 }, { v: 9 }], stones: [5, 8, 10, 13, 15] },
    { id: 'hos-orig-5', left: [{ v: 32, face: '4 × 8' }], stones: [5, 7, 9, 11, 20] },
    /* chapter 3: larger sums, times and a take-away on the slab */
    { id: 'hos-16', left: [{ v: 18 }, { v: 17 }], stones: [6, 9, 12, 14, 20] },
    { id: 'hos-17', left: [{ v: 42, face: '6 × 7' }], stones: [7, 12, 15, 20, 23] },
    { id: 'hos-18', left: [{ v: 41, face: '50 − 9' }], stones: [8, 13, 15, 18, 20] },
    { id: 'hos-19', left: [{ v: 24, face: '3 × 8' }, { v: 15 }], stones: [9, 11, 14, 16, 25] },
    { id: 'hos-20', left: [{ v: 56, face: '7 × 8' }], stones: [9, 14, 17, 22, 25] },
  ];

  /* ── THE TWO BALANCES ────────────────────────────────────
     `anchor` is the shipped prop each stands on, found BY KIND. `look` names
     its pictures in props.js's LOOKS (none = the first balance's). `chapters`
     are its runs: `from` is the first level's index in ROUNDS, `door` the
     doors.js key the run moves, and the trial id is that door's. `level`
     overrides the grade and cluster TrialUI.rounds() records — see there. */
  const STATIONS = [
    station({ anchor: 'azt-carved-floor-medallion',
      chapters: [{ from: 0, door: 'stone' }] }),
    station({ anchor: 'azt-geometric-floor-inlay', look: 'court',
      chapters: [
        { from: 5, door: 'door-1', level: { grade: 1, cluster: 4 } },
        { from: 10, door: 'door-2', level: { grade: 2, cluster: 2 } },
        { from: 15, door: 'door-3', level: { grade: 3, cluster: 1 } },
      ] }),
  ];

  function station(S) {
    let G = null, Z = null, canvas = null;
    let dressing = null, ready = false;
    let beam = null, door = null, chapter = S.chapters[0];
    let seats = [];            // the five pedestal props, left to right on screen
    let stones = [];           // { v, seat, where:'seat'|'pan'|'air', dest, slot, shown }
    let fliers = [];           // { st, from:{gx,gy,px,py}, t }
    let owned = [];            // every runtime prop we pushed, for teardown
    const BAL = { gx: 0, gy: 0 };

    let state = 'roam';        // roam | play
    let phase = 'idle';        // idle | opening | working | settling | solved | done
    let round = 0, score = 0, target = 0, firstTry = true, seq = 0;
    let drag = null, hover = null;
    let tiltVel = 0;                       // the beam's angular speed, for the spring
    const SCENE = { gx: 0, gy: 0 };        // what the camera leans toward
    let reveal = null;                     // { t, key, from, released } while the camera is away
    let carded = false;                    // the end card is up (so the run is filed)
    let clock = 0, guide = null, hand = null;   // the ghost hand: its clock, its kit guide, its prop

    /* Timers die with the run AND with the round: `seq` bumps on every leave
       and every restart, so a callback queued by a run the child walked out of
       can never fire into the next one. */
    const timers = new Set();
    function later(fn, ms) {
      const my = seq;
      const id = setTimeout(() => { timers.delete(id); if (state === 'play' && seq === my) fn(); }, ms);
      timers.add(id);
    }
    function clearTimers() { timers.forEach(clearTimeout); timers.clear(); }

    /* ---------------- runtime props ---------------- */
    function add(p) {
      p._noAdopt = true;          // creator mode must refuse to move or clone it
      if (S.look) p.look = S.look;   // which pictures props.js draws it with
      p.solid = false;            // the collision map was built before we existed
      Z.props.push(p); owned.push(p);
      return p;
    }
    function drop(p) {
      if (!Z || !p) return;
      const i = Z.props.indexOf(p); if (i >= 0) Z.props.splice(i, 1);
      const j = owned.indexOf(p); if (j >= 0) owned.splice(j, 1);
    }

    /* ---------------- where a stone is ----------------
       A place is a world CELL plus a screen-pixel offset from that cell's own
       screen point. That pairing is the whole trick: the cell gives correct
       depth sorting as a stone travels, and the offset gives pixel-exact
       landing on a pan that is itself swinging. */
    /* props.js draws this station's machine at Prom.hos.size(look) about
       its feet, so every pan offset from those feet is scaled by the same SIZE.
       The pedestals and the stones themselves are always full size. */
    const SIZE = Prom.hos.size(S.look);   // not K: K is the beam's spring
    function placeOf(where, i) {
      if (where === 'seat') {
        const s = seats[i];
        return { gx: s.gx, gy: s.gy, px: 0, py: -Prom.hos.seatTop(S.look) };
      }
      const sl = Prom.hos.slot(beam, 1, i);
      return { gx: BAL.gx, gy: BAL.gy, px: sl.x * SIZE, py: sl.y * SIZE };
    }
    function absOf(pl) {
      const s = ENG.gridToScreen(pl.gx, pl.gy);
      return { x: s.x + pl.px, y: s.y + pl.py };
    }
    function homeOf(st) { return placeOf(st.where === 'seat' ? 'seat' : 'pan', st.where === 'seat' ? st.seat : st.slot); }

    /* ---------------- the maths ---------------- */
    /* A stone the child is HOLDING is off the pan as far as the maths and the
       drawing are concerned — that is what makes picking one up read as taking
       it off — but it keeps its slot reserved in bound(), so putting it
       straight back down returns it to the place it came from rather than
       shuffling the row. */
    const held = () => (drag ? drag.st : null);
    const panStones = () => stones.filter((s) => s.where === 'pan' && s !== held());
    const bound = () => stones.filter((s) => s.where === 'pan' || (s.where === 'air' && s.dest === 'pan'));
    const panTotal = () => panStones().reduce((a, s) => a + s.v, 0);
    const leftTotal = () => (beam && beam.left ? beam.left : []).reduce((a, it) => a + it.v, 0);

    /* Tilt is the REAL difference, scaled to the level, not a count of moves.
       12 against 2 leans right over; 12 against 10 is a whisker; 12 against 14
       tips the other way. That is the entire feedback channel of this trial. */
    function wantTilt() {
      const l = leftTotal(), r = panTotal();
      if (!l && !r) return 0;
      const ref = Math.max(4, (target || l || 1) * 0.55);
      return Math.max(-1, Math.min(1, (r - l) / ref));
    }

    /* Slots are compacted after every change so the pan never shows a hole,
       and so `bound().length` is always the next free slot. */
    function reslot() {
      bound().sort((a, b) => a.slot - b.slot).forEach((s, i) => { s.slot = i; });
    }

    function sync() {
      if (!beam) return;
      const arr = [];
      panStones().forEach((s) => { arr[s.slot] = s.v; });
      beam.right = arr;
      const vals = panStones().sort((a, b) => a.slot - b.slot).map((s) => s.v);
      beam.rightText = vals.length ? vals.join(' + ') : '';
      seats.forEach((p, i) => {
        /* BY SEAT, not by index: since the stones are centred, stone i does
           not stand on plinth i, and a plinth outside the centred run has no
           stone at all — which is what `find` returning nothing means here. */
        const st = stones.find((s) => s.seat === i);
        p.stone = st && st.shown && st.where === 'seat' ? st.v : null;
        p.hover = hover === st && p.stone != null;
        p.hot = phase === 'working' && p.stone != null;
      });
      beam.hoverSlot = hover && hover.where === 'pan' ? hover.slot : null;
    }

    /* ---------------- moving a stone ---------------- */
    function send(st, dest) {
      if (!st || st.where === 'air' || phase !== 'working') return;
      const from = homeOf(st);
      /* Claim the slot BEFORE the stone joins bound(), so two stones launched
         a frame apart cannot both land in the same place. */
      if (dest === 'pan') st.slot = bound().length;
      st.where = 'air'; st.dest = dest;
      reslot();
      const prop = add({ kind: 'hos-flier', gx: from.gx, gy: from.gy, dx: from.px, dy: from.py,
        v: st.v, lift: 0, sortBias: 0.004 });
      fliers.push({ st, from, t: 0, prop });
      sync();
    }
    function arrive(f) {
      drop(f.prop);
      f.st.where = f.st.dest; f.st.dest = null;
      reslot(); sync();
      /* A stone lands with a clack, softer going home. Never a verdict: an
         overweight pan clacks like any other (cues.js, no sound for wrong). */
      sound(f.st.where === 'pan' ? 'pan' : 'home');
      const kick = reduced() ? 0 : LAND;              // reduced motion: no dip, no rebound
      if (f.st.where === 'pan') tiltVel += kick;      // the pan dips under the drop
      if (f.st.where === 'seat') tiltVel -= kick * 0.5;  // and rebounds when one leaves
      if (f.st.where === 'pan' && panTotal() > target) firstTry = false;
      checkSolved();
    }
    function tickFliers(dt) {
      const still = reduced();
      for (let i = fliers.length - 1; i >= 0; i--) {
        const f = fliers[i];
        f.t = Math.min(1, f.t + dt / FLY_S);
        const to = placeOf(f.st.dest, f.st.dest === 'seat' ? f.st.seat : f.st.slot);
        const a = absOf(f.from), b = absOf(to);
        /* reduced motion: the stone hops — it waits where it was and appears
           where it lands at the moment it would have arrived. Same timing. */
        const e = still ? (f.t < 0.75 ? 0 : 1) : 1 - Math.pow(1 - f.t, 3);
        const gx = f.from.gx + (to.gx - f.from.gx) * e;
        const gy = f.from.gy + (to.gy - f.from.gy) * e;
        const base = ENG.gridToScreen(gx, gy);
        f.prop.gx = gx; f.prop.gy = gy;
        f.prop.dx = a.x + (b.x - a.x) * e - base.x;
        f.prop.dy = a.y + (b.y - a.y) * e - base.y;
        f.prop.lift = still ? 0 : Math.sin(e * Math.PI) * ARC;
        if (f.t >= 1) { fliers.splice(i, 1); arrive(f); }
      }
    }

    /* ---------------- tap and drag are one action ----------------
       Tap is the taught path and drag only ever accelerates it: WCAG 2.2
       SC 2.5.7, and frontend/CLAUDE.md's own rule. The listeners are the
       room's (onDown and friends at the bottom of this file); each hands the
       event to every balance and only the one being played takes it. */
    function worldPt(e) {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) / G.zoom + ENG.cam.x, y: (e.clientY - r.top) / G.zoom + ENG.cam.y };
    }
    function hitStone(w) {
      let best = null, bd = Infinity;
      for (const st of stones) {
        if (st.where === 'air' || !st.shown) continue;
        const a = absOf(homeOf(st));
        const d = Math.hypot(w.x - a.x, w.y - (a.y - Prom.hos.STONE_H / 2));
        if (d < Prom.hos.HIT && d < bd) { best = st; bd = d; }
      }
      return best;
    }
    function overPan(w) {
      const b = Prom.hos.panBox(beam, 1, bound().length);
      const f = ENG.gridToScreen(BAL.gx, BAL.gy);
      return w.x > f.x + b.x0 * SIZE && w.x < f.x + b.x1 * SIZE && w.y > f.y + b.y0 * SIZE && w.y < f.y + b.y1 * SIZE;
    }
    function down(e) {
      /* Any press skips the reveal, and is NOT swallowed: a tap that means
         "walk there" still walks. That is the skip that needs no lock. */
      if (reveal) { skipReveal(); return; }
      if (state === 'play' && guide) guide.touch(clock);
      if (state !== 'play' || phase !== 'working' || drag) return;
      if (!canvas || e.target !== canvas) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const st = hitStone(worldPt(e));
      if (!st) return;
      e.preventDefault(); e.stopPropagation();
      if (canvas.setPointerCapture) { try { canvas.setPointerCapture(e.pointerId); } catch (_) { /* older browsers */ } }
      const home = homeOf(st);
      const prop = add({ kind: 'hos-flier', gx: home.gx, gy: home.gy, dx: home.px, dy: home.py,
        v: st.v, lift: 6, held: true, sortBias: 0.006 });
      drag = { id: e.pointerId, st, prop, from: st.where, x0: e.clientX, y0: e.clientY, moved: false };
      st.shown = false;                     // the seat lets go of it while it is held
      sync();
      canvas.style.cursor = 'grabbing';
    }
    function move(e) {
      if (!drag || e.pointerId !== drag.id) {
        if (state === 'play' && phase === 'working' && canvas && e.target === canvas) {
          const h = hitStone(worldPt(e));
          if (h !== hover) { hover = h; sync(); }
          canvas.style.cursor = h ? 'grab' : '';
        }
        return;
      }
      e.preventDefault();
      const w = worldPt(e);
      const cell = ENG.screenToGrid(w.x, w.y);
      drag.prop.gx = cell.gx; drag.prop.gy = cell.gy;
      const base = ENG.gridToScreen(cell.gx, cell.gy);
      drag.prop.dx = w.x - base.x; drag.prop.dy = w.y + 10 - base.y;
      /* ⚠ A DISTANCE, NOT A FLAG. rune-forge set `moved` on the first
         pointermove and standing-order had to undo it in production: a
         pointermove lands between press and release on almost every real
         click — mice jitter a pixel and touch always does — so a flag turns
         every tap into a drag dropped on nothing, and tapping stops working. */
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) > TAP_SLOP) drag.moved = true;
    }
    function up(e) {
      if (!drag || e.pointerId !== drag.id) return;
      e.preventDefault(); e.stopPropagation();
      const d = drag, w = worldPt(e);
      drag = null;
      canvas.style.cursor = '';
      drop(d.prop);
      d.st.shown = true;
      if (!d.moved) send(d.st, d.from === 'seat' ? 'pan' : 'seat');
      else if (d.from === 'seat' && overPan(w)) send(d.st, 'pan');
      else if (d.from === 'pan' && !overPan(w)) send(d.st, 'seat');
      else { sync(); checkSolved(); }       // dropped where it started: settle back
    }
    /* A cancelled pointer is an abort, never a drop — the house drag recipe in
       frontend/CLAUDE.md is explicit about it. The stone simply reappears
       where it was picked up from. */
    function cancel(e) {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      canvas.style.cursor = '';
      drop(d.prop);
      d.st.shown = true;
      sync(); checkSolved();
    }

    /* Keys 1..5 are the same action again, for a child who cannot aim a
       pointer at all. Escape is the exit the missing dialogue bar owes us. */
    function key(e) {
      if (state !== 'play') return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (reveal) {                          // any key skips it; a walk key still walks
        if (e.repeat) return;
        if (e.key === 'Escape') e.preventDefault();
        skipReveal(); return;
      }
      if (guide) guide.touch(clock);
      if (e.key === 'Escape') {
        if (Prom.screens && Prom.screens.active) return;   // a screen closes first
        /* Between the last level and the end card the run is finished but
           not yet FILED (TrialUI.end files it); leaving here would file a
           won run as abandoned, and an abandoned win opens no door for the
           room. The card is moments away. */
        if (phase === 'done' && !carded) return;
        e.preventDefault(); leave(); return;
      }
      if (phase !== 'working') return;
      const n = '12345'.indexOf(e.key);
      if (n < 0 || n >= stones.length) return;
      const st = stones[n];
      if (!st || st.where === 'air' || !st.shown) return;
      e.preventDefault();
      send(st, st.where === 'seat' ? 'pan' : 'seat');
    }

    /* ---------------- the run ---------------- */
    /* The floor is a REQUIREMENT, not a fit: props.js's stone is 35 units, and
       anything under 1.25 puts it below the 44 CSS px minimum for a child's
       tap target (docs/gamification/03). On a small window the set-piece
       overflows rather than shrinking past that. The span is the machine's:
       244 units of balance plus the pans below and the pedestal row in front
       is about 480 tall. */
    function focusZoom() {
      return Prom.scene.fitZoom(G.W - 80, G.H - 210, 540, 470, 1.25, 1.42);
    }

    /* The chapter [E] begins: the first one this child has not won yet — so a
       chapter only ever opens after the one before it — or, all of them won,
       the last. The first scale has one chapter, so this is always it. */
    function nextChapter() {
      return S.chapters.find((c) => !DOORS.mine(c.door)) || S.chapters[S.chapters.length - 1];
    }

    function startTrial() {
      if (!ready || !beam) return;          // the Hall was re-laid under us
      /* Only one balance plays at a time: both report into the same diamonds
         and the same TrialUI run, so starting this one puts the other down. */
      STATIONS.forEach((o) => { if (o.leave !== leave) o.leave(); });
      clearTimers();
      chapter = nextChapter();
      door = DOORS.door(chapter.door);
      state = 'play'; phase = 'opening';
      carded = false;
      if (!guide && Prom.trialKit && Prom.trialKit.guide) {
        guide = Prom.trialKit.guide({ after: HAND_AFTER, again: HAND_AGAIN, plan: handPlan,
          live: () => state === 'play' && phase === 'working' && !drag && !fliers.length && !reveal });
      }
      document.body.classList.add('hos-active');
      round = 0; score = 0; seq++;
      GAME.setInputLockReason(LOCK, false);   // this trial never locks; clear any stray
      Prom.scene.setSceneZoom(focusZoom());
      beam.live = true;
      door.run = true; door.bars = 0; door.openT = 0;
      TrialUI.stepAside();                    // hides the bar, KEEPS the run (never close())
      TrialUI.prompt(false);
      /* The literal grade and cluster are the Trials board card's, and
         trials.test.ts holds them to it: that card is `hall-of-scales`, the
         first scale. The court's chapters have no card (as Build the Bridge's
         have none) and record their own level, so their `level` is laid over
         the literal. */
      TrialUI.rounds(R, Object.assign({
        id: DOORS.idOf(chapter.door), source: 'world', grade: 1, cluster: 4,
        topic: msg('topic'), need: NEED,
      }, chapter.level));
      newRound();
    }

    /* ⚠ THE SET-PIECE IS PERMANENT FURNITURE, raised once when the zone binds
       and never torn down while the child is in the room. It stands level,
       empty and idle (`live: false`) whether or not anybody is playing, and
       pressing E only WAKES it. A four-tile machine appearing out of nothing
       the instant you press a key read as a bug. */
    function buildScene() {
      beam = add({ kind: 'hos-balance', gx: BAL.gx, gy: BAL.gy, live: false,
        tilt: 0, swayL: 0, swayR: 0, left: [], right: [], leftText: '',
        rightText: '', lit: 0, pin: 0, hoverSlot: null });
      /* Five pedestals on ONE SCREEN ROW, however many stones a level asks
         for — newRound() CENTRES the stones across them. Cells sharing a depth
         (gx + gy) sit at the same screen height and 76 px apart, so this
         diagonal in the world is a straight row in front of the scale. */
      seats = [];
      for (let i = 0; i < 5; i++) {
        seats.push(add({ kind: 'hos-pedestal', gx: 0, gy: 0,
          seat: i, stone: null, hot: false, hover: false }));
      }
      /* The ghost hand's prop: a cell IN FRONT of the pedestal row, so it
         sorts over the stones and the pans it points at. Empty between demos. */
      hand = add({ kind: 'hos-hand', gx: 0, gy: 0, pose: null, sortBias: 0.01 });
      layOut();
    }

    /* What the ghost hand acts out: reach for the lightest stone still on a
       plinth, press it, carry it over to the pan's next free place — and the
       stone itself never moves, so the child still makes the move. The
       LIGHTEST, because a demo must never give the answer away: no level's
       answer is its smallest stone alone. Legs are in world px. */
    function handPlan() {
      if (!beam || !Prom.hos) return null;
      const st = stones.filter((s) => s.where === 'seat' && s.shown).sort((a, b) => a.v - b.v)[0];
      if (!st) return null;
      const up = Prom.hos.STONE_H / 2;
      const a = absOf(placeOf('seat', st.seat)), b = absOf(placeOf('pan', bound().length));
      const at = { x: a.x, y: a.y - up }, pan = { x: b.x, y: b.y - up };
      const rest = { x: at.x + 60, y: at.y + 80 };
      return [
        { from: rest, to: at, dur: 900 },
        { from: at, to: at, dur: 600, press: true },
        { from: at, to: pan, dur: 1000 },
        { from: pan, to: pan, dur: 500 },
      ];
    }

    /* ── WHERE EVERYTHING STANDS, RECOMPUTED FROM THE ANCHOR ──────────────
       It also runs LIVE: drag the anchor in Creator and the balance, pedestals
       and camera focus walk over to follow, in the same frame. */
    let rackNarrow = false;
    function narrowLayout() { return !!G && G.W > 0 && G.W < 760; }
    function layOut() {
      rackNarrow = narrowLayout();
      if (beam) { beam.gx = BAL.gx; beam.gy = BAL.gy; }
      const depth = BAL.gx + BAL.gy + 3, col = BAL.gx - BAL.gy;
      for (let i = 0; i < seats.length; i++) {
        const d = col + (i - 2) * (rackNarrow ? 1.7 : 2);
        seats[i].gx = (depth + d) / 2; seats[i].gy = (depth - d) / 2;
      }
      if (hand) { hand.gx = BAL.gx + 3; hand.gy = BAL.gy + 3; }
      /* What the camera leans toward. NOT the balance's feet: the machine is
         244 px of art standing ABOVE that point and only the pedestals sit
         below it, so focusing on the ground puts the beam off the top. Pulling
         the focus back up-screen by a tile and a half of depth centres it. */
      SCENE.gx = BAL.gx - 0.75; SCENE.gy = BAL.gy - 0.75;
    }

    /* Is the anchor still THIS object? Creator can replace a row's prop rather
       than move it, and the court's inlay is placed while the room is open —
       so a balance with no anchor, or a stale one, looks for one by kind twice
       a second and stands up the moment it is there, without a reload. */
    let seekIn = 0;
    function seek(dt) {
      if (dressing && Z.props.indexOf(dressing) >= 0) return;
      if ((seekIn -= dt) > 0) return;
      seekIn = 0.5;
      const found = Z.props.find((p) => p.kind === S.anchor);
      if (!found) return;
      dressing = found;
      if (!ready) { ready = true; BAL.gx = found.gx; BAL.gy = found.gy; buildScene(); }
    }

    /* Has the anchor been dragged since the last frame? Two cheap number
       compares; props only ever move in Creator, so this costs nothing. */
    function reanchor() {
      if (dressing && (dressing.gx !== BAL.gx || dressing.gy !== BAL.gy)) {
        BAL.gx = dressing.gx; BAL.gy = dressing.gy;
        layOut();
      }
    }

    function newRound() {
      const row = ROUNDS[chapter.from + round];
      target = row.left.reduce((a, it) => a + it.v, 0);
      firstTry = true;
      phase = 'opening';
      seq++;                                  // orphan every timer the last level left
      hover = null; fliers.forEach((f) => drop(f.prop)); fliers = [];
      TrialUI.current(round);

      beam.left = []; beam.leftText = ''; beam.right = []; beam.rightText = '';
      beam.lit = 0; beam.pin = 0; beam.hoverSlot = null;
      /* CENTRED ON THE ROW, not packed to the left. Five plinths stand there
         whatever a level asks for; packed left, a three-stone level left two
         bare plinths side by side at one end, which reads as two stones that
         failed to appear rather than as spare furniture. */
      const off = ((seats.length - row.stones.length) / 2) | 0;
      stones = row.stones.map((v, i) => ({ v, seat: i + off, where: 'seat', dest: null, slot: -1, shown: false }));
      seats.forEach((p) => { p.stone = null; p.hot = false; p.hover = false; });

      /* The opening beat IS the instruction, because there is no sentence to
         read. The slab lands first and the beam slams down — that is the
         problem stated — and then the stones rise one at a time, which is what
         says they are yours to move. */
      later(() => {
        beam.left = row.left.map((it) => ({ v: it.v, text: it.face || String(it.v) }));
        beam.leftText = beam.left.map((it) => it.text).join(' + ');
      }, 260);
      row.stones.forEach((v, i) => later(() => { if (stones[i]) { stones[i].shown = true; sync(); } }, 700 + i * 170));
      later(() => {
        phase = 'working'; sync();
        if (!guide) return;
        guide.touch(clock);                   // the idle wait starts when play does
        /* Show before you say: the very first level a child ever meets here
           opens with the hand doing the move once. Not on a replay. */
        if (chapter.door === 'stone' && round === 0 && !DOORS.mine('stone')) guide.play(clock);
      }, 900 + row.stones.length * 170);
      sync();
    }

    function checkSolved() {
      if (phase !== 'working' || fliers.length) return;
      if (panTotal() !== target) return;
      solve();
    }

    function solve() {
      phase = 'settling';
      hover = null;
      const vals = panStones().sort((a, b) => a.slot - b.slot).map((s) => s.v);
      beam.rightText = String(target);
      seats.forEach((p) => { p.hot = false; p.hover = false; });
      // the maths, said in numbers. Not "Correct!", and not a score.
      GAME.flash(vals.join(' + ') + ' = ' + beam.leftText);
      TrialUI.mark(round, firstTry);
      if (firstTry) score++;
      later(() => {
        phase = 'solved';
        /* ONE BAR — or one lamp — PER LEVEL, and the slab creeps up a little
           each time, so there is no level in which nothing moved — but only
           to CREEP: the rest is the reveal's, on camera, when it is won.
           FLOOR keeps the bars whole if R and BARS ever part company again. */
        door.bars = ((round + 1) * BARS / R) | 0;
        door.openT = CREEP * (round + 1) / R;
      }, 700);
      later(() => {
        round++;
        if (round < R) newRound(); else finish();
      }, 2400);
    }

    function finish() {
      phase = 'done';
      document.body.classList.remove('hos-active');
      door.bars = BARS;
      /* A win opens the door for good, NOW — the server's record will say the
         same once it has filed the run, but the child is standing here. The
         FIRST win of it is held shut for the reveal; a door already opened
         is simply open, and a run short of NEED leaves the slab where its
         progress left it rather than swinging it wide and then shut. */
      const won = score >= NEED, first = won && !DOORS.mine(chapter.door);
      if (won) DOORS.won(chapter.door, { hold: first });
      if (first) later(startReveal, 300);
      else later(endCard, 2300);
    }

    function endCard() {
      carded = true;
      TrialUI.setSpeaker({narrationId:'narrator',name:{i18n:'narration.narrator'}});
      TrialUI.end({
        line: score >= NEED
          ? msg('passed')
          : msg('failed'),
        onAgain() { startTrial(); },
        onEnough() { leave(); },
      });
    }

    /* ---------------- the reveal ----------------
       From wherever the camera is to the door, a hold while it opens, and
       back to where the lean would have it — eased both ways, because a
       linear camera reads as mechanical. Driven from tick(), so a hidden or
       paused tab freezes it rather than skipping it. With no projection to
       aim by (a test vm) the beats still run and only the camera stays put. */
    function startReveal() {
      const g = GAME._G, pl = g && g.player;
      const f = (g && g.camFocus) || (pl ? { gx: pl.gx, gy: pl.gy } : null);
      reveal = { t: 0, key: chapter.door, from: f ? { gx: f.gx, gy: f.gy, z: 0 } : null, released: false };
    }
    function tickReveal(dt) {
      const r = reveal;
      r.t += dt * 1000;
      if (!r.released && r.t >= OPEN_MS) { r.released = true; DOORS.release(r.key); }
      if (r.t >= DONE_MS) { endReveal(); return; }
      const at = DOORS.focus(r.key);
      if (!at || !r.from) return;
      const home = Object.assign({ z: 0 }, leanFocus() || { gx: G.player.gx, gy: G.player.gy });
      const still = reduced();
      const f = r.t < BACK_MS
        ? (still ? at : mix(r.from, at, ease(r.t / GLIDE_MS)))
        : (still ? home : mix(at, home, ease((r.t - BACK_MS) / GLIDE_MS)));
      GAME.setCamFocus(f);
      /* Reduced motion CUTS: engine.js's follow(x, y, 1) snaps the camera,
         where the frame's own follow would otherwise glide it over. */
      const E = window.ENG;
      if (still && E && E.follow && E.gridToScreen) { const s = E.gridToScreen(f.gx, f.gy, 0); E.follow(s.x, s.y, 1); }
    }
    function endReveal() {
      if (!reveal) return;
      const k = reveal.key; reveal = null;
      DOORS.release(k);
      endCard();
    }
    /* Skipped by any key or press: the door opens now (with its sound), the
       camera goes home on the frame's own follow, and the card comes up. */
    const skipReveal = endReveal;

    /* Leaving does NOT dismantle the machine — it stands the scale back down
       to idle and walks away from it. The props stay because they are
       furniture, and the door goes back to whatever it is for this child. */
    function leave() {
      if (state === 'roam') return;
      seq++;
      clearTimers();
      if (reveal) { DOORS.release(reveal.key); reveal = null; }
      carded = false;
      if (guide) guide.touch(clock);
      if (hand) hand.pose = null;
      state = 'roam'; phase = 'idle';
      document.body.classList.remove('hos-active');
      fliers.forEach((f) => drop(f.prop)); fliers = [];
      if (drag) { drop(drag.prop); drag = null; }
      stones = []; hover = null;
      if (beam) {
        beam.live = false; beam.left = []; beam.right = []; beam.leftText = '';
        beam.rightText = ''; beam.lit = 0; beam.pin = 0; beam.hoverSlot = null;
      }
      if (door) door.run = false;
      seats.forEach((p) => { p.stone = null; p.hot = false; p.hover = false; });
      if (canvas) canvas.style.cursor = '';
      TrialUI.close();
      TrialUI.hideRounds();
      TrialUI.prompt(false);
      GAME.setInputLockReason(LOCK, false);
      GAME.setCamFocus(null);
      Prom.scene.resetZoom();
    }

    /* ---------------- the [E] pill ----------------
       roamPrompt is a thin wrapper over INTERACT.register and its `guide` may
       be any {gx, gy} — here it is the balance itself, because this trial IS a
       thing you touch rather than a person you talk to. While a run is live
       the same pill becomes the way out, for a child with no keyboard. */
    const roam = Prom.npc.roamPrompt({
      active: () => ready && state === 'roam',
      guide: () => BAL,
      radius: START_RADIUS,
      label: msg('prompt'),
      onSpeak: () => { if (state === 'roam' && ready) startTrial(); },
    });
    /* Not between the last level and the end card: stopping there would file
       a finished run as abandoned (see key()'s Escape). */
    const stop = Prom.npc.roamPrompt({
      active: () => ready && state === 'play' && (phase !== 'done' || carded),
      guide: () => BAL,
      radius: 2.6,
      label: msg('stop'),
      onSpeak: leave,
    });

    function tick(dt) {
      G = GAME._G;
      /* ⚠ REBIND ON RE-ENTRY. Prom.scene.zoneTick fires firstFrame ONCE for
         the life of the page, but walking out of this room and back in
         replaces G.zone with a fresh object from the server — so `dressing`,
         `Z` and every prop we pushed belong to a zone no longer on screen.
         Without this the trial looks fine and simply never starts again. */
      if (G.zone !== Z) bind(G);
      seek(dt);
      roam.tick(G); stop.tick(G);
      if (!ready || !beam) return;

      /* The beam as a damped spring. Integrated semi-implicitly and with dt
         CAPPED: a backgrounded tab hands this a dt of a whole second, and an
         un-capped spring step that large goes unstable and flings the beam. */
      const h = Math.min(0.05, dt);
      const want = wantTilt();
      /* Reduced motion keeps the tilt — it IS the feedback — but critically
         damps it: the beam settles on the difference without swinging past. */
      const still = reduced();
      tiltVel += (want - beam.tilt) * K * h;
      tiltVel *= Math.exp(-(still ? 2 * Math.sqrt(K) : C) * h);
      beam.tilt += tiltVel * h;
      if (beam.tilt > 1) { beam.tilt = 1; tiltVel = Math.min(0, tiltVel); }
      if (beam.tilt < -1) { beam.tilt = -1; tiltVel = Math.max(0, tiltVel); }
      if (Math.abs(want - beam.tilt) < 0.002 && Math.abs(tiltVel) < 0.02) {
        beam.tilt = want; tiltVel = 0;
      }
      /* The chains lag behind the pan they carry: a pan being driven downward
         trails, which is the detail that separates hanging chain from a rigid
         stick. Opposite signs because the two ends always move opposite ways. */
      const lag = still ? 0 : Math.max(-8, Math.min(8, -tiltVel * SWAY));
      beam.swayL = (beam.swayL || 0) + (-lag - (beam.swayL || 0)) * Math.min(1, dt * 9);
      beam.swayR = (beam.swayR || 0) + (lag - (beam.swayR || 0)) * Math.min(1, dt * 9);

      const locked = phase === 'settling' || phase === 'solved' || phase === 'done';
      beam.pin += ((locked ? 1 : 0) - beam.pin) * Math.min(1, dt * 5);
      beam.lit += ((locked ? 1 : 0) - beam.lit) * Math.min(1, dt * 4);

      reanchor();
      if (rackNarrow !== narrowLayout()) layOut();

      /* ── THE CAMERA LEANS, IT DOES NOT TAKE OVER ──────────
         Movement is free, so the camera follows the player. While a run is
         live the focus sits most of the way from the player to the set-piece:
         the machine is framed and the child is still in the picture. Phones
         center the machine so both outer stones fit without shrinking them.
         The lean fades to nothing past FAR tiles, so walking away hands the
         camera back rather than stranding the player off-screen. */
      if (state === 'play') {
        /* ...except while the reveal has the camera, which hands it back to
           exactly this lean when it is done. */
        if (reveal) tickReveal(dt); else GAME.setCamFocus(leanFocus());
      }

      tickFliers(dt);
      clock += dt * 1000;
      if (hand) hand.pose = guide && state === 'play' ? guide.tick(clock) : null;

      // a held stone keeps its own slot reserved but shows no hover ring elsewhere
      if (drag && drag.prop) drag.prop.lift = 6;
    }

    /* Where the lean puts the camera: most of the way from the player to the
       set-piece, fading out past FAR tiles. Null = follow the player. */
    function leanFocus() {
      const pl = G.player;
      const dd = Math.hypot(pl.gx - SCENE.gx, pl.gy - SCENE.gy);
      const lean = narrowLayout() ? 1 : LEAN;
      // The camera focus is above the scale: include that offset as well
      // as the whole start radius before fading on a phone.
      const near = narrowLayout() ? Math.max(NEAR, START_RADIUS + Math.hypot(BAL.gx-SCENE.gx, BAL.gy-SCENE.gy)) : NEAR;
      const w = dd <= near ? lean : Math.max(0, lean * (1 - (dd - near) / (FAR - near)));
      return w > 0.01
        ? { gx: pl.gx + (SCENE.gx - pl.gx) * w, gy: pl.gy + (SCENE.gy - pl.gy) * w }
        : null;
    }

    /* Anchor the set-piece on whatever the Hall currently holds. Run at the
       first frame AND whenever the zone object is replaced. */
    function bind(g) {
      Z = g.zone; canvas = g.canvas;
      if (door) door.run = false;
      owned = []; seats = []; stones = []; fliers = [];
      beam = null; drag = null; hover = null; hand = null; reveal = null; carded = false;
      state = 'roam'; phase = 'idle';
      document.body.classList.remove('hos-active');
      dressing = Z.props.find((p) => p.kind === S.anchor) || null;
      ready = !!dressing;
      if (!ready) {
        console.warn('[hall-of-scales] a balance is off until a ' + S.anchor + ' stands in ' + ZONE);
        return;
      }
      BAL.gx = dressing.gx; BAL.gy = dressing.gy;
      buildScene();
    }

    return { tick, bind, leave, down, move, up, cancel, key };
  }

  /* Leaving through a door, dying, or the bar's own exit all land here; each
     balance guards on its own state, so only the one being played moves. */
  TrialUI.onAbandon(() => STATIONS.forEach((s) => s.leave()));

  /* ⚠ THE POINTERDOWN LISTENER IS ON `window`, IN THE CAPTURE PHASE, AND THAT
     IS THE WHOLE REASON A TAP ON A STONE DOES NOT ALSO WALK THE CHILD ACROSS
     THE ROOM. core/game.js puts click-to-move on a `pointerdown` listener on
     the canvas, registered at game-core load — long before a zone tick's
     firstFrame gets to add ours. Two listeners on one element fire in
     registration order, so a second canvas listener's stopPropagation()
     arrives after the walk has already been ordered. Capturing on window runs
     before the canvas is reached at all, and it is the only shape that works
     while movement stays unlocked, which is the whole premise of this trial. */
  const onDown = (e) => STATIONS.forEach((s) => s.down(e));
  const onMove = (e) => STATIONS.forEach((s) => s.move(e));
  const onUp = (e) => STATIONS.forEach((s) => s.up(e));
  const onCancel = (e) => STATIONS.forEach((s) => s.cancel(e));
  const onKey = (e) => STATIONS.forEach((s) => s.key(e));

  let wired = false;
  Prom.scene.zoneTick(ZONE, {
    firstFrame(g) {
      STATIONS.forEach((s) => s.bind(g));
      DOORS.tick(0, g);
      if (wired) return;
      wired = true;
      window.addEventListener('pointerdown', onDown, true);   // capture — see above
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onCancel);
      window.addEventListener('keydown', onKey);
    },
    tick(dt) {
      STATIONS.forEach((s) => s.tick(dt));
      DOORS.tick(dt, GAME._G);
    },
  });
} });
