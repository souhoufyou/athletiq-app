"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdaptationExplanationCard } from "@/components/AdaptationExplanation";
import { SessionSummary } from "@/components/SessionSummary";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { getContextualAlternatives } from "@/lib/alternatives";
import { estimateCalories, type CalorieEstimate } from "@/lib/calories";
import { appendCalibrationEvent, createLoadFeedbackCalibrationEvent } from "@/lib/calibrationEvents";
import { rememberExerciseSwap } from "@/lib/exerciseSwapPreferences";
import { getLiveCoachAdvice, type LiveCoachAdvice } from "@/lib/liveCoaching";
import { getExerciseLoadInsight } from "@/lib/loadInsights";
import { applyLoadFeedbackToSettings, tuneExerciseLoad, type LoadFeedback } from "@/lib/loadTuning";
import { summarizeProgressions } from "@/lib/progression";
import { defaultSessionFeedback, getCompletedCount } from "@/lib/session";
import { useCoachStorage } from "@/lib/storage";
import { formatDuration, formatDurationLong, parseRestSeconds } from "@/lib/time";
import type {
  ActiveSession,
  BreathFeedback,
  CoachAiResponse,
  CompletedSession,
  EffortStatus,
  ExerciseSelectionInsight,
  ExerciseLog
} from "@/types/training";

type RestTimerState = {
  done: boolean;
  exerciseId?: string;
  initialSeconds: number;
  running: boolean;
  secondsLeft: number;
};

const statusOptions: Array<{ value: EffortStatus; label: string; idle: string; active: string }> = [
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
    idle: "border-white/10 bg-white/8 text-white/60",
    active: "border-zinc-500 bg-zinc-600 text-white"
  }
];

const quickReasonOptions = [
  "douleur poignet",
  "douleur épaule",
  "douleur dos",
  "douleur genou",
  "souffle",
  "trop lourd",
  "manque d'énergie"
];

export function SessionRunner() {
  const [lastSummary, setLastSummary] = useState<CompletedSession | null>(null);
  const [aiStatus, setAiStatus] = useState<string>("");
  const [finishWarning, setFinishWarning] = useState<string>("");
  const [loadFeedbackMessage, setLoadFeedbackMessage] = useState<string>("");
  const [showAlternatives, setShowAlternatives] = useState(false);
  const {
    activeSession,
    attachAiCoachResponse,
    clearReplacement,
    completeSession,
    currentProgram,
    dateKey,
    history,
    isReady,
    pauseSessionTimer,
    replaceExercise,
    resumeSessionTimer,
    setCurrentProgram,
    setSettings,
    setActiveExercise,
    startSession,
    settings,
    todaySession,
    todaysCompletedSession,
    updateExerciseLog,
    updateExerciseLogsBatch,
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
  const loadFeedbackExerciseKey =
    activeSession?.timing.activeExerciseId
    ?? activePlannedSession?.exercises[0]?.id
    ?? todaySession.exercises[0]?.id
    ?? "";
  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);

  useEffect(() => {
    setLoadFeedbackMessage("");
  }, [loadFeedbackExerciseKey]);

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
  const currentRestSeconds = currentExercise ? parseRestSeconds(currentExercise.rest) : 0;
  const currentLastLoad = currentExercise ? lastLoads[currentExercise.id] : undefined;
  // Use replacement if user swapped the exercise this session
  const effectiveExercise = (currentExercise && active?.replacements?.[currentExercise.id]) ?? currentExercise;
  const loadInsight = effectiveExercise ? getExerciseLoadInsight(effectiveExercise, settings) : undefined;
  const isReplaced = Boolean(currentExercise && active?.replacements?.[currentExercise.id]);
  const feedback = active?.feedback ?? defaultSessionFeedback;
  const currentLog = currentExercise && active
    ? active.logs[currentExercise.id] ?? createEmptyLog(currentExercise.id)
    : createEmptyLog(currentExercise?.id ?? "exercise");
  const alternatives = currentExercise
    ? getContextualAlternatives(currentExercise.id, currentExercise, {
        avoid: settings.avoid,
        comment: currentLog.comment,
        equipment: settings.equipment,
        status: currentLog.status,
        watchPoints: settings.watchPoints
      })
    : [];
  const liveAdvice = effectiveExercise
    ? getLiveCoachAdvice({
        exercise: effectiveExercise,
        feedback,
        log: currentLog,
        session: currentSession
      })
    : undefined;

  const goToExercise = (index: number) => {
    const target = currentSession.exercises[index];

    if (!target) {
      return;
    }

    setActiveExercise(target.id);
    setShowAlternatives(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRequestAi = (session: CompletedSession) => {
    requestAiCoach(session, settings.aiEnabled, attachAiCoachResponse, setLastSummary, setAiStatus);
  };

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

    return (
      <div className="space-y-5">
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
        {todaysCompletedSession && !lastSummary ? (
          <div className="card-dark border border-moss/20 p-4">
            <p className="font-black text-moss">Séance validée aujourd&apos;hui.</p>
            <p className="mt-1 text-sm font-semibold text-white/55">
              Elle est disponible dans l&apos;historique. Tu peux aussi relancer une nouvelle saisie si besoin.
            </p>
          </div>
        ) : null}
        <button
          className="h-16 w-full rounded-md bg-coral px-4 text-lg font-black text-white shadow-soft transition hover:bg-coral/90"
          onClick={() => {
            setLastSummary(null);
            setAiStatus("");
            startSession(todaySession);
          }}
          type="button"
        >
          Commencer la séance guidée
        </button>
        <Link
          className="block h-12 rounded-md border border-white/10 bg-white/8 px-4 py-3 text-center font-black text-white"
          href="/"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const updateCurrentLog = (patch: Partial<ExerciseLog>) => {
    if (!currentExercise) {
      return;
    }

    updateExerciseLog(currentExercise.id, patch);
    setFinishWarning("");
  };

  const applyLiveLoadFeedback = (feedbackDecision: LoadFeedback) => {
    if (!currentExercise || !effectiveExercise) {
      return;
    }

    const tunedExercise = tuneExerciseLoad(effectiveExercise, feedbackDecision);
    const nextSettings = appendCalibrationEvent(
      applyLoadFeedbackToSettings(settings, effectiveExercise, feedbackDecision),
      createLoadFeedbackCalibrationEvent(effectiveExercise, feedbackDecision, tunedExercise.plannedLoad)
    );

    if (isReplaced) {
      replaceExercise(currentExercise.id, tunedExercise);
    } else {
      setCurrentProgram(currentProgram.map((session) => ({
        ...session,
        exercises: session.exercises.map((exercise) => (
          session.id === currentSession.id && exercise.id === currentExercise.id ? tunedExercise : exercise
        ))
      })));
    }

    setSettings(nextSettings);

    if (tunedExercise.plannedLoad && feedbackDecision !== "correct") {
      updateCurrentLog({ usedLoad: tunedExercise.plannedLoad });
    }

    setLoadFeedbackMessage(
      feedbackDecision === "correct"
        ? `${effectiveExercise.name}: charge validee pour cette seance.`
        : feedbackDecision === "too-light"
          ? `${effectiveExercise.name}: charge montee tout de suite et futur calibrage plus ambitieux.`
          : `${effectiveExercise.name}: charge reduite tout de suite et futur calibrage plus prudent.`
    );
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

  const revealAlternatives = () => {
    setShowAlternatives(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const markAllOk = () => {
    updateExerciseLogsBatch(currentSession.exercises.map((exercise) => {
      const existing = active.logs[exercise.id];

      return {
        exerciseId: exercise.id,
        patch: {
          status: "ok" as EffortStatus,
          usedLoad: existing?.usedLoad || exercise.plannedLoad || "",
          completedReps: existing?.completedReps || exercise.target
        }
      };
    }));
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
      <section className="sticky top-0 z-20 -mx-4 border-b border-white/10 bg-[#0f111a]/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-3">
          <p className="shrink-0 text-xs font-black tabular-nums text-white/70">
            {currentIndex + 1}/{currentSession.exercises.length}
          </p>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-sky transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <SessionElapsedTime session={active} />
          <button
            aria-label={active.timer.isPaused ? "Reprendre" : "Pause"}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-black text-white/70 transition hover:bg-white/10"
            onClick={() => (active.timer.isPaused ? resumeSessionTimer() : pauseSessionTimer())}
            type="button"
          >
            {active.timer.isPaused ? "▶" : "⏸"}
          </button>
        </div>
      </section>

      <section className="card-dark p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-sky">Séance guidée</p>
            <h2 className="mt-0.5 truncate text-base font-black text-white">{currentSession.title}</h2>
          </div>
          <button
            className="h-10 shrink-0 rounded-md bg-sea px-3 text-xs font-black text-white shadow-sm transition hover:bg-sea/90"
            onClick={markAllOk}
            type="button"
          >
            Tout marquer OK
          </button>
        </div>
      </section>

      <SessionProgramCard
        programName={activeProgram?.name ?? "Programme personnalise"}
        programMeta={activeProgram ? `${activeProgram.frequency} j/sem. - ${activeProgram.averageDuration}` : `${currentProgram.length} jours actifs`}
      />

      {finishWarning ? (
        <div className="rounded-xl border border-coral/20 bg-coral/10 p-4 text-sm font-black leading-relaxed text-coral shadow-soft">
          {finishWarning}
        </div>
      ) : null}

      {effectiveExercise ? (
        <>
          <section className="rounded-2xl bg-ink p-5 text-white shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase text-sky">
                  Exercice {currentIndex + 1} sur {currentSession.exercises.length}
                </p>
                {isReplaced ? (
                  <p className="mt-1 text-xs font-black text-amber">Remplacé ce soir</p>
                ) : null}
                <h1 className="mt-2 text-3xl font-black leading-tight">{effectiveExercise.name}</h1>
                <p className="mt-3 text-base font-semibold leading-relaxed text-white/75">{effectiveExercise.cue}</p>
              </div>
              {currentLog.status ? (
                <span className="shrink-0 rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase text-white">
                  {statusLabel(currentLog.status)}
                </span>
              ) : null}
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-2">
              <FocusStat label="Charge prévue" value={effectiveExercise.plannedLoad ?? "À définir"} tone="info" />
              <FocusStat label="Séries / reps" value={effectiveExercise.target} tone="light" />
              <FocusStat label="Repos" value={effectiveExercise.rest} tone="warn" />
              <FocusStat label="Dernière charge" value={currentLastLoad ?? "Aucune"} tone="calm" />
            </dl>

            {loadInsight ? (
              <div className={`mt-3 rounded-md border px-3 py-3 ${loadInsightClass(loadInsight.tone)}`}>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-black/15 px-2 py-1 text-[10px] font-black uppercase">
                    {loadInsight.badge}
                  </span>
                  <p className="text-xs font-semibold leading-relaxed">{loadInsight.detail}</p>
                </div>
              </div>
            ) : null}
            {effectiveExercise.selectionInsight ? (
              <SelectionInsightCard insight={effectiveExercise.selectionInsight} />
            ) : null}

            {loadFeedbackMessage ? (
              <div className="mt-3 rounded-md border border-sea/20 bg-sea/10 px-3 py-2 text-xs font-semibold text-sea">
                {loadFeedbackMessage}
              </div>
            ) : null}

            {effectiveExercise.plannedLoad ? (
              <details className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <summary className="cursor-pointer list-none text-sm font-black text-white/70">
                  Ajuster la charge du jour
                </summary>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <LoadFeedbackButton
                    label="Trop leger"
                    onClick={() => applyLiveLoadFeedback("too-light")}
                    tone="info"
                  />
                  <LoadFeedbackButton
                    label="Correct"
                    onClick={() => applyLiveLoadFeedback("correct")}
                    tone="calm"
                  />
                  <LoadFeedbackButton
                    label="Trop lourd"
                    onClick={() => applyLiveLoadFeedback("too-heavy")}
                    tone="warn"
                  />
                </div>
              </details>
            ) : null}

            <button
              className={`mt-4 h-11 w-full rounded-md border px-4 text-sm font-black transition ${
                showAlternatives
                  ? "border-amber bg-amber/20 text-amber"
                  : "border-amber/30 bg-amber/10 text-amber hover:bg-amber/20"
              }`}
              onClick={() => setShowAlternatives((v) => !v)}
              type="button"
            >
              {showAlternatives ? "▲ Fermer les alternatives" : "🔄 Machine occupée — voir alternatives"}
            </button>
          </section>

          {showAlternatives ? (
            <section className="rounded-xl border border-amber/20 bg-amber/5 p-4 shadow-soft">
              <h3 className="text-base font-black text-amber">Alternatives recommandées</h3>
              <p className="mt-1 text-xs font-semibold text-white/55">
                Triées selon ton retour actuel, tes points à surveiller et tes exercices à éviter.
              </p>
              {alternatives.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {alternatives.map((alt) => (
                    <div
                      className="overflow-hidden rounded-xl border border-white/10 bg-white/5"
                      key={`${alt.name}-${alt.target}`}
                    >
                      <div className="p-3">
                        <p className="font-black text-white">{alt.name}</p>
                        <p className="mt-1 text-xs font-semibold text-white/55">{alt.target} · Repos {alt.rest}</p>
                        <p className="mt-2 text-xs font-semibold leading-relaxed text-white/70">{alt.cue}</p>
                      </div>
                      <button
                        className="w-full border-t border-white/10 bg-amber/15 py-2 text-sm font-black text-amber transition hover:bg-amber/25"
                        onClick={() => {
                          if (!currentExercise) return;
                          replaceExercise(currentExercise.id, alt);
                          setSettings(rememberExerciseSwap(settings, currentExercise, alt));
                          setShowAlternatives(false);
                        }}
                        type="button"
                      >
                        Choisir cet exercice
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-md bg-white/8 p-3 text-sm font-semibold text-white/50">
                  Aucune alternative prédéfinie. Adapte librement la charge ou l&apos;exercice.
                </p>
              )}
              {isReplaced ? (
                <button
                  className="mt-3 h-10 w-full rounded-md border border-white/10 bg-white/8 text-sm font-black text-white/60"
                  onClick={() => {
                    if (!currentExercise) return;
                    clearReplacement(currentExercise.id);
                    setShowAlternatives(false);
                  }}
                  type="button"
                >
                  Revenir à l&apos;exercice original
                </button>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}

      <RestTimerCard
        exerciseId={currentExercise?.id}
        onBeforeStart={() => {
          if (currentExercise) setActiveExercise(currentExercise.id);
        }}
        restLabel={currentExercise?.rest ?? "-"}
        restSeconds={currentRestSeconds}
      />

      <section className="card-dark p-4">
        <h2 className="text-lg font-black text-white">Action rapide</h2>
        <p className="mt-1 text-sm font-semibold text-white/55">
          Donne ton retour principal, puis passe a l&apos;exercice suivant.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {statusOptions
            .filter((status) => status.value !== "skipped")
            .map((status) => {
              const selected = currentLog.status === status.value;

              return (
                <button
                  className={`min-h-14 rounded-md border px-3 text-base font-black transition ${
                    selected ? status.active : status.idle
                  }`}
                  key={status.value}
                  onClick={() => handleStatus(status.value)}
                  type="button"
                >
                  {status.label}
                </button>
              );
            })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            className={`h-11 rounded-md border px-4 text-sm font-black transition ${
              showAlternatives
                ? "border-amber bg-amber/20 text-amber"
                : "border-amber/30 bg-amber/10 text-amber hover:bg-amber/20"
            }`}
            onClick={() => setShowAlternatives((value) => !value)}
            type="button"
          >
            {showAlternatives ? "Fermer remplacement" : "Remplacer"}
          </button>
          <button
            className={`h-11 rounded-md border px-4 text-sm font-black transition ${
              currentLog.status === "skipped"
                ? "border-zinc-500 bg-zinc-600 text-white"
                : "border-white/10 bg-white/8 text-white/70"
            }`}
            onClick={() => handleStatus("skipped")}
            type="button"
          >
            Passer
          </button>
        </div>
      </section>

      <details className="card-dark group p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Ajustements detailles</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">
              Charge realisee, reps et commentaire si tu veux etre plus precis.
            </p>
          </div>
          <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55 group-open:bg-sky/10 group-open:text-sky">
            Ouvrir
          </span>
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {statusOptions.map((status) => {
            const selected = currentLog.status === status.value;

            return (
              <button
                className={`min-h-14 rounded-md border px-3 text-base font-black transition ${
                  selected ? status.active : status.idle
                } ${status.value === "skipped" ? "col-span-2" : ""}`}
                key={status.value}
                onClick={() => handleStatus(status.value)}
                type="button"
              >
                {status.label}
              </button>
            );
          })}
        </div>

        <p className="mt-3 rounded-md bg-sky/10 px-3 py-2 text-xs font-bold leading-relaxed text-sky">
          Mode rapide : OK ou Facile remplit automatiquement la charge prévue et les reps prévues si les champs sont
          vides.
        </p>

        {needsQuickReason ? (
          <div className="mt-4 rounded-lg border border-coral/20 bg-coral/10 p-3">
            <p className="text-sm font-black text-white">Raison rapide</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {quickReasonOptions.map((reason) => (
                <button
                  className="min-h-11 rounded-md border border-coral/20 bg-coral/10 px-3 text-sm font-black text-coral shadow-sm"
                  key={reason}
                  onClick={() => applyQuickReason(reason)}
                  type="button"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {liveAdvice ? (
          <details className="mt-4 rounded-xl border border-sky/20 bg-sky/10 p-3">
            <summary className="cursor-pointer list-none text-sm font-black text-sky">
              Voir le conseil adaptatif
            </summary>
            <LiveCoachAdviceCard advice={liveAdvice} onShowAlternatives={revealAlternatives} />
          </details>
        ) : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm font-bold text-white/60">Charge réalisée</span>
            <input
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              inputMode="decimal"
              onChange={(event) => updateCurrentLog({ usedLoad: event.target.value })}
              placeholder="ex. 90 kg"
              value={currentLog.usedLoad}
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-white/60">Reps réalisées</span>
            <input
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              inputMode="text"
              onChange={(event) => updateCurrentLog({ completedReps: event.target.value })}
              placeholder="ex. 5/5/5"
              value={currentLog.completedReps}
            />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Commentaire optionnel</span>
          <textarea
            className="mt-1 min-h-24 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => updateCurrentLog({ comment: event.target.value })}
            placeholder="Sensation, douleur, adaptation..."
            value={currentLog.comment}
          />
        </label>
      </details>

      <details className="card-dark group p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Retour global</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">
              Ressenti general de la seance pour ajuster la prochaine.
            </p>
          </div>
          <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55 group-open:bg-sky/10 group-open:text-sky">
            Ouvrir
          </span>
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberFeedback
            label="Difficulté"
            max={10}
            min={1}
            onChange={(difficulty) => updateSessionFeedback({ difficulty })}
            value={feedback.difficulty}
          />
          <NumberFeedback
            label="Douleur globale"
            max={10}
            min={0}
            onChange={(globalPain) => updateSessionFeedback({ globalPain })}
            value={feedback.globalPain}
          />
          <NumberFeedback
            label="Énergie"
            max={10}
            min={1}
            onChange={(energy) => updateSessionFeedback({ energy })}
            value={feedback.energy}
          />
          <label className="block">
            <span className="text-sm font-bold text-white/60">Souffle</span>
            <select
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 text-base font-black text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              onChange={(event) => updateSessionFeedback({ breath: event.target.value as BreathFeedback })}
              value={feedback.breath}
            >
              <option value="bon">Bon</option>
              <option value="correct">Correct</option>
              <option value="difficile">Difficile</option>
              <option value="tres-mauvais">Très mauvais</option>
              <option value="vertige">Vertige</option>
              <option value="oppression">Oppression</option>
            </select>
          </label>
        </div>
      </details>

      <nav className="sticky bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-10 -mx-2 rounded-2xl border border-white/10 bg-[#0f111a]/95 p-2 shadow-soft backdrop-blur">
        <div className="grid grid-cols-2 gap-2">
          <button
            className="h-12 rounded-md border border-white/10 bg-white/8 px-3 text-sm font-black text-white disabled:opacity-40"
            disabled={!previousExercise}
            onClick={() => goToExercise(currentIndex - 1)}
            type="button"
          >
            Exercice précédent
          </button>
          <button
            className="h-12 rounded-md border border-sky/20 bg-sky/10 px-3 text-sm font-black text-sky disabled:opacity-40"
            disabled={!nextExercise}
            onClick={() => goToExercise(currentIndex + 1)}
            type="button"
          >
            Exercice suivant
          </button>
          <button
            className="col-span-2 h-14 rounded-md bg-coral px-4 text-base font-black text-white shadow-soft"
            onClick={finishSession}
            type="button"
          >
            Terminer séance
          </button>
        </div>
      </nav>
    </div>
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

function SessionProgramCard({
  programMeta,
  programName
}: {
  programMeta: string;
  programName: string;
}) {
  return (
    <section className="rounded-xl border border-sky/20 bg-sky/10 p-3 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-sky">Programme actif</p>
          <p className="mt-0.5 truncate text-sm font-black text-white">{programName}</p>
          <p className="mt-0.5 text-xs font-semibold text-white/55">{programMeta}</p>
        </div>
        <Link
          className="shrink-0 rounded-md border border-sky/25 bg-sky/10 px-3 py-2 text-xs font-black text-sky"
          href="/programme"
        >
          Voir
        </Link>
      </div>
    </section>
  );
}

function SelectionInsightCard({ insight }: { insight: ExerciseSelectionInsight }) {
  return (
    <div className="mt-3 rounded-md border border-white/10 bg-white/6 px-3 py-3">
      <p className="text-[10px] font-black uppercase text-white/40">Pourquoi cet exercice</p>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-white/70">{insight.summary}</p>
      <div className="mt-2 space-y-2">
        {insight.reasons.map((reason) => (
          <div className={`rounded-md border px-3 py-2 ${selectionReasonClass(reason.tone)}`} key={`${reason.title}-${reason.detail}`}>
            <p className="text-[10px] font-black uppercase">{reason.title}</p>
            <p className="mt-1 text-xs font-semibold leading-relaxed">{reason.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadFeedbackButton({
  label,
  onClick,
  tone
}: {
  label: string;
  onClick: () => void;
  tone: "calm" | "info" | "warn";
}) {
  const toneClass = {
    calm: "border-sea/20 bg-sea/10 text-sea",
    info: "border-sky/20 bg-sky/10 text-sky",
    warn: "border-amber/20 bg-amber/10 text-amber"
  }[tone];

  return (
    <button
      className={`h-10 rounded-md border text-xs font-black transition hover:brightness-110 ${toneClass}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function loadInsightClass(tone: "calm" | "info" | "muted" | "warn") {
  return {
    calm: "border-sea/20 bg-sea/10 text-sea",
    info: "border-sky/20 bg-sky/10 text-sky",
    muted: "border-white/10 bg-white/8 text-white/65",
    warn: "border-amber/20 bg-amber/10 text-amber"
  }[tone];
}

function selectionReasonClass(tone: "calm" | "info" | "warn") {
  return {
    calm: "border-sea/20 bg-sea/10 text-sea",
    info: "border-sky/20 bg-sky/10 text-sky",
    warn: "border-amber/20 bg-amber/10 text-amber"
  }[tone];
}

function LiveCoachAdviceCard({
  advice,
  onShowAlternatives
}: {
  advice: LiveCoachAdvice;
  onShowAlternatives: () => void;
}) {
  const toneClass = {
    calm: "border-sea/25 bg-sea/10 text-sea",
    danger: "border-red-500/30 bg-red-500/10 text-red-200",
    info: "border-sky/25 bg-sky/10 text-sky",
    warn: "border-amber/30 bg-amber/10 text-amber"
  }[advice.tone];
  const showAlternativeButton = advice.decision === "remplacer" || Boolean(advice.replacementSuggestion);

  return (
    <div className={`mt-4 rounded-xl border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-white/55">Coach live</p>
          <h3 className="mt-1 text-lg font-black text-white">{advice.title}</h3>
        </div>
        <span className="shrink-0 rounded-md bg-white/10 px-2 py-1 text-[11px] font-black uppercase text-white">
          {advice.primaryAction}
        </span>
      </div>

      <p className="mt-3 text-sm font-semibold leading-relaxed text-white/80">{advice.message}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <LiveCoachMetric label="Charge conseillee" value={advice.nextLoad} />
        <LiveCoachMetric label="Cible conseillee" value={advice.nextTarget} />
      </div>

      <p className="mt-3 rounded-md bg-white/8 p-3 text-xs font-semibold leading-relaxed text-white/70">
        {advice.reason}
      </p>

      {advice.warning ? (
        <p className="mt-2 rounded-md bg-coral/10 p-3 text-xs font-black leading-relaxed text-coral">
          {advice.warning}
        </p>
      ) : null}

      {advice.replacementSuggestion ? (
        <p className="mt-2 rounded-md bg-amber/10 p-3 text-xs font-semibold leading-relaxed text-amber">
          Variante conseillee : {advice.replacementSuggestion}
        </p>
      ) : null}

      {showAlternativeButton ? (
        <button
          className="mt-3 h-11 w-full rounded-md bg-amber px-4 text-sm font-black text-white shadow-sm transition hover:bg-amber/90"
          onClick={onShowAlternatives}
          type="button"
        >
          Voir les alternatives
        </button>
      ) : null}
    </div>
  );
}

function LiveCoachMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/8 p-3">
      <p className="text-[11px] font-black uppercase text-white/50">{label}</p>
      <p className="mt-1 text-sm font-black leading-tight text-white">{value}</p>
    </div>
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
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 text-lg font-black text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
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
    <p className="shrink-0 text-sm font-black tabular-nums text-white">
      {formatDuration(getElapsedMs(session, nowMs))}
    </p>
  );
}

function RestTimerCard({
  exerciseId,
  onBeforeStart,
  restLabel,
  restSeconds
}: {
  exerciseId?: string;
  onBeforeStart: () => void;
  restLabel: string;
  restSeconds: number;
}) {
  const [timer, setTimer] = useState<RestTimerState>({
    done: false,
    exerciseId,
    initialSeconds: 0,
    running: false,
    secondsLeft: 0
  });

  useEffect(() => {
    setTimer({
      done: false,
      exerciseId,
      initialSeconds: 0,
      running: false,
      secondsLeft: 0
    });
  }, [exerciseId]);

  useEffect(() => {
    if (!timer.running) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimer((current) => {
        if (!current.running) return current;

        if (current.secondsLeft <= 1) {
          return {
            ...current,
            done: true,
            running: false,
            secondsLeft: 0
          };
        }

        return { ...current, secondsLeft: current.secondsLeft - 1 };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timer.running]);

  const startRestTimer = () => {
    const seconds = Math.max(0, restSeconds);
    onBeforeStart();
    setTimer({
      done: seconds === 0,
      exerciseId,
      initialSeconds: seconds,
      running: seconds > 0,
      secondsLeft: seconds
    });
  };

  const adjustRestTimer = (delta: number) => {
    setTimer((current) => ({
      ...current,
      done: false,
      secondsLeft: Math.max(0, current.secondsLeft + delta)
    }));
  };

  const skipRestTimer = () => {
    setTimer((current) => ({
      ...current,
      done: false,
      running: false,
      secondsLeft: 0
    }));
  };

  const restartRestTimer = () => {
    setTimer((current) => {
      const seconds = current.initialSeconds || restSeconds;

      return {
        ...current,
        done: false,
        exerciseId,
        initialSeconds: seconds,
        running: seconds > 0,
        secondsLeft: seconds
      };
    });
  };

  return (
    <section
      className={`rounded-xl border p-4 shadow-soft ${
        timer.done ? "border-amber bg-amber/10" : "border-white/10 bg-white/5"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-amber">Minuteur repos</p>
          <p className="mt-1 text-4xl font-black tabular-nums text-white">{formatDuration(timer.secondsLeft * 1000)}</p>
          <p className="mt-1 text-sm font-bold text-white/55">Repos conseille : {restLabel}</p>
        </div>
        <button
          className="h-14 rounded-md bg-amber px-4 text-sm font-black text-white shadow-sm"
          onClick={startRestTimer}
          type="button"
        >
          Lancer repos
        </button>
      </div>
      {timer.done ? <p className="mt-3 text-sm font-black text-amber">Repos termine. Tu peux reprendre.</p> : null}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <TimerButton onClick={() => adjustRestTimer(30)}>+30 s</TimerButton>
        <TimerButton onClick={() => adjustRestTimer(-30)}>-30 s</TimerButton>
        <TimerButton onClick={skipRestTimer}>Passer</TimerButton>
        <TimerButton onClick={restartRestTimer}>Relancer</TimerButton>
      </div>
    </section>
  );
}

function TimerButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      className="min-h-11 rounded-md border border-white/10 bg-white/8 px-2 text-xs font-black text-white shadow-sm"
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

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
          <ReportMetric label="Validés" value={String(validCount)} tone="calm" />
          <ReportMetric label="Faciles" value={String(easyCount)} tone="calm" />
          <ReportMetric label="Trop durs" value={String(hardCount)} tone="warn" />
          <ReportMetric label="Douleurs" value={String(painCount)} tone="danger" />
        </div>
      </div>

      {/* ── Explicit AI analysis button ── */}
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

      {/* ── AI coach results ── */}
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

function statusLabel(status: EffortStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
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
