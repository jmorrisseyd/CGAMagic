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
| Mix & Gap | text reconstruction | ⬜ not yet |
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
Invaders II, Snake, 3 in a Row II, 5 Counters, Jump!, plus printable
worksheets (matching, dominoes, wordsearch, gap-fill, pelmanism cards).

## How it's put together

- **`src/types.ts`** — a pair's two sides are a tagged union (`text | image | audio`).
  Text/Picture/Sound/Pic-Sound Match are one `MatchSet` type differing only in
  which kind each side holds.
- **`src/lib/compile.ts`** — flattens any set kind into the `Pair[]` the game
  bank consumes, so a new template inherits every game for free.
- **`src/storage/media.ts`** — pictures and sounds go in IndexedDB, not
  localStorage (whose ~5MB quota a dozen photos would exhaust). Sets store only
  a `mediaId`; export inlines the blobs as base64 so a shared file stands alone.
- **Migration** — sets saved before the template rework are upgraded on read, so
  work already in a teacher's browser keeps opening.

## Development

```bash
npm install
npm run dev
```

Deploys to GitHub Pages automatically on push to `main`.
