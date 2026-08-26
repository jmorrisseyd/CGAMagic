import type { GameInfo } from "../types";

export const GAMES: GameInfo[] = [
  {
    id: "flashcards",
    name: "Flashcards",
    description:
      "See one side, try to recall the other, then reveal. No pressure, no scoring — just self-testing.",
    minPairs: 2,
  },
  {
    id: "drag-match",
    name: "Drag & Match",
    description:
      "Drag each answer onto its matching prompt. Try again on a wrong match — no penalty.",
    minPairs: 3,
  },
  {
    id: "three-in-a-row",
    name: "3 in a Row",
    description:
      "Two teams take turns answering questions to claim squares on a grid. Score a point for every line of three.",
    minPairs: 5,
  },
  {
    id: "pelmanism",
    name: "Pelmanism",
    description:
      "Classic memory pairs game. Play solo to beat your best attempt count, or head-to-head as two players.",
    minPairs: 4,
  },
  {
    id: "against-the-clock",
    name: "Against the Clock",
    description: "Match every pair before the timer runs out.",
    minPairs: 3,
  },
  {
    id: "tower-block",
    name: "Tower Block",
    description:
      "Answer multiple-choice questions to build your tower. One wrong answer ends it — unless you've got a play-safe left.",
    minPairs: 4,
  },
  {
    id: "type",
    name: "Type",
    description: "See the prompt, type the answer. Letter-by-letter feedback as you go.",
    minPairs: 2,
  },
  {
    id: "hangman",
    name: "Hangman",
    description: "Guess the hidden word one letter at a time — no clue, just spelling recall.",
    minPairs: 2,
  },
];

export function gameInfo(id: string): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}
