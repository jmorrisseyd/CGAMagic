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
import { MultiMatch } from "./MultiMatch";
import { Oxo } from "./Oxo";
import { Pelmanism } from "./Pelmanism";
import { ThreeInARow } from "./ThreeInARow";
import { TowerBlock } from "./TowerBlock";
import { Trainer } from "./Trainer";
import { TrueOrFalse } from "./TrueOrFalse";
import { TypeGame } from "./TypeGame";
import { gameInfo } from "./registry";

export function GamePage() {
  const { setId, gameId } = useParams<{ setId: string; gameId: string }>();
  const [set] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );

  if (!setId || !gameId || !set) return <Navigate to="/" replace />;

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
