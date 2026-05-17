import type { Exercise, ExerciseLog, SetLog } from "@/types/training";

/**
 * State machine for the guided session flow.
 *
 *  announce → set → rest → set → rest → ... → set (last) → feedback → next exercise announce
 *
 *  complete is the terminal state once every exercise has been answered.
 */
export type SessionStep =
  | { type: "announce"; exerciseIndex: number }
  | { type: "warm-up"; exerciseIndex: number }
  | { type: "set"; exerciseIndex: number; setIndex: number }
  | { type: "rest"; exerciseIndex: number; nextSetIndex: number; durationSec: number }
  | { type: "feedback"; exerciseIndex: number }
  | { type: "wrap-up" }
  | { type: "celebration" }
  | { type: "complete" };

/**
 * Number of sets prescribed for an exercise.
 * Source of truth: prescription.sets. Fall back to parsing the target string,
 * which is the legacy format (e.g. "4×6-10", "5x8", "5/5/5/5/5").
 */
export function getPlannedSetCount(exercise: Exercise): number {
  const prescribed = exercise.prescription?.sets;
  if (typeof prescribed === "number" && prescribed > 0) {
    return prescribed;
  }

  const target = exercise.target ?? "";
  const xMatch = target.match(/^\s*(\d+)\s*[x×]/i);
  if (xMatch) {
    const value = Number(xMatch[1]);
    if (Number.isFinite(value) && value > 0) {
      return value;
    }
  }

  const slashCount = target.split("/").filter((part) => part.trim().length > 0).length;
  if (slashCount > 1) {
    return slashCount;
  }

  return 1;
}

/**
 * Short label describing the rep target per set (e.g. "8", "6-10", "45s", "1 min").
 * Used in the announce and set screens.
 */
export function getPlannedRepsLabel(exercise: Exercise): string {
  const prescription = exercise.prescription;

  if (prescription) {
    if (prescription.repsMax && prescription.repsMax === prescription.repsMin) {
      return String(prescription.repsMax);
    }
    if (prescription.repsMin) {
      return String(prescription.repsMin);
    }
    if (prescription.durationSec) {
      return `${prescription.durationSec}s`;
    }
    if (prescription.durationMin) {
      return `${prescription.durationMin} min`;
    }
  }

  const target = (exercise.target ?? "").trim();
  const stripped = target.replace(/^\s*\d+\s*[x×]\s*/i, "").trim();
  const range = stripped.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return range[1];
  }
  return stripped || target || "—";
}

/**
 * Initial value used to prefill the reps input for a given set.
 * Prefers the upper bound of a range so the user always has a numeric target visible.
 */
export function getDefaultRepsValue(exercise: Exercise): string {
  const prescription = exercise.prescription;

  if (prescription?.repsMin) {
    return String(prescription.repsMin);
  }
  if (prescription?.repsMax) {
    return String(prescription.repsMax);
  }
  if (prescription?.durationSec) {
    return `${prescription.durationSec}s`;
  }

  const target = (exercise.target ?? "").trim();
  const stripped = target.replace(/^\s*\d+\s*[x×]\s*/i, "").trim();
  const range = stripped.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return range[1];
  }
  const single = stripped.match(/^(\d+)/);
  if (single) {
    return single[1];
  }
  return "";
}

/**
 * Load prefill rule:
 *   - first set        → exercise.plannedLoad
 *   - subsequent sets  → load entered on the previous set, falling back to plannedLoad
 */
export function getDefaultLoadForSet(
  exercise: Exercise,
  setIndex: number,
  existingSets: SetLog[] | undefined
): string {
  if (setIndex > 1 && existingSets) {
    for (let i = existingSets.length - 1; i >= 0; i -= 1) {
      const prev = existingSets[i];
      if (prev && prev.setIndex < setIndex && prev.usedLoad.trim()) {
        return prev.usedLoad;
      }
    }
  }
  return exercise.plannedLoad ?? "";
}

/**
 * Aggregate per-set data into the legacy ExerciseLog shape
 * (usedLoad / completedReps) so the progression engine keeps working.
 *
 *   usedLoad        → most frequent load across sets (ties → last non-empty)
 *   completedReps   → slash-joined per-set reps ("8/8/7/6"), recognised by the engine
 */
export function aggregateSets(sets: SetLog[]): { usedLoad: string; completedReps: string } {
  if (!sets || sets.length === 0) {
    return { usedLoad: "", completedReps: "" };
  }

  const ordered = [...sets].sort((a, b) => a.setIndex - b.setIndex);

  const loadCounts = new Map<string, number>();
  for (const set of ordered) {
    const value = set.usedLoad.trim();
    if (value) {
      loadCounts.set(value, (loadCounts.get(value) ?? 0) + 1);
    }
  }

  let usedLoad = "";
  let maxCount = 0;
  for (const [load, count] of loadCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      usedLoad = load;
    }
  }
  if (!usedLoad) {
    for (let i = ordered.length - 1; i >= 0; i -= 1) {
      if (ordered[i].usedLoad.trim()) {
        usedLoad = ordered[i].usedLoad;
        break;
      }
    }
  }

  const completedReps = ordered
    .map((set) => (set.completedReps.trim() || "0"))
    .join("/");

  return { usedLoad, completedReps };
}

/**
 * Parse a load string into its numeric value + unit.
 * Returns null when the value cannot be incremented (bodyweight, qualitative loads, etc.).
 */
export type LoadParts = {
  value: number;
  unit: string;
  decimals: number;
};

export function parseLoadValue(load: string): LoadParts | null {
  const trimmed = (load ?? "").trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(-?\d+(?:[.,]\d+)?)\s*(.*)$/);
  if (!match) return null;

  const numStr = match[1].replace(",", ".");
  const value = Number(numStr);
  if (!Number.isFinite(value)) return null;

  const dotIndex = numStr.indexOf(".");
  const decimals = dotIndex >= 0 ? numStr.length - dotIndex - 1 : 0;

  return { value, unit: match[2].trim(), decimals };
}

export function isNumericLoad(load: string): boolean {
  return parseLoadValue(load) !== null;
}

export function adjustLoad(load: string, delta: number): string {
  const parts = parseLoadValue(load);
  if (!parts) return load;

  const next = Math.max(0, parts.value + delta);
  const deltaStr = String(delta);
  const deltaDecimals = deltaStr.includes(".") ? deltaStr.split(".")[1].length : 0;
  const decimals = Math.max(parts.decimals, deltaDecimals);

  let formatted = decimals > 0 ? next.toFixed(decimals) : String(next);
  if (decimals > 0) {
    formatted = formatted.replace(/\.?0+$/, "");
    if (formatted === "" || formatted === "-") formatted = "0";
  }

  return parts.unit ? `${formatted} ${parts.unit}` : formatted;
}

export function adjustReps(reps: string, delta: number): string {
  const trimmed = (reps ?? "").trim();
  if (!trimmed) return delta > 0 ? "1" : "0";

  const match = trimmed.match(/^(\d+)/);
  if (!match) return reps;

  const current = Number(match[1]);
  if (!Number.isFinite(current)) return reps;

  const next = Math.max(0, current + delta);
  return trimmed.replace(/^\d+/, String(next));
}

/**
 * Recover the step the user should land on, based on what has already been logged.
 *   - resume on the first exercise that has no final status
 *   - if no set has been logged yet → announce
 *   - if some but not all sets are logged → next set
 *   - if every set is logged but no status → feedback
 *   - if all exercises have a status → complete
 */
export function shouldWarmUp(exercise: Exercise): boolean {
  const load = parseLoadValue(exercise.plannedLoad ?? "");
  const isHeavy = load && load.value >= 60;

  const compoundPatterns = /\b(bench|squat|hinge|deadlift|press|pull-?up|row|curl|tricep|leg)\b/i;
  const isCompound = compoundPatterns.test(exercise.name ?? "");

  return Boolean((isHeavy && load) || isCompound);
}

export function computeInitialStep(
  exercises: Exercise[],
  logs: Record<string, ExerciseLog>
): SessionStep {
  for (let i = 0; i < exercises.length; i += 1) {
    const exercise = exercises[i];
    const log = logs[exercise.id];

    if (log?.status) {
      continue;
    }

    const setCount = getPlannedSetCount(exercise);
    const loggedSets = log?.sets ?? [];

    // Show warm-up before first set of exercises that need it
    if (loggedSets.length === 0 && shouldWarmUp(exercise)) {
      const warmUpLogged = log?.warmUpCompleted;
      if (!warmUpLogged) {
        return { type: "warm-up", exerciseIndex: i };
      }
    }

    if (loggedSets.length === 0) {
      return { type: "announce", exerciseIndex: i };
    }

    if (loggedSets.length < setCount) {
      return { type: "set", exerciseIndex: i, setIndex: loggedSets.length + 1 };
    }

    return { type: "feedback", exerciseIndex: i };
  }

  return { type: "wrap-up" };
}
