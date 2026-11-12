import type { Pair, Side } from "../types";
import { shuffle } from "./shuffle";

export interface Choice {
  side: Side;
  isCorrect: boolean;
  pairId: string;
}

/** Two sides count as the same if a student couldn't tell them apart. */
export function sameSide(a: Side, b: Side): boolean {
  if (a.kind === "text" && b.kind === "text") {
    return a.text.trim().toLowerCase() === b.text.trim().toLowerCase();
  }
  if (a.kind === "image" && b.kind === "image") return a.mediaId === b.mediaId;
  if (a.kind === "audio" && b.kind === "audio") return a.mediaId === b.mediaId;
  return false;
}

/**
 * True when either pair's answer is a correct answer to the other's
 * prompt. Vocab lists are full of these — synonyms, and verb tables where
 * "je" and "il" both give "parle" — and the games must accept either copy
 * rather than insisting on the one that happens to share an id.
 */
export function interchangeable(a: Pair, b: Pair): boolean {
  return a.id === b.id || sameSide(a.right, b.right) || sameSide(a.left, b.left);
}

/**
 * Build `count` multiple-choice answers for `correct`, drawn from the other
 * pairs. A distractor is never another correct answer to this prompt, and
 * no two options look the same.
 */
export function buildChoices(
  allPairs: Pair[],
  correct: Pair,
  count: number,
): Choice[] {
  const distractors: Pair[] = [];
  for (const p of shuffle(allPairs)) {
    if (distractors.length >= count - 1) break;
    if (interchangeable(p, correct)) continue;
    if (distractors.some((d) => sameSide(d.right, p.right))) continue;
    distractors.push(p);
  }
  return shuffle([
    { side: correct.right, isCorrect: true, pairId: correct.id },
    ...distractors.map((p) => ({
      side: p.right,
      isCorrect: false,
      pairId: p.id,
    })),
  ]);
}
