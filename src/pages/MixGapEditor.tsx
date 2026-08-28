import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { makeId } from "../lib/id";
import { tokenise, wordCount } from "../lib/mixgap";
import { confirmDiscard, useUnsavedGuard } from "../lib/useUnsavedGuard";
import { getSet, saveSet } from "../storage/sets";
import type { AnySet, MixGapSet } from "../types";

/** TaskMagic caps a Mix & Gap passage at 500 words. */
const MAX_WORDS = 500;

export function MixGapEditor() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState<"text" | "gaps" | "findIt" | "questions">("text");

  useUnsavedGuard(dirty);

  const mg = set && set.kind === "mixgap" ? (set as MixGapSet) : undefined;
  const tokens = useMemo(() => tokenise(mg?.text ?? ""), [mg?.text]);
  const gapped = useMemo(
    () => new Set((mg?.gaps ?? []).map((g) => g.wordIndex)),
    [mg?.gaps],
  );

  if (!setId || !set) return <Navigate to="/" replace />;
  if (!mg) return <Navigate to="/" replace />;

  function update(patch: Partial<MixGapSet>) {
    setDirty(true);
    setSet((s) => (s && s.kind === "mixgap" ? ({ ...s, ...patch } as AnySet) : s));
  }

  function toggleGap(wordIndex: number) {
    const has = gapped.has(wordIndex);
    update({
      gaps: has
        ? mg!.gaps.filter((g) => g.wordIndex !== wordIndex)
        : [...mg!.gaps, { wordIndex }],
    });
  }

  /** Turns the teacher's current text selection into a Find it! prompt. */
  function addFindItFromSelection() {
    const selection = window.getSelection();
    const text = selection?.toString() ?? "";
    if (!text.trim()) {
      alert("Highlight a word or phrase in the passage first.");
      return;
    }
    const start = mg!.text.indexOf(text);
    if (start === -1) {
      alert("Couldn't locate that selection in the passage — try again.");
      return;
    }
    update({
      findIt: [
        ...mg!.findIt,
        { id: makeId(), prompt: "", start, end: start + text.length },
      ],
    });
    selection?.removeAllRanges();
    setTab("findIt");
  }

  function save() {
    saveSet(mg!);
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  const count = wordCount(mg.text);
  const overLimit = count > MAX_WORDS;

  const TABS = [
    ["text", "Passage"],
    ["gaps", `Gaps (${mg.gaps.length})`],
    ["findIt", `Find it! (${mg.findIt.length})`],
    ["questions", `Questions (${mg.comprehension.length})`],
  ] as const;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-cga-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Mix &amp; Gap set</h1>
        <div className="flex items-center gap-3">
          {savedFlash && <span className="text-leaf-300 text-sm">Saved ✓</span>}
          <button
            onClick={save}
            className="rounded bg-cga-600 hover:bg-cga-700 px-3 py-2 text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={() => {
              saveSet(mg);
              setDirty(false);
              navigate(`/play/${mg.id}`);
            }}
            className="rounded bg-cga-600 hover:bg-cga-700 px-3 py-2 text-sm font-medium"
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

      <main className="max-w-4xl mx-auto p-6 flex flex-col gap-5">
        <div className="bg-white rounded-xl shadow p-5">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Title</span>
            <input
              value={mg.title}
              onChange={(e) => update({ title: e.target.value })}
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="e.g. Ma routine quotidienne"
            />
          </label>
        </div>

        <div className="flex gap-2">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                tab === id ? "bg-cga-600 text-white" : "bg-white hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "text" && (
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Passage</h2>
              <span className={`text-sm ${overLimit ? "text-red-600" : "text-slate-400"}`}>
                {count} / {MAX_WORDS} words
              </span>
            </div>
            <textarea
              value={mg.text}
              onChange={(e) => update({ text: e.target.value })}
              rows={12}
              className="rounded border border-slate-300 px-3 py-2 leading-relaxed"
              placeholder={
                "Paste or type the text here — a paragraph, a letter, an email, a poem, a song, a recipe…"
              }
            />
            {overLimit && (
              <p className="text-sm text-red-600">
                That's longer than TaskMagic allowed. It'll still work, but the tile
                puzzles get unwieldy above about 500 words.
              </p>
            )}
          </div>
        )}

        {tab === "gaps" && (
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
            <h2 className="font-semibold">Choose the words to gap</h2>
            <p className="text-sm text-slate-500">
              Click any word to gap it. These same gaps drive Gap-fill, Multi Gaps
              and Write Gaps.
            </p>
            <div className="text-lg leading-loose">
              {tokens.map((t, i) =>
                t.isWord ? (
                  <button
                    key={i}
                    onClick={() => toggleGap(t.wordIndex)}
                    className={`rounded px-1 ${
                      gapped.has(t.wordIndex)
                        ? "bg-cga-600 text-white font-medium"
                        : "hover:bg-cga-100"
                    }`}
                  >
                    {t.text}
                  </button>
                ) : (
                  <span key={i}>{t.text}</span>
                ),
              )}
            </div>
            {mg.gaps.length > 0 && (
              <button
                onClick={() => update({ gaps: [] })}
                className="self-start text-sm text-slate-500 underline"
              >
                Clear all gaps
              </button>
            )}
          </div>
        )}

        {tab === "findIt" && (
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
            <h2 className="font-semibold">Find it! prompts</h2>
            <p className="text-sm text-slate-500">
              Highlight a word or phrase in the passage below, click "Use selection",
              then write the prompt students will read.
            </p>
            <p className="bg-slate-50 rounded p-4 leading-loose select-text">
              {mg.text || <span className="text-slate-400">Add a passage first.</span>}
            </p>
            <button
              onClick={addFindItFromSelection}
              className="self-start rounded bg-cga-600 hover:bg-cga-700 text-white px-4 py-2 text-sm font-medium"
            >
              Use selection
            </button>
            <div className="flex flex-col gap-2">
              {mg.findIt.map((f) => (
                <div key={f.id} className="flex items-center gap-2">
                  <span className="text-sm bg-cga-50 border border-cga-200 rounded px-2 py-1 max-w-56 truncate">
                    "{mg.text.slice(f.start, f.end)}"
                  </span>
                  <input
                    value={f.prompt}
                    onChange={(e) =>
                      update({
                        findIt: mg.findIt.map((x) =>
                          x.id === f.id ? { ...x, prompt: e.target.value } : x,
                        ),
                      })
                    }
                    className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
                    placeholder="Prompt, e.g. 'says what time he gets up'"
                  />
                  <button
                    onClick={() =>
                      update({ findIt: mg.findIt.filter((x) => x.id !== f.id) })
                    }
                    className="text-slate-400 hover:text-red-600 px-2"
                    aria-label="Delete prompt"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "questions" && (
          <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Comprehension questions</h2>
              <button
                onClick={() =>
                  update({
                    comprehension: [
                      ...mg.comprehension,
                      { id: makeId(), prompt: "", options: ["", ""], correctIndex: 0 },
                    ],
                  })
                }
                className="rounded bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-sm font-medium"
              >
                + Add question
              </button>
            </div>
            {mg.comprehension.map((q, qi) => (
              <div key={q.id} className="border border-slate-200 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={q.prompt}
                    onChange={(e) =>
                      update({
                        comprehension: mg.comprehension.map((x) =>
                          x.id === q.id ? { ...x, prompt: e.target.value } : x,
                        ),
                      })
                    }
                    className="flex-1 rounded border border-slate-300 px-3 py-2 font-medium"
                    placeholder={`Question ${qi + 1}`}
                  />
                  <button
                    onClick={() =>
                      update({
                        comprehension: mg.comprehension.filter((x) => x.id !== q.id),
                      })
                    }
                    className="text-slate-400 hover:text-red-600 px-2"
                    aria-label="Delete question"
                  >
                    ✕
                  </button>
                </div>
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctIndex === oi}
                      onChange={() =>
                        update({
                          comprehension: mg.comprehension.map((x) =>
                            x.id === q.id ? { ...x, correctIndex: oi } : x,
                          ),
                        })
                      }
                    />
                    <input
                      value={opt}
                      onChange={(e) =>
                        update({
                          comprehension: mg.comprehension.map((x) =>
                            x.id === q.id
                              ? {
                                  ...x,
                                  options: x.options.map((o, i) =>
                                    i === oi ? e.target.value : o,
                                  ),
                                }
                              : x,
                          ),
                        })
                      }
                      className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder={`Option ${oi + 1}`}
                    />
                    {q.options.length > 2 && (
                      <button
                        onClick={() =>
                          update({
                            comprehension: mg.comprehension.map((x) =>
                              x.id === q.id
                                ? {
                                    ...x,
                                    options: x.options.filter((_, i) => i !== oi),
                                    correctIndex:
                                      oi === x.correctIndex
                                        ? 0
                                        : oi < x.correctIndex
                                          ? x.correctIndex - 1
                                          : x.correctIndex,
                                  }
                                : x,
                            ),
                          })
                        }
                        className="text-slate-300 hover:text-red-600 text-xs px-1"
                        aria-label="Remove option"
                      >
                        ✕
                      </button>
                    )}
                  </label>
                ))}
                {q.options.length < 4 && (
                  <button
                    onClick={() =>
                      update({
                        comprehension: mg.comprehension.map((x) =>
                          x.id === q.id ? { ...x, options: [...x.options, ""] } : x,
                        ),
                      })
                    }
                    className="self-start text-sm text-slate-500 underline"
                  >
                    + Add option
                  </button>
                )}
              </div>
            ))}
            {mg.comprehension.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">
                No questions yet — the Comprehension activity needs at least one.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
