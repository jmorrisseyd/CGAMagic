import { useMemo, useState } from "react";
import { GameShell } from "../games/GameShell";
import { jumble } from "../lib/mixgap";
import type { MixGapSet } from "../types";

/**
 * Find it!: the teacher highlights a span of the passage and writes a
 * prompt for it; the student reads the prompt and highlights the matching
 * text. Selection is compared by character range, tolerating a little
 * slack at the edges so catching an adjacent space isn't marked wrong.
 */
export function FindIt({ set }: { set: MixGapSet }) {
  const prompts = useMemo(() => jumble(set.findIt), [set.findIt]);
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"right" | "wrong" | null>(null);

  const current = prompts[index];
  const done = index >= prompts.length;

  function checkSelection() {
    if (!current) return;
    const selection = window.getSelection();
    const text = selection?.toString() ?? "";
    if (!text.trim()) return;

    const expected = set.text.slice(current.start, current.end);
    // Compare on trimmed text rather than exact offsets: a student dragging
    // across a phrase routinely picks up a leading or trailing space.
    const ok = text.trim() === expected.trim();
    setFeedback(ok ? "right" : "wrong");
    if (ok) {
      setSolved((s) => [...s, current.id]);
      window.setTimeout(() => {
        setFeedback(null);
        selection?.removeAllRanges();
        setIndex((i) => i + 1);
      }, 700);
    } else {
      window.setTimeout(() => setFeedback(null), 700);
    }
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Find it!"
      status={
        <div className="text-sm text-slate-200">
          {solved.length} / {prompts.length}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-5 w-full max-w-3xl">
        {done ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-2xl font-bold text-leaf-700">All found! 🎉</div>
            <button
              onClick={() => {
                setIndex(0);
                setSolved([]);
              }}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <>
            <div className="bg-cga-50 border border-cga-200 rounded-lg px-5 py-4 w-full">
              <div className="text-xs uppercase tracking-wide text-cga-700 mb-1">
                Find the part of the text that means
              </div>
              <div className="text-lg font-semibold">{current.prompt}</div>
            </div>

            <p
              onMouseUp={checkSelection}
              className={`bg-white rounded-lg shadow p-5 w-full text-lg leading-loose select-text cursor-text ${
                feedback === "right"
                  ? "ring-2 ring-leaf-400"
                  : feedback === "wrong"
                    ? "ring-2 ring-red-400"
                    : ""
              }`}
            >
              {set.text}
            </p>

            <div className="text-sm h-5">
              {feedback === "right" && (
                <span className="text-leaf-700 font-semibold">That's it ✓</span>
              )}
              {feedback === "wrong" && (
                <span className="text-red-600">Not quite — try again</span>
              )}
              {!feedback && (
                <span className="text-slate-400">
                  Highlight the text with your mouse to answer
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </GameShell>
  );
}

/** Comprehension: the teacher's multiple-choice questions on the passage. */
export function Comprehension({ set }: { set: MixGapSet }) {
  const questions = useMemo(() => jumble(set.comprehension), [set.comprehension]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const current = questions[index];
  const done = index >= questions.length;

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    if (i === current.correctIndex) setScore((s) => s + 1);
    window.setTimeout(() => {
      setPicked(null);
      setIndex((n) => n + 1);
    }, 1100);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Comprehension"
      status={
        <div className="text-sm text-slate-200">
          Score: {score}/{questions.length}
        </div>
      }
    >
      <div className="flex flex-col gap-5 w-full max-w-3xl">
        {/* The passage stays on screen — it's reading comprehension, not recall. */}
        <p className="bg-white rounded-lg shadow p-5 leading-relaxed text-slate-700">
          {set.text}
        </p>

        {done ? (
          <div className="text-center flex flex-col items-center gap-3">
            <div className="text-3xl font-bold">
              {score} / {questions.length}
            </div>
            <button
              onClick={() => {
                setIndex(0);
                setScore(0);
              }}
              className="rounded-lg bg-cga-600 hover:bg-cga-700 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="text-sm text-slate-500">
              Question {index + 1} of {questions.length}
            </div>
            <div className="text-xl font-semibold">{current.prompt}</div>
            {current.options.map((option, i) => {
              const revealed = picked !== null;
              const isCorrect = i === current.correctIndex;
              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  disabled={revealed}
                  className={`rounded-lg px-5 py-3 font-medium text-left ${
                    revealed && isCorrect
                      ? "bg-leaf-100 text-leaf-800"
                      : revealed && picked === i
                        ? "bg-red-100 text-red-800"
                        : "bg-white hover:bg-cga-50 shadow"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </GameShell>
  );
}
