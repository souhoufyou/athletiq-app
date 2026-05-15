"use client";

import type { Exercise, MuscleGroup } from "@/types/training";
import { getPlannedRepsLabel, getPlannedSetCount } from "@/lib/sessionFlow";
import { SessionExerciseIcon } from "@/components/session/SessionExerciseIcon";

type Props = {
  exercise: Exercise;
  exerciseIndex: number;
  exerciseTotal: number;
  isReplaced?: boolean;
  onStart: () => void;
  onSkip: () => void;
  onReplace?: () => void;
};

const muscleLabels: Record<MuscleGroup, string> = {
  pectoraux: "Pectoraux",
  dos: "Dos",
  epaules: "Épaules",
  biceps: "Biceps",
  triceps: "Triceps",
  jambes: "Jambes",
  abdos: "Abdos",
  cardio: "Cardio",
  autre: "Autre"
};

export function SessionStepAnnounce({
  exercise,
  exerciseIndex,
  exerciseTotal,
  isReplaced = false,
  onStart,
  onSkip,
  onReplace
}: Props) {
  const setCount = getPlannedSetCount(exercise);
  const repsLabel = getPlannedRepsLabel(exercise);
  const muscles = exercise.muscleGroups ?? [];

  return (
    <section className="session-step-card session-step-enter p-5">
      <div className="session-step-accent" />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-white/45">
          Exercice {exerciseIndex + 1} / {exerciseTotal}
        </p>
        {isReplaced ? (
          <span className="rounded-full border border-amber/30 bg-amber/15 px-2.5 py-1 text-[10px] font-black uppercase text-amber">
            Remplacé
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-col items-center text-center">
        <SessionExerciseIcon exercise={exercise} className="size-20" />
        <h1 className="mt-4 text-3xl font-black leading-[1.05] text-white sm:text-4xl">
          {exercise.name}
        </h1>
        {muscles.length > 0 ? (
          <div className="mt-3 flex flex-wrap justify-center gap-1.5">
            {muscles.map((muscle) => (
              <span
                className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-white/70"
                key={muscle}
              >
                {muscleLabels[muscle] ?? muscle}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-2">
        <Stat label="Séries" value={String(setCount)} accent />
        <Stat label="Reps prévues" value={repsLabel} />
        <Stat label="Charge prévue" value={exercise.plannedLoad ?? "Libre"} />
        <Stat label="Repos" value={exercise.rest || "—"} />
      </dl>

      {exercise.cue ? (
        <p className="mt-5 rounded-xl border border-white/8 bg-white/4 p-3 text-sm font-semibold leading-relaxed text-white/70">
          {exercise.cue}
        </p>
      ) : null}

      <button className="session-cta-primary mt-6" onClick={onStart} type="button">
        Commencer l&apos;exercice
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {onReplace ? (
          <button className="session-cta-secondary" onClick={onReplace} type="button">
            🔄 Remplacer
          </button>
        ) : (
          <span />
        )}
        <button
          className={`session-cta-secondary ${onReplace ? "" : "col-span-2"}`}
          onClick={onSkip}
          type="button"
        >
          Passer
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent
          ? "border-coral/30 bg-coral/12 text-coral"
          : "border-white/8 bg-white/4 text-white"
      }`}
    >
      <dt className="text-[10px] font-black uppercase tracking-wide opacity-70">{label}</dt>
      <dd className={`mt-1 text-2xl font-black leading-tight ${accent ? "text-coral" : "text-white"}`}>{value}</dd>
    </div>
  );
}
