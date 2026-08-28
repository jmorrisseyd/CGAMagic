import { useState } from "react";
import { SideView } from "../components/SideView";
import type { PlayableSet } from "../lib/compile";
import { shuffle } from "../lib/shuffle";
import { sideText, type Pair } from "../types";
import { GameShell } from "./GameShell";

type Mode = "practice" | "test";
type Direction = "leftToRight" | "rightToLeft";

interface Result {
  pair: Pair;
  given: string;
  expected: string;
  correct: boolean;
}

function normalize(s: string, caseSensitive: boolean): string {
  const trimmed = s.trim();
  return caseSensitive ? trimmed : trimmed.toLowerCase();
}

/**
 * Two activities in one, as in the original: practice gives hints and lets
 * you retry until it sticks; test gives no feedback until the end and
 * produces a printable score sheet.
 */
export function Trainer({ set }: { set: PlayableSet }) {
  const [mode, setMode] = useState<Mode>("practice");
  const [direction, setDirection] = useState<Direction>("leftToRight");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [started, setStarted] = useState(false);
  const [items, setItems] = useState<Pair[]>(() => shuffle(set.pairs));
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [feedback, setFeedback] = useState<"right" | "wrong" | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [done, setDone] = useState(false);

  const current = items[index];
  const promptSide = direction === "leftToRight" ? current?.left : current?.right;
  const answerSide = direction === "leftToRight" ? current?.right : current?.left;
  const expected = answerSide ? sideText(answerSide) : "";

  function start(nextMode: Mode) {
    setMode(nextMode);
    setItems(shuffle(set.pairs));
    setIndex(0);
    setValue("");
    setResults([]);
    setFeedback(null);
    setRevealed(0);
    setDone(false);
    setStarted(true);
  }

  function record(correct: boolean) {
    setResults((r) => [...r, { pair: current, given: value, expected, correct }]);
  }

  function advance() {
    setValue("");
    setFeedback(null);
    setRevealed(0);
    if (index + 1 >= items.length) setDone(true);
    else setIndex((i) => i + 1);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const correct =
      normalize(value, caseSensitive) === normalize(expected, caseSensitive);

    if (mode === "test") {
      record(correct);
      advance();
      return;
    }

    if (correct) {
      record(true);
      setFeedback("right");
      window.setTimeout(advance, 700);
    } else {
      setFeedback("wrong");
    }
  }

  function skip() {
    record(false);
    advance();
  }

  const score = results.filter((r) => r.correct).length;

  if (!started) {
    return (
      <GameShell setId={set.id} setTitle={set.title} gameName="Trainer">
        <div className="flex flex-col items-center gap-6 max-w-md">
          <div className="flex flex-col gap-3 w-full bg-white rounded-xl shadow p-5">
            <button
              onClick={() =>
                setDirection(
                  direction === "leftToRight" ? "rightToLeft" : "leftToRight",
                )
              }
              className="text-sm text-slate-500 underline self-start"
            >
              Answer in:{" "}
              {direction === "leftToRight" ? set.rightLabel : set.leftLabel} (click to
              switch)
            </button>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Case sensitive marking
            </label>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => start("practice")}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-4"
            >
              Practice
              <div className="text-xs font-normal opacity-80">Hints and retries</div>
            </button>
            <button
              onClick={() => start("test")}
              className="rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-4"
            >
              Test
              <div className="text-xs font-normal opacity-80">No feedback, scored</div>
            </button>
          </div>
        </div>
      </GameShell>
    );
  }

  if (done) {
    return (
      <GameShell setId={set.id} setTitle={set.title} gameName="Trainer">
        <div className="flex flex-col items-center gap-5 w-full max-w-2xl">
          <div className="text-3xl font-bold">
            {score} / {results.length}
          </div>
          <div className="text-slate-500 capitalize">{mode} complete</div>
          <div className="w-full bg-white rounded-xl shadow divide-y print:shadow-none">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2 text-sm">
                <span className={r.correct ? "text-green-600" : "text-red-600"}>
                  {r.correct ? "✓" : "✗"}
                </span>
                <span className="flex-1">
                  <SideView
                    side={direction === "leftToRight" ? r.pair.left : r.pair.right}
                    imageClassName="max-h-10"
                  />
                </span>
                {!r.correct && (
                  <span className="text-slate-400 line-through">
                    {r.given || "(blank)"}
                  </span>
                )}
                <span className="font-medium">{r.expected}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 print:hidden">
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-slate-100 hover:bg-slate-200 px-5 py-3 font-medium"
            >
              Print results
            </button>
            <button
              onClick={() => setStarted(false)}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
            >
              Again
            </button>
          </div>
        </div>
      </GameShell>
    );
  }

  const hint =
    revealed > 0 ? expected.slice(0, revealed).padEnd(expected.length, "·") : null;

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName={`Trainer — ${mode}`}
      status={
        <div className="text-sm text-slate-200">
          {index + 1} / {items.length}
          {mode === "practice" && ` · ${score} right`}
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col items-center gap-5 w-96">
        <div className="text-2xl font-bold bg-white shadow rounded-lg px-6 py-5 w-full text-center min-h-24 flex items-center justify-center">
          {promptSide && <SideView side={promptSide} imageClassName="max-h-40" />}
        </div>

        {hint && (
          <div className="font-mono text-xl tracking-widest text-slate-400">{hint}</div>
        )}

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`w-full rounded-lg border-2 px-4 py-3 text-lg text-center outline-none ${
            feedback === "right"
              ? "border-green-400 bg-green-50"
              : feedback === "wrong"
                ? "border-red-400 bg-red-50"
                : "border-slate-300 focus:border-blue-400"
          }`}
          placeholder="Type your answer..."
        />

        {feedback === "wrong" && (
          <div className="text-red-600 text-sm">Not quite — try again.</div>
        )}

        <div className="flex gap-3">
          {mode === "practice" && (
            <button
              type="button"
              onClick={() => setRevealed((r) => Math.min(r + 1, expected.length))}
              className="rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 px-4 py-2 font-medium"
            >
              Hint
            </button>
          )}
          <button
            type="button"
            onClick={skip}
            className="rounded-lg bg-slate-200 hover:bg-slate-300 px-4 py-2 font-medium"
          >
            Skip
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2"
          >
            {mode === "test" ? "Next" : "Check"}
          </button>
        </div>
      </form>
    </GameShell>
  );
}
