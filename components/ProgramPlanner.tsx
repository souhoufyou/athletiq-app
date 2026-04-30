"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { appendCalibrationEvent, createLoadFeedbackCalibrationEvent } from "@/lib/calibrationEvents";
import { getProgramDeloadState } from "@/lib/deloadState";
import { rememberExerciseSwap } from "@/lib/exerciseSwapPreferences";
import { getExerciseLoadInsight } from "@/lib/loadInsights";
import { applyLoadFeedbackToSettings, tuneExerciseLoad, type LoadFeedback } from "@/lib/loadTuning";
import { getContextualAlternatives } from "@/lib/alternatives";
import { normalizeExerciseV2 } from "@/lib/programSchema";
import { GLOBAL_DELOAD_NOTE } from "@/lib/programAdaptation";
import { useCoachStorage } from "@/lib/storage";
import { getTrainingTrendReport } from "@/lib/trainingTrends";
import type { Exercise, ExerciseSelectionInsight, PlannedSession, UserSettings } from "@/types/training";

const goalLabels: Record<NonNullable<UserSettings["primaryGoal"]>, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de masse",
  recomposition: "Recomposition",
  performance: "Performance",
  sante: "Sante"
};

const recoveryLabels: Record<UserSettings["recoveryProfile"], string> = {
  good: "Bonne",
  irregular: "Irreguliere",
  poor: "Faible",
  regular: "Reguliere"
};

const durationLabels: Record<UserSettings["sessionDurationPreference"], string> = {
  long: "70-90 min",
  short: "35-45 min",
  standard: "50-65 min"
};

const weekdayLabels: Record<PlannedSession["weekday"], string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche"
};

export function ProgramPlanner() {
  const { currentProgram, history, isReady, setCurrentProgram, setSettings, settings, startSession, todaySession } = useCoachStorage();
  const [selectedId, setSelectedId] = useState(todaySession.id);
  const [isEditing, setIsEditing] = useState(false);
  const [draftSession, setDraftSession] = useState<PlannedSession | null>(null);
  const [loadFeedbackMessage, setLoadFeedbackMessage] = useState<string>("");
  const router = useRouter();
  const selectedSession = useMemo(
    () => currentProgram.find((session) => session.id === selectedId) ?? todaySession,
    [currentProgram, selectedId, todaySession]
  );

  useEffect(() => {
    setDraftSession(selectedSession);
    setIsEditing(false);
  }, [selectedSession]);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const startSelectedSession = (session: PlannedSession) => {
    startSession(session);
    router.push("/seance");
  };
  const saveDraftSession = () => {
    if (!draftSession) return;
    setCurrentProgram(currentProgram.map((session) => (session.id === draftSession.id ? draftSession : session)));
    setIsEditing(false);
  };
  const replaceExerciseBeforeSession = (sessionId: string, originalExercise: Exercise, replacement: Exercise) => {
    const normalizedReplacement = normalizeExerciseV2({
      ...replacement,
      id: originalExercise.id,
      classification: replacement.classification ?? originalExercise.classification,
      muscleGroups: replacement.muscleGroups ?? originalExercise.muscleGroups,
      selectionInsight: replacement.selectionInsight ?? buildManualReplacementInsight(originalExercise, replacement)
    });

    const nextProgram = currentProgram.map((session) => (
      session.id !== sessionId
        ? session
        : {
            ...session,
            exercises: session.exercises.map((exercise) => (
              exercise.id === originalExercise.id ? normalizedReplacement : exercise
            ))
          }
    ));

    setCurrentProgram(nextProgram);
    setSettings(rememberExerciseSwap(settings, originalExercise, replacement));
    if (selectedId === sessionId) {
      const nextSelected = nextProgram.find((session) => session.id === sessionId) ?? null;
      setDraftSession(nextSelected);
    }
  };
  const applyPreSessionLoadFeedback = (sessionId: string, exerciseId: string, feedback: LoadFeedback) => {
    const targetSession = currentProgram.find((session) => session.id === sessionId);
    const targetExercise = targetSession?.exercises.find((exercise) => exercise.id === exerciseId);
    if (!targetSession || !targetExercise) return;

    const nextProgram = currentProgram.map((session) => (
      session.id !== sessionId
        ? session
        : {
            ...session,
            exercises: session.exercises.map((exercise) => (
              exercise.id === exerciseId ? tuneExerciseLoad(exercise, feedback) : exercise
            ))
          }
    ));

    setCurrentProgram(nextProgram);
    if (selectedId === sessionId) {
      const nextSelected = nextProgram.find((session) => session.id === sessionId) ?? null;
      setDraftSession(nextSelected);
    }

    const tunedExercise = nextProgram
      .find((session) => session.id === sessionId)
      ?.exercises.find((exercise) => exercise.id === exerciseId);
    const nextSettings = appendCalibrationEvent(
      applyLoadFeedbackToSettings(settings, targetExercise, feedback),
      createLoadFeedbackCalibrationEvent(targetExercise, feedback, tunedExercise?.plannedLoad)
    );
    setSettings(nextSettings);
    setLoadFeedbackMessage(
      feedback === "correct"
        ? `${targetExercise.name}: charge confirmee pour aujourd'hui.`
        : feedback === "too-light"
          ? `${targetExercise.name}: charge montee et futur calibrage un peu plus ambitieux.`
          : `${targetExercise.name}: charge reduite et futur calibrage un peu plus prudent.`
    );
  };
  const todayExternalSports = getExternalSportsForDay(todaySession, settings);
  const selectedExternalSports = getExternalSportsForDay(selectedSession, settings);
  const basis = getProgramBasis(settings, currentProgram);
  const deloadState = getProgramDeloadState(currentProgram, history);
  const trendReport = getTrainingTrendReport(history, currentProgram, settings);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-white/10 premium-gradient p-5 text-white shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Séance du jour</p>
        <h2 className="mt-1 text-3xl font-black leading-tight">{todaySession.title}</h2>
        <p className="mt-2 text-sm font-semibold text-white/70">{todaySession.focus}</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <HeroTile label="Exercices" value={String(todaySession.exercises.length)} />
          <HeroTile label="Durée" value={todaySession.duration} />
          <HeroTile label="Sport" value={todayExternalSports.length ? todayExternalSports.join(" + ") : "Non"} />
        </div>
        <div className="mt-4 rounded-lg bg-white/10 p-3">
          <p className="text-xs font-black uppercase text-white/60">Premier exercice</p>
          <p className="mt-1 text-xl font-black">
            {todaySession.exercises[0]?.name ?? "Repos"}
            {todaySession.exercises[0]?.plannedLoad ? ` - ${todaySession.exercises[0].plannedLoad}` : ""}
          </p>
          <p className="mt-1 text-sm font-semibold text-white/70">{todaySession.exercises[0]?.target}</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="h-12 rounded-md border border-white/15 bg-white/10 px-3 font-black text-white"
            onClick={() => setSelectedId(todaySession.id)}
            type="button"
          >
            Voir détail
          </button>
          <button
            className="h-12 rounded-md bg-coral px-3 font-black text-white shadow-sm"
            onClick={() => startSelectedSession(todaySession)}
            type="button"
          >
            Commencer
          </button>
        </div>
      </section>

      <ProgramBasisCard items={basis} />
      <DeloadCycleCard state={deloadState} trendDetail={getDeloadTrendDetail(trendReport)} />

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-white/40">Semaine</p>
            <h2 className="mt-1 text-2xl font-black text-white">Choisir une seance</h2>
          </div>
          <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55">
            {currentProgram.length} jours
          </span>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {currentProgram.map((session) => (
            <ProgramDayCard
              isSelected={session.id === selectedSession.id}
              isToday={session.id === todaySession.id}
              key={session.id}
              onSelect={() => setSelectedId(session.id)}
              session={session}
              externalSports={getExternalSportsForDay(session, settings)}
            />
          ))}
        </div>
      </section>

      <SessionDetailCard
        draftSession={draftSession}
        externalSports={selectedExternalSports}
        isEditing={isEditing}
        onCancelEdit={() => {
          setDraftSession(selectedSession);
          setIsEditing(false);
        }}
        onChangeDraft={setDraftSession}
        onEdit={() => setIsEditing(true)}
        onSaveEdit={saveDraftSession}
        onStart={() => startSelectedSession(selectedSession)}
        session={selectedSession}
        settings={settings}
        loadFeedbackMessage={loadFeedbackMessage}
        onLoadFeedback={applyPreSessionLoadFeedback}
        onReplaceExercise={replaceExerciseBeforeSession}
      />
    </div>
  );
}

function ProgramBasisCard({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <details className="card-dark group p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Profil utilise</p>
          <p className="mt-1 text-sm font-bold text-white/55">Objectif, duree, recuperation et contraintes</p>
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55 group-open:bg-sky/10 group-open:text-sky">
          Voir
        </span>
      </summary>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div className="rounded-md bg-white/5 p-3" key={item.label}>
            <p className="text-[11px] font-black uppercase text-white/40">{item.label}</p>
            <p className="mt-1 text-sm font-black leading-tight text-white">{item.value}</p>
          </div>
        ))}
      </div>
    </details>
  );
}

function DeloadCycleCard({
  state,
  trendDetail
}: {
  state: ReturnType<typeof getProgramDeloadState>;
  trendDetail?: string;
}) {
  if (!state.active) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber/20 bg-amber/10 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-white/45">Cycle de recuperation</p>
          <h2 className="mt-1 text-2xl font-black text-white">Deload automatique actif</h2>
        </div>
        <span className="rounded-md bg-amber/15 px-3 py-2 text-xs font-black uppercase text-amber">
          {state.remainingSessions}/{state.totalSessions} restantes
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/70">
        {trendDetail ?? state.guideNote ?? "Le programme reduit un peu la charge pour refaire monter les sensations avant la prochaine poussee."}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-white/8 p-3">
          <p className="text-[11px] font-black uppercase text-white/40">Deja passees</p>
          <p className="mt-1 text-sm font-black text-white">{state.completedSessions}</p>
        </div>
        <div className="rounded-md bg-white/8 p-3">
          <p className="text-[11px] font-black uppercase text-white/40">Prochaine allegee</p>
          <p className="mt-1 text-sm font-black text-white">{state.nextSessionTitle ?? "Cycle en cours"}</p>
        </div>
      </div>
    </section>
  );
}

function ProgramDayCard({
  externalSports,
  isSelected,
  isToday,
  onSelect,
  session
}: {
  externalSports: string[];
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
  session: PlannedSession;
}) {
  const main = session.exercises[0];

  return (
    <article
      className={`w-[268px] shrink-0 cursor-pointer rounded-xl border p-4 shadow-soft transition hover:-translate-y-0.5 ${
        isSelected ? "border-sky/50 bg-sky/5" : "card-dark border-white/10"
      }`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={isToday ? "info" : "muted"}>{isToday ? "Aujourd'hui" : weekdayLabels[session.weekday]}</Badge>
            <Badge tone={session.intensity === "Soutenue" ? "force" : session.intensity === "Légère" ? "calm" : "info"}>
              {session.intensity}
            </Badge>
            {isDeloadSession(session) ? <Badge tone="warn">Deload</Badge> : null}
            {externalSports.map((sport) => <Badge key={sport} tone="warn">{sport}</Badge>)}
            {isCardioSession(session) ? <Badge tone="info">Cardio</Badge> : null}
            {session.weekday === "sunday" ? <Badge tone="calm">Repos actif</Badge> : null}
          </div>
          <h3 className="mt-3 text-xl font-black leading-tight text-white">{weekdayLabels[session.weekday]} : {session.title}</h3>
          <p className="mt-1 text-sm font-semibold text-white/60">{session.focus}</p>
        </div>
        <span className="shrink-0 rounded-md bg-white/8 px-3 py-2 text-sm font-black text-white">{session.duration}</span>
      </div>

      {main ? (
        <div className="mt-3 rounded-lg bg-white/8 p-3">
          <p className="text-xs font-black uppercase text-white/40">Mise en avant</p>
          <p className="mt-1 font-black text-white">
            {main.name}
            {main.plannedLoad ? ` — ${main.plannedLoad}` : ""}
          </p>
          <p className="mt-1 text-sm font-bold text-white/55">{main.target} · repos {main.rest}</p>
        </div>
      ) : null}

      <button
        className="mt-3 h-12 w-full rounded-md border border-sky/20 bg-sky/10 px-4 font-black text-sky"
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        type="button"
      >
        Voir détail
      </button>
    </article>
  );
}

function SessionDetailCard({
  draftSession,
  externalSports,
  isEditing,
  onCancelEdit,
  onChangeDraft,
  onEdit,
  onLoadFeedback,
  onReplaceExercise,
  onSaveEdit,
  onStart,
  session,
  settings,
  loadFeedbackMessage
}: {
  draftSession: PlannedSession | null;
  externalSports: string[];
  isEditing: boolean;
  onCancelEdit: () => void;
  onChangeDraft: (session: PlannedSession) => void;
  onEdit: () => void;
  onLoadFeedback: (sessionId: string, exerciseId: string, feedback: LoadFeedback) => void;
  onReplaceExercise: (sessionId: string, originalExercise: Exercise, replacement: Exercise) => void;
  onSaveEdit: () => void;
  onStart: () => void;
  session: PlannedSession;
  settings: UserSettings;
  loadFeedbackMessage: string;
}) {
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [swapMessage, setSwapMessage] = useState("");

  useEffect(() => {
    setExpandedExerciseId(null);
    setSwapMessage("");
  }, [session.id]);

  if (isEditing && draftSession) {
    return (
      <SessionEditor
        draft={draftSession}
        onCancel={onCancelEdit}
        onChange={onChangeDraft}
        onSave={onSaveEdit}
      />
    );
  }

  return (
    <section className="card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Détail séance</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white">{session.title}</h2>
          <p className="mt-1 text-sm font-semibold text-white/60">{session.focus}</p>
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-sm font-black text-white">{session.duration}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="info">{weekdayLabels[session.weekday]}</Badge>
        <Badge tone={session.intensity === "Soutenue" ? "force" : session.intensity === "Légère" ? "calm" : "info"}>
          {session.intensity}
        </Badge>
        {isDeloadSession(session) ? <Badge tone="warn">Deload</Badge> : null}
        {externalSports.map((sport) => <Badge key={sport} tone="warn">{sport}</Badge>)}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="h-12 rounded-md border border-sky/25 bg-sky/10 px-4 text-sm font-black text-sky"
          onClick={onEdit}
          type="button"
        >
          Modifier
        </button>
        <button
          className="h-12 rounded-md bg-coral px-4 text-sm font-black text-white shadow-soft"
          onClick={onStart}
          type="button"
        >
          Commencer
        </button>
      </div>

      {session.notes?.length ? (
        <div className="mt-4 rounded-lg bg-amber/10 p-3">
          {session.notes.map((note) => (
            <p className="text-sm font-black text-amber" key={note}>{note}</p>
          ))}
        </div>
      ) : null}

      {loadFeedbackMessage ? (
        <div className="mt-4 rounded-lg border border-sea/20 bg-sea/10 px-3 py-2 text-sm font-semibold text-sea">
          {loadFeedbackMessage}
        </div>
      ) : null}
      {swapMessage ? (
        <div className="mt-4 rounded-lg border border-amber/20 bg-amber/10 px-3 py-2 text-sm font-semibold text-amber">
          {swapMessage}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {session.exercises.map((exercise, index) => {
          const loadInsight = getExerciseLoadInsight(exercise, settings);
          const alternatives = getContextualAlternatives(exercise.id, exercise, {
            avoid: settings.avoid,
            equipment: settings.equipment,
            watchPoints: settings.watchPoints
          }).filter((alternative) => alternative.name !== exercise.name);
          const alternativesOpen = expandedExerciseId === exercise.id;

          return (
            <article className="rounded-lg border border-white/8 bg-white/5 p-3" key={exercise.id}>
              <div className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sky/10 text-sm font-black text-sky">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black leading-tight text-white">{exercise.name}</h3>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <MiniStat label="Cible" value={exercise.target} />
                    <MiniStat label="Charge" value={exercise.plannedLoad ?? "Libre"} />
                    <MiniStat label="Repos" value={exercise.rest} />
                  </div>
                  {loadInsight ? (
                    <div className={`mt-2 rounded-md border px-3 py-2 ${loadInsightClass(loadInsight.tone)}`}>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-black/15 px-2 py-1 text-[10px] font-black uppercase">
                          {loadInsight.badge}
                        </span>
                        <p className="text-xs font-semibold leading-relaxed">{loadInsight.detail}</p>
                      </div>
                    </div>
                  ) : null}
                  {exercise.plannedLoad ? (
                    <details className="mt-2 rounded-md border border-white/10 bg-white/5">
                      <summary className="cursor-pointer list-none px-3 py-2 text-xs font-black uppercase text-white/55">
                        Ajuster la charge
                      </summary>
                      {loadInsight ? (
                        <p className="px-3 pb-2 text-xs font-semibold leading-relaxed text-white/55">{loadInsight.detail}</p>
                      ) : null}
                      <div className="grid grid-cols-3 gap-2 px-3 pb-3">
                      <LoadFeedbackButton
                        label="Trop leger"
                        onClick={() => onLoadFeedback(session.id, exercise.id, "too-light")}
                        tone="info"
                      />
                      <LoadFeedbackButton
                        label="Correct"
                        onClick={() => onLoadFeedback(session.id, exercise.id, "correct")}
                        tone="calm"
                      />
                      <LoadFeedbackButton
                        label="Trop lourd"
                        onClick={() => onLoadFeedback(session.id, exercise.id, "too-heavy")}
                        tone="warn"
                      />
                      </div>
                    </details>
                  ) : null}
                  <button
                    className={`mt-2 h-10 w-full rounded-md border px-3 text-sm font-black transition ${
                      alternativesOpen
                        ? "border-amber bg-amber/20 text-amber"
                        : "border-amber/30 bg-amber/10 text-amber hover:bg-amber/20"
                    }`}
                    onClick={() => setExpandedExerciseId((current) => (current === exercise.id ? null : exercise.id))}
                    type="button"
                  >
                    {alternativesOpen ? "Fermer les variantes" : "Changer cet exercice"}
                  </button>
                  {alternativesOpen ? (
                    <div className="mt-2 rounded-md border border-amber/20 bg-amber/5 p-3">
                      <p className="text-[11px] font-black uppercase text-amber">Variantes</p>
                      {alternatives.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {alternatives.map((alternative) => (
                            <div className="rounded-lg border border-white/10 bg-white/5 p-3" key={`${exercise.id}-${alternative.name}-${alternative.target}`}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-black text-white">{alternative.name}</p>
                                  <p className="mt-1 text-xs font-semibold text-white/55">
                                    {alternative.target}
                                    {alternative.plannedLoad ? ` · ${alternative.plannedLoad}` : ""}
                                    {alternative.rest ? ` · repos ${alternative.rest}` : ""}
                                  </p>
                                </div>
                                <button
                                  className="shrink-0 rounded-md bg-amber px-3 py-2 text-xs font-black text-white"
                                  onClick={() => {
                                    onReplaceExercise(session.id, exercise, alternative);
                                    setExpandedExerciseId(null);
                                    setSwapMessage(`${exercise.name} remplace par ${alternative.name} pour cette seance.`);
                                  }}
                                  type="button"
                                >
                                  Choisir
                                </button>
                              </div>
                              <p className="mt-2 text-sm font-semibold leading-relaxed text-white/60">{alternative.cue}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 rounded-md bg-white/8 p-3 text-sm font-semibold text-white/50">
                          Aucune variante predefinie ici. Tu peux quand meme ajuster la charge ou modifier la seance manuellement.
                        </p>
                      )}
                    </div>
                  ) : null}
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-white/55">{exercise.cue}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <button
        className="hidden"
        onClick={onEdit}
        type="button"
      >
        Modifier cette seance
      </button>

      <button
        className="hidden"
        onClick={onStart}
        type="button"
      >
        Commencer cette séance
      </button>
    </section>
  );
}

function buildManualReplacementInsight(original: Exercise, replacement: Exercise): ExerciseSelectionInsight {
  const samePattern = Boolean(
    original.taxonomy?.pattern &&
    replacement.taxonomy?.pattern &&
    original.taxonomy.pattern === replacement.taxonomy.pattern
  );

  return {
    summary: `${replacement.name} a ete choisi a la place de ${original.name} pour garder une seance utile sans te bloquer sur un exercice qui ne convient pas aujourd'hui.`,
    reasons: [
      {
        detail: "Le remplacement reste dans la logique de la seance, avec plus de marge pour s'adapter avant de commencer.",
        title: "Ajustement manuel",
        tone: "info"
      },
      ...(samePattern
        ? [{
            detail: "Le pattern moteur reste coherent, donc la progression du bloc reste lisible meme si l'exercice change.",
            title: "Pattern conserve",
            tone: "calm" as const
          }]
        : [])
    ]
  };
}

function SessionEditor({
  draft,
  onCancel,
  onChange,
  onSave
}: {
  draft: PlannedSession;
  onCancel: () => void;
  onChange: (session: PlannedSession) => void;
  onSave: () => void;
}) {
  const updateExercise = (index: number, patch: Partial<PlannedSession["exercises"][number]>) => {
    onChange({
      ...draft,
      exercises: draft.exercises.map((exercise, currentIndex) =>
        currentIndex === index ? { ...exercise, ...patch } : exercise
      )
    });
  };
  const moveExercise = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.exercises.length) return;
    const next = [...draft.exercises];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange({ ...draft, exercises: next });
  };
  const removeExercise = (index: number) => {
    if (draft.exercises.length <= 1) return;
    onChange({ ...draft, exercises: draft.exercises.filter((_, currentIndex) => currentIndex !== index) });
  };
  const addExercise = () => {
    onChange({
      ...draft,
      exercises: [
        ...draft.exercises,
        {
          id: `${draft.id}-manual-${Date.now()}`,
          name: "Nouvel exercice",
          target: "3 x 10-12",
          plannedLoad: "",
          rest: "90 s",
          cue: "Ajuster la charge pour garder 1 a 3 repetitions en reserve.",
          muscleGroups: ["autre"],
          classification: "hypertrophie"
        }
      ]
    });
  };

  return (
    <section className="card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Edition programme</p>
          <h2 className="mt-1 text-2xl font-black leading-tight text-white">Modifier la seance</h2>
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-sm font-black text-white">{weekdayLabels[draft.weekday]}</span>
      </div>

      <div className="mt-4 grid gap-3">
        <TextField
          label="Titre"
          onChange={(value) => onChange({ ...draft, title: value })}
          value={draft.title}
        />
        <TextField
          label="Focus"
          onChange={(value) => onChange({ ...draft, focus: value })}
          value={draft.focus}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="Duree"
            onChange={(value) => onChange({ ...draft, duration: value })}
            value={draft.duration}
          />
          <label className="block">
            <span className="text-sm font-bold text-white/60">Intensite</span>
            <select
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              onChange={(event) => onChange({ ...draft, intensity: event.target.value as PlannedSession["intensity"] })}
              value={draft.intensity}
            >
              {(["LÃ©gÃ¨re", "ModÃ©rÃ©e", "Soutenue"] as PlannedSession["intensity"][]).map((intensity) => (
                <option key={intensity} value={intensity}>{intensity}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-white">Exercices</h3>
          <button
            className="h-10 rounded-md border border-sky/25 bg-sky/10 px-3 text-sm font-black text-sky"
            onClick={addExercise}
            type="button"
          >
            Ajouter
          </button>
        </div>

        {draft.exercises.map((exercise, index) => (
          <article className="rounded-lg border border-white/10 bg-white/5 p-3" key={exercise.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-black uppercase text-white/40">Exercice {index + 1}</p>
              <div className="flex gap-2">
                <button
                  className="h-9 rounded-md border border-white/10 bg-white/8 px-2 text-xs font-black text-white"
                  disabled={index === 0}
                  onClick={() => moveExercise(index, -1)}
                  type="button"
                >
                  Haut
                </button>
                <button
                  className="h-9 rounded-md border border-white/10 bg-white/8 px-2 text-xs font-black text-white"
                  disabled={index === draft.exercises.length - 1}
                  onClick={() => moveExercise(index, 1)}
                  type="button"
                >
                  Bas
                </button>
                <button
                  className="h-9 rounded-md border border-coral/25 bg-coral/10 px-2 text-xs font-black text-coral"
                  disabled={draft.exercises.length <= 1}
                  onClick={() => removeExercise(index)}
                  type="button"
                >
                  Suppr.
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3">
              <TextField label="Nom" onChange={(value) => updateExercise(index, { name: value })} value={exercise.name} />
              <div className="grid gap-2 sm:grid-cols-3">
                <TextField label="Cible" onChange={(value) => updateExercise(index, { target: value })} value={exercise.target} />
                <TextField label="Charge" onChange={(value) => updateExercise(index, { plannedLoad: value })} value={exercise.plannedLoad ?? ""} />
                <TextField label="Repos" onChange={(value) => updateExercise(index, { rest: value })} value={exercise.rest} />
              </div>
              <label className="block">
                <span className="text-sm font-bold text-white/60">Consigne</span>
                <textarea
                  className="mt-1 min-h-20 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                  onChange={(event) => updateExercise(index, { cue: event.target.value })}
                  value={exercise.cue}
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className="h-12 rounded-md border border-white/10 bg-white/8 px-4 font-black text-white"
          onClick={onCancel}
          type="button"
        >
          Annuler
        </button>
        <button
          className="h-12 rounded-md bg-sky px-4 font-black text-white shadow-soft"
          onClick={onSave}
          type="button"
        >
          Enregistrer
        </button>
      </div>
    </section>
  );
}

function HeroTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3 text-center">
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-white/60">{label}</p>
    </div>
  );
}

function TextField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/8 p-2">
      <p className="text-[10px] font-black uppercase text-white/40">{label}</p>
      <p className="mt-1 text-xs font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: "calm" | "force" | "info" | "muted" | "warn" }) {
  const toneClass = {
    calm: "bg-sea/10 text-sea",
    force: "bg-coral/10 text-coral",
    info: "bg-sky/10 text-sky",
    muted: "bg-white/8 text-white/55",
    warn: "bg-amber/10 text-amber"
  }[tone];

  return <span className={`rounded-md px-2 py-1 text-xs font-black ${toneClass}`}>{children}</span>;
}

function loadInsightClass(tone: "calm" | "info" | "muted" | "warn") {
  return {
    calm: "border-sea/20 bg-sea/10 text-sea",
    info: "border-sky/20 bg-sky/10 text-sky",
    muted: "border-white/10 bg-white/6 text-white/65",
    warn: "border-amber/20 bg-amber/10 text-amber"
  }[tone];
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

function getExternalSportsForDay(session: PlannedSession, settings: UserSettings): string[] {
  const names = settings.externalSports
    .filter((sport) => sport.days.includes(session.weekday))
    .map((sport) => sport.name);

  if (names.length === 0 && settings.judoDays.includes(session.weekday)) {
    return ["Sport externe"];
  }

  return names;
}

function isCardioSession(session: PlannedSession) {
  return /cardio|tapis|marche|rameur|stairmaster|intervalles|zone 2/i.test(
    `${session.title} ${session.focus} ${session.exercises.map((exercise) => exercise.name).join(" ")}`
  );
}

function isDeloadSession(session: PlannedSession) {
  return Boolean(session.notes?.includes(GLOBAL_DELOAD_NOTE));
}

function getProgramBasis(
  settings: UserSettings,
  program: PlannedSession[]
): Array<{ label: string; value: string }> {
  const sportNames = settings.externalSports.map((sport) => sport.name).filter(Boolean);
  const constraints = [
    ...settings.watchPoints,
    ...settings.avoid.map((item) => `eviter ${item}`)
  ].filter(Boolean);

  return [
    {
      label: "Objectif",
      value: settings.primaryGoal ? goalLabels[settings.primaryGoal] : settings.mainGoal || "Non precise"
    },
    {
      label: "Frequence",
      value: `${program.length || settings.weeklyFrequency || 0} seance${(program.length || settings.weeklyFrequency || 0) > 1 ? "s" : ""}/semaine`
    },
    {
      label: "Duree",
      value: durationLabels[settings.sessionDurationPreference]
    },
    {
      label: "Disponibilites",
      value: `${settings.availableDays.length} jour${settings.availableDays.length > 1 ? "s" : ""}`
    },
    {
      label: "Sports externes",
      value: sportNames.length ? sportNames.join(" + ") : "Aucun"
    },
    {
      label: "Recuperation",
      value: recoveryLabels[settings.recoveryProfile]
    },
    {
      label: "Contraintes",
      value: constraints.length ? `${constraints.length} active${constraints.length > 1 ? "s" : ""}` : "Aucune"
    },
    {
      label: "Charge",
      value: settings.strengthReferences.length
        ? `${settings.strengthReferences.length} repere${settings.strengthReferences.length > 1 ? "s" : ""}`
        : settings.benchOneRepMaxKg > 0
          ? `DC ${settings.benchOneRepMaxKg} kg`
          : "Estimation prudente"
    }
  ];
}

function getDeloadTrendDetail(report: ReturnType<typeof getTrainingTrendReport>): string | undefined {
  return report.items.find((item) => item.action === "deload_next_week" || item.action === "protect_recovery")?.detail;
}
