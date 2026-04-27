import { formatDuration } from "@/lib/time";
import type { RestTimerState } from "./types";

export function RestTimer({
  onAdjust,
  onRestart,
  onSkip,
  onStart,
  restLabel,
  restTimer
}: {
  onAdjust: (delta: number) => void;
  onRestart: () => void;
  onSkip: () => void;
  onStart: () => void;
  restLabel: string;
  restTimer: RestTimerState;
}) {
  return (
    <section
      className={`rounded-xl border p-4 shadow-soft ${
        restTimer.done ? "border-amber bg-amber/10" : "border-black/10 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amber">Minuteur repos</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-ink">
            {formatDuration(restTimer.secondsLeft * 1000)}
          </p>
          <p className="mt-1 text-sm font-bold text-ink/60">Repos conseille : {restLabel}</p>
        </div>
        <button
          className="h-16 rounded-md bg-amber px-4 text-sm font-black text-white shadow-sm"
          onClick={onStart}
          type="button"
        >
          Lancer repos
        </button>
      </div>
      {restTimer.done ? <p className="mt-3 text-sm font-black text-amber">Repos termine. Tu peux reprendre.</p> : null}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <TimerButton onClick={() => onAdjust(30)}>+30 s</TimerButton>
        <TimerButton onClick={() => onAdjust(-30)}>-30 s</TimerButton>
        <TimerButton onClick={onSkip}>Passer</TimerButton>
        <TimerButton onClick={onRestart}>Relancer</TimerButton>
      </div>
    </section>
  );
}

function TimerButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      className="min-h-11 rounded-md border border-black/10 bg-white px-2 text-xs font-black text-ink shadow-sm"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}
