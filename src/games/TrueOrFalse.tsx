import { useEffect, useRef, useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { sample, shuffle } from "../lib/shuffle";
import type { Pair, Side } from "../types";
import { GameShell } from "./GameShell";

const ROUNDS = 16;
const SECONDS = 3;

interface Round {
  prompt: Pair;
  shown: Pair;
  isTrue: boolean;
}

/** Two answers count as the same if a student couldn't tell them apart. */
function sameAnswer(a: Side, b: Side): boolean {
  if (a.kind === "text" && b.kind === "text") {
    return a.text.trim().toLowerCase() === b.text.trim().toLowerCase();
  }
  if (a.kind === "image" && b.kind === "image") return a.mediaId === b.mediaId;
  if (a.kind === "audio" && b.kind === "audio") return a.mediaId === b.mediaId;
  return false;
}

function buildRounds(pairs: Pair[]): Round[] {
  return sample(pairs, Math.min(ROUNDS, pairs.length)).map((prompt) => {
    // Half true, half paired with someone else's answer.
    const isTrue = Math.random() < 0.5;
    if (isTrue) return { prompt, shown: prompt, isTrue: true };
    // Synonyms are common in vocab lists, so an impostor carrying the same
    // answer would show a genuinely correct pairing marked false. Skip those.
    const others = pairs.filter(
      (p) => p.id !== prompt.id && !sameAnswer(p.right, prompt.right),
    );
    if (others.length === 0) return { prompt, shown: prompt, isTrue: true };
    return { prompt, shown: shuffle(others)[0], isTrue: false };
  });
}

/**
 * A pairing flashes up and you have three seconds to say whether it's
 * right. Letting the clock run out counts as a miss, which is what makes
 * it a recognition drill rather than a reasoning one.
 */
export function TrueOrFalse({ set }: { set: PlayableSet }) {
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds(set.pairs));
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [flash, setFlash] = useState<"right" | "wrong" | "timeout" | null>(null);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [remaining, setRemaining] = useState(SECONDS);
  /** Guards against a round being scored twice (timer firing alongside a click). */
  const resolvedRef = useRef(false);

  const current = rounds[index];

  // Count down. Only ever touches `remaining` — resolving from inside a
  // state updater would double-fire under StrictMode's double-invoke.
  useEffect(() => {
    if (!started || done || flash) return;
    resolvedRef.current = false;
    setRemaining(SECONDS);
    const id = window.setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [started, index, flash, done]);

  // Separate effect turns "clock hit zero" into a miss.
  useEffect(() => {
    if (!started || done || flash) return;
    if (remaining === 0) resolve(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, started, done, flash]);

  function resolve(answer: boolean | null) {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    const correct = answer !== null && answer === current.isTrue;
    if (correct) setScore((s) => s + 1);
    else setMissed((m) => m + 1);
    setFlash(answer === null ? "timeout" : correct ? "right" : "wrong");
    window.setTimeout(() => {
      setFlash(null);
      if (index + 1 >= rounds.length) setDone(true);
      else setIndex((i) => i + 1);
    }, 900);
  }

  function newGame() {
    setRounds(buildRounds(set.pairs));
    setIndex(0);
    setScore(0);
    setMissed(0);
    setFlash(null);
    setDone(false);
    setStarted(true);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="True or False?"
      status={
        <div className="text-sm text-slate-200">
          Score: {score} &middot; Missed: {missed}
        </div>
      }
    >
      {!started ? (
        <button
          onClick={() => setStarted(true)}
          className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 text-lg"
        >
          Start — {SECONDS}s per pairing
        </button>
      ) : done ? (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-3xl font-bold">Finished!</div>
          <div className="text-lg text-slate-600">
            {score} right out of {rounds.length}.
          </div>
          <button
            onClick={newGame}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
          >
            Play again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          <div className="text-sm text-slate-500">
            {index + 1} of {rounds.length}
          </div>
          <div className="text-4xl font-mono font-bold text-slate-400">{remaining}</div>
          <div
            className={`w-full rounded-xl px-8 py-8 flex items-center justify-center gap-8 text-2xl font-bold ${
              flash === "right"
                ? "bg-green-100"
                : flash === "wrong"
                  ? "bg-red-100"
                  : flash === "timeout"
                    ? "bg-amber-100"
                    : "bg-white shadow"
            }`}
          >
            <SideView side={current.prompt.left} imageClassName="max-h-32" />
            <span className="text-slate-300">=</span>
            <SideView side={current.shown.right} imageClassName="max-h-32" />
          </div>
          {flash ? (
            <div className="text-lg font-semibold text-slate-600">
              {flash === "timeout"
                ? "Too slow!"
                : flash === "right"
                  ? "Correct ✓"
                  : "Wrong ✗"}
            </div>
          ) : (
            <div className="flex gap-6">
              <button
                onClick={() => resolve(false)}
                className="rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold px-10 py-5 text-xl"
              >
                ✗ False
              </button>
              <button
                onClick={() => resolve(true)}
                className="rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-bold px-10 py-5 text-xl"
              >
                ✓ True
              </button>
            </div>
          )}
        </div>
      )}
    </GameShell>
  );
}
