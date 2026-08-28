export type WorksheetId =
  | "matching"
  | "multi-match"
  | "missing-letters"
  | "anagrams"
  | "wordsearch"
  | "dominoes"
  | "pelmanism-cards"
  | "vocab-list"
  | "test-sheet";

export interface WorksheetInfo {
  id: WorksheetId;
  name: string;
  description: string;
  minPairs: number;
  /** Sheets where the student writes the answer, so it must be text. */
  needsTextAnswer?: boolean;
  /** Sheets that can't represent audio at all (nothing to print). */
  needsPrintableStimulus?: boolean;
}

export const WORKSHEETS: WorksheetInfo[] = [
  {
    id: "matching",
    name: "Matching",
    description:
      "Two shuffled columns — students draw lines or write the matching number.",
    minPairs: 3,
  },
  {
    id: "multi-match",
    name: "Multiple choice",
    description: "Each prompt with three options to circle. One-in-three.",
    minPairs: 3,
  },
  {
    id: "missing-letters",
    name: "Missing letters",
    description:
      "Half the letters removed from each answer — students fill in the gaps.",
    minPairs: 2,
    needsTextAnswer: true,
  },
  {
    id: "anagrams",
    name: "Anagrams",
    description: "Answers with their letters jumbled, to be unscrambled.",
    minPairs: 2,
    needsTextAnswer: true,
  },
  {
    id: "wordsearch",
    name: "Wordsearch",
    description:
      "A letter grid hiding every answer, with the prompts as the clue list.",
    minPairs: 3,
    needsTextAnswer: true,
  },
  {
    id: "dominoes",
    name: "Dominoes",
    description:
      "Cut-out tiles where each answer sits beside the next prompt — the loop closes.",
    minPairs: 4,
    needsPrintableStimulus: true,
  },
  {
    id: "pelmanism-cards",
    name: "Pairs cards",
    description: "Cut-out cards for playing pelmanism or snap on paper.",
    minPairs: 4,
    needsPrintableStimulus: true,
  },
  {
    id: "vocab-list",
    name: "Vocabulary list",
    description: "A plain reference list of every pair, for sticking in books.",
    minPairs: 1,
    needsPrintableStimulus: true,
  },
  {
    id: "test-sheet",
    name: "Blank test",
    description:
      "Prompts with ruled lines to write the answer — a straight vocab test.",
    minPairs: 2,
  },
];

export function worksheetInfo(id: string): WorksheetInfo | undefined {
  return WORKSHEETS.find((w) => w.id === id);
}
