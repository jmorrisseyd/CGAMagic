import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { getSet, saveSet } from "../storage/sets";
import { makeId } from "../lib/id";
import type { Pair, TextMatchSet } from "../types";

export function Editor() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<TextMatchSet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );
  const [bulk, setBulk] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  if (!setId || !set) return <Navigate to="/" replace />;

  function update(patch: Partial<TextMatchSet>) {
    setSet((s) => (s ? { ...s, ...patch } : s));
  }

  function updatePair(id: string, patch: Partial<Pair>) {
    update({ pairs: set!.pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }

  function addRow() {
    update({ pairs: [...set!.pairs, { id: makeId(), left: "", right: "" }] });
  }

  function removeRow(id: string) {
    update({ pairs: set!.pairs.filter((p) => p.id !== id) });
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
        return { id: makeId(), left: parts[0].trim(), right: parts.slice(1).join(" ").trim() };
      })
      .filter((p): p is Pair => p !== null);
    update({ pairs: [...set!.pairs, ...newPairs] });
    setBulk("");
  }

  function save() {
    saveSet(set!);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function playNow() {
    saveSet(set!);
    navigate(`/play/${set!.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Text Match set</h1>
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

      <main className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Title</span>
            <input
              value={set.title}
              onChange={(e) => update({ title: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="e.g. French Household Vocabulary"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">Left column label</span>
              <input
                value={set.leftLabel}
                onChange={(e) => update({ leftLabel: e.target.value })}
                className="rounded border border-slate-300 px-3 py-2"
                placeholder="e.g. French"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">Right column label</span>
              <input
                value={set.rightLabel}
                onChange={(e) => update({ rightLabel: e.target.value })}
                className="rounded border border-slate-300 px-3 py-2"
                placeholder="e.g. English"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Pairs ({set.pairs.length})</h2>
            <button
              onClick={addRow}
              className="rounded bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-sm font-medium"
            >
              + Add row
            </button>
          </div>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 text-sm font-medium text-slate-500 px-1">
            <span>{set.leftLabel || "Left"}</span>
            <span>{set.rightLabel || "Right"}</span>
            <span />
          </div>
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
            {set.pairs.map((p) => (
              <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={p.left}
                  onChange={(e) => updatePair(p.id, { left: e.target.value })}
                  className="rounded border border-slate-300 px-3 py-2"
                />
                <input
                  value={p.right}
                  onChange={(e) => updatePair(p.id, { right: e.target.value })}
                  className="rounded border border-slate-300 px-3 py-2"
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
            {set.pairs.length === 0 && (
              <p className="text-slate-400 text-sm py-4 text-center">
                No pairs yet — add a row above, or paste a list below.
              </p>
            )}
          </div>
        </div>

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
      </main>
    </div>
  );
}
