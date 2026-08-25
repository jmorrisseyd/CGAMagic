import { useState } from "react";
import type { Pair, TextMatchSet } from "../types";
import { shuffle } from "../lib/shuffle";
import { GameShell } from "./GameShell";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export function TypeGame({ set }: { set: TextMatchSet }) {
  const [items] = useState<Pair[]>(() => shuffle(set.pairs));
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [attemptedWrong, setAttemptedWrong] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = items[index];
  const target = current?.right ?? "";

  function restart() {
    setIndex(0);
    setValue("");
    setAttemptedWrong(false);
    setScore(0);
    setDone(false);
  }

  function advance(gotIt: boolean) {
    if (gotIt && !attemptedWrong) setScore((s) => s + 1);
    if (index + 1 >= items.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setValue("");
      setAttemptedWrong(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (normalize(value) === normalize(target)) {
      advance(true);
    } else {
      setAttemptedWrong(true);
    }
  }

  const feedback = target.split("").map((ch, i) => {
    const typed = value[i];
    let cls = "text-slate-300";
    if (typed !== undefined) {
      cls = normalize(typed) === normalize(ch) ? "text-green-600" : "text-red-600";
    }
    return (
      <span key={i} className={cls}>
        {typed ?? "_"}
      </span>
    );
  });

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Type"
      status={
        <div className="text-sm text-slate-200">
          Score: {score}/{items.length}
        </div>
      }
    >
      {done ? (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-3xl font-bold">Done! 🎉</div>
          <div className="text-lg text-slate-600">
            {score} of {items.length} correct first time.
          </div>
          <button
            onClick={restart}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
          >
            Restart
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col items-center gap-6 w-96">
          <div className="text-sm text-slate-500">
            Item {index + 1} of {items.length}
          </div>
          <div className="text-2xl font-bold bg-white shadow rounded-lg px-6 py-4 w-full text-center">
            {current.left}
          </div>
          <div className="font-mono text-2xl tracking-wide">{feedback}</div>
          <input
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-lg text-center focus:border-blue-400 outline-none"
            placeholder={`Type the ${set.rightLabel.toLowerCase()}...`}
          />
          {attemptedWrong && (
            <div className="text-red-600 text-sm">Not quite — try again, or skip.</div>
          )}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => advance(false)}
              className="rounded-lg bg-slate-200 hover:bg-slate-300 px-5 py-2 font-medium"
            >
              Skip
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2"
            >
              Check
            </button>
          </div>
        </form>
      )}
    </GameShell>
  );
}
