"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SessionSummary } from "@/components/SessionSummary";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { getContextualAlternatives } from "@/lib/alternatives";
import { appendCalibrationEvent, createLoadFeedbackCalibrationEvent } from "@/lib/calibrationEvents";
import { rememberExerciseSwap } from "@/lib/exerciseSwapPreferences";
import { applyLoadFeedbackToSettings, tuneExerciseLoad, type LoadFeedback } from "@/lib/loadTuning";
import { summarizeProgressions } from "@/lib/progression";
import { defaultSessionFeedback, getCompletedCount } from "@/lib/session";
import { useCoachStorage } from "@/lib/storage";
import { formatDuration, formatDurationLong, parseRestSeconds } from "@/lib/time";
import type {
  ActiveSession,
  BreathFeedback,
  CompletedSession,
  EffortStatus,
  Exercise,
  ExerciseLog
} from "@/types/training";

type QuickRestPrompt = {
  id: string;
  nextExerciseName?: string;
  restLabel: string;
  seconds: number;
};

const statusOptions: Array<{ value: EffortStatus; label: string; idle: string; active: string }> = [
  { value: "ok", label: "OK", idle: "border-sea/25 bg-sea/10 text-sea", active: "border-sea bg-sea text-white" },
  { value: "easy", label: "Facile", idle: "border-sea/25 bg-sea/10 text-sea", active: "border-sea bg-sea text-white" },
  { value: "hard", label: "Trop dur", idle: "border-coral/30 bg-coral/10 text-coral", active: "border-coral bg-coral text-white" },
  { value: "pain", label: "Douleur", idle: "border-red-500/30 bg-red-500/10 text-red-200", active: "border-red-600 bg-red-600 text-white" },
  { value: "skipped", label: "Passe", idle: "border-white/10 bg-white/8 text-white/60", active: "border-zinc-500 bg-zinc-600 text-white" }
];

const quickReasonOptions = [
  "trop lourd",
  "souffle",
  "fatigue",
  "douleur poignet",
  "douleur epaule",
  "douleur dos",
  "machine occupee"
];

const breathOptions: Array<{ value: BreathFeedback; label: string }> = [
  { value: "bon", label: "Bon" },
  { value: "correct", label: "Correct" },
  { value: "difficile", label: "Difficile" },
  { value: "tres-mauvais", label: "Tres mauvais" },
  { value: "vertige", label: "Vertige" },
  { value: "oppression", label: "Oppression" }
];

export function SessionRunner() {
  const [lastSummary, setLastSummary] = useState<CompletedSession | null>(null);
  const [finishWarning, setFinishWarning] = useState("");
  const [loadFeedbackMessage, setLoadFeedbackMessage] = useState("");
  const [restPrompt, setRestPrompt] = useState<QuickRestPrompt | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const {
    activeSession,
    cancelActiveSession,
    clearReplacement,
    completeSession,
    currentProgram,
    dateKey,
    history,
    isReady,
    pauseSessionTimer,
    replaceExercise,
    resumeSessionTimer,
    setActiveExercise,
    setCurrentProgram,
    setSettings,
    settings,
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
  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);
  const matchingActive = Boolean(activeSession && activePlannedSession && activeSession.dateKey === dateKey);
  const active = matchingActive ? activeSession : null;
  const currentSession = active && activePlannedSession ? activePlannedSession : todaySession;
  const completedCount = active ? getCompletedCount(active.logs) : 0;
  const exerciseTotal = Math.max(1, currentSession.exercises.length);
  const progressPercent = active ? Math.round((completedCount / exerciseTotal) * 100) : 0;
  const currentExerciseId = active?.timing.activeExerciseId ?? currentSession.exercises[0]?.id;
  const foundIndex = currentSession.exercises.findIndex((exercise) => exercise.id === currentExerciseId);
  const currentIndex = foundIndex >= 0 ? foundIndex : 0;
  const currentExercise = currentSession.exercises[currentIndex] ?? currentSession.exercises[0];
  const effectiveExercise = (currentExercise && active?.replacements?.[currentExercise.id]) ?? currentExercise;
  const isReplaced = Boolean(currentExercise && active?.replacements?.[currentExercise.id]);
  const nextExercise = currentSession.exercises[currentIndex + 1];
  const previousExercise = currentSession.exercises[currentIndex - 1];
  const feedback = active?.feedback ?? defaultSessionFeedback;
  const currentLog = currentExercise && active
    ? active.logs[currentExercise.id] ?? createEmptyLog(currentExercise.id)
    : createEmptyLog(currentExercise?.id ?? "exercise");
  const lastLoads = useMemo(
    () =>
      Object.fromEntries(
        currentSession.exercises.map((exercise) => [exercise.id, getLastLoad(history, exercise.id)])
      ) as Record<string, string | undefined>,
    [currentSession.exercises, history]
  );
  const alternatives = currentExercise
    ? getContextualAlternatives(currentExercise.id, currentExercise, {
        avoid: settings.avoid,
        comment: currentLog.comment,
        equipment: settings.equipment,
        status: currentLog.status,
        watchPoints: settings.watchPoints
      })
    : [];
  const restSeconds = currentExercise ? parseRestSeconds(currentExercise.rest) : 0;
  const needsReason = currentLog.status === "hard" || currentLog.status === "pain";
  const allExercisesLogged = active
    ? currentSession.exercises.every((exercise) => Boolean(active.logs[exercise.id]?.status))
    : false;

  useEffect(() => {
    setLoadFeedbackMessage("");
    setShowAlternatives(false);
  }, [currentExercise?.id]);

  if (!isReady) {
    return <div className="rounded-2xl border border-white/10 bg-white/8 p-5 font-black text-white shadow-soft">Chargement...</div>;
  }

  if (!active) {
    const summarySession = lastSummary ?? todaysCompletedSession;

    return (
      <div className="space-y-4 pb-28">
        <section className="relative -mx-4 overflow-hidden border-b border-white/10 bg-[#050607] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:-mx-6 sm:px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_0%,rgba(255,90,0,0.42),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.07),transparent_44%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)] opacity-25" />
          <div className="relative">
            <p className="text-xs font-black uppercase text-coral">Mode salle</p>
            <h1 className="mt-2 text-3xl font-black leading-[0.95] text-white">{todaySession.title}</h1>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
              {activeProgram?.name ?? "Programme actif"} - {todaySession.focus}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              <SessionMetric label="Duree" value={todaySession.duration} />
              <SessionMetric label="Exos" value={`${todaySession.exercises.length}`} />
              <SessionMetric label="Intensite" value={todaySession.intensity} />
            </div>
            <button
              className="mt-5 h-16 w-full rounded-2xl bg-coral px-4 text-lg font-black text-white shadow-[0_18px_45px_rgba(255,90,0,0.32)]"
              onClick={() => {
                setLastSummary(null);
                startSession(todaySession);
              }}
              type="button"
            >
              Commencer la seance
            </button>
          </div>
        </section>

        {summarySession?.progressions ? (
          <GuidedSessionReport session={summarySession} />
        ) : (
          <SessionSummary completed={Boolean(todaysCompletedSession)} session={todaySession} />
        )}

        <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-sky">Plan du jour</p>
              <h2 className="mt-1 text-xl font-black text-white">Apercu rapide</h2>
            </div>
            <Link className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/70" href="/programme">
              Programme
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {todaySession.exercises.slice(0, 7).map((exercise, index) => (
              <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3" key={exercise.id}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-sm font-black text-coral">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{exercise.name}</p>
                  <p className="truncate text-xs font-semibold text-white/45">
                    {exercise.plannedLoad ? `${exercise.plannedLoad} - ` : ""}{exercise.target}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const updateCurrentLog = (patch: Partial<ExerciseLog>) => {
    if (!currentExercise) return;
    updateExerciseLog(currentExercise.id, patch);
    setFinishWarning("");
  };

  const buildStatusPatch = (status: EffortStatus): Partial<ExerciseLog> => {
    const patch: Partial<ExerciseLog> = { status };

    if (status !== "skipped" && !currentLog.usedLoad && currentExercise?.plannedLoad) {
      patch.usedLoad = currentExercise.plannedLoad;
    }

    if ((status === "ok" || status === "easy") && !currentLog.completedReps && currentExercise) {
      patch.completedReps = currentExercise.target;
    }

    return patch;
  };

  const setStatus = (status: EffortStatus) => {
    if (!currentExercise) return;
    updateCurrentLog(buildStatusPatch(status));
  };

  const showRestBeforeNext = () => {
    if (!currentExercise || !nextExercise || restSeconds <= 0) return;

    setRestPrompt({
      id: `${currentExercise.id}-${Date.now()}`,
      nextExerciseName: nextExercise.name,
      restLabel: currentExercise.rest,
      seconds: restSeconds
    });
  };

  const markAndAdvance = (status: EffortStatus) => {
    if (!currentExercise) return;

    updateExerciseLog(currentExercise.id, buildStatusPatch(status));
    setFinishWarning("");

    if (status === "ok" || status === "easy" || status === "skipped") {
      if (nextExercise) {
        if (status !== "skipped") showRestBeforeNext();
        goToExercise(currentIndex + 1, { keepRest: status !== "skipped" && restSeconds > 0 });
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const continueAfterIssue = () => {
    if (!currentLog.status) {
      setFinishWarning("Choisis d'abord ton ressenti.");
      return;
    }

    if (needsReason && !currentLog.comment.trim()) {
      setFinishWarning("Ajoute une raison rapide pour adapter la suite.");
      return;
    }

    if (nextExercise) {
      showRestBeforeNext();
      goToExercise(currentIndex + 1, { keepRest: restSeconds > 0 });
      return;
    }

    if (allExercisesLogged) {
      finishSession();
    }
  };

  const markHardOrPain = (status: Extract<EffortStatus, "hard" | "pain">) => {
    setStatus(status);
    setFinishWarning(status === "pain" ? "Note la zone douloureuse ou remplace l'exercice." : "");
  };

  const handleStatusTap = (status: EffortStatus) => {
    if (status === "ok" || status === "easy" || status === "skipped") {
      markAndAdvance(status);
      return;
    }

    markHardOrPain(status);
  };

  const setCurrentLoadAsTooHeavy = () => {
    applyLiveLoadFeedback("too-heavy");
    applyQuickReason("trop lourd");
  };

  const goToExercise = (index: number, options: { keepRest?: boolean } = {}) => {
    const target = currentSession.exercises[index];
    if (!target) return;
    setActiveExercise(target.id);
    if (!options.keepRest) {
      setRestPrompt(null);
    }
    setShowAlternatives(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const skipExercise = () => {
    markAndAdvance("skipped");
  };

  const applyQuickReason = (reason: string) => {
    const currentComment = currentLog.comment.trim();
    const hasReason = currentComment.toLowerCase().includes(reason.toLowerCase());
    updateCurrentLog({
      comment: hasReason ? currentComment : [currentComment, reason].filter(Boolean).join(", ")
    });
  };

  const applyLiveLoadFeedback = (feedbackDecision: LoadFeedback) => {
    if (!currentExercise || !effectiveExercise) return;

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
        ? "Charge validee pour cette seance."
        : feedbackDecision === "too-light"
          ? "Charge montee. Les prochaines charges seront plus ambitieuses."
          : "Charge reduite. Les prochaines charges seront plus prudentes."
    );
  };

  const chooseAlternative = (alternative: Exercise) => {
    if (!currentExercise) return;
    replaceExercise(currentExercise.id, alternative);
    setSettings(rememberExerciseSwap(settings, currentExercise, alternative));
    setShowAlternatives(false);
  };

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
      setFinishWarning("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="space-y-3 pb-6">
      <section className="sticky top-0 z-30 -mx-3 border-b border-white/10 bg-[#080a0e]/95 px-3 py-2 backdrop-blur sm:-mx-4 sm:px-4">
        <div className="flex items-center gap-3">
          <p className="shrink-0 text-xs font-black tabular-nums text-white/70">
            {currentIndex + 1}/{currentSession.exercises.length}
          </p>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <SessionElapsedTime session={active} />
          <button
            aria-label={active.timer.isPaused ? "Reprendre" : "Pause"}
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs font-black text-white/70"
            onClick={() => (active.timer.isPaused ? resumeSessionTimer() : pauseSessionTimer())}
            type="button"
          >
            {active.timer.isPaused ? "Reprendre" : "Pause"}
          </button>
        </div>
      </section>

      {restPrompt ? (
        <CompactRestTimer key={restPrompt.id} onDismiss={() => setRestPrompt(null)} prompt={restPrompt} />
      ) : null}

      {finishWarning ? (
        <div className="rounded-2xl border border-coral/25 bg-coral/10 p-3 text-sm font-black leading-relaxed text-coral shadow-soft">
          {finishWarning}
        </div>
      ) : null}

      {effectiveExercise ? (
        <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#10131d] p-3 text-white shadow-soft">
          <div className="absolute inset-x-0 top-0 h-1 bg-coral" />
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-coral">
                Exercice {currentIndex + 1} sur {currentSession.exercises.length}
              </p>
              <h1 className="mt-1 text-[1.75rem] font-black leading-[0.95] text-white">{effectiveExercise.name}</h1>
              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-white/65">{effectiveExercise.cue}</p>
            </div>
            {currentLog.status ? (
              <span className="shrink-0 rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black uppercase text-white">
                {statusLabel(currentLog.status)}
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <SessionMetric label="Charge" value={effectiveExercise.plannedLoad ?? "Libre"} />
            <SessionMetric label="Series / reps" value={effectiveExercise.target} compact />
            <SessionMetric label="Repos" value={effectiveExercise.rest} />
            <SessionMetric label="Derniere" value={lastLoads[currentExercise?.id ?? ""] ?? "Aucune"} />
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase text-sky">Ressenti exercice</p>
              {currentLog.status ? <p className="text-xs font-black text-white/45">Enregistre</p> : null}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {statusOptions.filter((status) => status.value !== "skipped").map((status) => (
                <button
                  className={`min-h-[4.2rem] rounded-2xl border px-3 text-base font-black transition active:scale-[0.99] ${
                    currentLog.status === status.value ? status.active : status.idle
                  }`}
                  key={status.value}
                  onClick={() => handleStatusTap(status.value)}
                  type="button"
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {needsReason ? (
            <div className="mt-3 rounded-2xl border border-coral/20 bg-coral/10 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase text-coral">Action rapide</p>
                  <p className="mt-1 text-sm font-semibold leading-snug text-white/65">
                    Donne une raison ou adapte tout de suite.
                  </p>
                </div>
                <button
                  className="shrink-0 rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/70"
                  onClick={continueAfterIssue}
                  type="button"
                >
                  {nextExercise ? "Continuer" : "Finir"}
                </button>
              </div>
              <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
                {quickReasonOptions.map((reason) => (
                  <button
                    className={`shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-black transition ${
                      currentLog.comment.toLowerCase().includes(reason.toLowerCase())
                        ? "border-coral bg-coral text-white"
                        : "border-coral/25 bg-coral/10 text-coral"
                    }`}
                    key={reason}
                    onClick={() => applyQuickReason(reason)}
                    type="button"
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button className="h-11 rounded-2xl border border-coral/25 bg-coral/10 px-2 text-xs font-black text-coral" onClick={setCurrentLoadAsTooHeavy} type="button">
                  Reduire
                </button>
                <button className="h-11 rounded-2xl border border-amber/30 bg-amber/10 px-2 text-xs font-black text-amber" onClick={() => setShowAlternatives(true)} type="button">
                  Remplacer
                </button>
                <button className="h-11 rounded-2xl border border-white/10 bg-white/8 px-2 text-xs font-black text-white/70" onClick={skipExercise} type="button">
                  Passer
                </button>
              </div>
            </div>
          ) : null}

          {isReplaced ? (
            <p className="mt-3 rounded-2xl border border-amber/20 bg-amber/10 px-3 py-2 text-xs font-black text-amber">
              Exercice remplace pour cette seance.
            </p>
          ) : null}

          <div className={`mt-3 grid gap-2 ${needsReason ? "grid-cols-1" : "grid-cols-3"}`}>
            <button
              className="h-11 rounded-2xl border border-white/10 bg-white/8 px-2 text-xs font-black text-white disabled:opacity-30"
              disabled={!previousExercise}
              onClick={() => goToExercise(currentIndex - 1)}
              type="button"
            >
              Retour
            </button>
            {needsReason ? null : (
              <>
                <button
                  className={`h-11 rounded-2xl border px-2 text-xs font-black transition ${
                    showAlternatives ? "border-amber bg-amber/20 text-amber" : "border-amber/30 bg-amber/10 text-amber"
                  }`}
                  onClick={() => setShowAlternatives((value) => !value)}
                  type="button"
                >
                  {showAlternatives ? "Fermer" : "Remplacer"}
                </button>
                <button
                  className="h-11 rounded-2xl border border-white/10 bg-white/8 px-2 text-xs font-black text-white/70"
                  onClick={skipExercise}
                  type="button"
                >
                  Passer
                </button>
              </>
            )}
          </div>

          {allExercisesLogged ? (
            <div className="mt-3 rounded-2xl border border-sea/20 bg-sea/10 p-3">
              <p className="text-sm font-black text-white">Seance prete a etre terminee.</p>
              <button
                className="mt-3 h-12 w-full rounded-2xl bg-coral px-3 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,90,0,0.32)]"
                onClick={finishSession}
                type="button"
              >
                Terminer la seance
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {showAlternatives ? (
        <AlternativesPanel
          alternatives={alternatives}
          isReplaced={isReplaced}
          onClear={() => {
            if (!currentExercise) return;
            clearReplacement(currentExercise.id);
            setShowAlternatives(false);
          }}
          onSelect={chooseAlternative}
        />
      ) : null}

      <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/40">Optionnel</p>
            <h2 className="mt-1 text-xl font-black text-white">Saisie precise</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">Charge utilisee, reps, RIR et commentaire.</p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
        </summary>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <TextInput label="Charge realisee" onChange={(usedLoad) => updateCurrentLog({ usedLoad })} placeholder="ex. 90 kg" value={currentLog.usedLoad} />
          <TextInput label="Reps realisees" onChange={(completedReps) => updateCurrentLog({ completedReps })} placeholder="ex. 8/8/7" value={currentLog.completedReps} />
        </div>

        <label className="mt-3 block">
          <span className="text-sm font-bold text-white/60">RIR derniere serie</span>
          <select
            className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => updateCurrentLog({ rir: event.target.value ? Number(event.target.value) : undefined })}
            value={currentLog.rir ?? ""}
          >
            <option value="">Non renseigne</option>
            <option value="0">0 - echec ou presque</option>
            <option value="1">1 - tres proche</option>
            <option value="2">2 - dur mais propre</option>
            <option value="3">3 - marge confortable</option>
            <option value="4">4 - facile</option>
            <option value="5">5+ - trop facile</option>
          </select>
        </label>

        <label className="mt-3 block">
          <span className="text-sm font-bold text-white/60">Commentaire</span>
          <textarea
            className="mt-1 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => updateCurrentLog({ comment: event.target.value })}
            placeholder="Sensation, douleur, adaptation..."
            value={currentLog.comment}
          />
        </label>

        {effectiveExercise?.plannedLoad ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
            <p className="text-sm font-black text-white">Charge du jour</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <LoadFeedbackButton label="Trop leger" onClick={() => applyLiveLoadFeedback("too-light")} tone="info" />
              <LoadFeedbackButton label="Correct" onClick={() => applyLiveLoadFeedback("correct")} tone="calm" />
              <LoadFeedbackButton label="Trop lourd" onClick={() => applyLiveLoadFeedback("too-heavy")} tone="warn" />
            </div>
            {loadFeedbackMessage ? (
              <p className="mt-3 rounded-xl border border-sea/20 bg-sea/10 px-3 py-2 text-xs font-semibold text-sea">
                {loadFeedbackMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </details>

      <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/40">Seance</p>
            <h2 className="mt-1 text-xl font-black text-white">Tous les exercices</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">{completedCount}/{currentSession.exercises.length} renseignes.</p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
        </summary>
        <div className="mt-4 space-y-2">
          {currentSession.exercises.map((exercise, index) => {
            const log = active.logs[exercise.id];
            const selected = exercise.id === currentExercise?.id;

            return (
              <button
                className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                  selected ? "border-coral/45 bg-coral/10" : "border-white/10 bg-white/[0.04]"
                }`}
                key={exercise.id}
                onClick={() => goToExercise(index)}
                type="button"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/8 text-xs font-black text-white/70">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{exercise.name}</p>
                  <p className="truncate text-xs font-semibold text-white/45">{exercise.target}</p>
                </div>
                {log?.status ? <span className="text-xs font-black text-coral">{statusLabel(log.status)}</span> : null}
              </button>
            );
          })}
        </div>
      </details>

      <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/40">Fin de seance</p>
            <h2 className="mt-1 text-xl font-black text-white">Ressenti global</h2>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
        </summary>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberFeedback label="Difficulte" max={10} min={1} onChange={(difficulty) => updateSessionFeedback({ difficulty })} value={feedback.difficulty} />
          <NumberFeedback label="Douleur" max={10} min={0} onChange={(globalPain) => updateSessionFeedback({ globalPain })} value={feedback.globalPain} />
          <NumberFeedback label="Energie" max={10} min={1} onChange={(energy) => updateSessionFeedback({ energy })} value={feedback.energy} />
          <label className="block">
            <span className="text-sm font-bold text-white/60">Souffle</span>
            <select
              className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base font-black text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              onChange={(event) => updateSessionFeedback({ breath: event.target.value as BreathFeedback })}
              value={feedback.breath}
            >
              {breathOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          className="mt-4 h-12 w-full rounded-2xl border border-red-500/25 bg-red-500/10 px-3 text-sm font-black text-red-200"
          onClick={() => {
            if (window.confirm("Abandonner cette seance en cours ?")) {
              cancelActiveSession();
              setFinishWarning("");
            }
          }}
          type="button"
        >
          Abandonner la seance
        </button>
      </details>

    </div>
  );
}

function CompactRestTimer({
  onDismiss,
  prompt
}: {
  onDismiss: () => void;
  prompt: QuickRestPrompt;
}) {
  const [secondsLeft, setSecondsLeft] = useState(prompt.seconds);
  const [running, setRunning] = useState(prompt.seconds > 0);

  useEffect(() => {
    setSecondsLeft(prompt.seconds);
    setRunning(prompt.seconds > 0);
  }, [prompt.seconds]);

  useEffect(() => {
    if (!running) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0) {
      setRunning(false);
    }
  }, [secondsLeft]);

  return (
    <section className="sticky top-[3.2rem] z-20 rounded-[22px] border border-amber/25 bg-[#15100a]/95 p-3 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-amber">Repos</p>
          <p className="mt-0.5 text-3xl font-black tabular-nums text-white">{formatDuration(secondsLeft * 1000)}</p>
          <p className="truncate text-xs font-semibold text-white/55">
            {secondsLeft === 0 ? "Tu peux reprendre" : `Avant ${prompt.nextExerciseName ?? "la suite"} - ${prompt.restLabel}`}
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-1">
          <button
            className="h-10 rounded-xl border border-white/10 bg-white/8 px-3 text-xs font-black text-white"
            onClick={() => setSecondsLeft((current) => current + 30)}
            type="button"
          >
            +30
          </button>
          <button
            className="h-10 rounded-xl border border-white/10 bg-white/8 px-3 text-xs font-black text-white"
            onClick={() => {
              setRunning(false);
              setSecondsLeft(0);
            }}
            type="button"
          >
            Stop
          </button>
          <button
            className="col-span-2 h-9 rounded-xl border border-amber/25 bg-amber/10 px-3 text-xs font-black text-amber"
            onClick={onDismiss}
            type="button"
          >
            Masquer
          </button>
        </div>
      </div>
    </section>
  );
}

function SessionMetric({ compact = false, label, value }: { compact?: boolean; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
      <p className="text-[10px] font-black uppercase text-white/45">{label}</p>
      <p className={`mt-1 ${compact ? "text-[13px]" : "text-sm"} truncate font-black text-white`}>{value}</p>
    </div>
  );
}

function AlternativesPanel({
  alternatives,
  isReplaced,
  onClear,
  onSelect
}: {
  alternatives: Exercise[];
  isReplaced: boolean;
  onClear: () => void;
  onSelect: (exercise: Exercise) => void;
}) {
  return (
    <section className="rounded-[24px] border border-amber/20 bg-amber/5 p-4 shadow-soft">
      <p className="text-xs font-black uppercase text-amber">Machine occupee ou douleur</p>
      <h2 className="mt-1 text-xl font-black text-white">Remplacement</h2>
      <div className="mt-3 space-y-2">
        {alternatives.length > 0 ? (
          alternatives.map((alternative) => (
            <button
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-white/8"
              key={`${alternative.name}-${alternative.target}`}
              onClick={() => onSelect(alternative)}
              type="button"
            >
              <p className="font-black text-white">{alternative.name}</p>
              <p className="mt-1 text-xs font-semibold text-white/55">{alternative.target} - repos {alternative.rest}</p>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-white/70">{alternative.cue}</p>
            </button>
          ))
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white/55">
            Aucune alternative predefinie pour cet exercice. Utilise un equivalent proche et note-le en commentaire.
          </p>
        )}
      </div>
      {isReplaced ? (
        <button className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/8 text-sm font-black text-white/65" onClick={onClear} type="button">
          Revenir a l&apos;exercice original
        </button>
      ) : null}
    </section>
  );
}

function TextInput({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        inputMode="text"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
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
    calm: "border-sea/25 bg-sea/10 text-sea",
    info: "border-sky/25 bg-sky/10 text-sky",
    warn: "border-coral/30 bg-coral/10 text-coral"
  }[tone];

  return (
    <button className={`h-11 rounded-2xl border text-xs font-black transition hover:brightness-110 ${toneClass}`} onClick={onClick} type="button">
      {label}
    </button>
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
        className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-lg font-black text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
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
    if (session.timer.isPaused) return;

    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session.timer.isPaused, session.timer.pausedTotalMs, session.timer.startedAt]);

  return <p className="shrink-0 text-sm font-black tabular-nums text-white">{formatDuration(getElapsedMs(session, nowMs))}</p>;
}

function GuidedSessionReport({ session }: { session: CompletedSession }) {
  const logs = Object.values(session.logs);
  const validCount = logs.filter((log) => log.status === "ok" || log.status === "easy").length;
  const hardCount = logs.filter((log) => log.status === "hard").length;
  const painCount = logs.filter((log) => log.status === "pain").length;
  const smartSummary = summarizeProgressions(session.progressions ?? {});

  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 text-white shadow-soft">
        <p className="text-xs font-black uppercase text-sea">Bilan seance</p>
        <h2 className="mt-2 text-2xl font-black leading-tight">{session.title}</h2>
        <p className="mt-2 text-sm font-semibold text-white/60">Terminee en {formatDurationLong(session.totalDurationMs)}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <ReportMetric label="OK" value={String(validCount)} />
          <ReportMetric label="Dur" value={String(hardCount)} />
          <ReportMetric label="Douleur" value={String(painCount)} />
        </div>
      </div>

      <SmartSummarySection empty="Aucune progression automatique." items={smartSummary.progressing} title="Progression" />
      <SmartSummarySection empty="Rien a surveiller." items={smartSummary.watch} title="A surveiller" />
      <SmartSummarySection empty="Aucun ajustement." items={smartSummary.nextSessionAdjustments} title="Prochaine seance" />
    </section>
  );
}

function ReportMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-3 text-center">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/50">{label}</p>
    </div>
  );
}

function SmartSummarySection({
  empty,
  items,
  title
}: {
  empty: string;
  items: string[];
  title: string;
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
      <h3 className="text-lg font-black text-white">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.slice(0, 4).map((item) => (
            <p className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-sm font-semibold leading-relaxed text-white/75" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-2xl border border-white/8 bg-white/[0.04] p-3 text-sm font-semibold text-white/50">{empty}</p>
        )}
      </div>
    </section>
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
    if (usedLoad) return usedLoad;
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
