import { useMemo } from "react";
import { SideView } from "../components/SideView";
import { buildChoices } from "../lib/quiz";
import { shuffle } from "../lib/shuffle";
import { anagram, blankLetters, buildWordsearch } from "../lib/wordsearch";
import { sideText, type Pair, type Side } from "../types";

export interface SheetProps {
  pairs: Pair[];
  leftLabel: string;
  rightLabel: string;
  showAnswers: boolean;
}

/** Small wrapper so printed stimuli keep a sane size on paper. */
function Stim({ side, className = "" }: { side: Side; className?: string }) {
  return (
    <SideView side={side} className={className} imageClassName="max-h-20 inline-block" />
  );
}

function Rule() {
  return <span className="inline-block border-b border-slate-400 print-rule flex-1 min-w-24" />;
}

export function MatchingSheet({ pairs, leftLabel, rightLabel, showAnswers }: SheetProps) {
  // Right column shuffled; the number beside each left item is the answer.
  // Memoised on `pairs` alone so toggling the answer key reveals the numbers
  // for the sheet already printed rather than reshuffling it.
  const { shuffledRight, answerFor } = useMemo(() => {
    const order = shuffle(pairs.map((p, i) => ({ pair: p, originalIndex: i })));
    return {
      shuffledRight: order,
      answerFor: new Map(order.map((entry, position) => [entry.pair.id, position + 1])),
    };
  }, [pairs]);

  return (
    <div className="grid grid-cols-2 gap-x-10">
      <div>
        <h3 className="font-bold mb-2 border-b-2 border-slate-800 print-rule">
          {leftLabel}
        </h3>
        <ol className="flex flex-col gap-2">
          {pairs.map((p) => (
            <li key={p.id} className="flex items-center gap-2 print-keep">
              <span className="w-7 h-7 border-2 border-slate-400 print-rule rounded grid place-items-center text-sm shrink-0">
                {showAnswers ? answerFor.get(p.id) : ""}
              </span>
              <Stim side={p.left} />
            </li>
          ))}
        </ol>
      </div>
      <div>
        <h3 className="font-bold mb-2 border-b-2 border-slate-800 print-rule">
          {rightLabel}
        </h3>
        <ol className="flex flex-col gap-2">
          {shuffledRight.map((entry, i) => (
            <li key={entry.pair.id} className="flex items-center gap-2 print-keep">
              <span className="w-7 shrink-0 text-sm text-slate-500">{i + 1}.</span>
              <Stim side={entry.pair.right} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export function MultiMatchSheet({ pairs, showAnswers }: SheetProps) {
  // Options are drawn once per pairs list, so ticking the answer key marks
  // the same three options the students were given.
  const choicesByPair = useMemo(
    () => new Map(pairs.map((p) => [p.id, buildChoices(pairs, p, 3)])),
    [pairs],
  );
  return (
    <ol className="flex flex-col gap-4">
      {pairs.map((p, i) => {
        const choices = choicesByPair.get(p.id) ?? [];
        return (
          <li key={p.id} className="print-keep">
            <div className="flex items-start gap-2">
              <span className="text-sm text-slate-500 w-6 shrink-0">{i + 1}.</span>
              <div className="flex-1">
                <div className="font-medium mb-1">
                  <Stim side={p.left} />
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 pl-2">
                  {choices.map((c, j) => (
                    <span key={j} className="flex items-center gap-1.5">
                      <span
                        className={`w-4 h-4 rounded-full border-2 border-slate-400 print-rule inline-block ${
                          showAnswers && c.isCorrect ? "bg-slate-800" : ""
                        }`}
                      />
                      <Stim side={c.side} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function MissingLettersSheet({ pairs, showAnswers }: SheetProps) {
  // Which letters are blanked is fixed per pairs list, so the answer key
  // corresponds to the gaps the students actually got.
  const blanked = useMemo(
    () => new Map(pairs.map((p) => [p.id, blankLetters(sideText(p.right))])),
    [pairs],
  );
  return (
    <ol className="flex flex-col gap-3">
      {pairs.map((p, i) => {
        const answer = sideText(p.right);
        return (
          <li key={p.id} className="flex items-center gap-3 print-keep">
            <span className="text-sm text-slate-500 w-6 shrink-0">{i + 1}.</span>
            <span className="w-1/2">
              <Stim side={p.left} />
            </span>
            <span className="font-mono tracking-widest text-lg">
              {showAnswers ? answer : blanked.get(p.id)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function AnagramsSheet({ pairs, showAnswers }: SheetProps) {
  // Jumbles are fixed per pairs list, so the answer key solves the same
  // anagrams that were printed.
  const jumbled = useMemo(
    () => new Map(pairs.map((p) => [p.id, anagram(sideText(p.right))])),
    [pairs],
  );
  return (
    <ol className="flex flex-col gap-3">
      {pairs.map((p, i) => {
        const answer = sideText(p.right);
        return (
          <li key={p.id} className="flex items-center gap-3 print-keep">
            <span className="text-sm text-slate-500 w-6 shrink-0">{i + 1}.</span>
            <span className="w-1/3">
              <Stim side={p.left} />
            </span>
            <span className="font-mono tracking-widest text-lg uppercase">
              {jumbled.get(p.id)}
            </span>
            <span className="flex-1 flex items-center">
              {showAnswers ? (
                <span className="font-semibold">{answer}</span>
              ) : (
                <Rule />
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function WordsearchSheet({ pairs, showAnswers }: SheetProps) {
  // The grid is built once per pairs list — regenerating it when the answer
  // key is ticked would highlight words in a puzzle nobody was given.
  const { grid, placements, skipped } = useMemo(
    () => buildWordsearch(pairs.map((p) => sideText(p.right)).filter(Boolean)),
    [pairs],
  );

  // Cells that form a placed word, so the answer key can highlight them.
  const solution = new Set<string>();
  for (const pl of placements) {
    for (let i = 0; i < pl.normalised.length; i++) {
      solution.add(`${pl.row + pl.dRow * i},${pl.col + pl.dCol * i}`);
    }
  }
  const placedWords = new Set(placements.map((p) => p.word));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center">
        <table className="border-collapse">
          <tbody>
            {grid.map((row, r) => (
              <tr key={r}>
                {row.map((ch, c) => {
                  const inSolution = showAnswers && solution.has(`${r},${c}`);
                  return (
                    <td
                      key={c}
                      className={`w-7 h-7 text-center font-mono text-sm border border-slate-300 print-rule ${
                        inSolution ? "bg-slate-800 text-white font-bold" : ""
                      }`}
                    >
                      {ch}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="font-bold mb-2">Find the {pairs.length > 0 ? "translation of" : ""}:</h3>
        <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm">
          {pairs
            .filter((p) => placedWords.has(sideText(p.right)))
            .map((p) => (
              <span key={p.id} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 border border-slate-400 print-rule shrink-0" />
                <Stim side={p.left} />
                {showAnswers && (
                  <span className="text-slate-500"> → {sideText(p.right)}</span>
                )}
              </span>
            ))}
        </div>
        {skipped.length > 0 && (
          <p className="text-xs text-slate-400 mt-3 no-print">
            {skipped.length} word{skipped.length === 1 ? "" : "s"} wouldn't fit in the
            grid and {skipped.length === 1 ? "was" : "were"} left out: {skipped.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Dominoes form a closed loop: each tile carries one pair's answer on the
 * left and the *next* pair's prompt on the right, so a correctly built
 * chain returns to the start. Tiles are shuffled for cutting out.
 */
export function DominoesSheet({ pairs }: SheetProps) {
  const tiles = useMemo(
    () =>
      shuffle(
        pairs.map((p, i) => ({
          id: p.id,
          answer: p.right,
          prompt: pairs[(i + 1) % pairs.length].left,
        })),
      ),
    [pairs],
  );

  return (
    <div className="grid grid-cols-2 gap-2">
      {tiles.map((t) => (
        <div
          key={t.id}
          className="border-2 border-slate-800 print-rule rounded flex items-stretch print-keep"
        >
          <div className="flex-1 p-2 text-center flex items-center justify-center min-h-14">
            <Stim side={t.answer} />
          </div>
          <div className="w-0.5 bg-slate-800 print-rule" />
          <div className="flex-1 p-2 text-center flex items-center justify-center min-h-14 font-semibold">
            <Stim side={t.prompt} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PelmanismCardsSheet({ pairs }: SheetProps) {
  const cards = useMemo(
    () =>
      shuffle(
        pairs.flatMap((p) => [
          { key: `${p.id}-l`, side: p.left },
          { key: `${p.id}-r`, side: p.right },
        ]),
      ),
    [pairs],
  );
  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map((c) => (
        <div
          key={c.key}
          className="border-2 border-dashed border-slate-500 print-rule rounded h-24 flex items-center justify-center p-2 text-center print-keep"
        >
          <Stim side={c.side} />
        </div>
      ))}
    </div>
  );
}

export function VocabListSheet({ pairs, leftLabel, rightLabel }: SheetProps) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left border-b-2 border-slate-800 print-rule pb-1 w-1/2">
            {leftLabel}
          </th>
          <th className="text-left border-b-2 border-slate-800 print-rule pb-1">
            {rightLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {pairs.map((p) => (
          <tr key={p.id} className="print-keep">
            <td className="border-b border-slate-200 print-rule py-1.5 pr-3 align-top">
              <Stim side={p.left} />
            </td>
            <td className="border-b border-slate-200 print-rule py-1.5 align-top">
              <Stim side={p.right} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TestSheet({ pairs, showAnswers }: SheetProps) {
  return (
    <ol className="flex flex-col gap-1">
      {pairs.map((p, i) => (
        <li key={p.id} className="flex items-baseline gap-3 py-2 print-keep">
          <span className="text-sm text-slate-500 w-6 shrink-0">{i + 1}.</span>
          <span className="w-2/5">
            <Stim side={p.left} />
          </span>
          {showAnswers ? (
            <span className="flex-1 font-semibold">{sideText(p.right)}</span>
          ) : (
            <Rule />
          )}
        </li>
      ))}
    </ol>
  );
}
