"use client";

import { useEffect, useState } from "react";
import type { Exercise } from "@/types/training";
import { NumberStepper, type StepperComparison } from "@/components/session/NumberStepper";
import { safeVibrate } from "@/lib/haptics";
import {
  adjustLoad,
  adjustReps,
  getPlannedRepsLabel,
  isNumericLoad,
  parseLoadValue
} from "@/lib/sessionFlow";

type Props = {
  exercise: Exercise;
  setIndex: number;       // 1-based
  setCount: number;
  defaultLoad: string;
  defaultReps: string;
  onComplete: (data: { usedLoad: string; completedReps: string }) => void;
};

/** Badge discret "vs prévu" : compare la charge saisie à la charge prévue
 *  (elle-même calculée par le moteur de progression à partir de la séance
 *  précédente). Renvoie null si l'un des deux côtés n'est pas numérique
 *  ou si les valeurs sont égales. */
function buildLoadComparison(usedLoad: string, plannedLoad?: string): StepperComparison | null {
  if (!plannedLoad) return null;
  const ref = parseLoadValue(plannedLoad);
  const cur = parseLoadValue(usedLoad);
  if (!ref || !cur) return null;

  const diff = cur.value - ref.value;
  if (Math.abs(diff) < 0.001) return null;

  const decimals = Math.max(ref.decimals, cur.decimals);
  let amount = decimals > 0 ? Math.abs(diff).toFixed(decimals) : String(Math.abs(diff));
  if (decimals > 0) {
    amount = amount.replace(/\.?0+$/, "");
    if (amount === "") amount = "0";
  }

  const unit = cur.unit || ref.unit;
  return {
    tone: diff > 0 ? "up" : "down",
    label: `${diff > 0 ? "+" : "−"}${amount}${unit ? ` ${unit}` : ""} vs prévu`
  };
}

export function SessionStepSet({
  exercise,
  setIndex,
  setCount,
  defaultLoad,
  defaultReps,
  onComplete
}: Props) {
  const [usedLoad, setUsedLoad] = useState(defaultLoad);
  const [completedReps, setCompletedReps] = useState(defaultReps);

  useEffect(() => {
    setUsedLoad(defaultLoad);
    setCompletedReps(defaultReps);
  }, [exercise.id, setIndex, defaultLoad, defaultReps]);

  const repsLabel = getPlannedRepsLabel(exercise);
  const isLastSet = setIndex >= setCount;
  const loadIsNumeric = isNumericLoad(usedLoad);
  const showLoadAdjuster = loadIsNumeric || Boolean(exercise.plannedLoad);
  const loadUnit =
    parseLoadValue(usedLoad)?.unit || parseLoadValue(exercise.plannedLoad ?? "")?.unit || "kg";
  const loadComparison = buildLoadComparison(usedLoad, exercise.plannedLoad);

  return (
    <section className="session-step-card session-step-enter p-5">
      <div className="session-step-accent" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-coral">En cours</p>
          <h2 className="mt-1 truncate text-xl font-bold leading-tight text-white">{exercise.name}</h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-coral/30 bg-coral/15 px-3 py-1.5 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-coral/80">Série</p>
          <p className="text-2xl font-bold leading-tight text-coral">
            {setIndex}<span className="text-coral/60"> / {setCount}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <NumberStepper
          adjustable={showLoadAdjuster}
          comparison={loadComparison}
          delta={2.5}
          deltaLabel="2,5"
          hint={exercise.plannedLoad ? `prévu ${exercise.plannedLoad}` : "Libre"}
          inputMode="decimal"
          label="Charge"
          onAdjust={(delta) => setUsedLoad((value) => adjustLoad(value || (exercise.plannedLoad ?? ""), delta))}
          onChange={setUsedLoad}
          placeholder={exercise.plannedLoad ?? "kg"}
          unitLabel={loadUnit}
          value={usedLoad}
        />
        <NumberStepper
          adjustable
          delta={1}
          deltaLabel="1"
          hint={`prévu ${repsLabel}`}
          inputMode="numeric"
          label="Reps"
          onAdjust={(delta) => setCompletedReps((value) => adjustReps(value, delta))}
          onChange={setCompletedReps}
          placeholder={repsLabel}
          unitLabel="reps"
          value={completedReps}
        />
      </div>

      <button
        className="session-cta-primary tap-feedback mt-7"
        onClick={() => {
          safeVibrate(15);
          onComplete({ usedLoad: usedLoad.trim(), completedReps: completedReps.trim() });
        }}
        type="button"
      >
        {isLastSet ? "Finir l’exercice" : "Série terminée"}
      </button>
    </section>
  );
}
