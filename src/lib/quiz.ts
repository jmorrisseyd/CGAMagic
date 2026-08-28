import type { Pair, Side } from "../types";
import { sample, shuffle } from "./shuffle";

export interface Choice {
  side: Side;
  isCorrect: boolean;
  pairId: string;
}

/** Build `count` multiple-choice answers for `correct`, drawn from the other pairs. */
export function buildChoices(
  allPairs: Pair[],
  correct: Pair,
  count: number,
): Choice[] {
  const others = allPairs.filter((p) => p.id !== correct.id);
  const distractors = sample(others, Math.min(count - 1, others.length));
  return shuffle([
    { side: correct.right, isCorrect: true, pairId: correct.id },
    ...distractors.map((p) => ({
      side: p.right,
      isCorrect: false,
      pairId: p.id,
    })),
  ]);
}
