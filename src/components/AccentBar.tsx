import { useEffect, useRef, type RefObject } from "react";
import { ACCENT_KEYS, PUNCTUATION_KEYS } from "../lib/keyboard";

/**
 * A palette of accented characters for the activities where students type
 * their answer. Inserts at the caret and hands focus straight back, so a
 * student can keep typing without reaching for the mouse again — and a
 * teacher on an interactive whiteboard can tap them.
 */
export function AccentBar({
  inputRef,
  value,
  onChange,
  includePunctuation = false,
}: {
  inputRef: RefObject<HTMLInputElement | null>;
  value: string;
  onChange: (next: string) => void;
  includePunctuation?: boolean;
}) {
  // Where the caret should land once React has committed the new value.
  // It has to be applied in an effect, not straight after onChange: the
  // input is controlled, so re-rendering it resets the caret to the end
  // and a mid-word insertion would send the next keystroke to the wrong
  // place.
  const pendingCaret = useRef<number | null>(null);

  useEffect(() => {
    if (pendingCaret.current === null) return;
    const el = inputRef.current;
    const at = pendingCaret.current;
    pendingCaret.current = null;
    el?.focus();
    el?.setSelectionRange(at, at);
  }, [value, inputRef]);

  function insert(ch: string) {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? start;
    pendingCaret.current = start + ch.length;
    onChange(value.slice(0, start) + ch + value.slice(end));
  }

  const keys = includePunctuation
    ? [...ACCENT_KEYS, ...PUNCTUATION_KEYS]
    : ACCENT_KEYS;

  return (
    <div className="flex flex-wrap gap-1 justify-center max-w-md">
      {keys.map((ch) => (
        <button
          key={ch}
          type="button"
          // Keep focus in the input so the caret position stays valid.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(ch)}
          className="w-8 h-8 rounded bg-white hover:bg-slate-100 shadow text-sm font-medium"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}
