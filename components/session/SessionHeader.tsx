import { formatDuration } from "@/lib/time";
import type { PlannedSession } from "@/types/training";
import { SessionProgress } from "./SessionProgress";

export function SessionHeader({
  completedCount,
  currentIndex,
  isPaused,
  onMarkAllOk,
  onPauseToggle,
  progressPercent,
  session,
  sessionElapsedMs
}: {
  completedCount: number;
  currentIndex: number;
  isPaused: boolean;
  onMarkAllOk: () => void;
  onPauseToggle: () => void;
  progressPercent: number;
  session: PlannedSession;
  sessionElapsedMs: number;
}) {
  return (
    <section className="sticky top-0 z-20 -mx-4 border-b border-black/10 bg-mist/95 px-4 py-3 shadow-soft backdrop-blur sm:-mx-5 sm:px-5">
      <div className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-sky">Mode seance guidee</p>
            <h2 className="mt-1 truncate text-lg font-black">{session.title}</h2>
            <p className="mt-1 text-sm font-black text-ink/60">
              Exercice {currentIndex + 1} sur {session.exercises.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tabular-nums text-ink">{formatDuration(sessionElapsedMs)}</p>
            <button
              className="mt-1 min-h-9 rounded-md border border-black/10 px-3 py-1 text-xs font-black text-ink/70"
              onClick={onPauseToggle}
              type="button"
            >
              {isPaused ? "Reprendre" : "Pause"}
            </button>
          </div>
        </div>

        <SessionProgress
          completedCount={completedCount}
          progressPercent={progressPercent}
          total={session.exercises.length}
        />
        <button
          className="mt-3 h-14 w-full rounded-md bg-sea px-4 text-sm font-black text-white shadow-sm"
          onClick={onMarkAllOk}
          type="button"
        >
          Tout marquer OK
        </button>
      </div>
    </section>
  );
}
