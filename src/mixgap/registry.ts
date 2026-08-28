import type { MixGapSet } from "../types";
import { wordCount } from "../lib/mixgap";

export type MixGapActivityId =
  | "tile-3"
  | "tile-4"
  | "tile-5"
  | "text-mix"
  | "next-word"
  | "one-in-three"
  | "space"
  | "anagrams"
  | "gap-fill"
  | "multi-gaps"
  | "write-gaps"
  | "find-it"
  | "comprehension";

export interface MixGapActivity {
  id: MixGapActivityId;
  name: string;
  description: string;
  /** Names and minimums follow TaskMagic's own documentation. */
  minWords?: number;
  maxWords?: number;
  /** Activities the teacher has to author content for. */
  needs?: "gaps" | "findIt" | "comprehension";
}

export const MIXGAP_ACTIVITIES: MixGapActivity[] = [
  {
    id: "tile-3",
    name: "Tile 3×3",
    description:
      "Eight chunks of the text in a nine-square grid — slide them into the empty space to rebuild it.",
    minWords: 8,
  },
  {
    id: "tile-4",
    name: "Tile 4×4",
    description: "The same sliding puzzle with fifteen chunks. Harder.",
    minWords: 15,
  },
  {
    id: "tile-5",
    name: "Tile 5×5",
    description: "Twenty-four chunks. For longer passages and confident classes.",
    minWords: 24,
  },
  {
    id: "text-mix",
    name: "Text Mix",
    description: "Every word jumbled — put them back in order.",
    minWords: 3,
  },
  {
    id: "next-word",
    name: "Next Word",
    description:
      "Build the text a word at a time, choosing the next one from ten options.",
    minWords: 5,
  },
  {
    id: "one-in-three",
    name: "1 in 3",
    description: "Build the text chunk by chunk, choosing from three each time.",
    minWords: 6,
  },
  {
    id: "space",
    name: "Space",
    description:
      "All the spaces and punctuation are gone — click where each word ends.",
    minWords: 3,
  },
  {
    id: "anagrams",
    name: "Anagrams",
    description: "Each word's letters jumbled, in the order they appear.",
    minWords: 3,
  },
  {
    id: "gap-fill",
    name: "Gap-fill",
    description:
      "The words you chose are removed — students type them back, with the word list to help.",
    needs: "gaps",
  },
  {
    id: "multi-gaps",
    name: "Multi Gaps",
    description: "Each gap becomes a multiple choice.",
    needs: "gaps",
  },
  {
    id: "write-gaps",
    name: "Write Gaps",
    description:
      "The same gaps with no word list — students work from context. Three tries each.",
    needs: "gaps",
  },
  {
    id: "find-it",
    name: "Find it!",
    description:
      "Read a prompt, then highlight the part of the text it refers to.",
    needs: "findIt",
  },
  {
    id: "comprehension",
    name: "Comprehension",
    description: "Multiple-choice questions on the passage.",
    needs: "comprehension",
  },
];

export function mixGapActivity(id: string): MixGapActivity | undefined {
  return MIXGAP_ACTIVITIES.find((a) => a.id === id);
}

/** Why an activity can't be played yet, or null when it's ready. */
export function unavailableReason(
  activity: MixGapActivity,
  set: MixGapSet,
): string | null {
  const n = wordCount(set.text);
  if (activity.minWords && n < activity.minWords) {
    return `Needs a passage of at least ${activity.minWords} words`;
  }
  if (activity.maxWords && n > activity.maxWords) {
    return `Only for passages up to ${activity.maxWords} words`;
  }
  if (activity.needs === "gaps" && set.gaps.length === 0) {
    return "Choose some words to gap first";
  }
  if (activity.needs === "findIt" && set.findIt.length === 0) {
    return "Add some Find it! prompts first";
  }
  if (activity.needs === "comprehension" && set.comprehension.length === 0) {
    return "Add some comprehension questions first";
  }
  return null;
}
