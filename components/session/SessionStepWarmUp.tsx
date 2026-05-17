"use client";

import { useState } from "react";
import type { Exercise } from "@/types/training";
import { parseLoadValue } from "@/lib/sessionFlow";

type Props = {
  exercise: Exercise;
  exerciseIndex: number;
  exerciseTotal: number;
  onComplete: () => void;
  onSkip: () => void;
};

export function SessionStepWarmUp({
  exercise,
  exerciseIndex,
  exerciseTotal,
  onComplete,
  onSkip
}: Props) {
  const [currentRampIndex, setCurrentRampIndex] = useState(0);
  const plannedLoad = exercise.plannedLoad ?? "";
  const parts = parseLoadValue(plannedLoad);
  const baseLoad = parts?.value ?? 0;
  const unit = parts?.unit ?? "";

  const warmupRamps = [
    { percent: 50, reps: 10 },
    { percent: 70, reps: 5 },
    { percent: 85, reps: 3 }
  ];

  const currentRamp = warmupRamps[currentRampIndex];
  const currentLoad = Math.round((baseLoad * currentRamp.percent) / 10) * 10;

  const handleRampComplete = () => {
    if (currentRampIndex < warmupRamps.length - 1) {
      setCurrentRampIndex(currentRampIndex + 1);
    } else {
      onComplete();
    }
  };

  const isLastRamp = currentRampIndex === warmupRamps.length - 1;

  return (
    <section className="session-step-card session-step-enter overflow-hidden p-5">
      <div className="session-step-accent" style={{ background: "linear-gradient(90deg, #ff9500, #ff5a00)" }} />

      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-amber">Échauffement</p>
          <h2 className="mt-2 text-2xl font-black text-white">
            {exercise.name}
          </h2>
        </div>
        <p className="shrink-0 rounded-full bg-amber/15 px-3 py-1 text-[10px] font-black uppercase text-amber">
          Exercice {exerciseIndex + 1} / {exerciseTotal}
        </p>
      </div>

      <p className="text-sm font-semibold text-white/65">
        Rampe de 3 séries pour préparer tes muscles à la charge de travail.
      </p>

      {/* Ramp progression */}
      <div className="mt-6 space-y-3">
        {warmupRamps.map((ramp, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border transition ${
              idx <= currentRampIndex
                ? "border-amber/40 bg-amber/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm font-black text-white">
                    {ramp.percent}% × {ramp.reps} reps
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/55">
                    {currentLoad} {unit}
                  </p>
                </div>
                {idx < currentRampIndex && (
                  <span className="text-lg">✓</span>
                )}
                {idx === currentRampIndex && (
                  <span className="inline-flex animate-pulse items-center justify-center rounded-full bg-amber text-white text-xs font-black w-6 h-6">
                    {currentRampIndex + 1}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Current ramp info */}
      {currentRampIndex < warmupRamps.length && (
        <div className="mt-6 rounded-2xl border border-sea/30 bg-sea/10 p-4">
          <p className="text-sm font-black text-sea">Série {currentRampIndex + 1} en cours</p>
          <p className="mt-2 text-2xl font-black text-white">
            {currentLoad} {unit}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/65">
            {currentRamp.reps} répétitions
          </p>
        </div>
      )}

      {/* Ready message */}
      {isLastRamp && (
        <div className="mt-6 rounded-2xl border border-sea/40 bg-sea/15 p-4 text-center">
          <p className="text-xl font-black text-sea">Prêt pour ta série de travail ! 🔥</p>
          <p className="mt-2 text-xs font-semibold text-white/65">
            Tu as bien échauffé tes articulations et muscles.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="session-cta-secondary"
          onClick={onSkip}
          type="button"
        >
          Passer l'échauffement
        </button>
        <button
          className="session-cta-primary"
          onClick={handleRampComplete}
          type="button"
        >
          {isLastRamp ? "Commencer la séance" : "Série complète →"}
        </button>
      </div>
    </section>
  );
}
