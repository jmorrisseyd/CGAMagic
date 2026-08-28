import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { toPlayable } from "../lib/compile";
import { getSet } from "../storage/sets";
import { isTextSide, type AnySet } from "../types";
import { AgainstTheClock } from "./AgainstTheClock";
import { DragMatch } from "./DragMatch";
import { Flashcards } from "./Flashcards";
import { Football } from "./Football";
import { Hangman } from "./Hangman";
import { Invaders } from "./Invaders";
import { MultiChoiceQuiz } from "./MultiChoiceQuiz";
import { MultiMatch } from "./MultiMatch";
import { Oxo } from "./Oxo";
import { Pelmanism } from "./Pelmanism";
import { ThreeInARow } from "./ThreeInARow";
import { TowerBlock } from "./TowerBlock";
import { Trainer } from "./Trainer";
import { TrueOrFalse } from "./TrueOrFalse";
import { TypeGame } from "./TypeGame";
import { gameInfo } from "./registry";
import { Anagrams, SpaceGame } from "../mixgap/SpaceAndAnagrams";
import { Comprehension, FindIt } from "../mixgap/FindItAndComprehension";
import { Gaps } from "../mixgap/Gaps";
import { NextWord, OneInThree, TextMix } from "../mixgap/Reconstruct";
import { Tile } from "../mixgap/Tile";

export function GamePage() {
  const { setId, gameId } = useParams<{ setId: string; gameId: string }>();
  const [set] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );

  if (!setId || !gameId || !set) return <Navigate to="/" replace />;

  if (set.kind === "mixgap") {
    switch (gameId) {
      case "tile-3": return <Tile set={set} size={3} />;
      case "tile-4": return <Tile set={set} size={4} />;
      case "tile-5": return <Tile set={set} size={5} />;
      case "text-mix": return <TextMix set={set} />;
      case "next-word": return <NextWord set={set} />;
      case "one-in-three": return <OneInThree set={set} />;
      case "space": return <SpaceGame set={set} />;
      case "anagrams": return <Anagrams set={set} />;
      case "gap-fill": return <Gaps set={set} mode="gap-fill" />;
      case "multi-gaps": return <Gaps set={set} mode="multi-gaps" />;
      case "write-gaps": return <Gaps set={set} mode="write-gaps" />;
      case "find-it": return <FindIt set={set} />;
      case "comprehension": return <Comprehension set={set} />;
      default: return <Navigate to={`/play/${setId}`} replace />;
    }
  }

  if (set.kind === "multichoice") {
    return gameId === "multi-choice-quiz" ? (
      <MultiChoiceQuiz set={set} />
    ) : (
      <Navigate to={`/play/${setId}/multi-choice-quiz`} replace />
    );
  }

  const playable = toPlayable(set);
  if (!playable) return <Navigate to={`/play/${setId}`} replace />;

  const info = gameInfo(gameId);
  if (!info) return <Navigate to={`/play/${setId}`} replace />;
  if (playable.pairs.length < info.minPairs) {
    return <Navigate to={`/play/${setId}`} replace />;
  }
  // Typing games need a text answer on at least one side to be playable.
  if (
    info.needsTextAnswer &&
    !playable.pairs.some((p) => isTextSide(p.left) || isTextSide(p.right))
  ) {
    return <Navigate to={`/play/${setId}`} replace />;
  }

  switch (gameId) {
    case "flashcards":
      return <Flashcards set={playable} />;
    case "multi-match":
      return <MultiMatch set={playable} />;
    case "drag-match":
      return <DragMatch set={playable} />;
    case "three-in-a-row":
      return <ThreeInARow set={playable} />;
    case "pelmanism":
      return <Pelmanism set={playable} />;
    case "against-the-clock":
      return <AgainstTheClock set={playable} />;
    case "true-or-false":
      return <TrueOrFalse set={playable} />;
    case "tower-block":
      return <TowerBlock set={playable} />;
    case "invaders":
      return <Invaders set={playable} />;
    case "football":
      return <Football set={playable} />;
    case "oxo":
      return <Oxo set={playable} />;
    case "type":
      return <TypeGame set={playable} />;
    case "hangman":
      return <Hangman set={playable} />;
    case "trainer":
      return <Trainer set={playable} />;
    default:
      return <Navigate to={`/play/${setId}`} replace />;
  }
}
