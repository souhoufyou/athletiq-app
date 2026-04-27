"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExerciseActions } from "@/components/session/ExerciseActions";
import { ExerciseCard } from "@/components/session/ExerciseCard";
import { ExerciseFeedbackForm } from "@/components/session/ExerciseFeedbackForm";
import { FinishSessionPanel } from "@/components/session/FinishSessionPanel";
import { RestTimer } from "@/components/session/RestTimer";
import { SessionHeader } from "@/components/session/SessionHeader";
import { SessionSummary } from "@/components/session/SessionSummary";
import type { RestTimerState } from "@/components/session/types";
import { defaultSessionFeedback, getCompletedCount } from "@/lib/session";
import { useCoachStorage } from "@/lib/storage";
import { parseRestSeconds } from "@/lib/time";
import type {
  ActiveSession,
  BreathFeedback,
  CoachAiResponse,
  CompletedSession,
  EffortStatus,
  ExerciseLog
} from "@/types/training";

export function SessionRunner() {
  const [lastSummary, setLastSummary] = useState<CompletedSession | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("");
  const [finishWarning, setFinishWarning] = useState<string>("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    done: false,
    initialSeconds: 0,
    running: false,
    secondsLeft: 0
  });
  const {
    activeSession,
    attachAiCoachResponse,
    completeSession,
    currentProgram,
    dateKey,
    history,
    isReady,
    pauseSessionTimer,
    resumeSessionTimer,
    setActiveExercise,
    startSession,
    settings,
    todaySession,
    todaysCompletedSession,
    updateExerciseLog,
    updateSessionFeedback
  } = useCoachStorage();

  const activePlannedSession = useMemo(
    () => (activeSession ? currentProgram.find((session) => session.id === activeSession.sessionId) : undefined),
    [activeSession, currentProgram]
  );
  const runningSession = activePlannedSession ?? todaySession;
  const lastLoads = useMemo(
    () =>
      Object.fromEntries(
        runningSession.exercises.map((exercise) => [exercise.id, getLastLoad(history, exercise.id)])
      ) as Record<string, string | undefined>,
    [history, runningSession.exercises]
  );

  useEffect(() => {
    if (!activeSession) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);

    return () => window.clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (!restTimer.running) {
      return;
    }

    const interval = window.setInterval(() => {
      setRestTimer((current) => {
        if (!current.running) {
          return current;
        }

        if (current.secondsLeft <= 1) {
          return {
            ...current,
            done: true,
            running: false,
            secondsLeft: 0
          };
        }

        return {
          ...current,
          secondsLeft: current.secondsLeft - 1
        };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [restTimer.running]);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const matchingActive = Boolean(activeSession && activePlannedSession && activeSession.dateKey === dateKey);
  const active = matchingActive ? activeSession : null;
  const currentSession = active ? runningSession : todaySession;
  const completedCount = active ? getCompletedCount(active.logs) : 0;
  const exerciseTotal = Math.max(1, currentSession.exercises.length);
  const progressPercent = active ? Math.round((completedCount / exerciseTotal) * 100) : 0;
  const currentExerciseId = active?.timing.activeExerciseId ?? currentSession.exercises[0]?.id;
  const foundIndex = currentSession.exercises.findIndex((exercise) => exercise.id === currentExerciseId);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  const currentExercise = currentSession.exercises[currentIndex] ?? currentSession.exercises[0];
  const previousExercise = currentSession.exercises[currentIndex - 1];
  const nextExercise = currentSession.exercises[currentIndex + 1];
  const sessionElapsedMs = active ? getElapsedMs(active, nowMs) : 0;
  const currentRestSeconds = currentExercise ? parseRestSeconds(currentExercise.rest) : 0;
  const currentLastLoad = currentExercise ? lastLoads[currentExercise.id] : undefined;

  const resetRestForExercise = (exerciseId?: string) => {
    setRestTimer({
      done: false,
      exerciseId,
      initialSeconds: 0,
      running: false,
      secondsLeft: 0
    });
  };

  const goToExercise = (index: number) => {
    const target = currentSession.exercises[index];

    if (!target) {
      return;
    }

    setActiveExercise(target.id);
    resetRestForExercise(target.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const startRestTimer = () => {
    if (!currentExercise) {
      return;
    }

    const seconds = Math.max(0, currentRestSeconds);

    setActiveExercise(currentExercise.id);
    setRestTimer({
      done: seconds === 0,
      exerciseId: currentExercise.id,
      initialSeconds: seconds,
      running: seconds > 0,
      secondsLeft: seconds
    });
  };

  const adjustRestTimer = (delta: number) => {
    setRestTimer((current) => ({
      ...current,
      done: false,
      secondsLeft: Math.max(0, current.secondsLeft + delta)
    }));
  };

  const skipRestTimer = () => {
    setRestTimer((current) => ({
      ...current,
      done: false,
      running: false,
      secondsLeft: 0
    }));
  };

  const restartRestTimer = () => {
    setRestTimer((current) => {
      const seconds = current.initialSeconds || currentRestSeconds;

      return {
        ...current,
        done: false,
        exerciseId: currentExercise?.id,
        initialSeconds: seconds,
        running: seconds > 0,
        secondsLeft: seconds
      };
    });
  };

  if (!active) {
    const summarySession = lastSummary ?? todaysCompletedSession;

    return (
      <div className="space-y-5">
        {summarySession?.progressions ? <FinishSessionPanel session={summarySession} /> : null}
        {summarySession?.progressions ? (
          <button
            className="h-16 w-full rounded-md border border-sky/20 bg-sky/10 px-4 text-base font-black text-sky shadow-soft"
            onClick={() =>
              requestAiCoach(
                summarySession,
                getSessionsThisWeek(history),
                settings.aiEnabled,
                attachAiCoachResponse,
                setLastSummary,
                setAiStatus
              )
            }
            type="button"
          >
            Analyser avec l&apos;IA
          </button>
        ) : null}
        {aiStatus ? (
          <div className="rounded-lg border border-black/10 bg-white p-4 text-sm font-black text-moss shadow-soft">
            {aiStatus}
          </div>
        ) : null}
        {!summarySession ? <SessionSummary completed={Boolean(todaysCompletedSession)} session={todaySession} /> : null}
        {todaysCompletedSession && !lastSummary ? (
          <div className="rounded-lg border border-moss/20 bg-white p-4 shadow-soft">
            <p className="font-black text-moss">Seance validee aujourd&apos;hui.</p>
            <p className="mt-1 text-sm font-semibold text-ink/60">
              Elle est disponible dans l&apos;historique. Tu peux aussi relancer une nouvelle saisie si besoin.
            </p>
          </div>
        ) : null}
        <button
          className="h-16 w-full rounded-md premium-action px-4 text-lg font-black text-white shadow-soft"
          onClick={() => {
            setLastSummary(null);
            setAiStatus("");
            startSession(todaySession);
          }}
          type="button"
        >
          Commencer la seance guidee
        </button>
        <Link
          className="block h-12 rounded-md border border-black/10 bg-white px-4 py-3 text-center font-black text-ink"
          href="/"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const feedback = active.feedback ?? defaultSessionFeedback;
  const currentLog = currentExercise
    ? active.logs[currentExercise.id] ?? createEmptyLog(currentExercise.id)
    : createEmptyLog("exercise");

  const updateCurrentLog = (patch: Partial<ExerciseLog>) => {
    if (!currentExercise) {
      return;
    }

    updateExerciseLog(currentExercise.id, patch);
    setFinishWarning("");
  };

  const handleStatus = (status: EffortStatus) => {
    if (!currentExercise) {
      return;
    }

    const patch: Partial<ExerciseLog> = { status };

    if (status !== "skipped" && !currentLog.usedLoad && currentExercise.plannedLoad) {
      patch.usedLoad = currentExercise.plannedLoad;
    }

    if ((status === "ok" || status === "easy") && !currentLog.completedReps) {
      patch.completedReps = currentExercise.target;
    }

    updateCurrentLog(patch);
  };

  const applyQuickReason = (reason: string) => {
    const currentComment = currentLog.comment.trim();
    const hasReason = currentComment.toLowerCase().includes(reason.toLowerCase());

    updateCurrentLog({
      comment: hasReason ? currentComment : [currentComment, reason].filter(Boolean).join(", ")
    });
  };

  const markAllOk = () => {
    currentSession.exercises.forEach((exercise) => {
      const existing = active.logs[exercise.id];

      updateExerciseLog(exercise.id, {
        status: "ok",
        usedLoad: existing?.usedLoad || exercise.plannedLoad || "",
        completedReps: existing?.completedReps || exercise.target
      });
    });
    setFinishWarning("");
  };

  const needsQuickReason = currentLog.status === "hard" || currentLog.status === "pain";

  const finishSession = () => {
    const missingReason = currentSession.exercises.find((exercise) => {
      const log = active.logs[exercise.id];
      return (log?.status === "hard" || log?.status === "pain") && !log.comment.trim();
    });

    if (missingReason) {
      setFinishWarning("Ajoute une raison rapide sur les exercices trop durs ou douloureux avant de terminer.");
      setActiveExercise(missingReason.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const completed = completeSession(currentSession);

    if (completed) {
      setLastSummary(completed);
      setAiStatus("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-4">
      <SessionHeader
        completedCount={completedCount}
        currentIndex={currentIndex}
        isPaused={active.timer.isPaused}
        onMarkAllOk={markAllOk}
        onPauseToggle={() => (active.timer.isPaused ? resumeSessionTimer() : pauseSessionTimer())}
        progressPercent={progressPercent}
        session={currentSession}
        sessionElapsedMs={sessionElapsedMs}
      />

      {finishWarning ? (
        <div className="rounded-xl border border-coral/20 bg-coral/10 p-4 text-sm font-black leading-relaxed text-coral shadow-soft">
          {finishWarning}
        </div>
      ) : null}

      {currentExercise ? (
        <ExerciseCard
          currentIndex={currentIndex}
          exercise={currentExercise}
          lastLoad={currentLastLoad}
          log={currentLog}
          total={currentSession.exercises.length}
        />
      ) : null}

      <RestTimer
        onAdjust={adjustRestTimer}
        onRestart={restartRestTimer}
        onSkip={skipRestTimer}
        onStart={startRestTimer}
        restLabel={currentExercise?.rest ?? "-"}
        restTimer={restTimer}
      />

      {currentExercise ? (
        <ExerciseFeedbackForm
          exercise={currentExercise}
          log={currentLog}
          needsQuickReason={needsQuickReason}
          onQuickReason={applyQuickReason}
          onStatus={handleStatus}
          onUpdateLog={updateCurrentLog}
        />
      ) : null}

      <GlobalFeedbackForm
        breath={feedback.breath}
        difficulty={feedback.difficulty}
        energy={feedback.energy}
        globalPain={feedback.globalPain}
        onChange={updateSessionFeedback}
      />

      <ExerciseActions
        canGoNext={Boolean(nextExercise)}
        canGoPrevious={Boolean(previousExercise)}
        onFinish={finishSession}
        onNext={() => goToExercise(currentIndex + 1)}
        onPrevious={() => goToExercise(currentIndex - 1)}
      />
    </div>
  );
}

function GlobalFeedbackForm({
  breath,
  difficulty,
  energy,
  globalPain,
  onChange
}: {
  breath: BreathFeedback;
  difficulty: number;
  energy: number;
  globalPain: number;
  onChange: (patch: { breath?: BreathFeedback; difficulty?: number; energy?: number; globalPain?: number }) => void;
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
      <h2 className="text-lg font-black">Retour global</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <NumberFeedback label="Difficulte" max={10} min={1} onChange={(value) => onChange({ difficulty: value })} value={difficulty} />
        <NumberFeedback label="Douleur globale" max={10} min={0} onChange={(value) => onChange({ globalPain: value })} value={globalPain} />
        <NumberFeedback label="Energie" max={10} min={1} onChange={(value) => onChange({ energy: value })} value={energy} />
        <label className="block">
          <span className="text-sm font-bold text-ink/60">Souffle</span>
          <select
            className="mt-1 h-12 w-full rounded-md border border-black/10 bg-white px-3 text-base font-black outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => onChange({ breath: event.target.value as BreathFeedback })}
            value={breath}
          >
            <option value="bon">Bon</option>
            <option value="correct">Correct</option>
            <option value="difficile">Difficile</option>
            <option value="tres-mauvais">Tres mauvais</option>
            <option value="vertige">Vertige</option>
            <option value="oppression">Oppression</option>
          </select>
        </label>
      </div>
    </section>
  );
}

function NumberFeedback({
  label,
  max,
  min,
  onChange,
  value
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-ink/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-black/10 px-3 text-lg font-black outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

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

function getLastLoad(history: CompletedSession[], exerciseId: string): string | undefined {
  for (const session of history) {
    const usedLoad = session.logs[exerciseId]?.usedLoad;

    if (usedLoad) {
      return usedLoad;
    }
  }

  return undefined;
}

function getSessionsThisWeek(history: CompletedSession[]) {
  const start = new Date();
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);

  return history.filter((session) => new Date(session.completedAt) >= start);
}

function createEmptyLog(exerciseId: string): ExerciseLog {
  return {
    exerciseId,
    usedLoad: "",
    completedReps: "",
    comment: ""
  };
}

async function requestAiCoach(
  completed: CompletedSession,
  weeklySessions: CompletedSession[],
  isEnabled: boolean,
  attachAiCoachResponse: (sessionId: string, aiCoach: CoachAiResponse) => void,
  setLastSummary: (session: CompletedSession) => void,
  setAiStatus: (status: string) => void
) {
  if (!isEnabled) {
    setAiStatus("IA desactivee");
    return;
  }

  setAiStatus("Analyse IA en cours...");

  try {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ session: completed, weeklySessions })
    });

    if (!response.ok) {
      throw new Error(`Coach API error ${response.status}`);
    }

    const aiCoach = (await response.json()) as CoachAiResponse;
    const nextSummary = { ...completed, aiCoach };

    attachAiCoachResponse(completed.id, aiCoach);
    setLastSummary(nextSummary);
    setAiStatus(aiCoach.summary === "IA desactivee" ? "IA desactivee" : "Analyse IA ajoutee");
  } catch {
    setAiStatus("IA indisponible. Les decisions locales sont conservees.");
  }
}
