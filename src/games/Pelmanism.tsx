import { useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { sample, shuffle } from "../lib/shuffle";
import type { Pair, Side } from "../types";
import { GameShell } from "./GameShell";

const MAX_PAIRS = 8;

interface Card {
  pairId: string;
  side: Side;
}

function buildCards(pairs: Pair[]): Card[] {
  const chosen = sample(pairs, Math.min(MAX_PAIRS, pairs.length));
  const cards: Card[] = chosen.flatMap((p) => [
    { pairId: p.id, side: p.left },
    { pairId: p.id, side: p.right },
  ]);
  return shuffle(cards);
}

export function Pelmanism({ set }: { set: PlayableSet }) {
  const [mode, setMode] = useState<"1p" | "2p">("1p");
  const [cards, setCards] = useState<Card[]>(() => buildCards(set.pairs));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [scores, setScores] = useState({ 1: 0, 2: 0 });
  const [player, setPlayer] = useState<1 | 2>(1);

  const totalPairs = cards.length / 2;
  const gameOver = matched.size === totalPairs;

  function newGame(nextMode: "1p" | "2p") {
    setMode(nextMode);
    setCards(buildCards(set.pairs));
    setFlipped([]);
    setMatched(new Set());
    setBusy(false);
    setAttempts(0);
    setScores({ 1: 0, 2: 0 });
    setPlayer(1);
  }

  function flip(index: number) {
    if (busy || flipped.includes(index) || matched.has(cards[index].pairId)) return;
    if (flipped.length === 1) {
      const next = [...flipped, index];
      setFlipped(next);
      setBusy(true);
      setAttempts((a) => a + 1);
      const [a, b] = next;
      const isMatch = cards[a].pairId === cards[b].pairId;
      setTimeout(() => {
        if (isMatch) {
          setMatched((m) => new Set(m).add(cards[a].pairId));
          if (mode === "2p") setScores((s) => ({ ...s, [player]: s[player] + 1 }));
        } else if (mode === "2p") {
          setPlayer((p) => (p === 1 ? 2 : 1));
        }
        setFlipped([]);
        setBusy(false);
      }, 800);
    } else {
      setFlipped([index]);
    }
  }

  const cols = Math.min(6, Math.ceil(Math.sqrt(cards.length * 1.4)));

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Pelmanism"
      status={
        <div className="text-sm text-slate-200">
          {mode === "1p" ? `Attempts: ${attempts}` : `P1: ${scores[1]} · P2: ${scores[2]}`}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-2">
          <button
            onClick={() => newGame("1p")}
            className={`px-3 py-1 rounded text-sm font-medium ${
              mode === "1p" ? "bg-cga-600 text-white" : "bg-white text-slate-600 border"
            }`}
          >
            1 Player
          </button>
          <button
            onClick={() => newGame("2p")}
            className={`px-3 py-1 rounded text-sm font-medium ${
              mode === "2p" ? "bg-cga-600 text-white" : "bg-white text-slate-600 border"
            }`}
          >
            2 Players
          </button>
        </div>

        {gameOver ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-3xl font-bold">
              {mode === "1p"
                ? `Done in ${attempts} attempts! 🎉`
                : scores[1] === scores[2]
                  ? "It's a tie!"
                  : `Player ${scores[1] > scores[2] ? 1 : 2} wins! 🎉`}
            </div>
            <button
              onClick={() => newGame(mode)}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <>
            {mode === "2p" && (
              <div className="text-lg font-semibold">Player {player}'s turn</div>
            )}
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
            >
              {cards.map((c, i) => {
                const isFlipped = flipped.includes(i) || matched.has(c.pairId);
                return (
                  <button
                    key={i}
                    onClick={() => flip(i)}
                    disabled={matched.has(c.pairId)}
                    className={`w-24 h-20 rounded-lg font-medium text-sm p-2 flex items-center justify-center text-center ${
                      matched.has(c.pairId)
                        ? "bg-leaf-100 text-leaf-800"
                        : isFlipped
                          ? "bg-white border-2 border-cga-400"
                          : "bg-slate-700 hover:bg-slate-600 text-white"
                    }`}
                  >
                    {isFlipped ? (
                      <SideView side={c.side} imageClassName="max-h-16" />
                    ) : (
                      "?"
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}
