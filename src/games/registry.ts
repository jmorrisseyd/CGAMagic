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
    id: "multi-match",
    name: "Multi-Match",
    description:
      "One-in-three multiple choice, no timer. Keep trying until it's right — the gentlest way in.",
    minPairs: 3,
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
    id: "true-or-false",
    name: "True or False?",
    description:
      "A pairing flashes up — is it right? Three seconds to decide before it moves on.",
    minPairs: 4,
  },
  {
    id: "tower-block",
    name: "Tower Block",
    description:
      "Answer multiple-choice questions to build your tower. One wrong answer ends it — unless you've got a play-safe left.",
    minPairs: 4,
  },
  {
    id: "invaders",
    name: "Invaders",
    description:
      "Answers drift down the screen — shoot the right one before it lands. Three lives.",
    minPairs: 4,
  },
  {
    id: "football",
    name: "Football",
    description:
      "Two teams. Answer correctly to move up the pitch — short passes are safer, shots on goal are riskier.",
    minPairs: 4,
  },
  {
    id: "oxo",
    name: "OXO",
    description:
      "Noughts and crosses, two teams. Type the answer to claim a square — a wrong answer hands it to the other side.",
    minPairs: 4,
    needsTextAnswer: true,
  },
  {
    id: "type",
    name: "Type",
    description: "See the prompt, type the answer. Checked when you submit.",
    minPairs: 2,
    needsTextAnswer: true,
  },
  {
    id: "hangman",
    name: "Hangman",
    description: "Guess the hidden word one letter at a time — no clue, just spelling recall.",
    minPairs: 2,
    needsTextAnswer: true,
  },
  {
    id: "trainer",
    name: "Trainer",
    description:
      "Practice mode with hints and retries, or test mode with no feedback and a printable score.",
    minPairs: 2,
    needsTextAnswer: true,
  },
];

export function gameInfo(id: string): GameInfo | undefined {
  return GAMES.find((g) => g.id === id);
}
