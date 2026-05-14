"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PROGRAM_CATALOG } from "@/data/programCatalog";
import { getActiveProgramTemplate, getActiveProgramTemplateId } from "@/lib/activeProgram";
import { instantiateProgramTemplate } from "@/lib/programInstantiation";
import { recommendPrograms } from "@/lib/programRecommendation";
import { useCoachStorage } from "@/lib/storage";
import type { PlannedSession, ProgramRecommendation, ProgramTemplate, UserSettings } from "@/types/training";

const goalLabels: Record<string, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de muscle",
  cardio: "Cardio",
  "cardio-sante": "Cardio / sante",
  performance: "Force",
  recomposition: "Recomposition",
  sante: "Sante"
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
  const {
    activeSession,
    cancelActiveSession,
    currentProgram,
    isReady,
    setCurrentProgram,
    settings,
    startSession,
    todaySession
  } = useCoachStorage();
  const [selectedId, setSelectedId] = useState(todaySession.id);
  const [programMessage, setProgramMessage] = useState("");
  const [showProgramSwitch, setShowProgramSwitch] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!currentProgram.some((session) => session.id === selectedId)) {
      setSelectedId(todaySession.id);
    }
  }, [currentProgram, selectedId, todaySession.id]);

  const selectedSession = useMemo(
    () => currentProgram.find((session) => session.id === selectedId) ?? todaySession,
    [currentProgram, selectedId, todaySession]
  );
  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);
  const activeTemplateId = useMemo(() => getActiveProgramTemplateId(currentProgram), [currentProgram]);
  const recommendations = useMemo(() => recommendPrograms(settings), [settings]);
  const activeRecommendation = useMemo(
    () => recommendations.find((recommendation) => recommendation.program.id === activeTemplateId),
    [activeTemplateId, recommendations]
  );
  const switchRecommendations = useMemo(() => recommendations.slice(0, 3), [recommendations]);
  const fitReasons = useMemo(
    () => getProgramFitReasons(activeRecommendation, settings, currentProgram.length),
    [activeRecommendation, currentProgram.length, settings]
  );

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const startPlannedSession = (session: PlannedSession) => {
    startSession(session);
    router.push("/seance");
  };

  const applyProgramTemplate = (template: ProgramTemplate) => {
    if (activeSession) {
      cancelActiveSession();
    }

    const nextProgram = instantiateProgramTemplate(template, settings);
    setCurrentProgram(nextProgram);
    setSelectedId(nextProgram[0]?.id ?? todaySession.id);
    setProgramMessage(
      activeSession
        ? `${template.name} est maintenant actif. Seance en cours annulee, historique conserve.`
        : `${template.name} est maintenant ton programme actif. Historique conserve.`
    );
    setShowProgramSwitch(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <section className="relative -mx-4 overflow-hidden border-b border-white/10 bg-[#050607] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:-mx-6 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(255,90,0,0.48),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)] opacity-25" />

        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-coral">Programme actif de {settings.athleteName}</p>
              <h1 className="mt-2 text-3xl font-black leading-[0.95] text-white">
                {activeProgram?.name ?? "Programme personnalise"}
              </h1>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
                {activeProgram?.description ?? "Plan actif adapte depuis ton profil et tes retours."}
              </p>
            </div>
            <span className="shrink-0 rounded-2xl border border-coral/35 bg-coral/15 px-3 py-2 text-xs font-black uppercase text-coral">
              {activeProgram?.level ?? "Perso"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <ProgramMetric label="Objectif" value={formatProgramObjective(activeProgram?.primaryObjective, settings)} />
            <ProgramMetric label="Frequence" value={activeProgram ? `${activeProgram.frequency} j/sem.` : `${currentProgram.length} j/sem.`} />
            <ProgramMetric label="Duree" value={activeProgram?.averageDuration ?? todaySession.duration} />
          </div>

          <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
            <button
              className="h-14 rounded-2xl bg-coral px-4 text-base font-black text-white shadow-[0_18px_46px_rgba(255,90,0,0.34)]"
              onClick={() => startPlannedSession(todaySession)}
              type="button"
            >
              Commencer aujourd&apos;hui
            </button>
            <button
              className="h-14 rounded-2xl border border-white/12 bg-white/10 px-4 text-sm font-black text-white"
              onClick={() => setShowProgramSwitch((value) => !value)}
              type="button"
            >
              Changer
            </button>
          </div>
        </div>
      </section>

      {programMessage ? (
        <p className="rounded-2xl border border-sky/20 bg-sky/10 px-4 py-3 text-sm font-semibold leading-relaxed text-sky">
          {programMessage}
        </p>
      ) : null}

      {showProgramSwitch ? (
        <ProgramSwitchSection
          activeTemplateId={activeTemplateId}
          message={programMessage}
          onChoose={applyProgramTemplate}
          onClose={() => setShowProgramSwitch(false)}
          recommendations={switchRecommendations}
        />
      ) : null}

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <p className="text-xs font-black uppercase text-sky">Pourquoi ce choix pour {settings.athleteName}</p>
        <div className="mt-3 space-y-2">
          {fitReasons.map((reason) => (
            <p className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3 text-sm font-semibold leading-relaxed text-white/72" key={reason}>
              {reason}
            </p>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-sky">Semaine type</p>
            <h2 className="mt-2 text-2xl font-black text-white">Ton plan jour par jour</h2>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/65">
            {currentProgram.length} seances
          </span>
        </div>

        <div className="mt-4 space-y-2">
          {currentProgram.map((session) => (
            <WeekSessionButton
              isSelected={session.id === selectedSession.id}
              isToday={session.id === todaySession.id}
              key={session.id}
              onSelect={() => setSelectedId(session.id)}
              session={session}
            />
          ))}
        </div>
      </section>

      <SessionDetailCard onStart={() => startPlannedSession(selectedSession)} session={selectedSession} />
    </div>
  );
}

function ProgramMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/10 p-3 text-center">
      <p className="truncate text-sm font-black leading-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/55">{label}</p>
    </div>
  );
}

function WeekSessionButton({
  isSelected,
  isToday,
  onSelect,
  session
}: {
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
  session: PlannedSession;
}) {
  return (
    <button
      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-3 text-left transition ${
        isSelected
          ? "border-coral/45 bg-coral/12"
          : isToday
            ? "border-sky/30 bg-sky/10"
            : "border-white/8 bg-white/[0.04]"
      }`}
      onClick={onSelect}
      type="button"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase text-white/42">
          {weekdayLabels[session.weekday]}{isToday ? " - aujourd'hui" : ""}
        </p>
        <p className="mt-1 truncate text-base font-black text-white">{session.title}</p>
        <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/55">{session.focus}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-black text-white">{session.duration}</p>
        <p className="mt-1 text-[10px] font-black uppercase text-white/40">{session.exercises.length} exos</p>
      </div>
    </button>
  );
}

function SessionDetailCard({
  onStart,
  session
}: {
  onStart: () => void;
  session: PlannedSession;
}) {
  return (
    <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-sky">Detail</p>
          <h2 className="mt-2 text-2xl font-black text-white">{session.title}</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">{session.focus}</p>
        </div>
        <button
          className="h-11 shrink-0 rounded-xl bg-coral px-4 text-sm font-black text-white"
          onClick={onStart}
          type="button"
        >
          Lancer
        </button>
      </div>

      {session.notes?.length ? (
        <div className="mt-3 space-y-2">
          {session.notes.map((note) => (
            <p className="rounded-xl border border-coral/20 bg-coral/10 px-3 py-2 text-xs font-semibold text-coral" key={note}>
              {note}
            </p>
          ))}
        </div>
      ) : null}

      <details className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
        <summary className="cursor-pointer list-none text-sm font-black text-white">
          Voir les exercices ({session.exercises.length})
        </summary>
        <div className="mt-3 space-y-2">
          {session.exercises.map((exercise, index) => (
            <ExerciseLine
              cue={exercise.cue}
              index={index + 1}
              key={exercise.id}
              load={exercise.plannedLoad}
              name={exercise.name}
              rest={exercise.rest}
              target={exercise.target}
            />
          ))}
        </div>
      </details>
    </section>
  );
}

function ExerciseLine({
  cue,
  index,
  load,
  name,
  rest,
  target
}: {
  cue: string;
  index: number;
  load?: string;
  name: string;
  rest: string;
  target: string;
}) {
  return (
    <article className="rounded-xl border border-white/8 bg-black/18 p-3">
      <div className="flex gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-coral/15 text-sm font-black text-coral">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-black leading-tight text-white">{name}</p>
          <p className="mt-1 text-xs font-semibold text-white/55">
            {load ? `${load} - ` : ""}
            {target} - repos {rest}
          </p>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-white/45">{cue}</p>
        </div>
      </div>
    </article>
  );
}

function ProgramSwitchSection({
  activeTemplateId,
  message,
  onChoose,
  onClose,
  recommendations
}: {
  activeTemplateId?: string;
  message: string;
  onChoose: (template: ProgramTemplate) => void;
  onClose: () => void;
  recommendations: ProgramRecommendation[];
}) {
  const hiddenCatalog = PROGRAM_CATALOG.filter(
    (program) => !recommendations.some((recommendation) => recommendation.program.id === program.id)
  );

  return (
    <section className="rounded-[24px] border border-coral/25 bg-[#10131d] p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Changer de programme</p>
          <h2 className="mt-2 text-2xl font-black text-white">Recommande + 2 alternatives</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">Le catalogue complet reste cache. Tu vois d&apos;abord les choix utiles.</p>
        </div>
        <button
          className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55"
          onClick={onClose}
          type="button"
        >
          Fermer
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-sky/20 bg-sky/10 px-3 py-2 text-sm font-semibold text-sky">
          {message}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {recommendations.map((recommendation) => (
          <ProgramChoiceCard
            isActive={activeTemplateId === recommendation.program.id}
            key={recommendation.program.id}
            onChoose={() => onChoose(recommendation.program)}
            program={recommendation.program}
            recommendation={recommendation}
          />
        ))}
      </div>

      <details className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
        <summary className="cursor-pointer list-none text-sm font-black text-white/70">
          Voir tout le catalogue ({PROGRAM_CATALOG.length})
        </summary>
        <div className="mt-3 space-y-3">
          {hiddenCatalog.map((program) => (
            <ProgramChoiceCard
              isActive={activeTemplateId === program.id}
              key={program.id}
              onChoose={() => onChoose(program)}
              program={program}
            />
          ))}
        </div>
      </details>
    </section>
  );
}

function ProgramChoiceCard({
  isActive,
  onChoose,
  program,
  recommendation
}: {
  isActive: boolean;
  onChoose: () => void;
  program: ProgramTemplate;
  recommendation?: ProgramRecommendation;
}) {
  return (
    <article className={`rounded-2xl border p-3 ${isActive ? "border-sea/35 bg-sea/10" : "border-white/8 bg-white/[0.04]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {isActive ? <Badge tone="calm" label="Actif" /> : null}
            {recommendation ? <Badge tone="info" label={`Reco #${recommendation.rank}`} /> : null}
            <Badge tone="muted" label={program.level} />
            <Badge tone="warn" label={`${program.frequency} j/sem.`} />
          </div>
          <h3 className="mt-2 text-lg font-black leading-tight text-white">{program.name}</h3>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-white/60">{program.description}</p>
        </div>
        <button
          className={`h-11 shrink-0 rounded-xl px-3 text-sm font-black ${
            isActive ? "border border-sea/30 bg-sea/10 text-sea" : "bg-coral text-white"
          }`}
          disabled={isActive}
          onClick={onChoose}
          type="button"
        >
          {isActive ? "Actif" : "Choisir"}
        </button>
      </div>

      {recommendation?.reasons.length ? (
        <p className="mt-3 rounded-xl bg-sky/10 px-3 py-2 text-xs font-semibold leading-relaxed text-sky">
          {recommendation.reasons.slice(0, 2).join(" ")}
        </p>
      ) : null}
    </article>
  );
}

function Badge({ label, tone }: { label: string; tone: "calm" | "info" | "muted" | "warn" }) {
  const toneClass = {
    calm: "bg-sea/10 text-sea",
    info: "bg-sky/10 text-sky",
    muted: "bg-white/8 text-white/55",
    warn: "bg-amber/10 text-amber"
  }[tone];

  return <span className={`rounded-md px-2 py-1 text-xs font-black ${toneClass}`}>{label}</span>;
}

function formatProgramObjective(primaryObjective: string | undefined, settings: UserSettings) {
  if (primaryObjective && goalLabels[primaryObjective]) {
    return goalLabels[primaryObjective];
  }

  if (settings.primaryGoal && goalLabels[settings.primaryGoal]) {
    return goalLabels[settings.primaryGoal];
  }

  return settings.mainGoal || "Objectif en cours";
}

function getProgramFitReasons(
  recommendation: ProgramRecommendation | undefined,
  settings: UserSettings,
  sessionsCount: number
) {
  if (recommendation?.reasons.length) {
    return recommendation.reasons.slice(0, 3);
  }

  return [
    `Objectif principal : ${formatProgramObjective(undefined, settings).toLowerCase()}.`,
    `Frequence actuelle : ${sessionsCount} seance${sessionsCount > 1 ? "s" : ""} par semaine.`,
    "Le programme reste stable : l'app ajuste les charges et les seances sans changer de plan toute seule."
  ];
}
