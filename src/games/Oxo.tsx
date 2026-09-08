import { useMemo, useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { sample, shuffle } from "../lib/shuffle";
import type { Pair, Side } from "../types";
import { GameShell } from "./GameShell";

type Team = "X" | "O";

const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

/** A few wrong answers alongside the nine real ones. */
const RED_HERRINGS = 3;

interface Option {
  key: string;
  /** The pair this answer belongs to; null for a red herring. */
  pairId: string | null;
  side: Side;
}

function assignCells(pairs: Pair[]): Pair[] {
  const out: Pair[] = [];
  let pool = shuffle(pairs);
  while (out.length < 9) {
    if (pool.length === 0) pool = shuffle(pairs);
    out.push(pool.pop()!);
  }
  return out;
}

/**
 * Every answer the board needs, plus a few red herrings drawn from
 * elsewhere in the set so the wrong options are plausible. Built once per
 * game and shown to the side, so as squares are claimed the pool narrows —
 * which is part of the tactics.
 */
function buildOptions(cells: Pair[], allPairs: Pair[]): Option[] {
  const needed = new Map<string, Pair>();
  for (const cell of cells) needed.set(cell.id, cell);

  const spare = allPairs.filter((p) => !needed.has(p.id));
  const herrings = sample(spare, Math.min(RED_HERRINGS, spare.length));

  return shuffle([
    ...[...needed.values()].map((p) => ({
      key: `answer-${p.id}`,
      pairId: p.id,
      side: p.right,
    })),
    ...herrings.map((p) => ({
      key: `herring-${p.id}`,
      pairId: null,
      side: p.right,
    })),
  ]);
}

/**
 * Noughts and crosses played as multiple choice: a team picks the square
 * it wants, then picks that square's translation from the options beside
 * the board. A wrong pick hands the square to the other team, which is how
 * TaskMagic's version behaves, so it stays quick enough for a plenary.
 */
export function Oxo({ set }: { set: PlayableSet }) {
  const [cells, setCells] = useState<Pair[]>(() => assignCells(set.pairs));
  const [options, setOptions] = useState<Option[]>(() =>
    buildOptions(cells, set.pairs),
  );
  const [owner, setOwner] = useState<(Team | null)[]>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<Team>("X");
  const [active, setActive] = useState<number | null>(null);
  const [wrongKey, setWrongKey] = useState<string | null>(null);
  /** Shown after a wrong pick so the class still sees the right answer. */
  const [correction, setCorrection] = useState<
    { prompt: Side; answer: Side; team: Team } | null
  >(null);

  const winner = LINES.reduce<Team | null>((found, line) => {
    if (found) return found;
    const [a, b, c] = line;
    if (owner[a] && owner[a] === owner[b] && owner[a] === owner[c]) return owner[a];
    return null;
  }, null);
  const full = owner.every(Boolean);
  const over = !!winner || full;

  /**
   * An answer is spent once no unclaimed square still needs it. Checked
   * against the remaining squares rather than a used-list, because a short
   * set can place the same pair on two squares.
   */
  const stillNeeded = useMemo(() => {
    const ids = new Set<string>();
    cells.forEach((cell, i) => {
      if (!owner[i]) ids.add(cell.id);
    });
    return ids;
  }, [cells, owner]);

  function newGame() {
    const nextCells = assignCells(set.pairs);
    setCells(nextCells);
    setOptions(buildOptions(nextCells, set.pairs));
    setOwner(Array(9).fill(null));
    setTurn("X");
    setActive(null);
    setCorrection(null);
    setWrongKey(null);
  }

  function claim(index: number, team: Team) {
    setOwner((prev) => {
      const next = [...prev];
      next[index] = team;
      return next;
    });
  }

  function choose(option: Option) {
    if (active === null || over) return;
    const target = cells[active];
    const other: Team = turn === "X" ? "O" : "X";

    if (option.pairId === target.id) {
      claim(active, turn);
      setCorrection(null);
    } else {
      claim(active, other);
      setWrongKey(option.key);
      setCorrection({ prompt: target.left, answer: target.right, team: other });
      window.setTimeout(() => {
        setCorrection(null);
        setWrongKey(null);
      }, 3200);
    }
    setActive(null);
    setTurn(other);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="OXO"
      status={
        <div className="text-sm text-slate-200">
          {over ? "Game over" : `Team ${turn}'s turn`}
        </div>
      }
    >
      {over ? (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-3xl font-bold">
            {winner ? `Team ${winner} wins! 🎉` : "It's a draw!"}
          </div>
          <button
            onClick={newGame}
            className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
          >
            Play again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
          <div className="min-h-6 text-sm font-medium text-center">
            {correction ? (
              <span className="inline-flex items-center gap-1.5 flex-wrap justify-center text-red-600">
                Not that one —
                <SideView side={correction.prompt} imageClassName="max-h-8" />
                <span className="text-slate-500">is</span>
                <SideView side={correction.answer} imageClassName="max-h-8" />
                <span>. The square goes to {correction.team}.</span>
              </span>
            ) : active === null ? (
              <span className="text-slate-500">
                Team {turn} — choose a square to claim.
              </span>
            ) : (
              <span className="text-cga-700">
                Now pick the matching answer from the list.
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-6 items-start w-full justify-center">
            <div className="grid grid-cols-3 gap-2 shrink-0">
              {cells.map((pair, i) => {
                const cellOwner = owner[i];
                const isActive = active === i;
                return (
                  <button
                    key={i}
                    onClick={() => !cellOwner && setActive(i)}
                    disabled={!!cellOwner}
                    className={`w-28 h-28 rounded-lg flex items-center justify-center p-2 text-center font-semibold ${
                      cellOwner === "X"
                        ? "bg-cga-200 text-cga-900 text-5xl"
                        : cellOwner === "O"
                          ? "bg-rose-200 text-rose-900 text-5xl"
                          : isActive
                            ? "bg-cga-50 border-4 border-cga-600 text-sm"
                            : "bg-white hover:bg-slate-50 border-2 border-slate-300 text-sm"
                    }`}
                  >
                    {cellOwner ?? (
                      <SideView side={pair.left} imageClassName="max-h-20" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2 w-full md:w-72">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Answers
              </div>
              {active !== null && (
                <div className="rounded-lg bg-cga-50 border border-cga-200 px-3 py-2 text-center font-bold">
                  <SideView side={cells[active].left} imageClassName="max-h-24 mx-auto" />
                </div>
              )}
              <div className="flex flex-col gap-1.5">
                {options.map((option) => {
                  // Herrings never get spent; real answers grey out once no
                  // remaining square needs them.
                  const spent =
                    option.pairId !== null && !stillNeeded.has(option.pairId);
                  const disabled = spent || active === null;
                  return (
                    <button
                      key={option.key}
                      onClick={() => choose(option)}
                      disabled={disabled}
                      className={`rounded px-3 py-2 text-sm font-medium text-left ${
                        wrongKey === option.key
                          ? "bg-red-100 text-red-700"
                          : spent
                            ? "bg-slate-100 text-slate-300 line-through"
                            : active === null
                              ? "bg-slate-50 text-slate-400"
                              : "bg-slate-100 hover:bg-cga-50"
                      }`}
                    >
                      <SideView side={option.side} imageClassName="max-h-16" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  );
}
