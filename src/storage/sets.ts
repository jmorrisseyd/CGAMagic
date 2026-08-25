import { makeId } from "../lib/id";
import type { TextMatchSet } from "../types";

const STORAGE_KEY = "cgamagic:textmatch:sets";

function readAll(): TextMatchSet[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TextMatchSet[];
  } catch {
    return [];
  }
}

function writeAll(sets: TextMatchSet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function listSets(): TextMatchSet[] {
  return readAll().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getSet(id: string): TextMatchSet | undefined {
  return readAll().find((s) => s.id === id);
}

export function createSet(
  title: string,
  leftLabel: string,
  rightLabel: string,
): TextMatchSet {
  const now = Date.now();
  const set: TextMatchSet = {
    id: makeId(),
    title,
    leftLabel,
    rightLabel,
    pairs: [],
    createdAt: now,
    updatedAt: now,
  };
  writeAll([...readAll(), set]);
  return set;
}

export function saveSet(set: TextMatchSet): void {
  const all = readAll();
  const idx = all.findIndex((s) => s.id === set.id);
  const updated = { ...set, updatedAt: Date.now() };
  if (idx === -1) {
    all.push(updated);
  } else {
    all[idx] = updated;
  }
  writeAll(all);
}

export function deleteSet(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function exportSet(set: TextMatchSet): string {
  return JSON.stringify(set, null, 2);
}

export function importSet(json: string): TextMatchSet {
  const parsed = JSON.parse(json) as TextMatchSet;
  if (!parsed.pairs || !Array.isArray(parsed.pairs)) {
    throw new Error("Not a valid CGAMagic Text Match file");
  }
  const now = Date.now();
  const set: TextMatchSet = {
    ...parsed,
    id: makeId(),
    createdAt: now,
    updatedAt: now,
  };
  writeAll([...readAll(), set]);
  return set;
}
