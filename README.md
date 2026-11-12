# CGAMagic

A browser-based clone of [MDL Software's TaskMagic3](https://www.mdlsoft.co.uk) — a template-based game and worksheet authoring tool for MFL (Modern Foreign Languages) classrooms. TaskMagic3 is Windows-only and no longer sold; this project rebuilds it for the browser so it keeps working.

No accounts, no server — everything runs and saves in your browser (with JSON export/import to move sets between machines).

**Live:** https://jmorrisseyd.github.io/CGAMagic/

## Templates

| Template | Authoring | Status |
| --- | --- | --- |
| Text Match | text ↔ text | ✅ |
| Picture Match | image ↔ text | ✅ |
| Sound Match | audio ↔ text | ✅ |
| Pic-Sound | audio ↔ image | ✅ |
| Grid Match | row × column headers → cell | ✅ |
| Multi-Choice | question + options | ✅ |
| Mix & Gap | a passage, plus gaps, Find it! prompts and comprehension questions | ✅ |
| Dialogues | speaker script | ⬜ not yet |

## Games

The first five templates all compile down to the same pair model, so every
game below works with any of them (games needing a typed answer are hidden
when neither side of a pair holds text).

Flashcards · Multi-Match · Drag & Match · 3 in a Row · Pelmanism (1–2 player) ·
Against the Clock · True or False? · Tower Block · Invaders · Football · OXO ·
Type · Hangman · Trainer (practice/test)

Multi-Choice has its own single quiz activity.

Still to build from the original's bank: Maze, Maze II, Spin, Pool, Doors,
Invaders II, Snake, 3 in a Row II, 5 Counters, Jump!

## Mix & Gap activities

A Mix & Gap set is one passage of text. The reconstruction activities are
generated from the passage alone; the rest need the teacher to mark gaps or
write prompts first.

- **From the passage:** Tile 3×3 / 4×4 / 5×5 · Text Mix · Next Word · 1 in 3 ·
  Space · Anagrams
- **From chosen gaps:** Gap-fill · Multi Gaps · Write Gaps
- **From written prompts:** Find it! · Comprehension

## Printable worksheets

Any pair-based set can be printed as: Matching · Multiple choice ·
Missing letters · Anagrams · Wordsearch · Dominoes · Pairs cards ·
Vocabulary list · Blank test

## Importing TaskMagic 3 files

Original `.mdl3` Text Match files can be imported from the home page alongside
CGAMagic's own JSON exports. Other TaskMagic file types aren't read yet.

## Built-in sets

The app ships with example Text Match sets and A Level Spanish Edexcel Unit 1
vocabulary. Typing activities have an on-screen bar of accented letters.

## How it's put together

- **`src/types.ts`** — a pair's two sides are a tagged union (`text | image | audio`).
  Text/Picture/Sound/Pic-Sound Match are one `MatchSet` type differing only in
  which kind each side holds.
- **`src/lib/compile.ts`** — flattens any set kind into the `Pair[]` the game
  bank consumes, so a new template inherits every game for free.
- **`src/storage/media.ts`** — pictures and sounds go in IndexedDB, not
  localStorage (whose ~5MB quota a dozen photos would exhaust). Sets store only
  a `mediaId`; export inlines the blobs as base64 so a shared file stands alone.
- **`src/lib/mdl3.ts`** — reader for TaskMagic 3's undocumented `.mdl3` binary
  format (fixed-width Windows-1252 fields), worked out from real files.
- **`src/games/registry.ts`, `src/mixgap/registry.ts`, `src/worksheets/registry.ts`**
  — the lists of games, Mix & Gap activities and worksheets, with the minimum
  content each one needs.
- **Migration** — sets saved before the template rework are upgraded on read, so
  work already in a teacher's browser keeps opening.

## Development

```bash
npm install
npm run dev
```

```bash
npm test        # Vitest
npm run lint    # oxlint
npm run build   # type-check and build
```

Deploys to GitHub Pages automatically on push to `main`.
