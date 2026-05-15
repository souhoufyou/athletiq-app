"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SessionExerciseIcon } from "@/components/session/SessionExerciseIcon";
import { DayStatusBadge } from "@/components/WeekTimeline";
import { PROGRAM_CATALOG } from "@/data/programCatalog";
import { getActiveProgramTemplate, getActiveProgramTemplateId } from "@/lib/activeProgram";
import { estimateCalories } from "@/lib/calories";
import { getActiveComplements } from "@/lib/complementaryPrograms";
import { getWeekday } from "@/lib/date";
import { instantiateProgramTemplate } from "@/lib/programInstantiation";
import { recommendPrograms } from "@/lib/programRecommendation";
import { getSessionCategory, getSessionTypeLabel, parseDurationToMs } from "@/lib/sessionMeta";
import { useCoachStorage } from "@/lib/storage";
import {
  buildWeekTimeline,
  getCompletedThisWeek,
  type DayInfo,
  type DayState
} from "@/lib/weekTimeline";
import type { PlannedSession, ProgramTemplate } from "@/types/training";

export function ProgramPlanner() {
  const {
    activeSession,
    cancelActiveSession,
    currentProgram,
    dateKey,
    history,
    isReady,
    setCurrentProgram,
    settings,
    startSession,
    todaySession
  } = useCoachStorage();
  const router = useRouter();
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showChangeProgram, setShowChangeProgram] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<ProgramTemplate | null>(null);

  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);
  const activeTemplateId = useMemo(() => getActiveProgramTemplateId(currentProgram), [currentProgram]);
  const todayWeekday = useMemo(() => getWeekday(), []);
  const weeklySessions = useMemo(() => getCompletedThisWeek(history), [history]);
  const activeToday =
    activeSession?.dateKey === dateKey && activeSession.sessionId === todaySession.id;
  const timelineDays = useMemo(
    () =>
      buildWeekTimeline({
        currentProgram,
        completedThisWeek: weeklySessions,
        todayWeekday,
        activeSessionId: activeToday ? activeSession?.sessionId : undefined
      }),
    [currentProgram, weeklySessions, todayWeekday, activeToday, activeSession?.sessionId]
  );
  const recommendations = useMemo(() => recommendPrograms(settings), [settings]);
  const switchOptions = useMemo(() => recommendations.slice(0, 3), [recommendations]);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const handleStartFromDay = (planned: PlannedSession, state: DayState) => {
    if (state === "rest") return;
    if (state !== "in-progress" && state !== "done") {
      startSession(planned);
    }
    router.push("/seance");
  };

  const applyTemplateNow = (template: ProgramTemplate) => {
    if (activeSession) {
      cancelActiveSession();
    }
    const nextProgram = instantiateProgramTemplate(template, settings);
    setCurrentProgram(nextProgram);
    setShowChangeProgram(false);
    setExpandedDay(null);
    setPendingTemplate(null);
  };

  const handleSelectTemplate = (template: ProgramTemplate) => {
    if (activeSession) {
      // Don't silently cancel — ask the user first.
      setPendingTemplate(template);
      return;
    }
    applyTemplateNow(template);
  };

  return (
    <div className="space-y-4">
      <ProgramHeader
        durationLabel={activeProgram?.averageDuration}
        frequency={activeProgram?.frequency}
        level={activeProgram?.level}
        name={activeProgram?.name ?? "Programme personnalisé"}
        onChangeProgram={() => setShowChangeProgram(true)}
        sessionsThisWeek={currentProgram.length}
      />

      <section className="space-y-2" aria-label="Semaine type">
        {timelineDays.map((day) => {
          const isExpanded = expandedDay === day.weekday;
          return (
            <DayRow
              currentWeightKg={settings.currentWeightKg}
              day={day}
              isExpanded={isExpanded}
              key={day.weekday}
              onStart={() => {
                if (day.planned) handleStartFromDay(day.planned, day.state);
              }}
              onToggle={() => setExpandedDay(isExpanded ? null : day.weekday)}
            />
          );
        })}
      </section>

      <ComplementsSection complementIds={settings.complementaryPrograms ?? []} />

      {showChangeProgram ? (
        <ChangeProgramSheet
          activeTemplateId={activeTemplateId}
          allPrograms={PROGRAM_CATALOG}
          onClose={() => setShowChangeProgram(false)}
          onSelect={handleSelectTemplate}
          recommendations={switchOptions}
        />
      ) : null}

      {pendingTemplate ? (
        <ConfirmChangeDialog
          onCancel={() => setPendingTemplate(null)}
          onConfirm={() => applyTemplateNow(pendingTemplate)}
          templateName={pendingTemplate.name}
        />
      ) : null}
    </div>
  );
}

function ComplementsSection({ complementIds }: { complementIds: string[] }) {
  const complements = getActiveComplements(complementIds);

  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-4" aria-label="Compléments">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Compléments</p>
        <Link
          className="text-[11px] font-black uppercase tracking-wide text-sky"
          href="/parametres"
        >
          Gérer
        </Link>
      </div>

      {complements.length === 0 ? (
        <p className="mt-3 text-sm font-semibold text-white/55">
          Aucun complément actif. Ajoute-en depuis les paramètres pour intégrer mobilité, abdos ou cardio léger.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {complements.map((complement) => (
            <li
              className="flex items-start justify-between gap-3 rounded-xl border border-white/8 bg-white/4 p-3"
              key={complement.id}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{complement.name}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/55">
                  {complement.weeklyTarget} · ~{complement.defaultDurationMin} min
                </p>
                <p className="mt-1 text-[11px] font-semibold leading-relaxed text-white/55">
                  {complement.shortDescription}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-sea/30 bg-sea/15 px-2.5 py-1 text-[10px] font-black uppercase text-sea">
                Actif
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ConfirmChangeDialog({
  onCancel,
  onConfirm,
  templateName
}: {
  onCancel: () => void;
  onConfirm: () => void;
  templateName: string;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink p-5 text-white shadow-soft">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-coral">Séance en cours</p>
        <h2 className="mt-2 text-xl font-black leading-tight">Changer de programme ?</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-white/65">
          Une séance est en cours. Si tu passes à <span className="text-white">{templateName}</span>,
          la séance non terminée sera abandonnée (ton historique reste intact).
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            className="h-12 rounded-md border border-white/10 bg-white/8 px-3 text-sm font-black text-white transition hover:bg-white/12"
            onClick={onCancel}
            type="button"
          >
            Annuler
          </button>
          <button
            className="h-12 rounded-md bg-coral px-3 text-sm font-black text-white transition hover:bg-coral/90"
            onClick={onConfirm}
            type="button"
          >
            Changer quand même
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HEADER
// ─────────────────────────────────────────────────────────────────────────

function ProgramHeader({
  durationLabel,
  frequency,
  level,
  name,
  onChangeProgram,
  sessionsThisWeek
}: {
  durationLabel?: string;
  frequency?: number;
  level?: string;
  name: string;
  onChangeProgram: () => void;
  sessionsThisWeek: number;
}) {
  return (
    <section className="session-step-card p-5">
      <div className="session-step-accent" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-coral">Programme actif</p>
          <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">{name}</h1>
        </div>
        <button
          className="shrink-0 rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-white/70 transition hover:bg-white/12"
          onClick={onChangeProgram}
          type="button"
        >
          Changer
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Meta label="Niveau" value={level ? capitalize(level) : "Perso"} />
        <Meta label="Fréquence" value={frequency ? `${frequency} j/sem.` : `${sessionsThisWeek} j/sem.`} />
        <Meta label="Durée moy." value={durationLabel ?? "—"} />
      </dl>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
      <p className="text-[10px] font-black uppercase tracking-wide text-white/55">{label}</p>
      <p className="mt-1 text-sm font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ─────────────────────────────────────────────────────────────────────────
// DAY ROW (collapsed + expanded)
// ─────────────────────────────────────────────────────────────────────────

function DayRow({
  currentWeightKg,
  day,
  isExpanded,
  onStart,
  onToggle
}: {
  currentWeightKg: number;
  day: DayInfo;
  isExpanded: boolean;
  onStart: () => void;
  onToggle: () => void;
}) {
  const accent = day.isToday ? "border-l-coral" : "border-l-white/12";
  const planned = day.planned;
  const isRest = !planned;

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-white/8 bg-white/4 transition ${
        day.isToday ? "ring-1 ring-coral/40" : ""
      }`}
    >
      <button
        aria-expanded={isExpanded}
        className={`flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition hover:bg-white/8 ${accent}`}
        onClick={onToggle}
        type="button"
      >
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-black uppercase tracking-wide ${day.isToday ? "text-coral" : "text-white/45"}`}>
            {day.label}{day.isToday ? " · Aujourd'hui" : ""}
          </p>
          {planned ? (
            <p className="mt-0.5 truncate text-base font-black text-white">{planned.title}</p>
          ) : (
            <p className="mt-0.5 truncate text-base font-black text-white/70">Repos</p>
          )}
          {planned ? (
            <p className="mt-0.5 truncate text-[11px] font-semibold text-white/55">
              {getSessionTypeLabel(getSessionCategory(planned))} · {planned.duration} · {planned.exercises.length} ex.
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] font-semibold text-white/45">Aucune séance prévue</p>
          )}
        </div>
        <DayStatusBadge state={day.state} />
        {!isRest ? (
          <span className="ml-1 shrink-0 text-xs font-black text-white/40" aria-hidden="true">
            {isExpanded ? "▴" : "▾"}
          </span>
        ) : null}
      </button>

      {isExpanded && planned ? (
        <DayDetail
          currentWeightKg={currentWeightKg}
          onStart={onStart}
          session={planned}
          state={day.state}
        />
      ) : null}
    </article>
  );
}

function DayDetail({
  currentWeightKg,
  onStart,
  session,
  state
}: {
  currentWeightKg: number;
  onStart: () => void;
  session: PlannedSession;
  state: DayState;
}) {
  const category = getSessionCategory(session);
  const plannedMs = parseDurationToMs(session.duration);
  const calorieEstimate = estimateCalories(session.intensity, currentWeightKg, plannedMs);

  const ctaLabel =
    state === "done" ? "Voir le résumé"
      : state === "in-progress" ? "Reprendre la séance"
      : "Commencer la séance";

  return (
    <div className="border-t border-white/8 bg-black/15 p-4">
      <div className="flex items-start gap-3">
        <SessionExerciseIcon category={category} className="size-14 shrink-0" />
        <div className="min-w-0 flex-1">
          {session.focus ? (
            <p className="text-xs font-semibold leading-relaxed text-white/60">{session.focus}</p>
          ) : null}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2">
        <Meta label="Durée" value={session.duration || "—"} />
        <Meta label="Exercices" value={String(session.exercises.length)} />
        <Meta label="Calories" value={`${calorieEstimate.low}–${calorieEstimate.high}`} />
      </dl>

      <ol className="mt-4 space-y-1.5">
        {session.exercises.map((exercise, index) => (
          <li
            className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/4 px-3 py-2"
            key={exercise.id}
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-coral/15 text-[11px] font-black text-coral">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">{exercise.name}</p>
              <p className="text-[11px] font-semibold text-white/55">
                {exercise.target}
                {exercise.plannedLoad ? ` · ${exercise.plannedLoad}` : ""}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <button className="session-cta-primary mt-5" onClick={onStart} type="button">
        {ctaLabel}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// CHANGE PROGRAM BOTTOM SHEET
// ─────────────────────────────────────────────────────────────────────────

function ChangeProgramSheet({
  activeTemplateId,
  allPrograms,
  onClose,
  onSelect,
  recommendations
}: {
  activeTemplateId?: string;
  allPrograms: ProgramTemplate[];
  onClose: () => void;
  onSelect: (template: ProgramTemplate) => void;
  recommendations: Array<{ program: ProgramTemplate }>;
}) {
  const recommendedIds = new Set(recommendations.map((r) => r.program.id));
  const otherPrograms = allPrograms.filter((p) => !recommendedIds.has(p.id));

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
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-coral">Programme</p>
            <h2 className="mt-1 text-xl font-black leading-tight">Changer de programme</h2>
            <p className="mt-1 text-xs font-semibold text-white/55">
              Tes données et ton historique restent intacts.
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

        <p className="mt-4 text-[10px] font-black uppercase tracking-wide text-sky">Recommandés</p>
        <div className="mt-2 space-y-2">
          {recommendations.map(({ program }) => (
            <ProgramOption
              isActive={program.id === activeTemplateId}
              key={program.id}
              onSelect={() => onSelect(program)}
              program={program}
            />
          ))}
        </div>

        {otherPrograms.length > 0 ? (
          <details className="mt-4 rounded-xl border border-white/8 bg-white/4 p-3">
            <summary className="cursor-pointer list-none text-xs font-black uppercase tracking-wide text-white/55">
              Voir tout le catalogue ({otherPrograms.length})
            </summary>
            <div className="mt-3 space-y-2">
              {otherPrograms.map((program) => (
                <ProgramOption
                  isActive={program.id === activeTemplateId}
                  key={program.id}
                  onSelect={() => onSelect(program)}
                  program={program}
                />
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}

function ProgramOption({
  isActive,
  onSelect,
  program
}: {
  isActive: boolean;
  onSelect: () => void;
  program: ProgramTemplate;
}) {
  return (
    <button
      className={`w-full overflow-hidden rounded-2xl border p-3 text-left transition ${
        isActive
          ? "border-sea/40 bg-sea/10"
          : "border-white/10 bg-white/5 hover:bg-white/8"
      }`}
      disabled={isActive}
      onClick={onSelect}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{program.name}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-white/55">
            {capitalize(program.level)} · {program.frequency} j/sem. · {program.averageDuration}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
            isActive
              ? "border-sea/30 bg-sea/15 text-sea"
              : "border-coral/30 bg-coral/15 text-coral"
          }`}
        >
          {isActive ? "Actif" : "Choisir"}
        </span>
      </div>
    </button>
  );
}
