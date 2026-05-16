"use client";

import type { Exercise, MuscleGroup } from "@/types/training";
import { getPlannedRepsLabel, getPlannedSetCount } from "@/lib/sessionFlow";
import { getSessionImage } from "@/lib/session-images";
import {
  SessionExerciseIcon,
  getSessionExerciseCategory
} from "@/components/session/SessionExerciseIcon";

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
  const category = getSessionExerciseCategory(exercise);
  const heroImage = getSessionImage(category, exercise.name);

  return (
    <section className="session-step-card session-step-enter overflow-hidden p-0">
      <div className="session-step-accent" />

      {/* Hero image */}
      <div
        className="relative h-40 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#04050d] via-[#04050d]/55 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="rounded-full bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/85 backdrop-blur">
              Exercice {exerciseIndex + 1} / {exerciseTotal}
            </p>
            {isReplaced ? (
              <span className="rounded-full border border-amber/30 bg-amber/30 px-2.5 py-1 text-[10px] font-black uppercase text-amber backdrop-blur">
                Remplacé
              </span>
            ) : null}
          </div>
          <div className="flex items-end gap-3">
            <SessionExerciseIcon category={category} className="size-12 shrink-0 backdrop-blur" />
            <h1 className="flex-1 text-2xl font-black leading-tight text-white sm:text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
              {exercise.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-5 pt-4">
        {muscles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
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

      <div className="px-5 pb-5">
        <dl className="mt-4 grid grid-cols-2 gap-2">
          <Stat label="Séries" value={String(setCount)} accent />
          <Stat label="Reps prévues" value={repsLabel} />
          <Stat label="Charge prévue" value={exercise.plannedLoad ?? "Libre"} />
          <Stat label="Repos" value={exercise.rest || "—"} />
        </dl>

        {exercise.cue ? (
          <p className="mt-4 rounded-xl border border-white/8 bg-white/4 p-3 text-sm font-semibold leading-relaxed text-white/70">
            {exercise.cue}
          </p>
        ) : null}

        <button className="session-cta-primary mt-5" onClick={onStart} type="button">
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
