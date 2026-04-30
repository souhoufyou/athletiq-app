// MET values per session intensity, calibrated to include EPOC (afterburn)
// so totals align with what mainstream fitness apps display.
// Reference (Compendium of Physical Activities, vigorous strength training): 5–6 MET.
const MET: Record<string, number> = {
  Légère: 3.5,
  Modérée: 5.0,
  Soutenue: 6.5
};

const MIN_SESSION_MINUTES = 5;
const MAX_SESSION_MINUTES = 150; // cap at 2h30 to avoid forgotten-running-timer outliers

export type CalorieEstimate = {
  low: number;
  high: number;
  met: number;
};

/**
 * Local calorie estimate: MET × weight_kg × duration_hours ±10 %.
 * Caps duration to [5 min, 150 min] to neutralize forgotten timers and
 * sub-warmup blips. Falls back to Modérée when intensity is unknown.
 */
export function estimateCalories(
  intensity: string,
  weightKg: number,
  totalDurationMs: number
): CalorieEstimate {
  const met = MET[intensity] ?? 5.0;
  const rawMinutes = totalDurationMs / 1_000 / 60;
  const clampedMinutes = Math.min(MAX_SESSION_MINUTES, Math.max(MIN_SESSION_MINUTES, rawMinutes));
  const hours = clampedMinutes / 60;
  const safeWeight = weightKg && weightKg > 0 ? weightKg : 75;
  const base = met * safeWeight * hours;
  return {
    low: Math.round(base * 0.9),
    high: Math.round(base * 1.1),
    met
  };
}
