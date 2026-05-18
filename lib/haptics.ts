/**
 * Déclenche une vibration courte si l'API est disponible.
 * No-op silencieux côté SSR ou sur les navigateurs non compatibles.
 */
export function safeVibrate(duration: number | number[] = 8): void {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(duration);
  } catch {
    // L'API peut throw si l'utilisateur n'a pas encore interagi avec la page.
  }
}
