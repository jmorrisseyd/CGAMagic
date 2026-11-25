import { useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useFitToScreen } from "../lib/useFitToScreen";

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
  const viewport = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useFitToScreen(viewport, content);

  return (
    // Exactly one screen tall, so the activity is sized to the window
    // rather than the window scrolling to the activity.
    // In print it flows normally again, so Trainer's printed results aren't
    // cut off at one screen.
    <div className="h-dvh bg-slate-100 flex flex-col overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* The header is sized in px, not rem, so it stays a slim bar while
          the activity below scales up to fill the screen. */}
      <header className="bg-cga-900 text-white px-[16px] py-[10px] flex items-center justify-between gap-[16px] shrink-0 print:hidden">
        <div className="min-w-0">
          <div className="text-[12px] uppercase tracking-wide text-slate-300">
            {setTitle}
          </div>
          <h1 className="text-[18px] leading-[24px] font-semibold truncate">{gameName}</h1>
        </div>
        <div className="flex items-center gap-[16px]">
          <div className="text-[16px] [&_*]:text-[16px]!">{status}</div>
          <Link
            to={`/play/${setId}`}
            className="shrink-0 rounded bg-slate-600 hover:bg-slate-500 px-[12px] py-[8px] text-[14px] font-medium"
          >
            Exit to menu
          </Link>
        </div>
      </header>
      <main
        ref={viewport}
        className="flex-1 min-h-0 overflow-auto flex p-6 print:block print:overflow-visible print:p-0"
      >
        {/* m-auto centres the activity when it fits and, unlike centring
            with flexbox, still lets it scroll from the top when it doesn't. */}
        <div ref={content} className="m-auto w-full flex flex-col items-center">
          {children}
        </div>
      </main>
    </div>
  );
}
