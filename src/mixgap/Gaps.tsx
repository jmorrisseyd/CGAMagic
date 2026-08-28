import { useMemo, useState } from "react";
import { GameShell } from "../games/GameShell";
import { jumble, normaliseAnswer, tokenise } from "../lib/mixgap";
import type { MixGapSet } from "../types";

type GapMode = "gap-fill" | "multi-gaps" | "write-gaps";

const MODE_META: Record<GapMode, { name: string; blurb: string; tries: number }> = {
  "gap-fill": {
    name: "Gap-fill",
    blurb: "Type each missing word — the word list below shows what's been removed.",
    tries: Infinity,
  },
  "multi-gaps": {
    name: "Multi Gaps",
    blurb: "Choose the right word for each gap.",
    tries: Infinity,
  },
  "write-gaps": {
    // TaskMagic gives three attempts per gap and no word list here.
    name: "Write Gaps",
    blurb: "No word list — work it out from the text around it. Three tries per gap.",
    tries: 3,
  },
};

/**
 * The three gap activities share one engine: same gaps chosen by the
 * teacher, differing in how much help the student gets. Gap-fill shows the
 * removed words as a list, Multi Gaps turns each into a multiple choice,
 * and Write Gaps gives neither and caps attempts at three.
 */
export function Gaps({ set, mode }: { set: MixGapSet; mode: GapMode }) {
  const meta = MODE_META[mode];
  const tokens = useMemo(() => tokenise(set.text), [set.text]);
  const gapByWordIndex = useMemo(
    () => new Map(set.gaps.map((g) => [g.wordIndex, g])),
    [set.gaps],
  );

  const gapWords = useMemo(() => {
    const byIndex = new Map<number, string>();
    for (const t of tokens) {
      if (t.isWord && gapByWordIndex.has(t.wordIndex)) {
        byIndex.set(t.wordIndex, t.text);
      }
    }
    return byIndex;
  }, [tokens, gapByWordIndex]);

  const order = useMemo(
    () => [...gapWords.keys()].sort((a, b) => a - b),
    [gapWords],
  );

  const [filled, setFilled] = useState<Record<number, string>>({});
  const [attempts, setAttempts] = useState<Record<number, number>>({});
  const [active, setActive] = useState<number | null>(order[0] ?? null);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);

  // Word list for Gap-fill, jumbled so its order isn't a hint.
  const wordList = useMemo(
    () => jumble(order.map((i) => gapWords.get(i)!)),
    [order, gapWords],
  );

  const options = useMemo(() => {
    if (mode !== "multi-gaps" || active === null) return [];
    const correct = gapWords.get(active)!;
    const supplied = gapByWordIndex.get(active)?.distractors ?? [];
    // Fall back to other gapped words when the teacher hasn't written
    // distractors, so the activity still works out of the box.
    const pool = supplied.length
      ? supplied
      : order.filter((i) => i !== active).map((i) => gapWords.get(i)!);
    return jumble([correct, ...jumble(pool).slice(0, 3)]);
  }, [mode, active, gapWords, gapByWordIndex, order]);

  const remaining = order.filter((i) => filled[i] === undefined);
  const done = remaining.length === 0;

  function answer(text: string) {
    if (active === null) return;
    const correct = gapWords.get(active)!;
    if (normaliseAnswer(text) === normaliseAnswer(correct)) {
      setFilled((f) => ({ ...f, [active]: correct }));
      setValue("");
      setWrong(false);
      const next = order.find((i) => i !== active && filled[i] === undefined);
      setActive(next ?? null);
      return;
    }
    const used = (attempts[active] ?? 0) + 1;
    setAttempts((a) => ({ ...a, [active]: used }));
    setWrong(true);
    if (used >= meta.tries) {
      // Out of tries: reveal it and move on, as TaskMagic does.
      setFilled((f) => ({ ...f, [active]: correct }));
      setValue("");
      setWrong(false);
      const next = order.find((i) => i !== active && filled[i] === undefined);
      setActive(next ?? null);
    }
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName={meta.name}
      status={
        <div className="text-sm text-slate-200">
          {order.length - remaining.length} / {order.length} gaps
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
        <p className="text-sm text-slate-500">{meta.blurb}</p>

        <div className="bg-white rounded-lg shadow p-5 w-full text-lg leading-loose">
          {tokens.map((t, i) => {
            if (!t.isWord || !gapByWordIndex.has(t.wordIndex)) {
              return <span key={i}>{t.text}</span>;
            }
            const answered = filled[t.wordIndex];
            const isActive = active === t.wordIndex;
            return (
              <button
                key={i}
                onClick={() => !answered && setActive(t.wordIndex)}
                disabled={!!answered}
                className={`inline-block min-w-20 mx-0.5 px-2 rounded border-b-2 font-medium ${
                  answered
                    ? "border-leaf-400 bg-leaf-50 text-leaf-700"
                    : isActive
                      ? "border-cga-600 bg-cga-50"
                      : "border-slate-400 bg-slate-50 hover:bg-cga-50"
                }`}
              >
                {answered ?? " ".repeat(Math.max(4, t.text.length))}
              </button>
            );
          })}
        </div>

        {done ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-leaf-700">All gaps filled! 🎉</div>
            <button
              onClick={() => {
                setFilled({});
                setAttempts({});
                setActive(order[0] ?? null);
              }}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : mode === "multi-gaps" ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {options.map((option, i) => (
              <button
                key={`${option}-${i}`}
                onClick={() => answer(option)}
                className="rounded-lg bg-white hover:bg-cga-50 shadow px-4 py-2.5 font-medium"
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              answer(value);
            }}
            className="flex flex-col items-center gap-3 w-80"
          >
            <input
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setWrong(false);
              }}
              className={`w-full rounded-lg border-2 px-4 py-3 text-lg text-center outline-none ${
                wrong ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-cga-400"
              }`}
              placeholder="Type the missing word…"
            />
            {meta.tries !== Infinity && active !== null && (
              <div className="text-xs text-slate-500">
                {meta.tries - (attempts[active] ?? 0)} tries left on this gap
              </div>
            )}
            <button
              type="submit"
              className="rounded bg-cga-600 hover:bg-cga-700 text-white px-5 py-2 font-semibold"
            >
              Check
            </button>
          </form>
        )}

        {mode === "gap-fill" && !done && (
          <div className="flex flex-wrap gap-2 justify-center border-t border-slate-200 pt-4 w-full">
            {wordList.map((w, i) => {
              const used = Object.values(filled).includes(w);
              return (
                <button
                  key={`${w}-${i}`}
                  onClick={() => answer(w)}
                  disabled={used}
                  className={`rounded px-3 py-1.5 text-sm font-medium ${
                    used
                      ? "bg-slate-100 text-slate-300 line-through"
                      : "bg-amber-100 hover:bg-amber-200"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </GameShell>
  );
}
