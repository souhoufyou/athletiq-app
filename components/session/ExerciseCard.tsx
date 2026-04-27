import type { Exercise, ExerciseLog } from "@/types/training";
import { statusLabel } from "./types";

export function ExerciseCard({
  currentIndex,
  exercise,
  lastLoad,
  log,
  total
}: {
  currentIndex: number;
  exercise: Exercise;
  lastLoad?: string;
  log: ExerciseLog;
  total: number;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ink p-5 text-white shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black uppercase text-sky">
            Exercice {currentIndex + 1} sur {total}
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight">{exercise.name}</h1>
          <p className="mt-3 text-base font-semibold leading-relaxed text-white/75">{exercise.cue}</p>
        </div>
        {log.status ? (
          <span className="shrink-0 rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase text-white">
            {statusLabel(log.status)}
          </span>
        ) : null}
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        <FocusStat label="Charge prevue" value={exercise.plannedLoad ?? "A definir"} tone="info" />
        <FocusStat label="Series / reps" value={exercise.target} tone="light" />
        <FocusStat label="Repos" value={exercise.rest} tone="warn" />
        <FocusStat label="Derniere charge" value={lastLoad ?? "Aucune"} tone="calm" />
      </dl>
    </section>
  );
}

function FocusStat({
  label,
  tone,
  value
}: {
  label: string;
  tone: "calm" | "info" | "light" | "warn";
  value: string;
}) {
  const toneClass = {
    calm: "bg-sea/15 text-white",
    info: "bg-sky/20 text-white",
    light: "bg-white/10 text-white",
    warn: "bg-amber/20 text-white"
  }[tone];

  return (
    <div className={`rounded-md p-3 ${toneClass}`}>
      <dt className="text-[11px] font-black uppercase text-white/65">{label}</dt>
      <dd className="mt-1 text-lg font-black leading-tight">{value}</dd>
    </div>
  );
}
