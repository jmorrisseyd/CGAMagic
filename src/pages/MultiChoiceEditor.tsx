import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { makeId } from "../lib/id";
import { getSet, saveSet } from "../storage/sets";
import type { AnySet, MultiChoiceQuestion, MultiChoiceSet } from "../types";
import { confirmDiscard, useUnsavedGuard } from "../lib/useUnsavedGuard";

const MAX_OPTIONS = 6;

export function MultiChoiceEditor() {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const [set, setSet] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [dirty, setDirty] = useState(false);

  useUnsavedGuard(dirty);

  if (!setId || !set) return <Navigate to="/" replace />;
  if (set.kind !== "multichoice") return <Navigate to="/" replace />;

  const mc = set as MultiChoiceSet;

  function updateSet(fn: (s: MultiChoiceSet) => MultiChoiceSet) {
    setDirty(true);
    setSet((s) => (s && s.kind === "multichoice" ? fn(s) : s));
  }

  function updateQuestions(
    fn: (qs: MultiChoiceQuestion[]) => MultiChoiceQuestion[],
  ) {
    updateSet((s) => ({ ...s, questions: fn(s.questions) }));
  }

  function patchQuestion(id: string, patch: Partial<MultiChoiceQuestion>) {
    updateQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
  }

  function addQuestion() {
    updateQuestions((qs) => [
      ...qs,
      { id: makeId(), prompt: "", options: ["", ""], correctIndex: 0 },
    ]);
  }

  function setOption(q: MultiChoiceQuestion, i: number, value: string) {
    const options = [...q.options];
    options[i] = value;
    patchQuestion(q.id, { options });
  }

  function addOption(q: MultiChoiceQuestion) {
    if (q.options.length >= MAX_OPTIONS) return;
    patchQuestion(q.id, { options: [...q.options, ""] });
  }

  function removeOption(q: MultiChoiceQuestion, i: number) {
    if (q.options.length <= 2) return;
    const options = q.options.filter((_, idx) => idx !== i);
    // Keep the correct answer pointing at the same option after a removal.
    let correctIndex = q.correctIndex;
    if (i === q.correctIndex) correctIndex = 0;
    else if (i < q.correctIndex) correctIndex = q.correctIndex - 1;
    patchQuestion(q.id, { options, correctIndex });
  }

  function save() {
    saveSet(mc);
    setDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Edit Multi-Choice set</h1>
        <div className="flex items-center gap-3">
          {savedFlash && <span className="text-green-300 text-sm">Saved ✓</span>}
          <button
            onClick={save}
            className="rounded bg-blue-600 hover:bg-blue-500 px-3 py-2 text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={() => {
              saveSet(mc);
              navigate(`/play/${mc.id}`);
            }}
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

      <main className="max-w-3xl mx-auto p-6 flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-600">Title</span>
            <input
              value={mc.title}
              onChange={(e) => updateSet((s) => ({ ...s, title: e.target.value }))}
              className="rounded border border-slate-300 px-3 py-2"
              placeholder="e.g. Reading comprehension — Tema 1"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Questions ({mc.questions.length})</h2>
          <button
            onClick={addQuestion}
            className="rounded bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-sm font-medium"
          >
            + Add question
          </button>
        </div>

        {mc.questions.length === 0 && (
          <p className="text-slate-400 text-sm py-8 text-center bg-white rounded-xl shadow">
            No questions yet — add one above.
          </p>
        )}

        {mc.questions.map((q, qi) => (
          <div key={q.id} className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-slate-400 pt-2">
                {qi + 1}.
              </span>
              <input
                value={q.prompt}
                onChange={(e) => patchQuestion(q.id, { prompt: e.target.value })}
                className="flex-1 rounded border border-slate-300 px-3 py-2 font-medium"
                placeholder="Question"
              />
              <button
                onClick={() =>
                  updateQuestions((qs) => qs.filter((x) => x.id !== q.id))
                }
                className="text-slate-400 hover:text-red-600 px-2 pt-2"
                aria-label="Delete question"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 pl-7">
              Select the radio button next to the correct answer.
            </p>

            <div className="flex flex-col gap-2 pl-7">
              {q.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${q.id}`}
                    checked={q.correctIndex === i}
                    onChange={() => patchQuestion(q.id, { correctIndex: i })}
                    aria-label={`Mark option ${i + 1} correct`}
                  />
                  <input
                    value={opt}
                    onChange={(e) => setOption(q, i, e.target.value)}
                    className={`flex-1 rounded border px-3 py-2 ${
                      q.correctIndex === i
                        ? "border-green-400 bg-green-50"
                        : "border-slate-300"
                    }`}
                    placeholder={`Option ${i + 1}`}
                  />
                  <button
                    onClick={() => removeOption(q, i)}
                    disabled={q.options.length <= 2}
                    className="text-slate-300 hover:text-red-600 disabled:opacity-30 px-1"
                    aria-label="Remove option"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => addOption(q)}
                disabled={q.options.length >= MAX_OPTIONS}
                className="self-start text-sm rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-3 py-1.5 font-medium"
              >
                + Option
              </button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
