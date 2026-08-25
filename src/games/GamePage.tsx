import { Navigate, useParams } from "react-router-dom";
import { useState } from "react";
import { getSet } from "../storage/sets";
import type { TextMatchSet } from "../types";
import { gameInfo } from "./registry";
import { Flashcards } from "./Flashcards";
import { DragMatch } from "./DragMatch";
import { ThreeInARow } from "./ThreeInARow";
import { Pelmanism } from "./Pelmanism";
import { AgainstTheClock } from "./AgainstTheClock";
import { TowerBlock } from "./TowerBlock";
import { TypeGame } from "./TypeGame";
import { Hangman } from "./Hangman";

export function GamePage() {
  const { setId, gameId } = useParams<{ setId: string; gameId: string }>();
  const [set] = useState<TextMatchSet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );

  if (!setId || !gameId || !set) return <Navigate to="/" replace />;
  const info = gameInfo(gameId);
  if (!info) return <Navigate to={`/play/${setId}`} replace />;
  if (set.pairs.length < info.minPairs) return <Navigate to={`/play/${setId}`} replace />;

  switch (gameId) {
    case "flashcards":
      return <Flashcards set={set} />;
    case "drag-match":
      return <DragMatch set={set} />;
    case "three-in-a-row":
      return <ThreeInARow set={set} />;
    case "pelmanism":
      return <Pelmanism set={set} />;
    case "against-the-clock":
      return <AgainstTheClock set={set} />;
    case "tower-block":
      return <TowerBlock set={set} />;
    case "type":
      return <TypeGame set={set} />;
    case "hangman":
      return <Hangman set={set} />;
    default:
      return <Navigate to={`/play/${setId}`} replace />;
  }
}
