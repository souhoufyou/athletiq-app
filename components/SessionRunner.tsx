"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdaptationExplanationCard } from "@/components/AdaptationExplanation";
import { SessionSummary } from "@/components/SessionSummary";
import { SessionCelebration } from "@/components/session/SessionCelebration";
import { SessionStepAnnounce } from "@/components/session/SessionStepAnnounce";
import { SessionStepFeedback } from "@/components/session/SessionStepFeedback";
import { SessionStepRest } from "@/components/session/SessionStepRest";
import { SessionStepSet } from "@/components/session/SessionStepSet";
import { SessionStepWrapUp, type SessionWrapUp } from "@/components/session/SessionStepWrapUp";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { getContextualAlternatives } from "@/lib/alternatives";
import { estimateCalories, type CalorieEstimate } from "@/lib/calories";
import { rememberExerciseSwap } from "@/lib/exerciseSwapPreferences";
import { summarizeProgressions } from "@/lib/progression";
import { getCompletedCount } from "@/lib/session";
import {
  aggregateSets,
  computeInitialStep,
  getDefaultLoadForSet,
  getDefaultRepsValue,
  getPlannedSetCount,
  type SessionStep
} from "@/lib/sessionFlow";
import { useCoachStorage } from "@/lib/storage";
import { formatDuration, formatDurationLong, parseRestSeconds } from "@/lib/time";
import type {
  ActiveSession,
  CoachAiResponse,
  CompletedSession,
  EffortStatus,
  Exercise,
  SetLog
} from "@/types/training";

export function SessionRunner() {
  const [lastSummary, setLastSummary] = useState<CompletedSession | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("");
  const [step, setStep] = useState<SessionStep | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [alternativesFor, setAlternativesFor] = useState<number | null>(null);
  const stepInitializedRef = useRef<string | null>(null);
  const lastTrackedExerciseIdRef = useRef<string | null>(null);

  const {
    activeSession,
    attachAiCoachResponse,
    cancelActiveSession,
    completeSession,
    currentProgram,
    dateKey,
    isReady,
    pauseSessionTimer,
    replaceExercise,
    resumeSessionTimer,
    settings,
    setSettings,
    setActiveExercise,
    startSession,
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
  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);

  const matchingActive = Boolean(activeSession && activePlannedSession && activeSession.dateKey === dateKey);
  const active = matchingActive ? activeSession : null;
  const currentSession = active ? runningSession : todaySession;

  // Initialise / re-sync the step machine when a new active session appears
  useEffect(() => {
    if (!active) {
      if (stepInitializedRef.current !== null) {
        stepInitializedRef.current = null;
        setStep(null);
      }
      return;
    }

    if (stepInitializedRef.current === active.sessionId) {
      return;
    }
    stepInitializedRef.current = active.sessionId;
    setStep(computeInitialStep(currentSession.exercises, active.logs));
  }, [active, currentSession.exercises]);

  // Keep per-exercise timing tracking aligned with the visible exercise.
  // The store writes a fresh reference on every emit, so we MUST guard with a
  // ref to avoid an infinite render loop (active → effect → setActiveExercise
  // → new active reference → effect again).
  useEffect(() => {
    if (!active || !step) {
      lastTrackedExerciseIdRef.current = null;
      return;
    }
    if (step.type === "complete" || step.type === "wrap-up" || step.type === "celebration") return;

    const exercise = currentSession.exercises[step.exerciseIndex];
    if (!exercise) return;
    if (lastTrackedExerciseIdRef.current === exercise.id) return;

    lastTrackedExerciseIdRef.current = exercise.id;
    setActiveExercise(exercise.id);
  }, [active, step, currentSession.exercises, setActiveExercise]);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRE / POST-SESSION VIEW (no active session)
  // ─────────────────────────────────────────────────────────────────────────

  if (!active) {
    const summarySession = lastSummary ?? todaysCompletedSession;
    const plannedForSummary = summarySession
      ? currentProgram.find((s) => s.id === summarySession.sessionId)
      : undefined;
    const calorieEstimate =
      plannedForSummary && summarySession
        ? estimateCalories(
            plannedForSummary.intensity,
            settings.currentWeightKg,
            summarySession.totalDurationMs
          )
        : undefined;

    const handleRequestAi = (session: CompletedSession) => {
      requestAiCoach(session, settings.aiEnabled, attachAiCoachResponse, setLastSummary, setAiStatus);
    };

    return (
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#11131a] p-5 text-white shadow-soft">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(255,91,0,0.34),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_44%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-coral">Mode séance</p>
                <h1 className="mt-2 text-3xl font-black leading-[0.95] text-white">{todaySession.title}</h1>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-white/60">
                  {activeProgram?.name ?? "Programme actif"} - {todaySession.focus}
                </p>
              </div>
              <span className="shrink-0 rounded-2xl border border-coral/30 bg-coral/15 px-3 py-2 text-sm font-black text-coral">
                Aujourd&apos;hui
              </span>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <LaunchMetric label="Durée" value={todaySession.duration} />
              <LaunchMetric label="Exercices" value={String(todaySession.exercises.length)} />
              <LaunchMetric label="Intensité" value={todaySession.intensity} />
            </div>
          </div>
        </section>

        {summarySession?.progressions ? (
          <GuidedSessionReport
            aiEnabled={settings.aiEnabled}
            aiStatus={aiStatus}
            calories={calorieEstimate}
            onRequestAi={() => handleRequestAi(summarySession)}
            session={summarySession}
          />
        ) : null}

        {!summarySession ? <SessionSummary completed={Boolean(todaysCompletedSession)} session={todaySession} /> : null}

        {todaysCompletedSession ? (
          <div className="card-dark border border-sea/20 p-4">
            <p className="font-black text-sea">Séance du jour validée ✓</p>
            <p className="mt-1 text-sm font-semibold text-white/55">
              Le bilan est ci-dessus et disponible dans l&apos;historique.
              {summarySession ? " Tu peux la relancer si tu veux la refaire." : ""}
            </p>
          </div>
        ) : null}

        {todaysCompletedSession ? (
          <button
            className="h-12 w-full rounded-md border border-white/10 bg-white/8 text-sm font-black text-white/70 transition hover:bg-white/12"
            onClick={() => {
              if (typeof window !== "undefined") {
                const ok = window.confirm(
                  "Une séance est déjà validée aujourd'hui. Relancer en créera une seconde dans l'historique (la précédente est conservée). Continuer ?"
                );
                if (!ok) return;
              }
              setLastSummary(null);
              setAiStatus("");
              startSession(todaySession);
            }}
            type="button"
          >
            Refaire la séance
          </button>
        ) : (
          <button
            className="h-16 w-full rounded-2xl bg-coral px-4 text-lg font-black text-white shadow-[0_18px_45px_rgba(255,91,0,0.32)] transition hover:bg-coral/90"
            onClick={() => {
              setLastSummary(null);
              setAiStatus("");
              startSession(todaySession);
            }}
            type="button"
          >
            Commencer la séance
          </button>
        )}

        <section className="card-dark p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-white/40">Plan du jour</p>
              <h2 className="mt-1 text-xl font-black text-white">Ce que tu vas faire</h2>
            </div>
            <Link
              className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/70"
              href="/programme"
            >
              Programme
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {todaySession.exercises.slice(0, 6).map((exercise, index) => (
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 p-3" key={exercise.id}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-sm font-black text-coral">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{exercise.name}</p>
                  <p className="text-xs font-semibold text-white/45">
                    {exercise.plannedLoad ? `${exercise.plannedLoad} - ` : ""}{exercise.target}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Link
          className="block h-12 rounded-md border border-white/10 bg-white/8 px-4 py-3 text-center font-black text-white"
          href="/"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DURING-SESSION VIEW (step machine)
  // ─────────────────────────────────────────────────────────────────────────

  if (!step) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement de la séance...</div>;
  }

  const completedCount = getCompletedCount(active.logs);
  const exerciseTotal = Math.max(1, currentSession.exercises.length);
  const progressPercent = Math.round((completedCount / exerciseTotal) * 100);

  const persistSet = (exerciseId: string, newSet: SetLog) => {
    const current = active.logs[exerciseId]?.sets ?? [];
    const filtered = current.filter((s) => s.setIndex !== newSet.setIndex);
    const nextSets = [...filtered, newSet].sort((a, b) => a.setIndex - b.setIndex);
    const aggregate = aggregateSets(nextSets);

    updateExerciseLog(exerciseId, {
      sets: nextSets,
      usedLoad: aggregate.usedLoad,
      completedReps: aggregate.completedReps
    });
  };

  const effectiveExerciseAt = (index: number): Exercise | undefined => {
    const planned = currentSession.exercises[index];
    if (!planned) return undefined;
    return active.replacements?.[planned.id] ?? planned;
  };

  const goToNextExerciseOrWrapUp = (currentIndex: number) => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < currentSession.exercises.length) {
      setStep({ type: "announce", exerciseIndex: nextIndex });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setStep({ type: "wrap-up" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finalizeSession = () => {
    setStep({ type: "complete" });
    const completed = completeSession(currentSession);
    if (completed) {
      setLastSummary(completed);
      setAiStatus("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStart = (exerciseIndex: number) => {
    setStep({ type: "set", exerciseIndex, setIndex: 1 });
  };

  const handleSkipFromAnnounce = (exerciseIndex: number) => {
    const exercise = currentSession.exercises[exerciseIndex];
    if (!exercise) return;
    updateExerciseLog(exercise.id, {
      status: "skipped",
      sets: [],
      usedLoad: "",
      completedReps: "",
      comment: ""
    });
    goToNextExerciseOrWrapUp(exerciseIndex);
  };

  const handleCompleteSet = (
    exerciseIndex: number,
    setIndex: number,
    data: { usedLoad: string; completedReps: string }
  ) => {
    const planned = currentSession.exercises[exerciseIndex];
    const effective = effectiveExerciseAt(exerciseIndex);
    if (!planned || !effective) return;

    persistSet(planned.id, { setIndex, ...data });

    const setCount = getPlannedSetCount(effective);
    if (setIndex >= setCount) {
      setStep({ type: "feedback", exerciseIndex });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const restSeconds = parseRestSeconds(effective.rest);
    setStep({
      type: "rest",
      exerciseIndex,
      nextSetIndex: setIndex + 1,
      durationSec: restSeconds
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleContinueAfterRest = (exerciseIndex: number, nextSetIndex: number) => {
    setStep({ type: "set", exerciseIndex, setIndex: nextSetIndex });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFeedback = (
    exerciseIndex: number,
    data: { status: EffortStatus; comment: string }
  ) => {
    const exercise = currentSession.exercises[exerciseIndex];
    if (!exercise) return;
    updateExerciseLog(exercise.id, {
      status: data.status,
      comment: data.comment
    });
    goToNextExerciseOrWrapUp(exerciseIndex);
  };

  const handleWrapUp = (data: SessionWrapUp) => {
    updateSessionFeedback({
      difficulty: data.difficulty,
      globalPain: data.globalPain
    });
    // Show the celebration screen first, then run finalizeSession on Continue.
    setStep({ type: "celebration" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleApplyAlternative = (exerciseIndex: number, replacement: Exercise) => {
    const original = currentSession.exercises[exerciseIndex];
    if (!original) return;
    replaceExercise(original.id, replacement);
    setSettings(rememberExerciseSwap(settings, original, replacement));
    setAlternativesFor(null);
  };

  const handleQuitConfirmed = () => {
    cancelActiveSession();
    setStep(null);
    setShowQuitConfirm(false);
    setAlternativesFor(null);
    stepInitializedRef.current = null;
  };

  return (
    <div className="space-y-4">
      <section className="z-20 -mx-4 border-b border-white/10 bg-[#0f111a]/95 px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              aria-label="Quitter la séance"
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-black text-white/70 transition hover:bg-white/10"
              onClick={() => setShowQuitConfirm(true)}
              type="button"
            >
              ✕
            </button>
            <p className="text-xs font-black tabular-nums text-white/60">
              {completedCount}/{currentSession.exercises.length}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-coral/25 bg-coral/10 px-3 py-1.5">
            <span className="size-2 animate-pulse rounded-full bg-coral" />
            <SessionElapsedTime session={active} />
          </div>
          <button
            aria-label={active.timer.isPaused ? "Reprendre" : "Pause"}
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-black text-white/70 transition hover:bg-white/10"
            onClick={() => (active.timer.isPaused ? resumeSessionTimer() : pauseSessionTimer())}
            type="button"
          >
            {active.timer.isPaused ? "▶" : "⏸"}
          </button>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </section>

      {step.type === "announce" ? (
        (() => {
          const planned = currentSession.exercises[step.exerciseIndex];
          const effective = effectiveExerciseAt(step.exerciseIndex);
          const isReplaced = Boolean(planned && active.replacements?.[planned.id]);
          if (!effective) return null;
          return (
            <SessionStepAnnounce
              exercise={effective}
              exerciseIndex={step.exerciseIndex}
              exerciseTotal={currentSession.exercises.length}
              isReplaced={isReplaced}
              onReplace={() => setAlternativesFor(step.exerciseIndex)}
              onSkip={() => handleSkipFromAnnounce(step.exerciseIndex)}
              onStart={() => handleStart(step.exerciseIndex)}
            />
          );
        })()
      ) : null}

      {step.type === "set" ? (
        (() => {
          const planned = currentSession.exercises[step.exerciseIndex];
          const effective = effectiveExerciseAt(step.exerciseIndex);
          if (!planned || !effective) return null;
          const existingSets = active.logs[planned.id]?.sets;
          const defaultLoad = getDefaultLoadForSet(effective, step.setIndex, existingSets);
          const defaultReps = getDefaultRepsValue(effective);
          return (
            <SessionStepSet
              defaultLoad={defaultLoad}
              defaultReps={defaultReps}
              exercise={effective}
              onComplete={(data) => handleCompleteSet(step.exerciseIndex, step.setIndex, data)}
              setCount={getPlannedSetCount(effective)}
              setIndex={step.setIndex}
            />
          );
        })()
      ) : null}

      {step.type === "rest" ? (
        (() => {
          const planned = currentSession.exercises[step.exerciseIndex];
          const effective = effectiveExerciseAt(step.exerciseIndex);
          if (!planned || !effective) return null;
          const justFinishedIndex = step.nextSetIndex - 1;
          const lastSet = active.logs[planned.id]?.sets?.find((s) => s.setIndex === justFinishedIndex);
          return (
            <SessionStepRest
              exercise={effective}
              initialSeconds={step.durationSec}
              lastSet={lastSet}
              nextSetIndex={step.nextSetIndex}
              onContinue={() => handleContinueAfterRest(step.exerciseIndex, step.nextSetIndex)}
              setCount={getPlannedSetCount(effective)}
              setIndexJustFinished={justFinishedIndex}
            />
          );
        })()
      ) : null}

      {step.type === "feedback" ? (
        (() => {
          const effective = effectiveExerciseAt(step.exerciseIndex);
          if (!effective) return null;
          const isLast = step.exerciseIndex === currentSession.exercises.length - 1;
          return (
            <SessionStepFeedback
              exercise={effective}
              exerciseIndex={step.exerciseIndex}
              exerciseTotal={currentSession.exercises.length}
              isLastExercise={isLast}
              onValidate={(data) => handleFeedback(step.exerciseIndex, data)}
            />
          );
        })()
      ) : null}

      {step.type === "wrap-up" ? (
        <SessionStepWrapUp
          completedCount={completedCount}
          exerciseCount={currentSession.exercises.length}
          onValidate={handleWrapUp}
        />
      ) : null}

      {step.type === "celebration" ? (
        <SessionCelebration
          durationLabel={formatDurationLong(
            Math.max(0, Date.now() - new Date(active.timer.startedAt).getTime() - active.timer.pausedTotalMs)
          )}
          exerciseCount={currentSession.exercises.length}
          onContinue={finalizeSession}
        />
      ) : null}

      {step.type === "complete" ? (
        <div className="session-step-card session-step-enter p-5 text-center">
          <div className="session-step-accent" style={{ background: "linear-gradient(90deg, #24c07a, #ff7a18)" }} />
          <p className="text-xs font-black uppercase tracking-[0.28em] text-sea">Séance terminée</p>
          <p className="mt-2 text-base font-semibold text-white/65">
            Enregistrement en cours…
          </p>
        </div>
      ) : null}

      {alternativesFor !== null ? (
        (() => {
          const planned = currentSession.exercises[alternativesFor];
          const effective = effectiveExerciseAt(alternativesFor);
          if (!planned || !effective) return null;
          const currentLog = active.logs[planned.id];
          const isReplaced = Boolean(active.replacements?.[planned.id]);
          const alternatives = getContextualAlternatives(planned.id, planned, {
            avoid: settings.avoid,
            comment: currentLog?.comment,
            equipment: settings.equipment,
            status: currentLog?.status,
            watchPoints: settings.watchPoints
          });
          return (
            <AlternativesSheet
              alternatives={alternatives}
              currentExerciseName={effective.name}
              isReplaced={isReplaced}
              onClose={() => setAlternativesFor(null)}
              onResetReplacement={() => {
                replaceExercise(planned.id, planned);
                setAlternativesFor(null);
              }}
              onSelect={(alt) => handleApplyAlternative(alternativesFor, alt)}
            />
          );
        })()
      ) : null}

      {showQuitConfirm ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink p-5 text-white shadow-soft">
            <h2 className="text-xl font-black">Quitter la séance ?</h2>
            <p className="mt-2 text-sm font-semibold text-white/65">
              Ta progression sur cette séance ne sera pas enregistrée dans l&apos;historique.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                className="h-12 rounded-md border border-white/10 bg-white/8 px-3 text-sm font-black text-white transition hover:bg-white/12"
                onClick={() => setShowQuitConfirm(false)}
                type="button"
              >
                Continuer la séance
              </button>
              <button
                className="h-12 rounded-md bg-coral px-3 text-sm font-black text-white transition hover:bg-coral/90"
                onClick={handleQuitConfirmed}
                type="button"
              >
                Quitter
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Alternatives bottom sheet
// ─────────────────────────────────────────────────────────────────────────

function AlternativesSheet({
  alternatives,
  currentExerciseName,
  isReplaced,
  onClose,
  onResetReplacement,
  onSelect
}: {
  alternatives: Exercise[];
  currentExerciseName: string;
  isReplaced: boolean;
  onClose: () => void;
  onResetReplacement: () => void;
  onSelect: (alt: Exercise) => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-ink p-5 text-white shadow-soft sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-amber">Remplacer</p>
            <h2 className="mt-1 text-xl font-black leading-tight">
              Alternatives à <span className="text-white/70">{currentExerciseName}</span>
            </h2>
            <p className="mt-1 text-xs font-semibold text-white/55">
              Filtrées selon ton matériel et tes contraintes.
            </p>
          </div>
          <button
            aria-label="Fermer"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-black text-white/70"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {alternatives.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/4 p-4 text-sm font-semibold text-white/55">
              Pas d&apos;alternative prédéfinie pour cet exercice. Adapte librement la charge ou l&apos;exercice.
            </p>
          ) : (
            alternatives.map((alt) => (
              <button
                className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition hover:bg-white/8"
                key={`${alt.name}-${alt.target}`}
                onClick={() => onSelect(alt)}
                type="button"
              >
                <p className="font-black text-white">{alt.name}</p>
                <p className="mt-1 text-xs font-semibold text-white/55">
                  {alt.target} · Repos {alt.rest}
                </p>
                {alt.cue ? (
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-white/65">{alt.cue}</p>
                ) : null}
              </button>
            ))
          )}
        </div>

        {isReplaced ? (
          <button
            className="session-cta-secondary mt-4"
            onClick={onResetReplacement}
            type="button"
          >
            Revenir à l&apos;exercice original
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Helpers — reused from previous implementation
// ─────────────────────────────────────────────────────────────────────────

function LaunchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center">
      <p className="text-lg font-black leading-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/55">{label}</p>
    </div>
  );
}

function SessionElapsedTime({ session }: { session: ActiveSession }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (session.timer.isPaused) {
      return;
    }

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session.timer.isPaused, session.timer.pausedTotalMs, session.timer.startedAt]);

  return (
    <p className="shrink-0 text-lg font-black tabular-nums leading-none text-coral">
      {formatDuration(getElapsedMs(session, nowMs))}
    </p>
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

// ─────────────────────────────────────────────────────────────────────────
// Post-session report (kept from previous implementation — unchanged behaviour)
// ─────────────────────────────────────────────────────────────────────────

function GuidedSessionReport({
  aiEnabled,
  aiStatus,
  calories,
  onRequestAi,
  session
}: {
  aiEnabled: boolean;
  aiStatus: string;
  calories?: CalorieEstimate;
  onRequestAi: () => void;
  session: CompletedSession;
}) {
  const [openExerciseId, setOpenExerciseId] = useState<string | null>(null);
  const logs = Object.values(session.logs);
  const validCount = logs.filter((log) => log.status === "ok" || log.status === "easy").length;
  const easyCount = logs.filter((log) => log.status === "easy").length;
  const hardCount = logs.filter((log) => log.status === "hard").length;
  const painCount = logs.filter((log) => log.status === "pain").length;
  const smartSummary = summarizeProgressions(session.progressions ?? {});
  const adaptations = session.adaptationExplanations;
  const adaptationEntries = adaptations ? Object.entries(adaptations) : [];
  const aiLoading = aiStatus === "Analyse IA en cours...";
  const aiDone = Boolean(session.aiCoach && session.aiCoach.summary !== "IA désactivée");

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-white/10 premium-gradient p-5 text-white shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Bilan séance</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">{session.title}</h2>
        <p className="mt-2 text-sm font-semibold text-white/70">
          Séance terminée en {formatDurationLong(session.totalDurationMs)}
        </p>
        {calories ? (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2">
            <span className="text-lg">🔥</span>
            <div>
              <p className="text-xs font-black uppercase text-white/60">Calories estimées</p>
              <p className="text-xl font-black text-white">
                {calories.low}–{calories.high} kcal
              </p>
            </div>
          </div>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <ReportMetric label="Validés" tone="calm" value={String(validCount)} />
          <ReportMetric label="Faciles" tone="calm" value={String(easyCount)} />
          <ReportMetric label="Trop durs" tone="warn" value={String(hardCount)} />
          <ReportMetric label="Douleurs" tone="danger" value={String(painCount)} />
        </div>
      </div>

      {!aiDone ? (
        <div className="card-dark p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-white">Analyse IA</p>
              <p className="mt-1 text-xs font-semibold text-white/55">
                {aiEnabled
                  ? "Demande une lecture approfondie de ta séance."
                  : "Active l'IA dans les réglages pour analyser."}
              </p>
            </div>
            <button
              className={`h-11 shrink-0 rounded-md px-4 text-sm font-black transition ${
                aiEnabled
                  ? "bg-sky text-white hover:bg-sky/80"
                  : "border border-white/10 bg-white/8 text-white/40"
              } ${aiLoading ? "opacity-60" : ""}`}
              disabled={!aiEnabled || aiLoading}
              onClick={onRequestAi}
              type="button"
            >
              {aiLoading ? "Analyse…" : "Analyser avec l'IA"}
            </button>
          </div>
          {aiStatus && !aiLoading ? (
            <p className="mt-3 text-xs font-semibold text-white/50">{aiStatus}</p>
          ) : null}
        </div>
      ) : null}

      {aiDone && session.aiCoach ? (
        <div className="card-dark border border-sky/20 p-4">
          <p className="text-xs font-black uppercase text-sky">Coach IA</p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-white/80">{session.aiCoach.summary}</p>
          {session.aiCoach.motivationalMessage ? (
            <p className="mt-3 rounded-md bg-sky/10 p-3 text-sm font-black italic text-sky">
              &ldquo;{session.aiCoach.motivationalMessage}&rdquo;
            </p>
          ) : null}
          {session.aiCoach.warnings.length > 0 ? (
            <div className="mt-3 space-y-1">
              {session.aiCoach.warnings.map((w) => (
                <p className="rounded-md bg-coral/10 px-3 py-2 text-xs font-semibold text-coral" key={w}>
                  ⚠ {w}
                </p>
              ))}
            </div>
          ) : null}
          {session.aiCoach.nextSessionAdjustments.length > 0 ? (
            <div className="mt-3">
              <p className="text-xs font-black uppercase text-white/55">Prochaine séance</p>
              <div className="mt-2 space-y-1">
                {session.aiCoach.nextSessionAdjustments.map((adj) => (
                  <p className="rounded-md bg-white/8 px-3 py-2 text-xs font-semibold text-white/80" key={adj}>
                    {adj}
                  </p>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <SmartSummarySection empty="Aucune progression automatique." items={smartSummary.progressing} title="Ce qui progresse" tone="progress" />
      <SmartSummarySection empty="Rien à signaler." items={smartSummary.unchanged} title="Ce qui reste pareil" tone="steady" />
      <SmartSummarySection empty="Aucune alerte particulière." items={smartSummary.watch} title="Ce qu’on surveille" tone="watch" />
      <SmartSummarySection
        empty="Aucun ajustement calculé."
        items={smartSummary.nextSessionAdjustments}
        title="Prochaine séance ajustée"
        tone="next"
      />

      {adaptationEntries.length > 0 ? (
        <section className="card-dark border border-sky/20 p-4">
          <h3 className="text-lg font-black text-white">Pourquoi ton programme évolue ?</h3>
          <p className="mt-1 text-sm font-semibold text-white/55">
            Clique sur un exercice pour voir le raisonnement de l&apos;adaptation.
          </p>
          <div className="mt-4 space-y-2">
            {adaptationEntries.map(([exerciseId, summary]) => {
              const exerciseName =
                session.progressions?.[exerciseId]?.exerciseName ?? exerciseId;
              const isOpen = openExerciseId === exerciseId;

              return (
                <div className="overflow-hidden rounded-lg border border-white/10" key={exerciseId}>
                  <button
                    className="flex w-full items-center justify-between gap-3 bg-white/8 px-4 py-3 text-left"
                    onClick={() => setOpenExerciseId(isOpen ? null : exerciseId)}
                    type="button"
                  >
                    <span className="font-black text-white">{exerciseName}</span>
                    <span className="shrink-0 text-xs font-black text-sky">
                      {isOpen ? "▲ Fermer" : "▼ Voir"}
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-white/10 bg-white/5 p-3">
                      <AdaptationExplanationCard
                        confidence={summary.confidence}
                        exerciseName={exerciseName}
                        explanation={summary.explanation}
                        violations={summary.violations}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}

function SmartSummarySection({
  empty,
  items,
  title,
  tone
}: {
  empty: string;
  items: string[];
  title: string;
  tone: "next" | "progress" | "steady" | "watch";
}) {
  const toneClass = {
    next: "border-sky/20 bg-sky/10 text-sky",
    progress: "border-amber/20 bg-amber/10 text-amber",
    steady: "border-sea/20 bg-sea/10 text-sea",
    watch: "border-coral/20 bg-coral/10 text-coral"
  }[tone];

  return (
    <section className={`rounded-xl border p-4 shadow-soft ${toneClass}`}>
      <h3 className="text-lg font-black text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.map((item) => (
            <p className="rounded-md bg-white/8 p-3 text-sm font-semibold leading-relaxed text-white/80" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-md bg-white/8 p-3 text-sm font-semibold text-white/50">{empty}</p>
        )}
      </div>
    </section>
  );
}

function ReportMetric({
  label,
  tone,
  value
}: {
  label: string;
  tone: "calm" | "danger" | "warn";
  value: string;
}) {
  const toneClass = {
    calm: "bg-sea/15 text-white",
    danger: "bg-red-500/20 text-white",
    warn: "bg-coral/20 text-white"
  }[tone];

  return (
    <div className={`rounded-md p-3 ${toneClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-white/70">{label}</p>
    </div>
  );
}

async function requestAiCoach(
  completed: CompletedSession,
  isEnabled: boolean,
  attachAiCoachResponse: (sessionId: string, aiCoach: CoachAiResponse) => void,
  setLastSummary: (session: CompletedSession) => void,
  setAiStatus: (status: string) => void
) {
  if (!isEnabled) {
    setAiStatus("IA désactivée");
    return;
  }

  setAiStatus("Analyse IA en cours...");

  try {
    const response = await fetch("/api/coach", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ session: completed })
    });

    if (!response.ok) {
      throw new Error(`Coach API error ${response.status}`);
    }

    const aiCoach = (await response.json()) as CoachAiResponse;
    const nextSummary = { ...completed, aiCoach };

    attachAiCoachResponse(completed.id, aiCoach);
    setLastSummary(nextSummary);
    setAiStatus(aiCoach.summary === "IA désactivée" ? "IA désactivée" : "Analyse IA ajoutée");
  } catch {
    setAiStatus("IA indisponible. Les décisions locales sont conservées.");
  }
}
