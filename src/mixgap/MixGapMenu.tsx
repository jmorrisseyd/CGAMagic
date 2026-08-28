import { Link } from "react-router-dom";
import { wordCount } from "../lib/mixgap";
import type { MixGapSet } from "../types";
import { MIXGAP_ACTIVITIES, unavailableReason } from "./registry";

/** Activity menu for a Mix & Gap set, mirroring the match-set play menu. */
export function MixGapMenu({ set }: { set: MixGapSet }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-cga-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-300">
            Mix &amp; Gap
          </div>
          <h1 className="text-xl font-bold truncate">{set.title}</h1>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to={`/edit/${set.id}`}
            className="rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            Edit
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
          {wordCount(set.text)} words &middot; {set.gaps.length} gap
          {set.gaps.length === 1 ? "" : "s"} &middot; {set.comprehension.length} question
          {set.comprehension.length === 1 ? "" : "s"}
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {MIXGAP_ACTIVITIES.map((a) => {
            const blocked = unavailableReason(a, set);
            const card = (
              <div
                className={`h-full rounded-xl p-5 border ${
                  blocked
                    ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed"
                    : "bg-white border-slate-200 hover:border-cga-400 hover:shadow"
                }`}
              >
                <h2 className="font-semibold text-lg mb-1">{a.name}</h2>
                <p className="text-sm text-slate-500">{a.description}</p>
                {blocked && (
                  <p className="text-xs text-amber-600 mt-2">{blocked}</p>
                )}
              </div>
            );
            return blocked ? (
              <div key={a.id}>{card}</div>
            ) : (
              <Link key={a.id} to={`/play/${set.id}/${a.id}`}>
                {card}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
