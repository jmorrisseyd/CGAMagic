import { useState } from "react";
import { Link } from "react-router-dom";
import { shuffle } from "../lib/shuffle";
import type { MultiChoiceQuestion, MultiChoiceSet } from "../types";
import { GameShell } from "./GameShell";

interface Asked {
  question: MultiChoiceQuestion;
  /** Option indices in display order, so shuffling doesn't lose the answer. */
  order: number[];
}

function prepare(questions: MultiChoiceQuestion[]): Asked[] {
  return shuffle(questions).map((question) => ({
    question,
    order: shuffle(question.options.map((_, i) => i)),
  }));
}

export function MultiChoiceQuiz({ set }: { set: MultiChoiceSet }) {
  const [asked, setAsked] = useState<Asked[]>(() => prepare(set.questions));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current = asked[index];

  // A set with no questions has nothing to render — say so rather than
  // crashing on current.question.
  if (!current && !done) {
    return (
      <GameShell setId={set.id} setTitle={set.title} gameName="Multi-Choice">
        <div className="text-center flex flex-col items-center gap-4">
          <p className="text-slate-500">
            This set has no questions yet.
          </p>
          <Link
            to={`/edit/${set.id}`}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
          >
            Add questions →
          </Link>
        </div>
      </GameShell>
    );
  }

  function restart() {
    setAsked(prepare(set.questions));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  function pick(optionIndex: number) {
    if (picked !== null) return;
    setPicked(optionIndex);
    if (optionIndex === current.question.correctIndex) setScore((s) => s + 1);
    window.setTimeout(() => {
      setPicked(null);
      if (index + 1 >= asked.length) setDone(true);
      else setIndex((i) => i + 1);
    }, 1100);
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Multi-Choice"
      status={
        <div className="text-sm text-slate-200">
          Score: {score}/{asked.length}
        </div>
      }
    >
      {done ? (
        <div className="text-center flex flex-col items-center gap-4">
          <div className="text-3xl font-bold">
            {score} / {asked.length}
          </div>
          <button
            onClick={restart}
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
          >
            Play again
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
          <div className="text-sm text-slate-500">
            Question {index + 1} of {asked.length}
          </div>
          <div className="text-2xl font-bold bg-white shadow rounded-xl px-8 py-6 w-full text-center">
            {current.question.prompt}
          </div>
          <div className="flex flex-col gap-3 w-full">
            {current.order.map((optionIndex) => {
              const isCorrect = optionIndex === current.question.correctIndex;
              const revealed = picked !== null;
              return (
                <button
                  key={optionIndex}
                  onClick={() => pick(optionIndex)}
                  disabled={revealed}
                  className={`rounded-lg px-5 py-4 font-medium text-lg text-left ${
                    revealed && isCorrect
                      ? "bg-green-100 text-green-800"
                      : revealed && picked === optionIndex
                        ? "bg-red-100 text-red-800"
                        : "bg-white hover:bg-slate-50 shadow"
                  }`}
                >
                  {current.question.options[optionIndex]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </GameShell>
  );
}
