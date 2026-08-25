import { useMemo, useState } from "react";
import type { Pair, TextMatchSet } from "../types";
import { buildLines } from "../lib/lines";
import { buildChoices, type Choice } from "../lib/quiz";
import { shuffle } from "../lib/shuffle";
import { GameShell } from "./GameShell";

type Size = "3x3" | "3x4" | "4x4";
const SIZES: Record<Size, { rows: number; cols: number }> = {
  "3x3": { rows: 3, cols: 3 },
  "3x4": { rows: 3, cols: 4 },
  "4x4": { rows: 4, cols: 4 },
};

type Team = "A" | "B";

function assignCells(pairs: Pair[], count: number): Pair[] {
  const out: Pair[] = [];
  let pool = shuffle(pairs);
  while (out.length < count) {
    if (pool.length === 0) pool = shuffle(pairs);
    out.push(pool.pop()!);
  }
  return out;
}

export function ThreeInARow({ set }: { set: TextMatchSet }) {
  const [size, setSize] = useState<Size>("3x3");
  const { rows, cols } = SIZES[size];
  const total = rows * cols;
  const lines = useMemo(() => buildLines(rows, cols), [rows, cols]);

  const [cellPairs, setCellPairs] = useState<Pair[]>(() =>
    assignCells(set.pairs, total),
  );
  const [owner, setOwner] = useState<(Team | null)[]>(() =>
    Array(total).fill(null),
  );
  const [scoredLines, setScoredLines] = useState<Set<number>>(new Set());
  const [scores, setScores] = useState<Record<Team, number>>({ A: 0, B: 0 });
  const [turn, setTurn] = useState<Team>("A");
  const [active, setActive] = useState<{ cell: number; choices: Choice[] } | null>(
    null,
  );

  function newGame(nextSize: Size) {
    const { rows: r, cols: c } = SIZES[nextSize];
    setSize(nextSize);
    setCellPairs(assignCells(set.pairs, r * c));
    setOwner(Array(r * c).fill(null));
    setScoredLines(new Set());
    setScores({ A: 0, B: 0 });
    setTurn("A");
    setActive(null);
  }

  function openCell(cell: number) {
    if (owner[cell]) return;
    const choices = buildChoices(set.pairs, cellPairs[cell], 3);
    setActive({ cell, choices });
  }

  function answer(choice: Choice) {
    if (!active) return;
    const { cell } = active;
    if (choice.isCorrect) {
      const nextOwner = [...owner];
      nextOwner[cell] = turn;
      setOwner(nextOwner);

      let gained = 0;
      const newlyScored = new Set(scoredLines);
      lines.forEach((line, i) => {
        if (newlyScored.has(i)) return;
        if (line.every((idx) => nextOwner[idx] === turn)) {
          newlyScored.add(i);
          gained += 1;
        }
      });
      if (gained > 0) {
        setScoredLines(newlyScored);
        setScores((s) => ({ ...s, [turn]: s[turn] + gained }));
      }
    }
    setActive(null);
    setTurn((t) => (t === "A" ? "B" : "A"));
  }

  const filled = owner.filter(Boolean).length;
  const gameOver = filled === total;

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="3 in a Row"
      status={
        <div className="text-sm text-slate-200">
          Team A: {scores.A} &middot; Team B: {scores.B}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {(Object.keys(SIZES) as Size[]).map((s) => (
            <button
              key={s}
              onClick={() => newGame(s)}
              className={`px-3 py-1 rounded text-sm font-medium ${
                s === size
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {gameOver ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-3xl font-bold">
              {scores.A === scores.B
                ? "It's a tie!"
                : `Team ${scores.A > scores.B ? "A" : "B"} wins! 🎉`}
            </div>
            <div className="text-lg text-slate-600">
              Team A: {scores.A} &middot; Team B: {scores.B}
            </div>
            <button
              onClick={() => newGame(size)}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <>
            <div className="text-lg font-semibold">
              Team {turn}'s turn
            </div>
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {cellPairs.map((p, i) => {
                const cellOwner = owner[i];
                return (
                  <button
                    key={i}
                    onClick={() => openCell(i)}
                    disabled={!!cellOwner}
                    className={`w-24 h-24 rounded-lg font-semibold text-sm flex items-center justify-center p-2 text-center ${
                      cellOwner === "A"
                        ? "bg-blue-200 text-blue-900"
                        : cellOwner === "B"
                          ? "bg-rose-200 text-rose-900"
                          : "bg-white hover:bg-slate-50 border-2 border-slate-300"
                    }`}
                  >
                    {cellOwner ? p.right : p.left}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {active && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center gap-5 max-w-md w-full">
            <div className="text-sm text-slate-500">Team {turn}, answer:</div>
            <div className="text-2xl font-bold text-center">
              {cellPairs[active.cell].left}
            </div>
            <div className="flex flex-col gap-3 w-full">
              {active.choices.map((c, i) => (
                <button
                  key={i}
                  onClick={() => answer(c)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 px-4 py-3 font-medium"
                >
                  {c.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}
