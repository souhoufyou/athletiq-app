/**
 * Tracks whether the welcome carousel has been shown on this device.
 * Stored globally (not per-profile) since it's about the first-time experience.
 */

const KEY = "coach-adaptatif:welcome-seen";

export function isWelcomeSeen(): boolean {
  if (typeof window === "undefined") return true; // SSR: don't redirect
  return window.localStorage.getItem(KEY) === "1";
}

export function markWelcomeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    // localStorage unavailable (private mode) — silent fail, just skip the redirect
  }
}

export function resetWelcomeSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
