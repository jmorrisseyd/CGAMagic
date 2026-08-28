import { useMemo, useState } from "react";
import { GameShell } from "../games/GameShell";
import { chunk, jumble, words } from "../lib/mixgap";
import type { MixGapSet } from "../types";

/**
 * Text Mix: every word of the passage jumbled into a pool; clicking a word
 * appends it to the rebuilt text. A wrong word is refused rather than
 * penalised, matching the low-pressure feel of TaskMagic's version.
 */
export function TextMix({ set }: { set: MixGapSet }) {
  const target = useMemo(() => words(set.text), [set.text]);
  const [pool, setPool] = useState<{ word: string; key: number }[]>(() =>
    jumble(target.map((word, i) => ({ word, key: i }))),
  );
  const [built, setBuilt] = useState<string[]>([]);
  const [wrongKey, setWrongKey] = useState<number | null>(null);

  const done = built.length === target.length;

  function take(entry: { word: string; key: number }) {
    if (done) return;
    if (entry.word !== target[built.length]) {
      setWrongKey(entry.key);
      window.setTimeout(() => setWrongKey(null), 500);
      return;
    }
    setBuilt((b) => [...b, entry.word]);
    setPool((p) => p.filter((x) => x.key !== entry.key));
  }

  function undo() {
    if (built.length === 0) return;
    const last = built[built.length - 1];
    setBuilt((b) => b.slice(0, -1));
    setPool((p) => [...p, { word: last, key: Math.random() }]);
  }

  function restart() {
    setPool(jumble(target.map((word, i) => ({ word, key: i }))));
    setBuilt([]);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Text Mix"
      status={
        <div className="text-sm text-slate-200">
          {built.length} / {target.length} words
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow p-4 w-full min-h-24 leading-relaxed">
          {built.join(" ")}
          {!done && <span className="text-slate-300">▌</span>}
        </div>

        {done ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-leaf-700">Text rebuilt! 🎉</div>
            <button
              onClick={restart}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 justify-center">
              {pool.map((entry) => (
                <button
                  key={entry.key}
                  onClick={() => take(entry)}
                  className={`rounded-lg px-3 py-2 font-medium shadow ${
                    wrongKey === entry.key
                      ? "bg-red-100 text-red-700"
                      : "bg-white hover:bg-cga-50"
                  }`}
                >
                  {entry.word}
                </button>
              ))}
            </div>
            <button
              onClick={undo}
              disabled={built.length === 0}
              className="rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 px-4 py-2 text-sm font-medium"
            >
              ← Undo
            </button>
          </>
        )}
      </div>
    </GameShell>
  );
}

/**
 * Next Word (ten options) and 1 in 3 (three chunks) are the same activity
 * at different grain, so they share an engine: pick the correct
 * continuation, and the text accumulates above.
 */
function SequentialBuild({
  set,
  gameName,
  units,
  optionCount,
}: {
  set: MixGapSet;
  gameName: string;
  units: string[];
  optionCount: number;
}) {
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const done = index >= units.length;

  // Distractors are drawn from elsewhere in the passage, so wrong answers
  // are plausible rather than random noise.
  const options = useMemo(() => {
    if (done) return [];
    const correct = units[index];
    const others = units.filter((u, i) => i !== index && u !== correct);
    const picked = jumble(others).slice(0, Math.max(0, optionCount - 1));
    return jumble([correct, ...picked]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, units, optionCount, done]);

  function choose(option: string) {
    if (option !== units[index]) {
      setWrong(option);
      setMistakes((m) => m + 1);
      window.setTimeout(() => setWrong(null), 500);
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName={gameName}
      status={
        <div className="text-sm text-slate-200">
          {index} / {units.length} &middot; {mistakes} wrong
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
        <div className="bg-white rounded-lg shadow p-4 w-full min-h-24 leading-relaxed">
          {units.slice(0, index).join(" ")}
          {!done && <span className="text-slate-300">▌</span>}
        </div>

        {done ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-leaf-700">Finished! 🎉</div>
            <div className="text-slate-600">
              {mistakes === 0 ? "No mistakes." : `${mistakes} wrong along the way.`}
            </div>
            <button
              onClick={() => {
                setIndex(0);
                setMistakes(0);
              }}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 justify-center">
            {options.map((option, i) => (
              <button
                key={`${option}-${i}`}
                onClick={() => choose(option)}
                className={`rounded-lg px-4 py-2.5 font-medium shadow max-w-md text-left ${
                  wrong === option
                    ? "bg-red-100 text-red-700"
                    : "bg-white hover:bg-cga-50"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </GameShell>
  );
}

export function NextWord({ set }: { set: MixGapSet }) {
  const units = useMemo(() => words(set.text), [set.text]);
  return (
    <SequentialBuild
      set={set}
      gameName="Next Word"
      units={units}
      optionCount={10}
    />
  );
}

export function OneInThree({ set }: { set: MixGapSet }) {
  // Chunks of a few words each, so the choice is about sense not spelling.
  const units = useMemo(() => {
    const total = words(set.text).length;
    return chunk(set.text, Math.max(3, Math.ceil(total / 4)));
  }, [set.text]);
  return (
    <SequentialBuild set={set} gameName="1 in 3" units={units} optionCount={3} />
  );
}
