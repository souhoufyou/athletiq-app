"use client";

import { useEffect, useRef, useState } from "react";
import type { Exercise, SetLog } from "@/types/training";
import { formatDuration } from "@/lib/time";

type Props = {
  exercise: Exercise;
  setIndexJustFinished: number;
  setCount: number;
  nextSetIndex: number;
  initialSeconds: number;
  lastSet?: SetLog;
  onContinue: () => void;
};

/**
 * The countdown ticks every second but state is kept LOCAL to this component,
 * so the parent SessionRunner does not re-render on each tick.
 */
export function SessionStepRest({
  exercise,
  setIndexJustFinished,
  setCount,
  nextSetIndex,
  initialSeconds,
  lastSet,
  onContinue
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(() => Math.max(0, initialSeconds));
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const warnedAt10 = useRef(false);
  const warnedAt0 = useRef(false);

  useEffect(() => {
    setSecondsLeft(Math.max(0, initialSeconds));
    setPaused(false);
    warnedAt10.current = false;
    warnedAt0.current = false;
  }, [exercise.id, setIndexJustFinished, initialSeconds]);

  useEffect(() => {
    if (paused || secondsLeft <= 0) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [paused, secondsLeft]);

  // Haptic feedback at 10s left and at the end (no-op when API unavailable)
  useEffect(() => {
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;

    if (secondsLeft === 10 && !warnedAt10.current) {
      warnedAt10.current = true;
      try { navigator.vibrate(120); } catch {}
    }
    if (secondsLeft === 0 && !warnedAt0.current && initialSeconds > 0) {
      warnedAt0.current = true;
      try { navigator.vibrate([180, 90, 180]); } catch {}
    }
  }, [secondsLeft, initialSeconds]);

  // Auto-advance to next set 2s after rest timer ends
  useEffect(() => {
    if (secondsLeft !== 0 || initialSeconds === 0) return;
    const timeout = window.setTimeout(onContinue, 2000);
    return () => window.clearTimeout(timeout);
  }, [secondsLeft, initialSeconds, onContinue]);

  const done = secondsLeft <= 0;
  const ringSize = 240;
  const ringStroke = 12;
  const radius = (ringSize - ringStroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = initialSeconds > 0 ? Math.max(0, Math.min(1, secondsLeft / initialSeconds)) : 0;
  const dashOffset = circumference * (1 - progressRatio);
  const isFinalCountdown = !done && secondsLeft <= 10;

  return (
    <section className="session-step-card session-step-enter p-5">
      <div className="session-step-accent" style={{ background: "linear-gradient(90deg, #ff9f1a, #ff5a00)" }} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-amber">Repos</p>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/45">
          Prochaine · Série {nextSetIndex} / {setCount}
        </p>
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <h2 className="truncate text-base font-black text-white">{exercise.name}</h2>
        {lastSet ? (
          <p className="shrink-0 text-xs font-bold text-white/55">
            Série {setIndexJustFinished} : <span className="text-white">{formatLastSet(lastSet)}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex items-center justify-center">
        <div
          className={`relative ${done ? "session-rest-final-warning rounded-full" : ""}`}
          style={{ width: ringSize, height: ringSize }}
        >
          <svg className="session-rest-ring" width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`}>
            <circle
              className="session-rest-ring-track"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              strokeWidth={ringStroke}
            />
            <circle
              className="session-rest-ring-progress"
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              strokeWidth={ringStroke}
              style={{
                stroke: isFinalCountdown ? "#ff5a00" : "#ff9f1a"
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              className={`text-7xl font-black tabular-nums leading-none ${
                isFinalCountdown ? "text-coral" : "text-white"
              }`}
              style={{ letterSpacing: "-0.02em" }}
            >
              {formatDuration(secondsLeft * 1000)}
            </p>
            {done ? (
              <p className="mt-2 text-xs font-black uppercase tracking-[0.25em] text-amber">
                Repos terminé
              </p>
            ) : (
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
                {paused ? "Pause" : "En cours"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2">
        <RestControl
          label="+30 s"
          onClick={() => {
            warnedAt10.current = false;
            warnedAt0.current = false;
            setSecondsLeft((current) => current + 30);
          }}
        />
        <RestControl
          label={paused ? "Reprendre" : "Pause"}
          highlight={paused}
          onClick={() => setPaused((value) => !value)}
        />
        <RestControl label="Passer" onClick={() => setSecondsLeft(0)} />
      </div>

      <button className="session-cta-primary mt-5" onClick={onContinue} type="button">
        {done ? `Série ${nextSetIndex} dans 2s…` : `Lancer la série ${nextSetIndex}`}
      </button>
    </section>
  );
}

function RestControl({
  highlight = false,
  label,
  onClick
}: {
  highlight?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`h-14 rounded-xl border px-3 text-sm font-black transition ${
        highlight
          ? "border-amber bg-amber/20 text-amber"
          : "border-white/10 bg-white/8 text-white hover:bg-white/12"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function formatLastSet(set: SetLog): string {
  const reps = set.completedReps.trim();
  const load = set.usedLoad.trim();
  if (load && reps) return `${load} × ${reps}`;
  return load || reps || "—";
}
