# CGAMagic

A browser-based clone of [MDL Software's TaskMagic3](https://www.mdlsoft.co.uk) — a template-based game and worksheet authoring tool for MFL (Modern Foreign Languages) classrooms. TaskMagic3 is Windows-only and no longer sold; this project rebuilds it for the browser so it keeps working.

No accounts, no server — everything runs and saves in your browser (with JSON export/import to move sets between machines).

## Status: Phase 1 — Text Match

TaskMagic3 has 8 template families (Text Match, Picture Match, Sound Match, Pic-Sound, Grid Match, Mix & Gap, Dialogues, Multi-Choice), most sharing a common bank of ~20 game engines. Phase 1 builds that shared engine on **Text Match** (plain text-to-text pairs):

- Flashcards
- Drag & Match
- 3 in a Row
- Pelmanism (1 or 2 player)
- Against the Clock
- Tower Block
- Type
- Hangman

Later phases: reuse this engine for Picture/Sound/Grid/Pic-Sound Match (swap the stimulus type), then build Mix & Gap, Dialogues, and Multi-Choice as their own engines, plus printable worksheets.

## Development

```bash
npm install
npm run dev
```
