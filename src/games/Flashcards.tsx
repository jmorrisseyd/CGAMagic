import { useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { shuffle } from "../lib/shuffle";
import type { Pair } from "../types";
import { GameShell } from "./GameShell";

export function Flashcards({ set }: { set: PlayableSet }) {
  const [random, setRandom] = useState(true);
  const [queue, setQueue] = useState<Pair[]>(() =>
    random ? shuffle(set.pairs) : set.pairs,
  );
  const [revealed, setRevealed] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState<Pair[]>([]);
  const [done, setDone] = useState(false);

  const current = queue[0];

  function toggleOrder() {
    const nextRandom = !random;
    setRandom(nextRandom);
    setQueue(nextRandom ? shuffle(set.pairs) : [...set.pairs]);
    setRevealed(false);
    setKnown(0);
    setUnknown([]);
    setDone(false);
  }

  function advance(knewIt: boolean) {
    const rest = queue.slice(1);
    if (knewIt) {
      setKnown((k) => k + 1);
    } else {
      setUnknown((u) => [...u, current]);
    }
    if (rest.length > 0) {
      setQueue(rest);
      setRevealed(false);
    } else if (unknown.length > 0 || !knewIt) {
      const retry = knewIt ? unknown : [...unknown, current];
      setQueue(random ? shuffle(retry) : retry);
      setUnknown([]);
      setRevealed(false);
    } else {
      setDone(true);
    }
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Flashcards"
      status={
        <div className="text-sm text-slate-200">
          Known: {known} &middot; Cards left: {queue.length}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <button onClick={toggleOrder} className="text-sm text-slate-500 underline">
          Order: {random ? "Random" : "In order"} (click to switch)
        </button>

        {done ? (
          <Summary known={known} total={set.pairs.length} onRestart={toggleOrder} />
        ) : (
          <>
            <div
              onClick={() => setRevealed((r) => !r)}
              className="w-96 h-56 bg-white rounded-xl shadow-lg flex items-center justify-center text-center p-6 text-2xl font-medium cursor-pointer select-none border-4 border-slate-300"
            >
              <SideView side={revealed ? current.right : current.left} />
            </div>
            <div className="text-sm text-slate-500">
              {revealed ? set.rightLabel : set.leftLabel} — click card to{" "}
              {revealed ? "hide" : "reveal"}
            </div>
            {revealed && (
              <div className="flex gap-4">
                <button
                  onClick={() => advance(false)}
                  className="rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-6 py-3"
                >
                  ✗ Didn't know it
                </button>
                <button
                  onClick={() => advance(true)}
                  className="rounded-lg bg-leaf-100 hover:bg-leaf-200 text-leaf-700 font-semibold px-6 py-3"
                >
                  ✓ Knew it
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

function Summary({
  known,
  total,
  onRestart,
}: {
  known: number;
  total: number;
  onRestart: () => void;
}) {
  return (
    <div className="text-center flex flex-col items-center gap-4">
      <div className="text-3xl font-bold">All done! 🎉</div>
      <div className="text-lg text-slate-600">
        You knew {known} of {total} first time.
      </div>
      <button
        onClick={onRestart}
        className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
      >
        Restart
      </button>
    </div>
  );
}
