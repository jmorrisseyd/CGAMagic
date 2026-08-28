import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { compileGrid, gridPrompt } from "../lib/compile";
import { getSet, saveSet } from "../storage/sets";
import type { AnySet, GridSet } from "../types";
import { confirmDiscard, useUnsavedGuard } from "../lib/useUnsavedGuard";

const MIN_ROWS = 1;
const MAX_ROWS = 12;
const MIN_COLS = 1;
const MAX_COLS = 8;

/**
 * Authoring for Grid Match: row and column headers combine to prompt for
 * each cell (the classic use is a verb across the top and pronouns down
 * the side). A blank cell just means "don't ask this combination".
 */
export function GridEditor() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [dirty, setDirty] = useState(false);

  useUnsavedGuard(dirty);

  if (!setId || !set) return <Navigate to="/" replace />;
  if (set.kind !== "grid") return <Navigate to="/" replace />;

  const grid = set as GridSet;
  const pairCount = compileGrid(grid).length;

  function updateGrid(fn: (g: GridSet) => GridSet) {
    setDirty(true);
    setSet((s) => (s && s.kind === "grid" ? fn(s) : s));
  }

  function setCell(r: number, c: number, value: string) {
    updateGrid((g) => {
      const cells = g.cells.map((row) => [...row]);
      cells[r][c] = value;
      return { ...g, cells };
    });
  }

  function setRowHeader(r: number, value: string) {
    updateGrid((g) => {
      const rowHeaders = [...g.rowHeaders];
      rowHeaders[r] = value;
      return { ...g, rowHeaders };
    });
  }

  function setColHeader(c: number, value: string) {
    updateGrid((g) => {
      const colHeaders = [...g.colHeaders];
      colHeaders[c] = value;
      return { ...g, colHeaders };
    });
  }

  function addRow() {
    updateGrid((g) =>
      g.rowHeaders.length >= MAX_ROWS
        ? g
        : {
            ...g,
            rowHeaders: [...g.rowHeaders, ""],
            cells: [...g.cells, Array(g.colHeaders.length).fill("")],
          },
    );
  }

  function removeRow(r: number) {
    updateGrid((g) =>
      g.rowHeaders.length <= MIN_ROWS
        ? g
        : {
            ...g,
            rowHeaders: g.rowHeaders.filter((_, i) => i !== r),
            cells: g.cells.filter((_, i) => i !== r),
          },
    );
  }

  function addCol() {
    updateGrid((g) =>
      g.colHeaders.length >= MAX_COLS
        ? g
        : {
            ...g,
            colHeaders: [...g.colHeaders, ""],
            cells: g.cells.map((row) => [...row, ""]),
          },
    );
  }

  function removeCol(c: number) {
    updateGrid((g) =>
      g.colHeaders.length <= MIN_COLS
        ? g
        : {
            ...g,
            colHeaders: g.colHeaders.filter((_, i) => i !== c),
            cells: g.cells.map((row) => row.filter((_, i) => i !== c)),
          },
    );
  }

  function save() {
    saveSet(grid);
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  function playNow() {
    saveSet(grid);
    navigate(`/play/${grid.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Grid Match set</h1>
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
            onClick={(e) => {
              if (!confirmDiscard(dirty)) e.preventDefault();
            }}
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            ← All sets
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Title</span>
            <input
              value={grid.title}
              onChange={(e) =>
                updateGrid((g) => ({ ...g, title: e.target.value }))
              }
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="e.g. Present tense — être, avoir, aller"
            />
          </label>
        </div>

        <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4 overflow-x-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Grid</h2>
              <p className="text-sm text-slate-500">
                Leave a cell blank to skip that combination. {pairCount} question
                {pairCount === 1 ? "" : "s"} from this grid.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={addRow}
                disabled={grid.rowHeaders.length >= MAX_ROWS}
                className="rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-3 py-1.5 text-sm font-medium"
              >
                + Row
              </button>
              <button
                onClick={addCol}
                disabled={grid.colHeaders.length >= MAX_COLS}
                className="rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-3 py-1.5 text-sm font-medium"
              >
                + Column
              </button>
            </div>
          </div>

          <table className="border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-40" />
                {grid.colHeaders.map((h, c) => (
                  <th key={c} className="min-w-36">
                    <div className="flex items-center gap-1">
                      <input
                        value={h}
                        onChange={(e) => setColHeader(c, e.target.value)}
                        className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1.5 font-semibold text-sm"
                        placeholder="e.g. être"
                      />
                      <button
                        onClick={() => removeCol(c)}
                        disabled={grid.colHeaders.length <= MIN_COLS}
                        className="text-slate-300 hover:text-red-600 disabled:opacity-30 text-xs px-1"
                        aria-label={`Delete column ${c + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.rowHeaders.map((rh, r) => (
                <tr key={r}>
                  <th>
                    <div className="flex items-center gap-1">
                      <input
                        value={rh}
                        onChange={(e) => setRowHeader(r, e.target.value)}
                        className="w-full rounded border border-slate-300 bg-slate-50 px-2 py-1.5 font-semibold text-sm"
                        placeholder="e.g. je"
                      />
                      <button
                        onClick={() => removeRow(r)}
                        disabled={grid.rowHeaders.length <= MIN_ROWS}
                        className="text-slate-300 hover:text-red-600 disabled:opacity-30 text-xs px-1"
                        aria-label={`Delete row ${r + 1}`}
                      >
                        ✕
                      </button>
                    </div>
                  </th>
                  {grid.colHeaders.map((_, c) => (
                    <td key={c}>
                      <input
                        value={grid.cells[r]?.[c] ?? ""}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                        placeholder={
                          rh || grid.colHeaders[c]
                            ? gridPrompt(rh, grid.colHeaders[c])
                            : ""
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
