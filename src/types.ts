export interface Pair {
  id: string;
  left: string;
  right: string;
}

export interface TextMatchSet {
  id: string;
  title: string;
  leftLabel: string;
  rightLabel: string;
  pairs: Pair[];
  createdAt: number;
  updatedAt: number;
}

export type GameId =
  | "flashcards"
  | "drag-match"
  | "three-in-a-row"
  | "pelmanism"
  | "against-the-clock"
  | "tower-block"
  | "type"
  | "hangman";

export interface GameInfo {
  id: GameId;
  name: string;
  description: string;
  minPairs: number;
}
