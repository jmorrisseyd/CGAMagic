/** Letter-grid puzzle generation for the printable wordsearch worksheet. */

export interface Placement {
  word: string;
  /** The word as written into the grid (accents stripped, spaces removed). */
  normalised: string;
  row: number;
  col: number;
  dRow: number;
  dCol: number;
}

export interface Wordsearch {
  grid: string[][];
  placements: Placement[];
  /** Words that wouldn't fit anywhere — surfaced so the sheet can say so. */
  skipped: string[];
}

const DIRECTIONS: [number, number][] = [
  [0, 1], // →
  [1, 0], // ↓
  [1, 1], // ↘
  [-1, 1], // ↗
  [0, -1], // ←
  [-1, 0], // ↑
  [-1, -1], // ↖
  [1, -1], // ↙
];

/**
 * Wordsearch grids can't show accents (students scan for bare letters), so
 * é becomes E and so on. Kept as a separate step from upper-casing because
 * the clue list still shows the properly accented word.
 */
export function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function normaliseForGrid(s: string): string {
  return stripAccents(s)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

function randInt(n: number): number {
  return Math.floor(Math.random() * n);
}

function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function fits(
  grid: (string | null)[][],
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
): boolean {
  const size = grid.length;
  for (let i = 0; i < word.length; i++) {
    const r = row + dRow * i;
    const c = col + dCol * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    const existing = grid[r][c];
    // Overlapping is fine as long as the shared cell agrees.
    if (existing !== null && existing !== word[i]) return false;
  }
  return true;
}

/**
 * Places as many words as will fit, longest first (long words are hardest
 * to place, so they get first pick of the empty grid).
 */
export function buildWordsearch(
  words: string[],
  options: { size?: number; allowBackwards?: boolean } = {},
): Wordsearch {
  const cleaned = words
    .map((w) => ({ word: w, normalised: normaliseForGrid(w) }))
    .filter((w) => w.normalised.length >= 2);

  const longest = cleaned.reduce((max, w) => Math.max(max, w.normalised.length), 0);
  const size = options.size ?? Math.max(10, Math.min(20, longest + 3));
  const directions = options.allowBackwards ? DIRECTIONS : DIRECTIONS.slice(0, 4);

  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );
  const placements: Placement[] = [];
  const skipped: string[] = [];

  // Longest first, and only then randomised within the same length.
  const ordered = shuffled(cleaned).sort(
    (a, b) => b.normalised.length - a.normalised.length,
  );

  for (const { word, normalised } of ordered) {
    if (normalised.length > size) {
      skipped.push(word);
      continue;
    }
    let placed = false;
    // Try random starts rather than scanning, so grids differ each print.
    const attempts = size * size * directions.length;
    for (let attempt = 0; attempt < attempts && !placed; attempt++) {
      const dir = directions[randInt(directions.length)];
      const row = randInt(size);
      const col = randInt(size);
      if (!fits(grid, normalised, row, col, dir[0], dir[1])) continue;
      for (let i = 0; i < normalised.length; i++) {
        grid[row + dir[0] * i][col + dir[1] * i] = normalised[i];
      }
      placements.push({
        word,
        normalised,
        row,
        col,
        dRow: dir[0],
        dCol: dir[1],
      });
      placed = true;
    }
    if (!placed) skipped.push(word);
  }

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const filled = grid.map((row) =>
    row.map((cell) => cell ?? ALPHABET[randInt(ALPHABET.length)]),
  );

  return { grid: filled, placements, skipped };
}

/** Scrambles a word for the anagram sheet, never returning the original. */
export function anagram(word: string): string {
  const letters = word.split("");
  if (letters.length < 2) return word;
  for (let attempt = 0; attempt < 12; attempt++) {
    const shuffledLetters = shuffled(letters);
    const candidate = shuffledLetters.join("");
    if (candidate !== word) return candidate;
  }
  // Palindromic or single repeated letter — swap the ends and accept it.
  return [...letters].reverse().join("");
}

/**
 * Blanks a proportion of a word's letters, keeping the first one as an
 * anchor. Returns e.g. "b _ n j o _ r" style display strings.
 */
export function blankLetters(word: string, keepRatio = 0.5): string {
  const chars = [...word];
  const letterIdx = chars
    .map((c, i) => (/[\p{L}]/u.test(c) ? i : -1))
    .filter((i) => i >= 0);
  const keep = new Set<number>();
  if (letterIdx.length > 0) keep.add(letterIdx[0]);
  const target = Math.max(1, Math.round(letterIdx.length * keepRatio));
  const pool = shuffled(letterIdx.slice(1));
  for (const i of pool) {
    if (keep.size >= target) break;
    keep.add(i);
  }
  return chars
    .map((c, i) => (/[\p{L}]/u.test(c) && !keep.has(i) ? "_" : c))
    .join("");
}
