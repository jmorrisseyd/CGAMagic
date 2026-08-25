import type { Pair } from "../types";
import { sample, shuffle } from "./shuffle";

export interface Choice {
  text: string;
  isCorrect: boolean;
  pairId: string;
}

/** Build a multiple-choice set of `count` right-hand answers for `correct`, drawn from the other pairs. */
export function buildChoices(
  allPairs: Pair[],
  correct: Pair,
  count: number,
): Choice[] {
  const others = allPairs.filter((p) => p.id !== correct.id);
  const distractors = sample(others, Math.min(count - 1, others.length));
  const choices: Choice[] = [
    { text: correct.right, isCorrect: true, pairId: correct.id },
    ...distractors.map((p) => ({
      text: p.right,
      isCorrect: false,
      pairId: p.id,
    })),
  ];
  return shuffle(choices);
}
