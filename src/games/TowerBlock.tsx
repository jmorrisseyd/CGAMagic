import { useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { buildChoices, type Choice } from "../lib/quiz";
import { sample } from "../lib/shuffle";
import type { Pair } from "../types";
import { GameShell } from "./GameShell";

const MAX_QUESTIONS = 15;
const START_PLAY_SAFES = 4;

export function TowerBlock({ set }: { set: PlayableSet }) {
  const [order, setOrder] = useState<Pair[]>(() =>
    sample(set.pairs, Math.min(MAX_QUESTIONS, set.pairs.length)),
  );
  const [index, setIndex] = useState(0);
  const [blocks, setBlocks] = useState(0);
  const [playSafes, setPlaySafes] = useState(START_PLAY_SAFES);
  const [gameOver, setGameOver] = useState<"win" | "lose" | null>(null);
  const [choices, setChoices] = useState<Choice[]>(() =>
    buildChoices(set.pairs, order[0], 4),
  );
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  function newGame() {
    const next = sample(set.pairs, Math.min(MAX_QUESTIONS, set.pairs.length));
    setOrder(next);
    setIndex(0);
    setBlocks(0);
    setPlaySafes(START_PLAY_SAFES);
    setGameOver(null);
    setChoices(buildChoices(set.pairs, next[0], 4));
    setFlash(null);
  }

  function answer(choice: Choice) {
    if (gameOver) return;
    if (choice.isCorrect) {
      setFlash("correct");
      const nextBlocks = blocks + 1;
      setTimeout(() => {
        setFlash(null);
        setBlocks(nextBlocks);
        if (index + 1 >= order.length) {
          setGameOver("win");
        } else {
          const nextIndex = index + 1;
          setIndex(nextIndex);
          setChoices(buildChoices(set.pairs, order[nextIndex], 4));
        }
      }, 500);
    } else {
      setFlash("wrong");
      setTimeout(() => {
        setFlash(null);
        if (playSafes > 0) {
          setPlaySafes((p) => p - 1);
          if (index + 1 >= order.length) {
            setGameOver("win");
          } else {
            const nextIndex = index + 1;
            setIndex(nextIndex);
            setChoices(buildChoices(set.pairs, order[nextIndex], 4));
          }
        } else {
          setGameOver("lose");
        }
      }, 500);
    }
  }

  const current = order[index];

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Tower Block"
      status={
        <div className="text-sm text-slate-200">
          Play-safes: {"🛟".repeat(playSafes) || "none"}
        </div>
      }
    >
      <div className="flex gap-10 items-end">
        <div className="flex flex-col-reverse gap-1 w-20">
          {Array.from({ length: blocks }).map((_, i) => (
            <div
              key={i}
              className="h-8 rounded bg-amber-500 border-2 border-amber-700 shadow"
            />
          ))}
          <div className="h-2 bg-slate-500 rounded" />
        </div>

        <div className="flex flex-col items-center gap-6 w-96">
          {gameOver ? (
            <div className="text-center flex flex-col items-center gap-4">
              <div className="text-3xl font-bold">
                {gameOver === "win"
                  ? "Tower complete! 🎉"
                  : "The tower fell!"}
              </div>
              <div className="text-lg text-slate-600">
                You built {blocks} block{blocks === 1 ? "" : "s"} high.
              </div>
              <button
                onClick={newGame}
                className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
              >
                Play again
              </button>
            </div>
          ) : (
            <>
              <div className="text-sm text-slate-500">
                Question {index + 1} of {order.length}
              </div>
              <div
                className={`text-2xl font-bold text-center px-6 py-4 rounded-lg w-full ${
                  flash === "correct"
                    ? "bg-leaf-100"
                    : flash === "wrong"
                      ? "bg-red-100"
                      : "bg-white shadow"
                }`}
              >
                <SideView side={current.left} imageClassName="max-h-40 mx-auto" />
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {choices.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => answer(c)}
                    disabled={!!flash}
                    className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-3 font-medium"
                  >
                    <SideView side={c.side} imageClassName="max-h-24 mx-auto" />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </GameShell>
  );
}
