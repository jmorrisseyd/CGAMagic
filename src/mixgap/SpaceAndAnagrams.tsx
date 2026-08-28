import { useMemo, useState } from "react";
import { GameShell } from "../games/GameShell";
import {
  boundaryPositions,
  boundarySeparators,
  jumble,
  normaliseAnswer,
  stripSpacing,
  words,
} from "../lib/mixgap";
import type { MixGapSet } from "../types";

/**
 * Space: TaskMagic strips every space and punctuation mark, and the student
 * "clicks at the dividing point between words", at which point "the missing
 * space and or punctuation is automatically inserted" — so a correct click
 * restores whatever originally sat there, commas and all.
 */
export function SpaceGame({ set }: { set: MixGapSet }) {
  const stripped = useMemo(() => stripSpacing(set.text), [set.text]);
  const correct = useMemo(() => boundaryPositions(set.text), [set.text]);
  const separators = useMemo(() => boundarySeparators(set.text), [set.text]);
  const correctSet = useMemo(() => new Set(correct), [correct]);

  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrongAt, setWrongAt] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);

  const done = found.size === correct.length;

  function clickGap(afterChar: number) {
    if (done || found.has(afterChar)) return;
    if (!correctSet.has(afterChar)) {
      setWrongAt(afterChar);
      setMistakes((m) => m + 1);
      window.setTimeout(() => setWrongAt(null), 400);
      return;
    }
    setFound((f) => new Set(f).add(afterChar));
  }

  // Anything after the final word — usually a full stop — sits past the last
  // boundary, so there is nothing for the student to click. It's shown once
  // they've finished so the completed passage matches the original exactly.
  const tail = useMemo(() => {
    const match = /[^\p{L}\p{N}]+$/u.exec(set.text);
    return match ? match[0].trimEnd() : "";
  }, [set.text]);

  // Rebuild the display, inserting the real separator wherever the student
  // has correctly identified a boundary.
  const pieces: React.ReactNode[] = [];
  for (let i = 0; i < stripped.length; i++) {
    pieces.push(<span key={`c${i}`}>{stripped[i]}</span>);
    const after = i + 1;
    if (after === stripped.length) break;
    const boundaryIndex = correct.indexOf(after);
    if (found.has(after)) {
      pieces.push(
        <span key={`s${i}`} className="text-leaf-700 font-semibold">
          {separators[boundaryIndex] || " "}
        </span>,
      );
    } else {
      pieces.push(
        <button
          key={`g${i}`}
          onClick={() => clickGap(after)}
          aria-label={`Insert a break after character ${after}`}
          className={`inline-block w-1.5 h-5 align-middle mx-px rounded-sm ${
            wrongAt === after ? "bg-red-400" : "bg-transparent hover:bg-cga-300"
          }`}
        />,
      );
    }
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Space"
      status={
        <div className="text-sm text-slate-200">
          {found.size} / {correct.length} &middot; {mistakes} wrong
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
        <p className="text-sm text-slate-500">
          Click between two words to put the space and punctuation back.
        </p>
        <div className="bg-white rounded-lg shadow p-5 w-full text-lg leading-loose break-words font-mono">
          {pieces}
          {done && tail && (
            <span className="text-leaf-700 font-semibold">{tail}</span>
          )}
        </div>
        {done && (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-leaf-700">All spaced! 🎉</div>
            <button
              onClick={() => {
                setFound(new Set());
                setMistakes(0);
              }}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}

/** Anagrams: each word jumbled, in the order they appear in the passage. */
export function Anagrams({ set }: { set: MixGapSet }) {
  const target = useMemo(() => words(set.text), [set.text]);
  const scrambled = useMemo(
    () => target.map((w) => (w.length > 1 ? jumble([...w]).join("") : w)),
    [target],
  );

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [wrong, setWrong] = useState(false);
  const [solved, setSolved] = useState(0);

  const done = index >= target.length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (normaliseAnswer(value) === normaliseAnswer(target[index])) {
      setSolved((s) => s + 1);
      setIndex((i) => i + 1);
      setValue("");
      setWrong(false);
    } else {
      setWrong(true);
    }
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Anagrams"
      status={
        <div className="text-sm text-slate-200">
          {solved} / {target.length}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-2xl">
        <div className="bg-white rounded-lg shadow p-4 w-full leading-relaxed">
          {target.map((w, i) => (
            <span key={i} className={i === index ? "font-bold" : ""}>
              {i < index ? w : i === index ? scrambled[i] : "•".repeat(w.length)}{" "}
            </span>
          ))}
        </div>

        {done ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-leaf-700">All unscrambled! 🎉</div>
            <button
              onClick={() => {
                setIndex(0);
                setSolved(0);
              }}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col items-center gap-3 w-80">
            <div className="text-3xl font-mono tracking-widest uppercase">
              {scrambled[index]}
            </div>
            <input
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setWrong(false);
              }}
              className={`w-full rounded-lg border-2 px-4 py-3 text-lg text-center outline-none ${
                wrong ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-cga-400"
              }`}
              placeholder="Unscramble it…"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIndex((i) => i + 1);
                  setValue("");
                  setWrong(false);
                }}
                className="rounded bg-slate-200 hover:bg-slate-300 px-4 py-2 text-sm font-medium"
              >
                Skip
              </button>
              <button
                type="submit"
                className="rounded bg-cga-600 hover:bg-cga-700 text-white px-5 py-2 font-semibold"
              >
                Check
              </button>
            </div>
          </form>
        )}
      </div>
    </GameShell>
  );
}
