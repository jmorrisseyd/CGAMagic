import { useEffect, useRef, useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { sample, shuffle } from "../lib/shuffle";
import type { Pair } from "../types";
import { GameShell } from "./GameShell";

const MAX_ITEMS = 16;
const SECONDS_PER_ITEM = 6;

export function AgainstTheClock({ set }: { set: PlayableSet }) {
  const [items, setItems] = useState<Pair[]>(() =>
    sample(set.pairs, Math.min(MAX_ITEMS, set.pairs.length)),
  );
  const [rightOrder, setRightOrder] = useState<Pair[]>(() => shuffle(items));
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [wrongFlash, setWrongFlash] = useState<{ left: string; right: string } | null>(
    null,
  );
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState<"win" | "timeout" | null>(null);
  const timerRef = useRef<number | null>(null);

  const totalTime = items.length * SECONDS_PER_ITEM;

  function newGame() {
    const chosen = sample(set.pairs, Math.min(MAX_ITEMS, set.pairs.length));
    setItems(chosen);
    setRightOrder(shuffle(chosen));
    setMatched(new Set());
    setSelectedLeft(null);
    setWrongFlash(null);
    setStarted(false);
    setFinished(null);
    setTimeLeft(chosen.length * SECONDS_PER_ITEM);
  }

  function start() {
    setTimeLeft(totalTime);
    setStarted(true);
  }

  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          window.clearInterval(timerRef.current!);
          setFinished("timeout");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [started, finished]);

  function pickLeft(id: string) {
    if (!started || finished || matched.has(id)) return;
    setSelectedLeft(id);
  }

  function pickRight(pair: Pair) {
    if (!started || finished || !selectedLeft || matched.has(pair.id)) return;
    if (selectedLeft === pair.id) {
      const next = new Set(matched).add(pair.id);
      setMatched(next);
      setSelectedLeft(null);
      if (next.size === items.length) {
        setFinished("win");
        if (timerRef.current) window.clearInterval(timerRef.current);
      }
    } else {
      setWrongFlash({ left: selectedLeft, right: pair.id });
      setTimeout(() => setWrongFlash(null), 500);
      setSelectedLeft(null);
    }
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Against the Clock"
      status={
        started && !finished ? (
          <div className="text-sm text-slate-200 font-mono">⏱ {timeLeft}s</div>
        ) : null
      }
    >
      <div className="flex flex-col items-center gap-6">
        {!started ? (
          <button
            onClick={start}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-4 text-lg"
          >
            Start ({totalTime}s)
          </button>
        ) : finished ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-3xl font-bold">
              {finished === "win" ? "All matched! 🎉" : "Time's up!"}
            </div>
            <div className="text-lg text-slate-600">
              Matched {matched.size} of {items.length}
            </div>
            <button
              onClick={newGame}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-12 gap-y-3">
            <div className="flex flex-col gap-3">
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickLeft(p.id)}
                  disabled={matched.has(p.id)}
                  className={`rounded-lg px-4 py-3 font-medium text-left ${
                    matched.has(p.id)
                      ? "bg-green-100 text-green-700"
                      : selectedLeft === p.id
                        ? "bg-blue-500 text-white"
                        : wrongFlash?.left === p.id
                          ? "bg-red-200"
                          : "bg-white hover:bg-slate-50 shadow"
                  }`}
                >
                  <SideView side={p.left} imageClassName="max-h-16" />
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              {rightOrder.map((p) => (
                <button
                  key={p.id}
                  onClick={() => pickRight(p)}
                  disabled={matched.has(p.id)}
                  className={`rounded-lg px-4 py-3 font-medium text-left ${
                    matched.has(p.id)
                      ? "bg-green-100 text-green-700"
                      : wrongFlash?.right === p.id
                        ? "bg-red-200"
                        : "bg-white hover:bg-slate-50 shadow"
                  }`}
                >
                  <SideView side={p.right} imageClassName="max-h-16" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
