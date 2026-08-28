import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { toPlayable } from "../lib/compile";
import { sample } from "../lib/shuffle";
import { getSet } from "../storage/sets";
import { isTextSide, type AnySet, type Pair } from "../types";
import { WORKSHEETS, type WorksheetId } from "../worksheets/registry";
import {
  AnagramsSheet,
  DominoesSheet,
  MatchingSheet,
  MissingLettersSheet,
  MultiMatchSheet,
  PelmanismCardsSheet,
  TestSheet,
  VocabListSheet,
  WordsearchSheet,
  type SheetProps,
} from "../worksheets/sheets";

const SHEETS: Record<WorksheetId, (props: SheetProps) => React.ReactElement> = {
  matching: MatchingSheet,
  "multi-match": MultiMatchSheet,
  "missing-letters": MissingLettersSheet,
  anagrams: AnagramsSheet,
  wordsearch: WordsearchSheet,
  dominoes: DominoesSheet,
  "pelmanism-cards": PelmanismCardsSheet,
  "vocab-list": VocabListSheet,
  "test-sheet": TestSheet,
};

export function Worksheets() {
  const { setId } = useParams<{ setId: string }>();
  const [set] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );
  const [selected, setSelected] = useState<WorksheetId>("matching");
  const [limit, setLimit] = useState(20);
  const [showAnswers, setShowAnswers] = useState(false);
  const [swapped, setSwapped] = useState(false);
  /** Bumped to re-roll the random parts (shuffles, grids) on demand. */
  const [seed, setSeed] = useState(0);

  // Everything below runs before any early return so hook order stays fixed.
  const playable = set ? toPlayable(set) : null;
  const allPairs = playable?.pairs ?? [];

  // Swapping direction turns "French → English" sheets into "English → French".
  const directed: Pair[] = swapped
    ? allPairs.map((p) => ({ ...p, left: p.right, right: p.left }))
    : allPairs;

  // Re-sampled only when an input actually changes, so ticking "answer key"
  // shows the same questions rather than reshuffling under the teacher.
  const pairs = useMemo(
    () => sample(directed, Math.min(limit, directed.length)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [limit, swapped, seed, set?.id, allPairs.length],
  );

  if (!setId || !set) return <Navigate to="/" replace />;
  if (!playable) return <Navigate to={`/edit/${setId}`} replace />;

  const hasAudio = allPairs.some(
    (p) => p.left.kind === "audio" || p.right.kind === "audio",
  );
  const leftLabel = swapped ? playable.rightLabel : playable.leftLabel;
  const rightLabel = swapped ? playable.leftLabel : playable.rightLabel;
  const answerIsText = directed.every((p) => isTextSide(p.right));

  const info = WORKSHEETS.find((w) => w.id === selected)!;
  const Sheet = SHEETS[selected];

  const tooFewPairs = allPairs.length < info.minPairs;
  const needsText = info.needsTextAnswer && !answerIsText;
  const needsPrintable = info.needsPrintableStimulus && hasAudio;
  const blocked = tooFewPairs || needsText || needsPrintable;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between no-print">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-300">
            Worksheets
          </div>
          <h1 className="text-xl font-bold truncate">{set.title}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to={`/play/${setId}`}
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            ← Games
          </Link>
          <Link
            to="/"
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            All sets
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-5">
        <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-4 no-print">
          <div className="grid sm:grid-cols-3 gap-2">
            {WORKSHEETS.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelected(w.id)}
                className={`text-left rounded-lg border-2 p-3 ${
                  selected === w.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="font-semibold text-sm">{w.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{w.description}</div>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t pt-4">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Items</span>
              <input
                type="number"
                min={1}
                max={allPairs.length}
                value={limit}
                onChange={(e) => setLimit(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded border border-slate-300 px-2 py-1"
              />
              <span className="text-slate-400">of {allPairs.length}</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={swapped}
                onChange={(e) => setSwapped(e.target.checked)}
              />
              Swap direction ({leftLabel} → {rightLabel})
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showAnswers}
                onChange={(e) => setShowAnswers(e.target.checked)}
              />
              Answer key
            </label>

            <button
              onClick={() => setSeed((s) => s + 1)}
              className="rounded bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-sm font-medium"
            >
              Shuffle again
            </button>

            <button
              onClick={() => window.print()}
              disabled={blocked}
              className="ml-auto rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-semibold px-5 py-2"
            >
              Print
            </button>
          </div>

          {blocked && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded px-3 py-2">
              {tooFewPairs
                ? `This sheet needs at least ${info.minPairs} pairs — this set has ${allPairs.length}.`
                : needsText
                  ? "This sheet needs a written answer. Try swapping the direction, or pick a sheet that doesn't ask students to write the answer."
                  : "This set uses sound, which can't be printed. Try a sheet that works from the written side."}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-8 print-area">
          <div className="flex items-baseline justify-between mb-1 gap-4">
            <h2 className="text-xl font-bold">{set.title}</h2>
            <span className="text-sm text-slate-500 print-ink">
              Name: ________________________
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-6 print-ink">
            {info.name}
            {showAnswers && " — ANSWER KEY"}
          </p>

          {blocked ? (
            <p className="text-slate-400 text-center py-12 no-print">
              Pick a different sheet or adjust the options above.
            </p>
          ) : (
            <Sheet
              pairs={pairs}
              leftLabel={leftLabel}
              rightLabel={rightLabel}
              showAnswers={showAnswers}
            />
          )}
        </div>
      </div>
    </div>
  );
}
