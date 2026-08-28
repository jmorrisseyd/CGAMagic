import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { GAMES } from "../games/registry";
import { MixGapMenu } from "../mixgap/MixGapMenu";
import { toPlayable } from "../lib/compile";
import { getSet } from "../storage/sets";
import { isTextSide, type AnySet } from "../types";

export function PlayMenu() {
  const { setId } = useParams<{ setId: string }>();
  const [set] = useState<AnySet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );

  if (!setId || !set) return <Navigate to="/" replace />;

  // Mix & Gap has its own bank of activities rather than the match games.
  if (set.kind === "mixgap") return <MixGapMenu set={set} />;

  // Multi-Choice has a single bespoke activity, so skip the menu entirely.
  if (set.kind === "multichoice") {
    return <Navigate to={`/play/${setId}/multi-choice-quiz`} replace />;
  }

  const playable = toPlayable(set);
  if (!playable) return <Navigate to={`/edit/${setId}`} replace />;

  const hasTextAnswer = playable.pairs.some(
    (p) => isTextSide(p.left) || isTextSide(p.right),
  );

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-cga-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-300">
            {set.kind === "grid" ? "Grid Match" : "Match"}
          </div>
          <h1 className="text-xl font-bold truncate">{set.title}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to={`/worksheets/${setId}`}
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            🖨 Worksheets
          </Link>
          <Link
            to="/"
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            ← All sets
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <p className="text-slate-500 mb-6">
          {playable.pairs.length} pair{playable.pairs.length === 1 ? "" : "s"} &middot;{" "}
          {playable.leftLabel} ↔ {playable.rightLabel}
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {GAMES.map((g) => {
            const enoughPairs = playable.pairs.length >= g.minPairs;
            const typeable = !g.needsTextAnswer || hasTextAnswer;
            const enabled = enoughPairs && typeable;
            const content = (
              <div
                className={`h-full rounded-xl p-5 border ${
                  enabled
                    ? "bg-white border-slate-200 hover:border-cga-400 hover:shadow"
                    : "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <h2 className="font-semibold text-lg mb-1">{g.name}</h2>
                <p className="text-sm text-slate-500">{g.description}</p>
                {!enoughPairs && (
                  <p className="text-xs text-amber-600 mt-2">
                    Needs at least {g.minPairs} pairs
                  </p>
                )}
                {enoughPairs && !typeable && (
                  <p className="text-xs text-amber-600 mt-2">
                    Needs a text answer to type
                  </p>
                )}
              </div>
            );
            return enabled ? (
              <Link key={g.id} to={`/play/${setId}/${g.id}`}>
                {content}
              </Link>
            ) : (
              <div key={g.id}>{content}</div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
