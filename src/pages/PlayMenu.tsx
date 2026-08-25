import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { getSet } from "../storage/sets";
import type { TextMatchSet } from "../types";
import { GAMES } from "../games/registry";

export function PlayMenu() {
  const { setId } = useParams<{ setId: string }>();
  const [set] = useState<TextMatchSet | undefined>(() =>
    setId ? getSet(setId) : undefined,
  );

  if (!setId || !set) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-300">
            Text Match
          </div>
          <h1 className="text-xl font-bold">{set.title}</h1>
        </div>
        <Link
          to="/"
          className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
        >
          ← All sets
        </Link>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        <p className="text-slate-500 mb-6">
          {set.pairs.length} pair{set.pairs.length === 1 ? "" : "s"} &middot;{" "}
          {set.leftLabel} ↔ {set.rightLabel}
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {GAMES.map((g) => {
            const enabled = set.pairs.length >= g.minPairs;
            const content = (
              <div
                className={`h-full rounded-xl p-5 border ${
                  enabled
                    ? "bg-white border-slate-200 hover:border-blue-400 hover:shadow"
                    : "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                }`}
              >
                <h2 className="font-semibold text-lg mb-1">{g.name}</h2>
                <p className="text-sm text-slate-500">{g.description}</p>
                {!enabled && (
                  <p className="text-xs text-amber-600 mt-2">
                    Needs at least {g.minPairs} pairs
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
