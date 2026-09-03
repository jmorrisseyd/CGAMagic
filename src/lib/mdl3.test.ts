import { existsSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { Mdl3ParseError, parseMdl3, titleFromFilename } from "./mdl3";

/**
 * Builds a .mdl3 in memory from the reverse-engineered spec, so the parser
 * can be tested without shipping the department's own files into the repo.
 * Writing the encoder as well as the reader also checks the spec both ways:
 * if the layout below is wrong, the round-trip fails.
 *
 *   0    16 bytes   "TaskMagic Binary"
 *   16   uint32 LE  N = pair count
 *   20   field[0]          instruction
 *        field[1..N]       left items
 *        field[N+1..2N]    right items
 *        field[2N+1]       enabled activities
 *        field[2N+2]       padding
 *   + 4 trailing bytes;  total = 400N + 624
 */
const CP1252_HIGH_REVERSE: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84, "…": 0x85, "†": 0x86, "‡": 0x87,
  "ˆ": 0x88, "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c, "Ž": 0x8e, "‘": 0x91,
  "’": 0x92, "“": 0x93, "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97, "˜": 0x98,
  "™": 0x99, "š": 0x9a, "›": 0x9b, "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
};

function encodeCp1252(text: string): number[] {
  return [...text].map((ch) => {
    const high = CP1252_HIGH_REVERSE[ch];
    if (high !== undefined) return high;
    const code = ch.codePointAt(0)!;
    if (code > 0xff) throw new Error(`not representable in cp1252: ${ch}`);
    return code;
  });
}

function buildMdl3(options: {
  pairs: [string, string][];
  instruction?: string;
  activities?: string;
  /** Deliberately corrupt the declared pair count, for the error tests. */
  declaredCount?: number;
}): ArrayBuffer {
  const { pairs, instruction = "Drag the items…", activities = "_mat__fla_" } = options;
  const n = pairs.length;
  const total = 400 * n + 624;
  const bytes = new Uint8Array(total).fill(0x20);

  bytes.set(encodeCp1252("TaskMagic Binary"), 0);
  new DataView(bytes.buffer).setUint32(16, options.declaredCount ?? n, true);

  const writeField = (index: number, text: string) =>
    bytes.set(encodeCp1252(text), 20 + index * 200);

  writeField(0, instruction);
  pairs.forEach(([left], i) => writeField(1 + i, left));
  pairs.forEach(([, right], i) => writeField(1 + n + i, right));
  writeField(2 * n + 1, activities);

  return bytes.buffer;
}

describe("parseMdl3", () => {
  it("reads back the pairs it was given", () => {
    const file = buildMdl3({
      pairs: [
        ["dans", "in / inside"],
        ["devant", "in front of"],
        ["sur", "on"],
      ],
    });
    expect(parseMdl3(file).pairs).toEqual([
      { left: "dans", right: "in / inside" },
      { left: "devant", right: "in front of" },
      { left: "sur", right: "on" },
    ]);
  });

  it("keeps lefts and rights in their own blocks, not interleaved", () => {
    // The format stores all left items then all right items. Reading it as
    // alternating pairs would silently pair "dans" with "devant".
    const parsed = parseMdl3(
      buildMdl3({ pairs: [["dans", "in"], ["devant", "in front of"]] }),
    );
    expect(parsed.pairs[0]).toEqual({ left: "dans", right: "in" });
  });

  /**
   * The characters that distinguish windows-1252 from latin-1. Decoding
   * these as latin-1 yields invisible C1 control characters, which is
   * exactly how "L’estomac" once imported as "Lestomac".
   */
  it.each([
    ["’", "L’estomac", 0x92],
    ["œ", "ma sœur", 0x9c],
    ["“", "“bonjour”", 0x93],
    ["…", "et puis…", 0x85],
    ["€", "20€", 0x80],
  ])("decodes the cp1252-only character %s", (char, phrase) => {
    const parsed = parseMdl3(buildMdl3({ pairs: [[phrase, "x"]] }));
    expect(parsed.pairs[0].left).toBe(phrase);
    expect(parsed.pairs[0].left).toContain(char);
  });

  it("leaves no C1 control characters behind", () => {
    const parsed = parseMdl3(buildMdl3({ pairs: [["L’estomac", "ma sœur"]] }));
    const text = parsed.pairs[0].left + parsed.pairs[0].right;
    const c1 = [...text].filter((c) => {
      const code = c.codePointAt(0)!;
      return code >= 0x80 && code <= 0x9f;
    });
    expect(c1).toEqual([]);
  });

  it("preserves accented characters that latin-1 also handles", () => {
    const parsed = parseMdl3(
      buildMdl3({ pairs: [["à côté de", "next to"], ["policía", "police officer"]] }),
    );
    expect(parsed.pairs.map((p) => p.left)).toEqual(["à côté de", "policía"]);
  });

  it("strips the space padding but keeps interior whitespace", () => {
    const parsed = parseMdl3(buildMdl3({ pairs: [["deux mots", "two words"]] }));
    expect(parsed.pairs[0].left).toBe("deux mots");
  });

  it("reads the enabled-activity codes", () => {
    const parsed = parseMdl3(
      buildMdl3({ pairs: [["a", "b"]], activities: "_mat__3ir__hng__tra_" }),
    );
    expect(parsed.enabledActivities).toEqual(["mat", "3ir", "hng", "tra"]);
  });

  it("copes with an empty activity list", () => {
    const parsed = parseMdl3(buildMdl3({ pairs: [["a", "b"]], activities: "" }));
    expect(parsed.enabledActivities).toEqual([]);
  });

  describe("rejects files it can't trust", () => {
    it("throws on an empty file", () => {
      expect(() => parseMdl3(new ArrayBuffer(0))).toThrow(Mdl3ParseError);
    });

    it("throws when the signature is missing", () => {
      const bytes = new Uint8Array(1024).fill(0x41);
      expect(() => parseMdl3(bytes.buffer)).toThrow(/signature/i);
    });

    it("throws when the size contradicts the declared pair count", () => {
      // Header claims 16 pairs, body only holds 2.
      const file = buildMdl3({ pairs: [["a", "b"], ["c", "d"]], declaredCount: 16 });
      expect(() => parseMdl3(file)).toThrow(/expected/i);
    });
  });
});

describe("titleFromFilename", () => {
  it("drops the extension and turns underscores into spaces", () => {
    expect(titleFromFilename("1_a_eng_to_fr_sports_vocab.mdl3")).toBe(
      "1 a eng to fr sports vocab",
    );
  });

  it("leaves an already-readable name alone", () => {
    expect(titleFromFilename("colours of animals.mdl3")).toBe("colours of animals");
  });

  it("falls back rather than returning an empty title", () => {
    expect(titleFromFilename(".mdl3")).toBe("Imported set");
  });
});

/**
 * The department's real files are deliberately not in the repo, so this
 * block is opt-in: run it with MDL3_CORPUS=1 npm test.
 *
 * It is gated on an environment variable rather than merely on the folder
 * existing, because those files live in OneDrive. Reading one that has been
 * evicted to cloud-only storage either fails outright or blocks while it is
 * fetched back, and neither belongs in a default test run that should be
 * fast and offline. It stays available because parsing every real file is
 * the strongest check there is on the format.
 */
const CORPUS = join(process.env.HOME ?? "", "Documents/taskmagic-samples");
const runCorpus = process.env.MDL3_CORPUS === "1" && existsSync(CORPUS);

describe.skipIf(!runCorpus)("against the real .mdl3 corpus", () => {
  it("parses every readable file without throwing", async () => {
    const files = readdirSync(CORPUS).filter((f) => f.toLowerCase().endsWith(".mdl3"));
    expect(files.length).toBeGreaterThan(0);

    const failures: string[] = [];
    let read = 0;
    let pairs = 0;
    let skipped = 0;

    for (const name of files) {
      // Reads are async and time-boxed. A file evicted to cloud-only
      // storage makes OneDrive fetch it back, and the synchronous read
      // would block the event loop indefinitely — past even Vitest's own
      // timeout, which can't interrupt blocking code.
      let ab: ArrayBuffer | null = null;
      try {
        ab = await Promise.race([
          readFile(join(CORPUS, name)).then(
            (buf) =>
              buf.buffer.slice(
                buf.byteOffset,
                buf.byteOffset + buf.byteLength,
              ) as ArrayBuffer,
          ),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000)),
        ]);
      } catch {
        ab = null;
      }
      if (!ab) {
        skipped++;
        continue;
      }
      read++;
      try {
        pairs += parseMdl3(ab).pairs.length;
      } catch (e) {
        failures.push(`${name}: ${(e as Error).message}`);
      }
    }

    if (skipped > 0) {
      console.warn(
        `[mdl3] ${skipped} of ${files.length} sample files were unreadable or ` +
          `slow to fetch from cloud storage and were skipped.`,
      );
    }
    expect(failures).toEqual([]);
    expect(read).toBeGreaterThan(0);
    expect(pairs).toBeGreaterThan(0);
  });
});
