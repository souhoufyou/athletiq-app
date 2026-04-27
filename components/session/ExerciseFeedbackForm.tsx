import type { EffortStatus, Exercise, ExerciseLog } from "@/types/training";
import { quickReasonOptions, statusOptions } from "./types";

export function ExerciseFeedbackForm({
  exercise,
  log,
  needsQuickReason,
  onQuickReason,
  onStatus,
  onUpdateLog
}: {
  exercise: Exercise;
  log: ExerciseLog;
  needsQuickReason: boolean;
  onQuickReason: (reason: string) => void;
  onStatus: (status: EffortStatus) => void;
  onUpdateLog: (patch: Partial<ExerciseLog>) => void;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
      <h2 className="text-lg font-black">Retour exercice</h2>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {statusOptions.map((status) => {
          const selected = log.status === status.value;

          return (
            <button
              className={`min-h-16 rounded-md border px-3 text-base font-black transition ${
                selected ? status.active : status.idle
              } ${status.value === "skipped" ? "col-span-2" : ""}`}
              key={status.value}
              onClick={() => onStatus(status.value)}
              type="button"
            >
              {status.label}
            </button>
          );
        })}
      </div>

      <p className="mt-3 rounded-md bg-sky/10 px-3 py-2 text-xs font-bold leading-relaxed text-sky">
        Mode rapide : OK ou Facile remplit automatiquement la charge prevue et les reps prevues si les champs sont
        vides.
      </p>

      {needsQuickReason ? (
        <div className="mt-4 rounded-lg border border-coral/20 bg-coral/10 p-3">
          <p className="text-sm font-black text-ink">Raison rapide</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {quickReasonOptions.map((reason) => (
              <button
                className="min-h-11 rounded-md border border-coral/20 bg-white px-3 text-sm font-black text-coral shadow-sm"
                key={reason}
                onClick={() => onQuickReason(reason)}
                type="button"
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-bold text-ink/60">Charge realisee</span>
          <input
            className="mt-1 h-12 w-full rounded-md border border-black/10 bg-white px-3 text-base font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            inputMode="decimal"
            onChange={(event) => onUpdateLog({ usedLoad: event.target.value })}
            placeholder={exercise.plannedLoad ?? "ex. 90 kg"}
            value={log.usedLoad}
          />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-ink/60">Reps realisees</span>
          <input
            className="mt-1 h-12 w-full rounded-md border border-black/10 bg-white px-3 text-base font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            inputMode="text"
            onChange={(event) => onUpdateLog({ completedReps: event.target.value })}
            placeholder="ex. 5/5/5"
            value={log.completedReps}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-ink/60">Commentaire optionnel</span>
        <textarea
          className="mt-1 min-h-24 w-full resize-none rounded-md border border-black/10 bg-white px-3 py-3 text-base font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
          onChange={(event) => onUpdateLog({ comment: event.target.value })}
          placeholder="Sensation, douleur, adaptation..."
          value={log.comment}
        />
      </label>
    </section>
  );
}
