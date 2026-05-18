type ViewTransitionCallback = () => void | Promise<void>;

/**
 * Runs `callback` (typically a navigation / state update) inside a
 * View Transition when the browser supports it and the user has not asked
 * for reduced motion. In every other case the callback runs immediately, so
 * navigation never depends on the View Transitions API.
 *
 * Safe to call during SSR: when `document` is unavailable the callback is
 * still executed synchronously.
 */
export function startSafeViewTransition(callback: ViewTransitionCallback): void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    void callback();
    return;
  }

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || typeof document.startViewTransition !== "function") {
    void callback();
    return;
  }

  try {
    document.startViewTransition(callback);
  } catch {
    void callback();
  }
}
