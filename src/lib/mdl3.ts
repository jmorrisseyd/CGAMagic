/**
 * Reader for TaskMagic 3's `.mdl3` Text Match files.
 *
 * The format was worked out by inspecting a corpus of 166 real department
 * files; it is not documented anywhere and TaskMagic is no longer sold.
 * It's a flat, uncompressed layout of space-padded fixed-width fields:
 *
 *   offset 0    16 bytes   "TaskMagic Binary"
 *   offset 16   uint32 LE  N = number of pairs
 *   offset 20   field[0]           instruction text
 *               field[1..N]        left-hand items
 *               field[N+1..2N]     right-hand items
 *               field[2N+1]        enabled activities, e.g. "_mat__3ir__fla_"
 *               field[2N+2]        trailing padding
 *   + 4 trailing bytes
 *
 * Every field is exactly 200 bytes, right-padded with spaces (0x20), so
 * total size is always 400*N + 624 — which held for all 166 samples.
 *
 * Text is Windows-1252, not Latin-1: the corpus contains 0x92 (curly
 * apostrophe), 0x80 (euro) and 0x9c (oe ligature), which are undefined in
 * Latin-1 and would decode to control characters.
 */

const MAGIC = "TaskMagic Binary";
const FIELD_WIDTH = 200;
const HEADER_BYTES = 20;
/** Fields that aren't items: the instruction, the activity list, the padding. */
const NON_ITEM_FIELDS = 3;

export interface Mdl3Pair {
  left: string;
  right: string;
}

export interface Mdl3File {
  /** The on-screen instruction TaskMagic showed above the activity. */
  instruction: string;
  pairs: Mdl3Pair[];
  /** Short activity codes the teacher had switched on, e.g. ["mat", "fla"]. */
  enabledActivities: string[];
}

export class Mdl3ParseError extends Error {}

function decodeField(bytes: Uint8Array): string {
  // windows-1252 is required for the curly quotes and accented characters
  // Word-authored vocab lists are full of.
  const text = new TextDecoder("windows-1252").decode(bytes);
  // Fields are space-padded to their full width; a trailing NUL can appear
  // in the final padding field.
  return text.replace(/[\s\0]+$/, "");
}

export function parseMdl3(buffer: ArrayBuffer): Mdl3File {
  const bytes = new Uint8Array(buffer);

  if (bytes.length < HEADER_BYTES + FIELD_WIDTH) {
    throw new Mdl3ParseError("File is too short to be a TaskMagic file.");
  }

  const magic = new TextDecoder("windows-1252").decode(bytes.subarray(0, 16));
  if (magic !== MAGIC) {
    throw new Mdl3ParseError("Not a TaskMagic file (missing signature).");
  }

  const view = new DataView(buffer);
  const pairCount = view.getUint32(16, true);

  const expectedSize = 400 * pairCount + 624;
  if (bytes.length !== expectedSize) {
    throw new Mdl3ParseError(
      `Unexpected size for a ${pairCount}-pair file: expected ${expectedSize} bytes, got ${bytes.length}.`,
    );
  }

  const fieldCount = Math.floor((bytes.length - HEADER_BYTES) / FIELD_WIDTH);
  if (fieldCount < 2 * pairCount + NON_ITEM_FIELDS) {
    throw new Mdl3ParseError("File is truncated — not enough item fields.");
  }

  const field = (i: number) =>
    decodeField(
      bytes.subarray(
        HEADER_BYTES + i * FIELD_WIDTH,
        HEADER_BYTES + (i + 1) * FIELD_WIDTH,
      ),
    );

  const instruction = field(0);
  const pairs: Mdl3Pair[] = [];
  for (let i = 0; i < pairCount; i++) {
    const left = field(1 + i);
    const right = field(1 + pairCount + i);
    // A pair with nothing on either side is an unused slot, not content.
    if (!left && !right) continue;
    pairs.push({ left, right });
  }

  const enabledActivities = field(2 * pairCount + 1)
    .split("_")
    .map((code) => code.trim())
    .filter(Boolean);

  return { instruction, pairs, enabledActivities };
}

/** "1_a_eng_to_fr_sports_vocab.mdl3" -> "1 a eng to fr sports vocab". */
export function titleFromFilename(filename: string): string {
  return (
    filename
      .replace(/\.mdl3$/i, "")
      .replace(/[_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim() || "Imported set"
  );
}
