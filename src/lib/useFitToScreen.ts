import { useLayoutEffect, type RefObject } from "react";

/**
 * Sizes an activity to fill the screen, so on a classroom whiteboard it is
 * as large as the space allows and only scrolls when even small text
 * wouldn't fit.
 *
 * It works by setting the root font size. Every Tailwind size (text,
 * padding, widths, image heights) is in rem, so the whole activity grows
 * and shrinks as one, and the layout stays real: drag-and-drop, fixed
 * overlays and click targets all behave as normal, which a CSS transform
 * scale would break. Breakpoints are unaffected because media queries
 * measure rem against the browser default, not the root element.
 */

/** The browser default that Tailwind's rem sizes are designed around. */
const BASE_PX = 16;
/** Below this, text gets hard to read from the back of a classroom. */
const MIN_PX = 14;
/** Above this, start screens with one button would turn comically large. */
const MAX_PX = 40;
/**
 * When a content change leaves the activity using less than this share of
 * the height, it is allowed to grow again. Between questions the content
 * stays about the same size, so this doesn't make the text jump; it catches
 * a real change of screen, such as going from a long results list back to
 * a start screen with "Play again", which would otherwise stay tiny.
 */
const REGROW_BELOW = 0.75;

export function useFitToScreen(
  viewport: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
): void {
  useLayoutEffect(() => {
    const vp = viewport.current;
    const ct = content.current;
    if (!vp || !ct) return;
    const root = document.documentElement;

    // Strict: even 1px over shows a scrollbar on the activity.
    const overflowing = () =>
      vp.scrollHeight > vp.clientHeight || vp.scrollWidth > vp.clientWidth;
    const setSize = (px: number) => {
      root.style.fontSize = `${px}px`;
    };
    const currentSize = () => parseFloat(root.style.fontSize) || BASE_PX;
    /** Share of the available height the activity currently takes up. */
    const heightUsed = () => {
      const style = getComputedStyle(vp);
      const available =
        vp.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      return available > 0 ? ct.getBoundingClientRect().height / available : 1;
    };

    /** The largest size at which the activity fits, found by bisection. */
    function fit() {
      setSize(MAX_PX);
      if (!overflowing()) return;
      setSize(MIN_PX);
      if (overflowing()) return; // too much even at the minimum: let it scroll
      let lo = MIN_PX;
      let hi = MAX_PX;
      while (hi - lo > 0.25) {
        const mid = (lo + hi) / 2;
        setSize(mid);
        if (overflowing()) hi = mid;
        else lo = mid;
      }
      setSize(lo);
    }

    fit();

    // Refits are batched to the next frame, with a timer as a fallback:
    // browsers hold back animation frames while a tab is in the background,
    // and without the timer an activity that grew while hidden was left
    // scrolling when the teacher switched back to it.
    let frame = 0;
    let timer = 0;
    /** Whether the pending refit may grow the activity, not just shrink it. */
    let pendingFull = false;
    /**
     * Refits wait while a pointer is held down, so dragging a card in Drag &
     * Match (or a long-press on a whiteboard) never resizes things mid-gesture.
     */
    let pointerDown = false;
    let deferred = false;

    function cancel() {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    }

    function run() {
      cancel();
      if (pointerDown && !pendingFull) {
        deferred = true;
        return;
      }
      const full = pendingFull;
      pendingFull = false;
      if (full) fit();
      // When the content itself changes (next question, feedback appearing)
      // it shrinks to fit, but only grows back once it has become clearly
      // smaller. Growing on every change would make the text jump in size
      // from one question to the next.
      else if (overflowing()) {
        if (currentSize() > MIN_PX) fit();
      } else if (currentSize() < MAX_PX && heightUsed() < REGROW_BELOW) fit();
    }

    function schedule(full: boolean) {
      // A content change mustn't downgrade a pending resize to shrink-only.
      pendingFull = pendingFull || full;
      cancel();
      frame = requestAnimationFrame(run);
      timer = window.setTimeout(run, 100);
    }

    // A resize starts afresh, so the activity can grow into new space.
    const onResize = () => schedule(true);
    const onContentChange = () => schedule(false);

    const onPointerDown = () => {
      pointerDown = true;
    };
    const onPointerUp = () => {
      pointerDown = false;
      if (deferred) {
        deferred = false;
        schedule(false);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
    const resizeObserver = new ResizeObserver(onContentChange);
    resizeObserver.observe(ct);
    // Attribute changes are left out on purpose: dragging a card changes
    // its inline transform on every frame, and that must not refit mid-drag.
    const mutationObserver = new MutationObserver(onContentChange);
    mutationObserver.observe(ct, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      cancel();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      root.style.fontSize = "";
    };
  }, [viewport, content]);
}
