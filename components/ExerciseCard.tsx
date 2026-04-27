"use client";

import type { EffortStatus, Exercise, ExerciseLog } from "@/types/training";

const statuses: Array<{ value: EffortStatus; label: string; idle: string; active: string }> = [
  {
    value: "ok",
    label: "OK",
    idle: "border-sea/25 bg-sea/10 text-sea",
    active: "border-sea bg-sea text-white"
  },
  {
    value: "easy",
    label: "Facile",
    idle: "border-sea/25 bg-sea/10 text-sea",
    active: "border-sea bg-sea text-white"
  },
  {
    value: "hard",
    label: "Trop dur",
    idle: "border-coral/30 bg-coral/10 text-coral",
    active: "border-coral bg-coral text-white"
  },
  {
    value: "pain",
    label: "Douleur",
    idle: "border-red-500/30 bg-red-500/10 text-red-600",
    active: "border-red-600 bg-red-600 text-white"
  },
  {
    value: "skipped",
    label: "Pas fait",
    idle: "border-black/10 bg-mist text-ink/70",
    active: "border-zinc-500 bg-zinc-600 text-white"
  }
];

type ExerciseCardProps = {
  exercise: Exercise;
  log: ExerciseLog;
  onChange: (patch: Partial<ExerciseLog>) => void;
  isActive?: boolean;
  isCompleted?: boolean;
  lastLoad?: string;
  onSetActive?: () => void;
};

export function ExerciseCard({
  exercise,
  isActive,
  isCompleted,
  lastLoad,
  log,
  onChange,
  onSetActive
}: ExerciseCardProps) {
  return (
    <article
      className={`scroll-mt-72 scroll-mb-32 rounded-lg border bg-white p-4 shadow-soft transition ${
        isActive ? "border-sky ring-2 ring-sky/20" : "border-black/10"
      }`}
      onFocus={onSetActive}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            {isActive ? (
              <span className="rounded-full bg-sky px-2.5 py-1 text-xs font-black uppercase text-white">Actuel</span>
            ) : null}
            {isCompleted ? (
              <span className="rounded-full bg-sea/10 px-2.5 py-1 text-xs font-black uppercase text-sea">Renseigné</span>
            ) : null}
          </div>
          <h3 className="text-xl font-black leading-tight text-ink">{exercise.name}</h3>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/60">{exercise.cue}</p>
        </div>
        <div className="shrink-0 rounded-md bg-sky/10 px-3 py-2 text-right text-sky">
          <p className="text-base font-black">{exercise.target}</p>
          <p className="text-xs font-semibold text-ink/60">prévu</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md border border-sky/15 bg-sky/10 p-3">
          <dt className="font-bold text-sky">Charge prévue</dt>
          <dd className="mt-1 text-xl font-black">{exercise.plannedLoad ?? "À définir"}</dd>
        </div>
        <div className="rounded-md border border-amber/20 bg-amber/10 p-3">
          <dt className="font-bold text-amber">Repos</dt>
          <dd className="mt-1 text-xl font-black">{exercise.rest}</dd>
        </div>
        <div className="col-span-2 rounded-md border border-black/10 bg-mist p-3">
          <dt className="font-bold text-ink/60">Dernière charge réalisée</dt>
          <dd className="mt-1 text-lg font-black text-ink">{lastLoad ?? "Aucune donnée"}</dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {statuses.map((status) => {
          const isActive = log.status === status.value;

          return (
            <button
              className={`min-h-14 rounded-md border px-3 text-base font-black transition ${
                isActive ? status.active : status.idle
              } ${status.value === "skipped" ? "col-span-2" : ""}`}
              key={status.value}
              onClick={() => {
                onSetActive?.();
                onChange({ status: status.value });
              }}
              type="button"
            >
              {status.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-bold text-ink/60">Charge utilisée</span>
          <input
            className="mt-1 h-12 w-full rounded-md border border-black/10 bg-white px-3 text-base font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            inputMode="decimal"
            onChange={(event) => onChange({ usedLoad: event.target.value })}
            onFocus={onSetActive}
            placeholder="ex. 18 kg"
            value={log.usedLoad}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-ink/60">Reps réalisées</span>
          <input
            className="mt-1 h-12 w-full rounded-md border border-black/10 bg-white px-3 text-base font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            inputMode="text"
            onChange={(event) => onChange({ completedReps: event.target.value })}
            onFocus={onSetActive}
            placeholder="ex. 8/8/7"
            value={log.completedReps}
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-sm font-bold text-ink/60">Commentaire</span>
        <textarea
          className="mt-1 min-h-24 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-3 text-base font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
          onChange={(event) => onChange({ comment: event.target.value })}
          onFocus={onSetActive}
          placeholder="Sensation, douleur, adaptation..."
          value={log.comment}
        />
      </label>
    </article>
  );
}
