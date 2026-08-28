import { useEffect, useRef, useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { buildChoices, type Choice } from "../lib/quiz";
import { shuffle } from "../lib/shuffle";
import type { Pair } from "../types";
import { GameShell } from "./GameShell";

const START_LIVES = 3;
const TICK_MS = 50;

const SPEEDS = { easy: 0.28, medium: 0.5, hard: 0.85 } as const;
type Difficulty = keyof typeof SPEEDS;

/**
 * Answers drift down the screen; click the right one before it lands.
 * Position is percent-of-height so it scales to whatever the whiteboard is.
 */
export function Invaders({ set }: { set: PlayableSet }) {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [items, setItems] = useState<Pair[]>(() => shuffle(set.pairs));
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>(() =>
    buildChoices(set.pairs, items[0], 4),
  );
  const [depth, setDepth] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const [flash, setFlash] = useState<"hit" | "miss" | null>(null);
  /** Stops one landing being counted twice (tick racing a click). */
  const resolvedRef = useRef(false);

  const current = items[index];

  // Drive the descent. Only ever touches `depth` — triggering a life loss
  // from inside the updater double-fires under StrictMode.
  useEffect(() => {
    if (!running || over || flash) return;
    resolvedRef.current = false;
    const id = window.setInterval(() => {
      setDepth((d) => Math.min(100, d + SPEEDS[difficulty]));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [running, over, flash, difficulty, index]);

  // Separate effect turns "it reached the ground" into a lost life.
  useEffect(() => {
    if (!running || over || flash) return;
    if (depth >= 100) loseLife();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depth, running, over, flash]);

  function advanceQuestion() {
    setIndex((i) => {
      const next = i + 1 >= items.length ? 0 : i + 1;
      setChoices(buildChoices(set.pairs, items[next], 4));
      return next;
    });
    setDepth(0);
  }

  function loseLife() {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setFlash("miss");
    const remaining = lives - 1;
    setLives(remaining);
    if (remaining <= 0) {
      setOver(true);
      setRunning(false);
      return;
    }
    window.setTimeout(() => {
      setFlash(null);
      advanceQuestion();
    }, 700);
  }

  function shoot(choice: Choice) {
    if (!running || flash || resolvedRef.current) return;
    if (choice.isCorrect) {
      resolvedRef.current = true;
      setFlash("hit");
      setScore((s) => s + 1);
      window.setTimeout(() => {
        setFlash(null);
        advanceQuestion();
      }, 400);
    } else {
      loseLife();
    }
  }

  function start(level: Difficulty) {
    const fresh = shuffle(set.pairs);
    setDifficulty(level);
    setItems(fresh);
    setIndex(0);
    setChoices(buildChoices(set.pairs, fresh[0], 4));
    setDepth(0);
    setLives(START_LIVES);
    setScore(0);
    setOver(false);
    setFlash(null);
    setRunning(true);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Invaders"
      status={
        <div className="text-sm text-slate-200">
          {"❤️".repeat(Math.max(0, lives))} &middot; Score: {score}
        </div>
      }
    >
      {!running && !over ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-slate-500">Choose a speed:</p>
          <div className="flex gap-3">
            {(Object.keys(SPEEDS) as Difficulty[]).map((level) => (
              <button
                key={level}
                onClick={() => start(level)}
                className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3 capitalize"
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      ) : over ? (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-3xl font-bold">Game over</div>
          <div className="text-lg text-slate-600">You scored {score}.</div>
          <button
            onClick={() => start(difficulty)}
            className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
          >
            Play again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-3xl">
          <div
            className={`relative w-full h-72 rounded-xl overflow-hidden border-4 ${
              flash === "hit"
                ? "border-leaf-400 bg-leaf-50"
                : flash === "miss"
                  ? "border-red-400 bg-red-50"
                  : "border-slate-700 bg-slate-900"
            }`}
          >
            <div
              className="absolute left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg bg-white shadow-lg text-xl font-bold whitespace-nowrap"
              style={{ top: `${depth}%` }}
            >
              <SideView side={current.left} imageClassName="max-h-20" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-red-500" />
          </div>
          <div className="grid grid-cols-2 gap-3 w-full">
            {choices.map((c, i) => (
              <button
                key={i}
                onClick={() => shoot(c)}
                disabled={!!flash}
                className="rounded-lg bg-white hover:bg-slate-50 shadow px-4 py-3 font-medium disabled:opacity-60"
              >
                <SideView side={c.side} imageClassName="max-h-20 mx-auto" />
              </button>
            ))}
          </div>
        </div>
      )}
    </GameShell>
  );
}
