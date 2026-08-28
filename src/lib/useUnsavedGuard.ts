import { useEffect } from "react";

/**
 * Warns before the tab is closed or reloaded while an editor holds unsaved
 * work. Editors keep their set in component state and only persist on Save,
 * so without this a stray click discards everything typed.
 */
export function useUnsavedGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Older browsers need returnValue set to show their own prompt.
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}

/** Confirms in-app navigation away from unsaved work. True means "go ahead". */
export function confirmDiscard(dirty: boolean): boolean {
  return (
    !dirty ||
    confirm("You have unsaved changes. Leave this set without saving them?")
  );
}
