import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function GameShell({
  setId,
  setTitle,
  gameName,
  status,
  children,
}: {
  setId: string;
  setTitle: string;
  gameName: string;
  status?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-slate-300">
            {setTitle}
          </div>
          <h1 className="text-lg font-semibold truncate">{gameName}</h1>
        </div>
        <div className="flex items-center gap-4">
          {status}
          <Link
            to={`/play/${setId}`}
            className="shrink-0 rounded bg-slate-600 hover:bg-slate-500 px-3 py-2 text-sm font-medium"
          >
            Exit to menu
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
