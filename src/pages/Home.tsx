import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createSet,
  deleteSet,
  exportSet,
  importSet,
  listSets,
} from "../storage/sets";
import type { TextMatchSet } from "../types";

export function Home() {
  const navigate = useNavigate();
  const [sets, setSets] = useState<TextMatchSet[]>(() => listSets());
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [leftLabel, setLeftLabel] = useState("French");
  const [rightLabel, setRightLabel] = useState("English");
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  function refresh() {
    setSets(listSets());
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const set = createSet(title || "Untitled set", leftLabel, rightLabel);
    navigate(`/edit/${set.id}`);
  }

  function handleDelete(id: string, title: string) {
    if (confirm(`Delete "${title}"? This can't be undone.`)) {
      deleteSet(id);
      refresh();
    }
  }

  function handleExport(set: TextMatchSet) {
    const blob = new Blob([exportSet(set)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${set.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "textmatch"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      importSet(text);
      refresh();
      setError(null);
    } catch {
      setError("That file doesn't look like a valid CGAMagic Text Match export.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-800 text-white px-6 py-5">
        <h1 className="text-2xl font-bold">CGAMagic</h1>
        <p className="text-slate-300 text-sm">Text Match — MFL classroom activities</p>
      </header>

      <main className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5"
          >
            + New Text Match set
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded-lg bg-white hover:bg-slate-50 border border-slate-300 font-medium px-5 py-2.5"
          >
            Import from file
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-xl shadow p-5 flex flex-col gap-4"
          >
            <h2 className="font-semibold text-lg">New Text Match set</h2>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-600">Title</span>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded border border-slate-300 px-3 py-2"
                placeholder="e.g. French Household Vocabulary"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-600">Left label</span>
                <input
                  value={leftLabel}
                  onChange={(e) => setLeftLabel(e.target.value)}
                  className="rounded border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-600">Right label</span>
                <input
                  value={rightLabel}
                  onChange={(e) => setRightLabel(e.target.value)}
                  className="rounded border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2"
              >
                Create &amp; edit pairs →
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 px-5 py-2 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {sets.length === 0 && !showCreate && (
            <p className="text-slate-400 text-center py-12">
              No sets yet — create your first Text Match set to get started.
            </p>
          )}
          {sets.map((set) => (
            <div
              key={set.id}
              className="bg-white rounded-xl shadow p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{set.title}</h3>
                <p className="text-sm text-slate-500">
                  {set.pairs.length} pair{set.pairs.length === 1 ? "" : "s"} &middot;{" "}
                  {set.leftLabel} ↔ {set.rightLabel}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => navigate(`/play/${set.id}`)}
                  className="rounded bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-3 py-2"
                >
                  Play
                </button>
                <button
                  onClick={() => navigate(`/edit/${set.id}`)}
                  className="rounded bg-slate-100 hover:bg-slate-200 text-sm font-medium px-3 py-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleExport(set)}
                  className="rounded bg-slate-100 hover:bg-slate-200 text-sm font-medium px-3 py-2"
                >
                  Export
                </button>
                <button
                  onClick={() => handleDelete(set.id, set.title)}
                  className="rounded bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-3 py-2"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
