# What we built during the hackathon

Colosseum judges only the work done between the start and end of the
hackathon. Lumia started **before** the hackathon, so this page sets out
what existed before and what we built during it.

All numbers come straight from our private repository's git history (git
records the date and size of every change). The cut-off is
**Sep 14, 2026, 00:00 Pacific time**. Numbers were counted on Oct 12, 2026.

## The numbers

| | Before the hackathon<br>(Jul 23 – Sep 13) | During the hackathon<br>(Sep 14 – Oct 12) |
|---|---|---|
| Commits (saved changes) | 1,119 | **1,296** |
| Lines of code added (JS, TS, HTML, CSS) | — | **~238,000** |
| Lines of design and research docs added | — | **~162,000** |
| New painted art files added | — | **4,258** |
| New automated test files | — | **179** (of 391 today) |

Two main authors wrote the code during the window. Our AI coding assistants
(Claude Code and Codex) worked under their direction and are counted in their
commits.

## What already existed on Sep 14 (pre-existing work)

We disclose all of this as pre-existing:

- **The game engine**: the isometric renderer, the world map, movement, the
  camera, and the browser client that loads it all with no build step.
- **The online world**: the Colyseus game server (Colyseus is an open-source
  framework for real-time multiplayer games), accounts, saved characters,
  and the Postgres database.
- **Core RPG systems**: combat against easy pastel monsters, items, shops,
  enchanting, powers, the in-game economy, trading, and parties.
- **The map editor ("Creator")**: our own in-browser tool that places
  everything in the world and saves it straight to the database.
- **The first maths trials**, including early versions of Build the Bridge
  (Sep 12), Hall of Scales (Sep 10) and Weighmaster's Test (Aug 14).
- **A first localization system** for translating text (localization means
  adapting the game's text to another language).

## What we built during the hackathon (Sep 14 – Oct 12)

### Maths trials: 14 new or rebuilt

| Date | Trial | Maths |
|---|---|---|
| Sep 24 | **Two Stalls**, rebuilt as a hands-on shopping trial | comparing prices |
| Sep 24 | **Armoury**, ten new levels | place value (tens and ones) |
| Sep 25 | **Build the Bridge**, rebuilt in 3 steps around one shared rule file | area |
| Sep 21 – Oct 7 | **Hall of Scales**: a way in, painted art, two balances, twenty levels, four doors | equations, "make both sides equal" |
| Oct 3 | **Artillery** in the Ballista Yard | division as equal steps |
| Oct 4 | **NPC House**: six rounds | area and perimeter |
| Oct 6 | **Number Shield**: walk through +, −, × circles until the charge hits the monster's number | mental arithmetic in combat |
| Oct 8 | **Fraction Shield** | fractions |
| Oct 7 | **Pin Lock**: eight lock styles | making a total from parts |
| Oct 9 | **Build a Fence** (Grade 1) | closed shapes and corners |
| Oct 10 | **Ice Ruins** | continuing a number pattern |
| Oct 10 | **Tracker**: measure the trail with one rope | measuring length |
| Oct 10 | **The Lantern Table** (Grade 2) | equal groups (early multiplication) |
| Oct 10 | **The Crumbling Sanctuary** (Grade 3) | multiplication tables |

### For parents and the business

- **Membership and billing** (Sep 24 – 26): a parent page where a grown-up
  buys a membership through Polar (a payment provider). The game checks
  membership from our own records, so a payment-company outage never interrupts
  play. A nightly job makes sure our records match the payment provider's.
- **Daily Prizes** (Sep 25): a 7-day reward ladder that the team can edit
  live from the game's tools.
- **Starlight** (Sep 26 – 29): a cosmetic currency members earn each paid
  month. It runs on an append-only ledger (every grant and spend is a new
  line that is never edited), and a nightly check confirms each balance
  equals the sum of its lines. The Star-Keeper shop sells looks only. You
  cannot buy an advantage.
- **The grown-ups' panel** (Sep 29): a parent signs in with an emailed
  one-time code and links to their child's account. They see the child's
  Starlight statement and decide whether the child may spend Starlight.
- **The lumia.game waitlist** (Sep 28): sign-ups, one welcome email,
  unsubscribe. This is where our 200 waitlist spots came from.
- **The Android app** (Oct 11): Lumia installs from an Android app package (APK) as a full-screen app.

### Content and storytelling

- **Quests** (Sep 14 – 18): an in-game editor where our writers create,
  check and publish quests without touching code, plus a server journal that
  makes sure a quest reward is paid exactly once.
- **Voices and narration** (Sep 17 – Oct 1): prerecorded, bilingual character
  voices; seven trials narrated by their characters; a sentence library and
  recording review for voice actors' takes.
- **Russian everywhere** (Sep 14 – 27): an autosaving Languages editor with
  background machine translation. Every new trial
  ships in English and Russian, and the automated tests fail if a Russian
  line is missing.
- **AI art and animation pipeline** (whole window): new places, props,
  landmarks, walls, monsters and guards are generated with AI image tools,
  cut and sized automatically, and checked by a person before placement. New
  characters such as the Fordwatch Guard (Oct 9) and their animations came through
  this pipeline.
- **Smarter monsters** (Oct 6 – 8): a second attack type (melee plus fire),
  and enemies that chase farther before giving up.

### Engineering habits that stayed constant

- **Research before building.** Before any architectural decision (how to
  build something structural, such as billing or the parent panel) we read
  50 or more sources and save the findings. The repository holds **209
  research write-ups**. The parent panel alone drew on 157 sources.
- **Test, then ship to production.** A change goes live only after the full
  test suite and the type-checker pass. We then check it in the live game.
