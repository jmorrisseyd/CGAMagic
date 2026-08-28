import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { SideEditor, emptySide } from "../components/SideEditor";
import { makeId } from "../lib/id";
import { getSet, saveSet } from "../storage/sets";
import type { AnySet, MatchSet, Pair, Side } from "../types";

export function Editor() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );
  const [bulk, setBulk] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  if (!setId || !set) return <Navigate to="/" replace />;
  if (set.kind !== "match") return <Navigate to="/" replace />;

  const matchSet = set as MatchSet;
  const bulkable = matchSet.leftKind === "text" && matchSet.rightKind === "text";

  function update(patch: Partial<MatchSet>) {
    setSet((s) => (s ? ({ ...s, ...patch } as AnySet) : s));
  }

  /**
   * Pair edits go through the updater form rather than reading `pairs` off
   * the render closure, so several edits in one tick can't clobber each
   * other (e.g. clicking "Add row" twice quickly).
   */
  function updatePairs(fn: (pairs: Pair[]) => Pair[]) {
    setSet((s) =>
      s && s.kind === "match" ? ({ ...s, pairs: fn(s.pairs) } as AnySet) : s,
    );
  }

  function updatePair(id: string, patch: Partial<Pair>) {
    updatePairs((pairs) =>
      pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    );
  }

  function addRow() {
    updatePairs((pairs) => [
      ...pairs,
      {
        id: makeId(),
        left: emptySide(matchSet.leftKind),
        right: emptySide(matchSet.rightKind),
      },
    ]);
  }

  function removeRow(id: string) {
    updatePairs((pairs) => pairs.filter((p) => p.id !== id));
  }

  function addBulk() {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    const newPairs: Pair[] = lines
      .map((line) => {
        const parts = line.includes("\t")
          ? line.split("\t")
          : line.includes(",")
            ? line.split(",")
            : line.split(/\s+-\s+/);
        if (parts.length < 2) return null;
        return {
          id: makeId(),
          left: { kind: "text", text: parts[0].trim() } as Side,
          right: { kind: "text", text: parts.slice(1).join(" ").trim() } as Side,
        };
      })
      .filter((p): p is Pair => p !== null);
    updatePairs((pairs) => [...pairs, ...newPairs]);
    setBulk("");
  }

  function save() {
    saveSet(matchSet);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function playNow() {
    saveSet(matchSet);
    navigate(`/play/${matchSet.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit set</h1>
        <div className="flex items-center gap-3">
          {savedFlash && <span className="text-green-300 text-sm">Saved ✓</span>}
          <button
            onClick={save}
            className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={playNow}
            className="rounded bg-green-600 hover:bg-green-500 px-3 py-2 text-sm font-medium"
          >
            Save &amp; Play →
          </button>
          <Link
            to="/"
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            ← All sets
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Title</span>
            <input
              value={matchSet.title}
              onChange={(e) => update({ title: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="e.g. French Household Vocabulary"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">
                Left label ({matchSet.leftKind})
              </span>
              <input
                value={matchSet.leftLabel}
                onChange={(e) => update({ leftLabel: e.target.value })}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">
                Right label ({matchSet.rightKind})
              </span>
              <input
                value={matchSet.rightLabel}
                onChange={(e) => update({ rightLabel: e.target.value })}
                className="rounded border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pairs ({matchSet.pairs.length})</h2>
            <button
              onClick={addRow}
              className="rounded bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-sm font-medium"
            >
              + Add row
            </button>
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-medium text-slate-500 px-1">
            <span>{matchSet.leftLabel || "Left"}</span>
            <span>{matchSet.rightLabel || "Right"}</span>
            <span />
          </div>
          <div className="flex flex-col gap-2 max-h-[28rem] overflow-y-auto">
            {matchSet.pairs.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <SideEditor
                  side={p.left}
                  kind={matchSet.leftKind}
                  onChange={(left) => updatePair(p.id, { left })}
                />
                <SideEditor
                  side={p.right}
                  kind={matchSet.rightKind}
                  onChange={(right) => updatePair(p.id, { right })}
                />
                <button
                  onClick={() => removeRow(p.id)}
                  className="text-slate-400 hover:text-red-600 px-2"
                  aria-label="Delete row"
                >
                  ✕
                </button>
              </div>
            ))}
            {matchSet.pairs.length === 0 && (
              <p className="text-slate-400 text-sm py-4 text-center">
                No pairs yet — add a row above{bulkable ? ", or paste a list below" : ""}.
              </p>
            )}
          </div>
        </div>

        {bulkable && (
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Bulk add</h2>
            <p className="text-sm text-slate-500">
              Paste one pair per line, separated by a tab, comma, or " - ". Example:{" "}
              <code className="bg-slate-100 px-1 rounded">le chien - the dog</code>
            </p>
            <textarea
              value={bulk}
              onChange={(e) => setBulk(e.target.value)}
              rows={5}
              className="rounded border border-slate-300 px-3 py-2 font-mono text-sm"
              placeholder={"le chien - the dog\nla maison - the house"}
            />
            <button
              onClick={addBulk}
              disabled={!bulk.trim()}
              className="self-start rounded bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white px-4 py-2 text-sm font-medium"
            >
              Add lines
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
