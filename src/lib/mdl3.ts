/**
 * Reader for TaskMagic 3's `.mdl3` Text Match files.
 *
 * The format was worked out by inspecting a corpus of 188 real department
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
 * total size is always 400*N + 624 — which held for all 188 samples.
 *
 * Text is Windows-1252, not Latin-1: the corpus contains 0x92 (curly
 * apostrophe), 0x9c (oe ligature), 0x93/0x94 (curly double quotes), 0x85
 * (ellipsis) and 0x80 (euro). Latin-1 maps those to C1 control characters,
 * so "L’estomac" and "ma sœur" would come out as invisible mojibake.
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

/**
 * windows-1252's 0x80-0x9F range, which is where it differs from Latin-1.
 * Everything outside this range maps to the same code point as the byte.
 *
 * This is spelled out rather than delegated to TextDecoder because not
 * every JS runtime actually implements the legacy single-byte tables — a
 * Node build here decoded 0x92 to U+0092 (an invisible control character)
 * for every label including "windows-1252", silently turning "L’estomac"
 * into "Lestomac". Doing the mapping by hand makes the result
 * identical everywhere.
 */
const CP1252_HIGH: readonly number[] = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, // 80-87
  0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f, // 88-8F
  0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014, // 90-97
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178, // 98-9F
];

function decodeCp1252(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) {
    out += String.fromCodePoint(
      byte >= 0x80 && byte <= 0x9f ? CP1252_HIGH[byte - 0x80] : byte,
    );
  }
  return out;
}

function decodeField(bytes: Uint8Array): string {
  // Fields are padded to their full width with spaces, and the final
  // padding field can carry trailing NULs. Only those two are padding —
  // a tab is real content, so \s must not be used here.
  return decodeCp1252(bytes).replace(/[ \0]+$/, "");
}

export function parseMdl3(buffer: ArrayBuffer): Mdl3File {
  const bytes = new Uint8Array(buffer);

  if (bytes.length < HEADER_BYTES + FIELD_WIDTH) {
    throw new Mdl3ParseError("File is too short to be a TaskMagic file.");
  }

  const magic = decodeCp1252(bytes.subarray(0, 16));
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
