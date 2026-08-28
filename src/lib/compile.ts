import type { AnySet, GridSet, MatchSet, Pair } from "../types";

/**
 * A set flattened into the shape the match game bank consumes. Grid Match
 * authors a table but plays as ordinary pairs, so it compiles down here
 * rather than needing its own copy of every game.
 */
export interface PlayableSet {
  id: string;
  title: string;
  leftLabel: string;
  rightLabel: string;
  pairs: Pair[];
}

/** "je" + "être" -> "être · je", the prompt shown for a grid cell. */
export function gridPrompt(rowHeader: string, colHeader: string): string {
  return [rowHeader, colHeader].filter(Boolean).join(" · ");
}

export function compileGrid(set: GridSet): Pair[] {
  const pairs: Pair[] = [];
  set.rowHeaders.forEach((rowHeader, r) => {
    set.colHeaders.forEach((colHeader, c) => {
      const answer = set.cells[r]?.[c]?.trim();
      if (!answer) return; // blank cell = deliberately skipped combination
      pairs.push({
        id: `${set.id}:${r}:${c}`,
        left: { kind: "text", text: gridPrompt(rowHeader, colHeader) },
        right: { kind: "text", text: answer },
      });
    });
  });
  return pairs;
}

export function compileMatch(set: MatchSet): Pair[] {
  return set.pairs;
}

/** Returns null for set kinds that have their own bespoke activities. */
export function toPlayable(set: AnySet): PlayableSet | null {
  switch (set.kind) {
    case "match":
      return {
        id: set.id,
        title: set.title,
        leftLabel: set.leftLabel,
        rightLabel: set.rightLabel,
        pairs: compileMatch(set),
      };
    case "grid":
      return {
        id: set.id,
        title: set.title,
        leftLabel: "Prompt",
        rightLabel: "Answer",
        pairs: compileGrid(set),
      };
    default:
      return null;
  }
}
