import type { LoadUnit, StrengthReference } from "@/types/training";

const LB_TO_KG = 0.45359237;

export function estimateOneRepMaxFromSet(load: number, reps: number, unit: LoadUnit = "kg"): number | undefined {
  if (!Number.isFinite(load) || load <= 0) return undefined;

  const safeReps = clamp(Math.round(Number.isFinite(reps) && reps > 0 ? reps : 1), 1, 12);
  const loadKg = unit === "kg" ? load : load * LB_TO_KG;
  if (safeReps === 1) return roundToOneDecimal(loadKg);

  return roundToOneDecimal(loadKg * (1 + safeReps / 30));
}

export function buildStrengthReferenceFromSet(
  lift: string,
  load: number,
  reps: number,
  unit: LoadUnit = "kg"
): StrengthReference | undefined {
  const estimatedOneRepMaxKg = estimateOneRepMaxFromSet(load, reps, unit);
  if (!estimatedOneRepMaxKg) return undefined;

  const safeReps = clamp(Math.round(Number.isFinite(reps) && reps > 0 ? reps : 1), 1, 12);
  const loadKg = unit === "kg" ? load : roundToOneDecimal(load * LB_TO_KG);

  return {
    lift,
    value: `${formatNumber(load)} ${unit} x ${safeReps}`,
    loadKg: roundToOneDecimal(loadKg),
    reps: safeReps,
    estimatedOneRepMaxKg,
    confidence: safeReps === 1 ? "declared" : "estimated",
    note: safeReps === 1
      ? "Max 1 repetition declare."
      : `1RM estime depuis une serie de ${safeReps} repetitions.`
  };
}

export function formatEstimatedOneRepMax(value: number | undefined): string {
  return value && value > 0 ? `${formatNumber(value)} kg estime` : "Non renseigne";
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}
