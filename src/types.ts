/**
 * One half of a matching pair. Text lives inline; images and audio are
 * stored as blobs in IndexedDB (see storage/media.ts) and referenced by
 * mediaId, because data URLs would blow localStorage's ~5MB quota after
 * only a handful of pictures.
 */
export type Side =
  | { kind: "text"; text: string }
  | { kind: "image"; mediaId: string; alt?: string }
  | { kind: "audio"; mediaId: string; label?: string };

export type SideKind = Side["kind"];

export interface Pair {
  id: string;
  left: Side;
  right: Side;
}

/** Which templates the match engine can present, by what each side holds. */
export type MatchTemplate =
  | "text-match"
  | "picture-match"
  | "sound-match"
  | "pic-sound";

export interface BaseSet {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Text/Picture/Sound/Pic-Sound Match all share this shape and the same
 * game engine — only leftKind/rightKind differ:
 *   text-match    text  <-> text
 *   picture-match image <-> text
 *   sound-match   audio <-> text
 *   pic-sound     audio <-> image
 */
export interface MatchSet extends BaseSet {
  kind: "match";
  template: MatchTemplate;
  leftLabel: string;
  rightLabel: string;
  leftKind: SideKind;
  rightKind: SideKind;
  pairs: Pair[];
}

/**
 * Grid Match: row and column headers combine to prompt for a cell, e.g.
 * headers [être] x [je] -> "je suis". Compiles down to ordinary pairs so
 * it can reuse the whole match game bank.
 */
export interface GridSet extends BaseSet {
  kind: "grid";
  rowHeaders: string[];
  colHeaders: string[];
  /** cells[row][col]; "" means "skip this combination". */
  cells: string[][];
}

/** One word the teacher chose to gap, identified by its position in the text. */
export interface MixGapGap {
  /** Index among the text's words (punctuation and spacing excluded). */
  wordIndex: number;
  /** Wrong answers for Multi Gaps; the real word is mixed in at play time. */
  distractors?: string[];
}

/** A span of the passage the student has to find from a written prompt. */
export interface FindItPrompt {
  id: string;
  prompt: string;
  /** Character offsets into the passage. */
  start: number;
  end: number;
}

/**
 * Mix & Gap: one passage (TaskMagic allows up to 500 words) that generates
 * a bank of reconstruction activities, plus gaps, comprehension questions
 * and Find it! prompts the teacher adds on top.
 */
export interface MixGapSet extends BaseSet {
  kind: "mixgap";
  text: string;
  gaps: MixGapGap[];
  findIt: FindItPrompt[];
  comprehension: MultiChoiceQuestion[];
}

/** Dialogues: an ordered script of speaker turns. */
export interface DialogueSet extends BaseSet {
  kind: "dialogue";
  lines: { id: string; speaker: string; text: string }[];
}

export interface MultiChoiceQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface MultiChoiceSet extends BaseSet {
  kind: "multichoice";
  questions: MultiChoiceQuestion[];
}

export type AnySet =
  | MatchSet
  | GridSet
  | MixGapSet
  | DialogueSet
  | MultiChoiceSet;

export type SetKind = AnySet["kind"];

export type GameId =
  | "flashcards"
  | "drag-match"
  | "three-in-a-row"
  | "pelmanism"
  | "against-the-clock"
  | "tower-block"
  | "type"
  | "hangman"
  | "multi-match"
  | "true-or-false"
  | "invaders"
  | "football"
  | "oxo"
  | "trainer";

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  minPairs: number;
  /**
   * Games where the player produces the answer by typing/spelling it, so
   * the answer side must be text (can't type a picture).
   */
  needsTextAnswer?: boolean;
}

/** Convenience for code that only cares about plain-text sides. */
export function sideText(side: Side): string {
  switch (side.kind) {
    case "text":
      return side.text;
    case "image":
      return side.alt ?? "";
    case "audio":
      return side.label ?? "";
  }
}

export function isTextSide(side: Side): boolean {
  return side.kind === "text";
}
