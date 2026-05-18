"use client";

import { useEffect, useState } from "react";
import type { ActiveSession } from "@/types/training";
import { formatDuration } from "@/lib/time";

type Props = {
  session: ActiveSession;
  /** Short context label, e.g. "Série 3/5", "Repos", "Échauffement". */
  phase: string;
  /** Main info: usually the current exercise name. */
  title: string;
  /** Optional secondary info, e.g. "90 kg" or "Série 4/5 à suivre". */
  detail?: string;
  exerciseIndex: number; // 0-based
  exerciseTotal: number;
  completedCount: number;
  progressPercent: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onQuit: () => void;
};

function getElapsedMs(session: ActiveSession, nowMs: number): number {
  const timer = session.timer ?? {
    startedAt: session.startedAt,
    isPaused: false,
    pausedTotalMs: 0
  };
  const startedAt = new Date(timer.startedAt).getTime();
  const stoppedAt = timer.isPaused && timer.pausedAt ? new Date(timer.pausedAt).getTime() : nowMs;
  return Math.max(0, stoppedAt - startedAt - timer.pausedTotalMs);
}

/**
 * Floating, compact session header — a "Dynamic Island"-style pill.
 * Compact: one line (phase · exercise · elapsed time + mini progress bar).
 * Expanded (on tap): exercise position, validated count, pause & quit actions.
 *
 * Purely presentational: it receives derived primitives and callbacks, and
 * owns nothing but its own open/closed state and the 1s timer tick.
 */
export function SessionPill({
  session,
  phase,
  title,
  detail,
  exerciseIndex,
  exerciseTotal,
  completedCount,
  progressPercent,
  isPaused,
  onTogglePause,
  onQuit
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Tick once per second while running; paused time is frozen via pausedAt.
  useEffect(() => {
    if (isPaused) return;
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isPaused]);

  // Auto-collapse when the session moves to a new step.
  useEffect(() => {
    setExpanded(false);
  }, [phase, title]);

  const elapsedLabel = formatDuration(getElapsedMs(session, nowMs));
  const clampedProgress = Math.min(100, Math.max(0, progressPercent));
  const safeIndex = Math.min(Math.max(exerciseIndex, 0), Math.max(exerciseTotal - 1, 0));

  return (
    <div className="session-pill-wrap">
      <div className={`session-pill ${expanded ? "session-pill-expanded" : ""}`}>
        <button
          aria-expanded={expanded}
          aria-label={expanded ? "Réduire les détails de la séance" : "Afficher les détails de la séance"}
          className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <span className={`session-pill-dot ${isPaused ? "session-pill-dot-paused" : ""}`} />
          <span className="flex min-w-0 flex-1 items-baseline gap-2">
            <span className="shrink-0 text-[11px] font-black uppercase tracking-wide text-coral">
              {phase}
            </span>
            <span className="truncate text-sm font-bold text-white/85">{title}</span>
          </span>
          <span className="shrink-0 text-sm font-black tabular-nums text-white/90">
            {elapsedLabel}
          </span>
          <svg
            aria-hidden="true"
            className={`session-pill-chevron text-white/45 ${expanded ? "session-pill-chevron-up" : ""}`}
            fill="none"
            height="16"
            viewBox="0 0 24 24"
            width="16"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
        </button>

        <div className={`session-pill-panel ${expanded ? "session-pill-panel-open" : ""}`}>
          <div>
            <div className="border-t border-white/10 px-3.5 pb-3.5 pt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-black uppercase tracking-wide text-white/45">
                  Exercice {safeIndex + 1} / {exerciseTotal}
                </p>
                <p className="text-[11px] font-bold tabular-nums text-white/55">
                  {completedCount}/{exerciseTotal} validés
                </p>
              </div>
              <p className="mt-1 truncate text-base font-black text-white">{title}</p>
              {detail ? (
                <p className="truncate text-xs font-semibold text-white/55">{detail}</p>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  className="h-11 rounded-xl border border-white/10 bg-white/8 text-sm font-black text-white transition hover:bg-white/12"
                  onClick={onTogglePause}
                  type="button"
                >
                  {isPaused ? "Reprendre" : "Pause"}
                </button>
                <button
                  className="h-11 rounded-xl border border-coral/30 bg-coral/15 text-sm font-black text-coral transition hover:bg-coral/25"
                  onClick={onQuit}
                  type="button"
                >
                  Quitter
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="h-1 overflow-hidden bg-white/10">
          <div
            className="h-full bg-coral transition-[width] duration-300"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
