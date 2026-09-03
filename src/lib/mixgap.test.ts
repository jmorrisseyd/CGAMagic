import { describe, expect, it } from "vitest";
import {
  boundaryPositions,
  boundarySeparators,
  chunk,
  isSolved,
  neighbours,
  scrambleSlidingPuzzle,
  stripSpacing,
  tokenise,
  words,
} from "./mixgap";

/**
 * The standard solvability test for an NxN sliding puzzle. An arrangement
 * is only reachable from the solved state when:
 *   - odd N:  the inversion count is even
 *   - even N: inversions + the blank's row counted from the bottom is odd
 *
 * This matters because an unsolvable scramble is unwinnable, and a student
 * would have no way of telling that from a merely hard one.
 */
function isSolvable(board: number[], size: number): boolean {
  const blank = size * size - 1;
  const tiles = board.filter((v) => v !== blank);
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) inversions++;
    }
  }
  if (size % 2 === 1) return inversions % 2 === 0;
  const blankRowFromBottom = size - Math.floor(board.indexOf(blank) / size);
  return (inversions + blankRowFromBottom) % 2 === 1;
}

describe("scrambleSlidingPuzzle", () => {
  // Property test: this has to hold for every scramble, not just one, so it
  // is asserted across many rather than by example.
  it.each([3, 4, 5])("only ever produces solvable %ix%i boards", (size) => {
    for (let i = 0; i < 200; i++) {
      const board = scrambleSlidingPuzzle(size);
      expect(isSolvable(board, size), `unsolvable board: ${board}`).toBe(true);
    }
  });

  it.each([3, 4, 5])("produces a complete %ix%i board with no duplicates", (size) => {
    for (let i = 0; i < 50; i++) {
      const board = scrambleSlidingPuzzle(size);
      expect(board).toHaveLength(size * size);
      expect(new Set(board).size).toBe(size * size);
    }
  });

  it("never hands back an already-solved board", () => {
    for (let i = 0; i < 200; i++) {
      expect(isSolved(scrambleSlidingPuzzle(3))).toBe(false);
    }
  });
});

describe("neighbours", () => {
  it("gives the four orthogonal cells for a centre square", () => {
    expect(neighbours(4, 3).sort((a, b) => a - b)).toEqual([1, 3, 5, 7]);
  });

  it("gives only two for a corner", () => {
    expect(neighbours(0, 3).sort((a, b) => a - b)).toEqual([1, 3]);
    expect(neighbours(8, 3).sort((a, b) => a - b)).toEqual([5, 7]);
  });

  it("never wraps around a row edge", () => {
    // Cell 2 is the top-right of a 3x3; cell 3 is the row below's left.
    expect(neighbours(2, 3)).not.toContain(3);
  });
});

describe("tokenise", () => {
  it("keeps words, spacing and punctuation as separate tokens", () => {
    const tokens = tokenise("Je me lève.");
    expect(tokens.filter((t) => t.isWord).map((t) => t.text)).toEqual([
      "Je",
      "me",
      "lève",
    ]);
  });

  it("round-trips to the original text", () => {
    const text = "Je me lève à sept heures. Ensuite, je vais au collège.";
    expect(tokenise(text).map((t) => t.text).join("")).toBe(text);
  });

  it("treats an internal apostrophe as part of the word", () => {
    expect(words("j'ai l’estomac")).toEqual(["j'ai", "l’estomac"]);
  });

  it("numbers words sequentially, skipping punctuation", () => {
    const tokens = tokenise("un, deux");
    expect(tokens.filter((t) => t.isWord).map((t) => t.wordIndex)).toEqual([0, 1]);
    expect(tokens.filter((t) => !t.isWord).every((t) => t.wordIndex === -1)).toBe(true);
  });
});

describe("the Space activity's boundary maths", () => {
  const text = "Je me lève à sept heures. Ensuite, je vais au collège.";

  it("strips every space and punctuation mark", () => {
    expect(stripSpacing(text)).toBe("JemelèveàseptheuresEnsuitejevaisaucollège");
  });

  it("puts a boundary after every word but the last", () => {
    expect(boundaryPositions(text)).toHaveLength(words(text).length - 1);
  });

  /**
   * The activity restores "the missing space and or punctuation" at each
   * boundary, so rebuilding from the stripped text plus the separators has
   * to reproduce the passage exactly — bar anything trailing the last word,
   * which sits past every boundary.
   */
  it("rebuilds the original passage from the stripped text and separators", () => {
    const stripped = stripSpacing(text);
    const positions = boundaryPositions(text);
    const separators = boundarySeparators(text);

    let rebuilt = "";
    let taken = 0;
    positions.forEach((pos, i) => {
      rebuilt += stripped.slice(taken, pos) + separators[i];
      taken = pos;
    });
    rebuilt += stripped.slice(taken);

    expect(rebuilt).toBe(text.replace(/[^\p{L}\p{N}]+$/u, ""));
  });
});

describe("chunk", () => {
  it("splits into exactly the number of chunks asked for", () => {
    const text = words(Array.from({ length: 40 }, (_, i) => `w${i}`).join(" ")).join(" ");
    expect(chunk(text, 8)).toHaveLength(8);
  });

  it("loses no words", () => {
    const text = "Je me lève à sept heures et je prends mon petit déjeuner";
    expect(chunk(text, 4).join(" ").split(/\s+/)).toEqual(text.split(/\s+/));
  });

  it("never produces an empty chunk, even for short passages", () => {
    expect(chunk("un deux trois", 8).every((c) => c.trim().length > 0)).toBe(true);
  });
});
