import { useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { buildChoices, type Choice } from "../lib/quiz";
import { shuffle } from "../lib/shuffle";
import type { Pair } from "../types";
import { GameShell } from "./GameShell";

type Team = "A" | "B";

/** Pitch runs 0 (A's goal) to 10 (B's goal); play kicks off in the middle. */
const PITCH = 10;
const KICKOFF = 5;

interface Move {
  label: string;
  advance: number;
  /** Chance of success — long balls are riskier, which is the point. */
  odds: number;
}

const MOVES: Move[] = [
  { label: "Short pass", advance: 1, odds: 0.95 },
  { label: "Long pass", advance: 2, odds: 0.75 },
  { label: "Shot at goal", advance: PITCH, odds: 0.45 },
];

/**
 * Two teams push the ball up a pitch by answering. Safer moves gain less
 * ground, so the class ends up answering more questions to score — which
 * is the pedagogical trick behind the original.
 */
export function Football({ set }: { set: PlayableSet }) {
  const [items] = useState<Pair[]>(() => shuffle(set.pairs));
  const [qIndex, setQIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>(() =>
    buildChoices(set.pairs, items[0], 4),
  );
  const [ball, setBall] = useState(KICKOFF);
  const [turn, setTurn] = useState<Team>("A");
  const [scores, setScores] = useState<Record<Team, number>>({ A: 0, B: 0 });
  const [pendingMove, setPendingMove] = useState<Move | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const current = items[qIndex % items.length];

  function nextQuestion() {
    const next = qIndex + 1;
    setQIndex(next);
    setChoices(buildChoices(set.pairs, items[next % items.length], 4));
  }

  function swapTurn() {
    setTurn((t) => (t === "A" ? "B" : "A"));
  }

  function answer(choice: Choice) {
    if (!pendingMove || message) return;
    const move = pendingMove;
    setPendingMove(null);

    if (!choice.isCorrect) {
      setMessage(`Wrong — possession to Team ${turn === "A" ? "B" : "A"}.`);
      window.setTimeout(() => {
        setMessage(null);
        swapTurn();
        nextQuestion();
      }, 1400);
      return;
    }

    const succeeded = Math.random() < move.odds;
    if (!succeeded) {
      setMessage(`Right answer, but the ${move.label.toLowerCase()} was intercepted!`);
      window.setTimeout(() => {
        setMessage(null);
        swapTurn();
        nextQuestion();
      }, 1600);
      return;
    }

    // Team A pushes towards PITCH, Team B towards 0.
    const direction = turn === "A" ? 1 : -1;
    const target = ball + direction * move.advance;

    if (target >= PITCH || target <= 0) {
      setScores((s) => ({ ...s, [turn]: s[turn] + 1 }));
      setMessage(`⚽ GOAL for Team ${turn}!`);
      window.setTimeout(() => {
        setMessage(null);
        setBall(KICKOFF);
        swapTurn();
        nextQuestion();
      }, 1800);
      return;
    }

    setBall(target);
    setMessage(`${move.label} complete!`);
    window.setTimeout(() => {
      setMessage(null);
      nextQuestion();
    }, 900);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Football"
      status={
        <div className="text-sm text-slate-200">
          Team A: {scores.A} &middot; Team B: {scores.B}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
        <div className="w-full bg-green-700 rounded-xl p-4 relative h-20 flex items-center">
          <div className="absolute inset-y-2 left-2 w-1 bg-white/60 rounded" />
          <div className="absolute inset-y-2 right-2 w-1 bg-white/60 rounded" />
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/40" />
          <div
            className="absolute w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-xl transition-all duration-500"
            style={{ left: `calc(${(ball / PITCH) * 100}% - 20px)` }}
          >
            ⚽
          </div>
        </div>
        <div className="flex justify-between w-full text-xs text-slate-500 -mt-4">
          <span>Team B's goal</span>
          <span>Team A's goal</span>
        </div>

        <div className="text-lg font-semibold">Team {turn}'s turn</div>

        {message ? (
          <div className="text-xl font-bold text-center py-8">{message}</div>
        ) : !pendingMove ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-slate-500 text-sm">Choose your move:</p>
            <div className="flex gap-3">
              {MOVES.map((m) => (
                <button
                  key={m.label}
                  onClick={() => setPendingMove(m)}
                  className="rounded-lg bg-white hover:bg-slate-50 shadow px-5 py-3 font-medium flex flex-col items-center"
                >
                  <span>{m.label}</span>
                  <span className="text-xs text-slate-400">
                    {Math.round(m.odds * 100)}% success
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 w-full">
            <div className="text-sm text-slate-500">
              {pendingMove.label} — answer to attempt it
            </div>
            <div className="text-2xl font-bold bg-white shadow rounded-xl px-6 py-5 w-full text-center min-h-24 flex items-center justify-center">
              <SideView side={current.left} imageClassName="max-h-32" />
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
              {choices.map((c, i) => (
                <button
                  key={i}
                  onClick={() => answer(c)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-3 font-medium"
                >
                  <SideView side={c.side} imageClassName="max-h-20 mx-auto" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </GameShell>
  );
}
