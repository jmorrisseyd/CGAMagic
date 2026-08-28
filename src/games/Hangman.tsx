import { useState } from "react";
import type { PlayableSet } from "../lib/compile";
import { sample } from "../lib/shuffle";
import { isTextSide, sideText, type Pair } from "../types";
import { GameShell } from "./GameShell";

const MAX_WORDS = 16;
const MAX_WRONG = 6;
const ALPHABET = "abcdefghijklmnopqrstuvwxyz".split("");
const ACCENTED = "àâäéèêëîïôöùûüçñ".split("");

type Direction = "leftToRight" | "rightToLeft";

/** A side is only guessable if it's written text — you can't spell a picture. */
function sideIsSpellable(pairs: PlayableSet["pairs"], which: "left" | "right") {
  return pairs.length > 0 && pairs.every((p) => isTextSide(p[which]));
}

export function Hangman({ set }: { set: PlayableSet }) {
  const leftSpellable = sideIsSpellable(set.pairs, "left");
  const rightSpellable = sideIsSpellable(set.pairs, "right");
  // Prefer guessing the left (target language) side, but fall back to the
  // right when the left is a picture or a sound — otherwise the secret is
  // empty and the round counts as won before it starts.
  const [direction, setDirection] = useState<Direction>(
    leftSpellable ? "rightToLeft" : "leftToRight",
  );
  const canSwitch = leftSpellable && rightSpellable;
  const [items, setItems] = useState<Pair[]>(() =>
    sample(set.pairs, Math.min(MAX_WORDS, set.pairs.length)),
  );
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState(0);
  const [saved, setSaved] = useState(0);
  const [hanged, setHanged] = useState(0);

  const current = items[index];
  const secret = sideText(direction === "leftToRight" ? current.right : current.left);
  const guessLabel = direction === "leftToRight" ? set.rightLabel : set.leftLabel;
  const secretLetters = new Set(
    secret.toLowerCase().split("").filter((c) => /[a-zàâäéèêëîïôöùûüçñ]/.test(c)),
  );
  const won = [...secretLetters].every((l) => guessed.has(l));
  const lost = wrong >= MAX_WRONG;
  const roundOver = won || lost;
  const allDone = index + 1 >= items.length && roundOver;

  function newGame(nextDirection: Direction = direction) {
    setDirection(nextDirection);
    setItems(sample(set.pairs, Math.min(MAX_WORDS, set.pairs.length)));
    setIndex(0);
    setGuessed(new Set());
    setWrong(0);
    setSaved(0);
    setHanged(0);
  }

  function switchDirection() {
    newGame(direction === "leftToRight" ? "rightToLeft" : "leftToRight");
  }

  function guess(letter: string) {
    if (roundOver || guessed.has(letter)) return;
    const next = new Set(guessed).add(letter);
    setGuessed(next);
    if (!secretLetters.has(letter)) setWrong((w) => w + 1);
  }

  function nextWord() {
    if (won) setSaved((s) => s + 1);
    if (lost) setHanged((h) => h + 1);
    if (index + 1 < items.length) {
      setIndex((i) => i + 1);
      setGuessed(new Set());
      setWrong(0);
    }
  }

  return (
    <GameShell
      setId={set.id}
      setTitle={set.title}
      gameName="Hangman"
      status={
        <div className="text-sm text-slate-200">
          Saved: {saved} &middot; Hanged: {hanged}
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-lg">
        {allDone ? (
          <div className="text-center flex flex-col items-center gap-4">
            <div className="text-3xl font-bold">All words done! 🎉</div>
            <div className="text-lg text-slate-600">
              Saved {saved}, hanged {hanged}, of {items.length}.
            </div>
            <button
              onClick={() => newGame()}
              className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
            >
              Play again
            </button>
          </div>
        ) : (
          <>
            {canSwitch ? (
              <button
                type="button"
                onClick={switchDirection}
                className="text-sm text-slate-500 underline"
              >
                Guessing: {guessLabel} (click to switch)
              </button>
            ) : (
              <span className="text-sm text-slate-500">Guessing: {guessLabel}</span>
            )}
            <div className="text-sm text-slate-500">
              Word {index + 1} of {items.length}
            </div>
            <HangmanDrawing wrong={wrong} />
            <div className="text-3xl font-mono tracking-widest">
              {secret.split("").map((ch, i) => {
                const lower = ch.toLowerCase();
                const isLetter = /[a-zàâäéèêëîïôöùûüçñ]/.test(lower);
                const show = !isLetter || guessed.has(lower) || roundOver;
                return (
                  <span key={i} className="inline-block w-8 text-center border-b-4 border-slate-400 mx-0.5">
                    {show ? ch : " "}
                  </span>
                );
              })}
            </div>

            {roundOver ? (
              <div className="flex flex-col items-center gap-3">
                <div className={`text-xl font-bold ${won ? "text-green-700" : "text-red-700"}`}>
                  {won ? "Saved! 🎉" : `Hanged! The word was "${secret}"`}
                </div>
                <button
                  onClick={nextWord}
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3"
                >
                  Next word →
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-wrap gap-1 justify-center max-w-md">
                  {ALPHABET.map((l) => (
                    <LetterButton key={l} letter={l} guessed={guessed} onGuess={guess} secretLetters={secretLetters} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1 justify-center max-w-md">
                  {ACCENTED.map((l) => (
                    <LetterButton key={l} letter={l} guessed={guessed} onGuess={guess} secretLetters={secretLetters} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

function LetterButton({
  letter,
  guessed,
  onGuess,
  secretLetters,
}: {
  letter: string;
  guessed: Set<string>;
  onGuess: (l: string) => void;
  secretLetters: Set<string>;
}) {
  const isGuessed = guessed.has(letter);
  const correct = isGuessed && secretLetters.has(letter);
  return (
    <button
      onClick={() => onGuess(letter)}
      disabled={isGuessed}
      className={`w-8 h-8 rounded text-sm font-semibold uppercase ${
        isGuessed
          ? correct
            ? "bg-green-200 text-green-700"
            : "bg-red-200 text-red-700"
          : "bg-white hover:bg-slate-100 shadow"
      }`}
    >
      {letter}
    </button>
  );
}

function HangmanDrawing({ wrong }: { wrong: number }) {
  return (
    <svg width="140" height="150" viewBox="0 0 140 150" className="text-slate-700">
      <line x1="10" y1="140" x2="90" y2="140" stroke="currentColor" strokeWidth="4" />
      <line x1="30" y1="140" x2="30" y2="10" stroke="currentColor" strokeWidth="4" />
      <line x1="30" y1="10" x2="90" y2="10" stroke="currentColor" strokeWidth="4" />
      <line x1="90" y1="10" x2="90" y2="30" stroke="currentColor" strokeWidth="4" />
      {wrong >= 1 && <circle cx="90" cy="42" r="12" stroke="currentColor" strokeWidth="3" fill="none" />}
      {wrong >= 2 && <line x1="90" y1="54" x2="90" y2="90" stroke="currentColor" strokeWidth="3" />}
      {wrong >= 3 && <line x1="90" y1="62" x2="72" y2="78" stroke="currentColor" strokeWidth="3" />}
      {wrong >= 4 && <line x1="90" y1="62" x2="108" y2="78" stroke="currentColor" strokeWidth="3" />}
      {wrong >= 5 && <line x1="90" y1="90" x2="74" y2="115" stroke="currentColor" strokeWidth="3" />}
      {wrong >= 6 && <line x1="90" y1="90" x2="106" y2="115" stroke="currentColor" strokeWidth="3" />}
    </svg>
  );
}
