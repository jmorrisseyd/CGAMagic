import { useRef, useState } from "react";
import { AccentBar } from "../components/AccentBar";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { shuffle } from "../lib/shuffle";
import { sideText, type Pair } from "../types";
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

function normalize(s: string): string {
  return s.trim().toLowerCase();
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
 * Noughts and crosses where claiming a square means typing the answer.
 * A wrong answer hands the square to the other team, so it moves fast and
 * suits a plenary on the whiteboard.
 */
export function Oxo({ set }: { set: PlayableSet }) {
  const [cells, setCells] = useState<Pair[]>(() => assignCells(set.pairs));
  const [owner, setOwner] = useState<(Team | null)[]>(() => Array(9).fill(null));
  const [turn, setTurn] = useState<Team>("X");
  const [active, setActive] = useState<number | null>(null);
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const winner = LINES.reduce<Team | null>((found, line) => {
    if (found) return found;
    const [a, b, c] = line;
    if (owner[a] && owner[a] === owner[b] && owner[a] === owner[c]) return owner[a];
    return null;
  }, null);
  const full = owner.every(Boolean);
  const over = !!winner || full;

  function newGame() {
    setCells(assignCells(set.pairs));
    setOwner(Array(9).fill(null));
    setTurn("X");
    setActive(null);
    setValue("");
    setMessage(null);
  }

  function claim(index: number, team: Team) {
    setOwner((prev) => {
      const next = [...prev];
      next[index] = team;
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active === null) return;
    const target = sideText(cells[active].right);
    const other: Team = turn === "X" ? "O" : "X";

    if (normalize(value) === normalize(target)) {
      claim(active, turn);
      setMessage(null);
    } else {
      claim(active, other);
      setMessage(`Not quite — "${target}". Square goes to ${other}.`);
      window.setTimeout(() => setMessage(null), 2000);
    }
    setActive(null);
    setValue("");
    setTurn(other);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="OXO"
      status={<div className="text-sm text-slate-200">Team {turn}'s turn</div>}
    >
      <div className="flex flex-col items-center gap-5">
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
          <>
            {message && (
              <div className="text-sm font-medium text-red-600">{message}</div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {cells.map((pair, i) => (
                <button
                  key={i}
                  onClick={() => !owner[i] && active === null && setActive(i)}
                  disabled={!!owner[i] || active !== null}
                  className={`w-28 h-28 rounded-lg flex items-center justify-center p-2 text-center font-semibold ${
                    owner[i] === "X"
                      ? "bg-cga-200 text-cga-900 text-5xl"
                      : owner[i] === "O"
                        ? "bg-rose-200 text-rose-900 text-5xl"
                        : "bg-white hover:bg-slate-50 border-2 border-slate-300 text-sm"
                  }`}
                >
                  {owner[i] ?? (
                    <SideView side={pair.left} imageClassName="max-h-20" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {active !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={submit}
            className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center gap-5 max-w-md w-full"
          >
            <div className="text-sm text-slate-500">Team {turn}, type the answer:</div>
            <div className="text-2xl font-bold text-center">
              <SideView side={cells[active].left} imageClassName="max-h-32" />
            </div>
            <input
              ref={inputRef}
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border-2 border-slate-300 px-4 py-3 text-lg text-center focus:border-cga-400 outline-none"
            />
            <AccentBar
              inputRef={inputRef}
              value={value}
              onChange={setValue}
              includePunctuation
            />
            <button
              type="submit"
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-2"
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </GameShell>
  );
}
