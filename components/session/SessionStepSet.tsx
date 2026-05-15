"use client";

import { useEffect, useState } from "react";
import type { Exercise } from "@/types/training";
import {
  adjustLoad,
  adjustReps,
  getPlannedRepsLabel,
  isNumericLoad
} from "@/lib/sessionFlow";

type Props = {
  exercise: Exercise;
  setIndex: number;       // 1-based
  setCount: number;
  defaultLoad: string;
  defaultReps: string;
  onComplete: (data: { usedLoad: string; completedReps: string }) => void;
};

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

  return (
    <section className="session-step-card session-step-enter p-5">
      <div className="session-step-accent" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-coral">En cours</p>
          <h2 className="mt-1 truncate text-xl font-black leading-tight text-white">{exercise.name}</h2>
        </div>
        <div className="shrink-0 rounded-2xl border border-coral/30 bg-coral/15 px-3 py-1.5 text-center">
          <p className="text-[10px] font-black uppercase tracking-wide text-coral/80">Série</p>
          <p className="text-2xl font-black leading-tight text-coral">
            {setIndex}<span className="text-coral/60"> / {setCount}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <NumberStat
          adjustable={showLoadAdjuster}
          delta={2.5}
          deltaLabel="2,5"
          hint={exercise.plannedLoad ? `prévu ${exercise.plannedLoad}` : "Libre"}
          inputMode="decimal"
          label="Charge"
          onAdjust={(delta) => setUsedLoad((value) => adjustLoad(value || (exercise.plannedLoad ?? ""), delta))}
          onChange={setUsedLoad}
          placeholder={exercise.plannedLoad ?? "kg"}
          value={usedLoad}
        />
        <NumberStat
          adjustable
          delta={1}
          deltaLabel="1"
          hint={`prévu ${repsLabel}`}
          inputMode="numeric"
          label="Reps"
          onAdjust={(delta) => setCompletedReps((value) => adjustReps(value, delta))}
          onChange={setCompletedReps}
          placeholder={repsLabel}
          value={completedReps}
        />
      </div>

      <button
        className="session-cta-primary mt-7"
        onClick={() => onComplete({ usedLoad: usedLoad.trim(), completedReps: completedReps.trim() })}
        type="button"
      >
        {isLastSet ? "Finir l’exercice" : "Série terminée"}
      </button>
    </section>
  );
}

function NumberStat({
  adjustable,
  delta,
  deltaLabel,
  hint,
  inputMode,
  label,
  onAdjust,
  onChange,
  placeholder,
  value
}: {
  adjustable: boolean;
  delta: number;
  deltaLabel: string;
  hint: string;
  inputMode: "decimal" | "numeric";
  label: string;
  onAdjust: (delta: number) => void;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-wide text-white/55">{label}</p>
        <p className="text-[10px] font-bold text-white/45">{hint}</p>
      </div>
      <input
        className="session-number-input mt-2"
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          aria-label={`Retirer ${deltaLabel}`}
          className="session-adjust-btn !w-full"
          disabled={!adjustable}
          onClick={() => onAdjust(-delta)}
          type="button"
        >
          −{deltaLabel}
        </button>
        <button
          aria-label={`Ajouter ${deltaLabel}`}
          className="session-adjust-btn !w-full"
          disabled={!adjustable}
          onClick={() => onAdjust(delta)}
          type="button"
        >
          +{deltaLabel}
        </button>
      </div>
    </div>
  );
}
