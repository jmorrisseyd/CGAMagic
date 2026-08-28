import { useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { buildChoices, type Choice } from "../lib/quiz";
import { shuffle } from "../lib/shuffle";
import type { Pair } from "../types";
import { GameShell } from "./GameShell";

/**
 * The easiest activity in the bank: one-in-three, no clock, no lives.
 * Wrong answers grey out and you try again, so nobody gets stuck.
 */
export function MultiMatch({ set }: { set: PlayableSet }) {
  const [items] = useState<Pair[]>(() => shuffle(set.pairs));
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>(() =>
    buildChoices(set.pairs, items[0], 3),
  );
  const [ruledOut, setRuledOut] = useState<Set<number>>(new Set());
  const [firstTime, setFirstTime] = useState(0);
  const [usedRetry, setUsedRetry] = useState(false);
  const [done, setDone] = useState(false);

  const current = items[index];

  function restart() {
    setIndex(0);
    setChoices(buildChoices(set.pairs, items[0], 3));
    setRuledOut(new Set());
    setFirstTime(0);
    setUsedRetry(false);
    setDone(false);
  }

  function pick(choice: Choice, i: number) {
    if (ruledOut.has(i)) return;
    if (!choice.isCorrect) {
      setRuledOut((prev) => new Set(prev).add(i));
      setUsedRetry(true);
      return;
    }
    if (!usedRetry) setFirstTime((n) => n + 1);
    if (index + 1 >= items.length) {
      setDone(true);
      return;
    }
    const next = index + 1;
    setIndex(next);
    setChoices(buildChoices(set.pairs, items[next], 3));
    setRuledOut(new Set());
    setUsedRetry(false);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Multi-Match"
      status={
        <div className="text-sm text-slate-200">
          First time: {firstTime}/{items.length}
        </div>
      }
    >
      {done ? (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-3xl font-bold">All done! 🎉</div>
          <div className="text-lg text-slate-600">
            {firstTime} of {items.length} right first time.
          </div>
          <button
            onClick={restart}
            className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
          >
            Play again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full max-w-xl">
          <div className="text-sm text-slate-500">
            Question {index + 1} of {items.length}
          </div>
          <div className="text-3xl font-bold bg-white shadow rounded-xl px-8 py-6 w-full text-center min-h-28 flex items-center justify-center">
            <SideView side={current.left} imageClassName="max-h-48" />
          </div>
          <div className="flex flex-col gap-3 w-full">
            {choices.map((c, i) => (
              <button
                key={i}
                onClick={() => pick(c, i)}
                disabled={ruledOut.has(i)}
                className={`rounded-lg px-5 py-4 font-medium text-lg ${
                  ruledOut.has(i)
                    ? "bg-red-50 text-red-300 line-through"
                    : "bg-white hover:bg-slate-50 shadow"
                }`}
              >
                <SideView side={c.side} imageClassName="max-h-28 mx-auto" />
              </button>
            ))}
          </div>
        </div>
      )}
    </GameShell>
  );
}
