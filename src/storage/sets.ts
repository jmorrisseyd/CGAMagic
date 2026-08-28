import { edexcelUnit1Sets } from "../data/edexcelUnit1";
import { exampleSets, type ExampleSet } from "../data/exampleSets";
import { makeId } from "../lib/id";
import { parseMdl3, titleFromFilename } from "../lib/mdl3";
import type {
  AnySet,
  GridSet,
  MatchSet,
  MatchTemplate,
  MixGapSet,
  MultiChoiceSet,
  Pair,
  Side,
} from "../types";
import {
  base64ToBlob,
  blobToBase64,
  getMedia,
  pruneMedia,
  putMedia,
} from "./media";

const STORAGE_KEY = "cgamagic:textmatch:sets";

/** The pre-templates shape: pairs held plain strings and every set was a text match. */
interface LegacySet {
  id: string;
  title: string;
  leftLabel: string;
  rightLabel: string;
  pairs: { id: string; left: string; right: string }[];
  createdAt: number;
  updatedAt: number;
}

function isLegacy(set: unknown): set is LegacySet {
  if (typeof set !== "object" || set === null) return false;
  const s = set as Record<string, unknown>;
  if ("kind" in s) return false;
  return Array.isArray(s.pairs);
}

/** Upgrades a pre-templates set in place so old saved work keeps opening. */
function migrateLegacy(old: LegacySet): MatchSet {
  return {
    id: old.id,
    kind: "match",
    template: "text-match",
    title: old.title,
    leftLabel: old.leftLabel,
    rightLabel: old.rightLabel,
    leftKind: "text",
    rightKind: "text",
    pairs: (old.pairs ?? []).map((p) => ({
      id: p.id,
      left: { kind: "text", text: p.left } as Side,
      right: { kind: "text", text: p.right } as Side,
    })),
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
  };
}

function readAll(): AnySet[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((s) => (isLegacy(s) ? migrateLegacy(s) : (s as AnySet)));
  } catch {
    return [];
  }
}

function writeAll(sets: AnySet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function listSets(): AnySet[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSet(id: string): AnySet | undefined {
  return readAll().find((s) => s.id === id);
}

export const MATCH_TEMPLATE_KINDS: Record<
  MatchTemplate,
  { left: Side["kind"]; right: Side["kind"]; name: string; blurb: string }
> = {
  "text-match": {
    left: "text",
    right: "text",
    name: "Text Match",
    blurb: "Word or phrase to word or phrase — the classic vocab pairing.",
  },
  "picture-match": {
    left: "image",
    right: "text",
    name: "Picture Match",
    blurb: "Match pictures to words. Good for concrete vocab with beginners.",
  },
  "sound-match": {
    left: "audio",
    right: "text",
    name: "Sound Match",
    blurb: "Hear it, match it to the written form. Listening and spelling.",
  },
  "pic-sound": {
    left: "audio",
    right: "image",
    name: "Pic-Sound",
    blurb: "Hear it, pick the picture. No written language at all.",
  },
};

export function createMatchSet(
  title: string,
  template: MatchTemplate,
  leftLabel: string,
  rightLabel: string,
): MatchSet {
  const now = Date.now();
  const kinds = MATCH_TEMPLATE_KINDS[template];
  const set: MatchSet = {
    id: makeId(),
    kind: "match",
    template,
    title,
    leftLabel,
    rightLabel,
    leftKind: kinds.left,
    rightKind: kinds.right,
    pairs: [],
    createdAt: now,
    updatedAt: now,
  };
  writeAll([...readAll(), set]);
  return set;
}

export function createSet(
  title: string,
  leftLabel: string,
  rightLabel: string,
): MatchSet {
  return createMatchSet(title, "text-match", leftLabel, rightLabel);
}

/** Starts a 3x3 grid — the smallest size that still makes a useful table. */
export function createGridSet(title: string): GridSet {
  const now = Date.now();
  const set: GridSet = {
    id: makeId(),
    kind: "grid",
    title,
    rowHeaders: ["", "", ""],
    colHeaders: ["", "", ""],
    cells: [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ],
    createdAt: now,
    updatedAt: now,
  };
  writeAll([...readAll(), set]);
  return set;
}

export function createMixGapSet(title: string): MixGapSet {
  const now = Date.now();
  const set: MixGapSet = {
    id: makeId(),
    kind: "mixgap",
    title,
    text: "",
    gaps: [],
    findIt: [],
    comprehension: [],
    createdAt: now,
    updatedAt: now,
  };
  writeAll([...readAll(), set]);
  return set;
}

export function createMultiChoiceSet(title: string): MultiChoiceSet {
  const now = Date.now();
  const set: MultiChoiceSet = {
    id: makeId(),
    kind: "multichoice",
    title,
    questions: [],
    createdAt: now,
    updatedAt: now,
  };
  writeAll([...readAll(), set]);
  return set;
}

export function saveSet(set: AnySet): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === set.id);
  const updated = { ...set, updatedAt: Date.now() };
  if (idx === -1) all.push(updated);
  else all[idx] = updated;
  writeAll(all);
}

export function deleteSet(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
  // Drop any pictures or sounds the deleted set was the last owner of,
  // otherwise they sit in IndexedDB forever eating the storage quota.
  void pruneMedia(referencedMediaIds());
}

/** Every mediaId any stored set still points at — used to prune orphan blobs. */
export function referencedMediaIds(): Set<string> {
  const ids = new Set<string>();
  for (const set of readAll()) {
    if (set.kind !== "match") continue;
    for (const pair of set.pairs) {
      for (const side of [pair.left, pair.right]) {
        if (side.kind === "image" || side.kind === "audio") ids.add(side.mediaId);
      }
    }
  }
  return ids;
}

function sideMediaId(side: Side): string | null {
  return side.kind === "image" || side.kind === "audio" ? side.mediaId : null;
}

/** Export as JSON, inlining any referenced media as base64 so the file stands alone. */
export async function exportSet(set: AnySet): Promise<string> {
  const media: Record<string, string> = {};
  if (set.kind === "match") {
    for (const pair of set.pairs) {
      for (const side of [pair.left, pair.right]) {
        const id = sideMediaId(side);
        if (!id || media[id]) continue;
        const blob = await getMedia(id);
        if (blob) media[id] = await blobToBase64(blob);
      }
    }
  }
  return JSON.stringify({ set, media }, null, 2);
}

/** Accepts both the new {set, media} envelope and a bare legacy set file. */
export async function importSet(json: string): Promise<AnySet> {
  const parsed = JSON.parse(json) as unknown;
  let incoming: unknown;
  let media: Record<string, string> = {};

  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "set" in (parsed as Record<string, unknown>)
  ) {
    const envelope = parsed as { set: unknown; media?: Record<string, string> };
    incoming = envelope.set;
    media = envelope.media ?? {};
  } else {
    incoming = parsed;
  }

  const set: AnySet = isLegacy(incoming)
    ? migrateLegacy(incoming)
    : (incoming as AnySet);

  if (!set || typeof set !== "object" || !("kind" in set)) {
    throw new Error("Not a valid CGAMagic file");
  }

  // Re-key media so importing the same file twice can't clobber blobs.
  const remap = new Map<string, string>();
  for (const [oldId, dataUrl] of Object.entries(media)) {
    const newId = makeId();
    remap.set(oldId, newId);
    await putMedia(newId, base64ToBlob(dataUrl));
  }

  const now = Date.now();
  const rekeyed: AnySet =
    set.kind === "match"
      ? {
          ...set,
          pairs: set.pairs.map((p) => ({
            ...p,
            left: remapSide(p.left, remap),
            right: remapSide(p.right, remap),
          })),
        }
      : set;

  const stored: AnySet = { ...rekeyed, id: makeId(), createdAt: now, updatedAt: now };
  writeAll([...readAll(), stored]);
  return stored;
}

function remapSide(side: Side, remap: Map<string, string>): Side {
  if (side.kind === "image" || side.kind === "audio") {
    const next = remap.get(side.mediaId);
    if (next) return { ...side, mediaId: next };
  }
  return side;
}

/**
 * Imports TaskMagic 3 `.mdl3` Text Match files. Written as a batch because
 * a department's back catalogue runs to hundreds of files and rewriting
 * storage once per file would be quadratic.
 *
 * TaskMagic doesn't record which language each column holds, so the labels
 * are a sensible default the teacher can rename per set.
 */
export function importMdl3Files(
  files: { name: string; buffer: ArrayBuffer }[],
): { imported: MatchSet[]; failures: { name: string; reason: string }[] } {
  const imported: MatchSet[] = [];
  const failures: { name: string; reason: string }[] = [];
  const now = Date.now();

  for (const file of files) {
    try {
      const parsed = parseMdl3(file.buffer);
      if (parsed.pairs.length === 0) {
        failures.push({ name: file.name, reason: "no pairs in file" });
        continue;
      }
      imported.push({
        id: makeId(),
        kind: "match",
        template: "text-match",
        title: titleFromFilename(file.name),
        leftLabel: "Target language",
        rightLabel: "English",
        leftKind: "text",
        rightKind: "text",
        pairs: parsed.pairs.map((p) => ({
          id: makeId(),
          left: { kind: "text", text: p.left },
          right: { kind: "text", text: p.right },
        })),
        createdAt: now,
        updatedAt: now,
      });
    } catch (err) {
      failures.push({
        name: file.name,
        reason: err instanceof Error ? err.message : "could not be read",
      });
    }
  }

  if (imported.length > 0) writeAll([...readAll(), ...imported]);
  return { imported, failures };
}

/**
 * Seeds a built-in collection. Skips any set whose title already exists,
 * so it's safe to call more than once.
 */
export function loadSetCollection(collection: ExampleSet[]): {
  added: number;
  skipped: number;
} {
  const all = readAll();
  const existingTitles = new Set(all.map((s) => s.title));
  const now = Date.now();
  const toAdd: AnySet[] = [];
  let skipped = 0;

  for (const example of collection) {
    if (existingTitles.has(example.title)) {
      skipped++;
      continue;
    }
    const pairs: Pair[] = example.pairs.map((p) => ({
      id: makeId(),
      left: { kind: "text", text: p.left },
      right: { kind: "text", text: p.right },
    }));
    toAdd.push({
      id: makeId(),
      kind: "match",
      template: "text-match",
      title: example.title,
      leftLabel: example.leftLabel,
      rightLabel: example.rightLabel,
      leftKind: "text",
      rightKind: "text",
      pairs,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (toAdd.length > 0) writeAll([...all, ...toAdd]);
  return { added: toAdd.length, skipped };
}

/** Seeds the built-in demo sets (French/Italian/Spanish x Year 7/9/11). */
export function loadExampleSets(): { added: number; skipped: number } {
  return loadSetCollection(exampleSets);
}

/** Seeds the A Level Spanish Edexcel Unit 1 vocab sets (1.1, 1.2, 1.3). */
export function loadEdexcelUnit1Sets(): { added: number; skipped: number } {
  return loadSetCollection(edexcelUnit1Sets);
}
