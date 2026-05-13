"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PROGRAM_CATALOG } from "@/data/programCatalog";
import { getActiveProgramTemplate, getActiveProgramTemplateId } from "@/lib/activeProgram";
import { getProgramDeloadState } from "@/lib/deloadState";
import { instantiateProgramTemplate } from "@/lib/programInstantiation";
import { recommendPrograms } from "@/lib/programRecommendation";
import { useCoachStorage } from "@/lib/storage";
import { getTrainingTrendReport } from "@/lib/trainingTrends";
import type { PlannedSession, ProgramRecommendation, ProgramTemplate, UserSettings } from "@/types/training";

const goalLabels: Record<string, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de masse",
  cardio: "Cardio",
  "cardio-sante": "Cardio / sante",
  performance: "Performance",
  recomposition: "Recomposition",
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
  const {
    activeSession,
    cancelActiveSession,
    currentProgram,
    history,
    isReady,
    setCurrentProgram,
    settings,
    startSession,
    todaySession
  } = useCoachStorage();
  const [selectedId, setSelectedId] = useState(todaySession.id);
  const [programMessage, setProgramMessage] = useState("");
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
  const basis = useMemo(() => getProgramBasis(settings, currentProgram), [settings, currentProgram]);
  const deloadState = useMemo(() => getProgramDeloadState(currentProgram, history), [currentProgram, history]);
  const trendReport = useMemo(
    () => getTrainingTrendReport(history, currentProgram, settings),
    [history, currentProgram, settings]
  );

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const startSelectedSession = (session: PlannedSession) => {
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
        ? `${template.name} est maintenant actif. La seance en cours non validee a ete annulee, historique conserve.`
        : `${template.name} est maintenant ton programme actif. Historique conserve.`
    );
  };

  return (
    <div className="space-y-4">
      <section className="relative -mx-4 overflow-hidden border-b border-white/10 bg-[#050607] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:-mx-6 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_0%,rgba(255,90,0,0.54),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)] opacity-35" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-coral">Programme OS</p>
              <h1 className="mt-3 text-5xl font-black leading-[0.86] tracking-normal text-white">
                {activeProgram?.name ?? "Programme personnalise"}
              </h1>
              <p className="mt-4 max-w-[23rem] text-sm font-semibold leading-relaxed text-white/68">
                {activeProgram?.description ?? "Plan actif genere a partir de ton profil et de tes reglages."}
              </p>
            </div>
            <span className="shrink-0 rounded-[1.3rem] border border-coral/35 bg-coral/15 px-4 py-3 text-xs font-black uppercase tracking-[0.18em] text-coral">
              {activeProgram?.level ?? "Perso"}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <HeroTile label="Objectif" value={formatProgramObjective(activeProgram?.primaryObjective, settings)} />
            <HeroTile label="Frequence" value={activeProgram ? `${activeProgram.frequency} j/sem.` : `${currentProgram.length} j/sem.`} />
            <HeroTile label="Duree" value={activeProgram?.averageDuration ?? todaySession.duration} />
          </div>

          <div className="mt-5 rounded-[2rem] border border-white/12 bg-[#080a0f]/88 p-4 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-coral">Bloc a executer</p>
                <h2 className="mt-2 text-3xl font-black leading-tight">{todaySession.title}</h2>
                <p className="mt-2 text-sm font-semibold text-white/65">{todaySession.focus}</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/8 px-4 py-3 text-center">
                <p className="text-2xl font-black">{todaySession.exercises.length}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/50">exos</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="h-14 rounded-[1.25rem] border border-white/15 bg-white/10 px-3 font-black text-white"
                onClick={() => setSelectedId(todaySession.id)}
                type="button"
              >
                Voir la semaine
              </button>
              <button
                className="h-14 rounded-[1.25rem] bg-coral px-3 font-black text-white shadow-[0_18px_45px_rgba(255,90,0,0.28)]"
                onClick={() => startSelectedSession(todaySession)}
                type="button"
              >
                Commencer
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
        <ProgramFitCard
          program={activeProgram}
          reasons={getProgramFitReasons(activeRecommendation, settings, currentProgram.length)}
        />
        <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky">Semaine type</p>
          <div className="mt-4 space-y-2">
            {currentProgram.map((session) => (
              <button
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  session.id === selectedSession.id
                    ? "border-coral/40 bg-coral/12"
                    : session.id === todaySession.id
                      ? "border-sky/30 bg-sky/10"
                      : "border-white/8 bg-white/[0.04]"
                }`}
                key={session.id}
                onClick={() => setSelectedId(session.id)}
                type="button"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">
                    {weekdayLabels[session.weekday]}
                  </p>
                  <p className="mt-1 text-base font-black text-white">{session.title}</p>
                  <p className="mt-1 text-sm font-semibold text-white/60">{session.focus}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">{session.duration}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                    {session.exercises.length} exos
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </section>

      <SessionPreviewCard onStart={() => startSelectedSession(selectedSession)} session={selectedSession} />

      <DeloadCycleCard state={deloadState} trendDetail={getDeloadTrendDetail(trendReport)} />

      <ProgramBasisCard items={basis} />

      <ProgramSwitchSection
        activeTemplateId={activeTemplateId}
        allPrograms={PROGRAM_CATALOG}
        message={programMessage}
        onChoose={applyProgramTemplate}
        recommendations={switchRecommendations}
      />
    </div>
  );
}

function ProgramFitCard({
  program,
  reasons
}: {
  program?: ProgramTemplate;
  reasons: string[];
}) {
  return (
    <section className="card-dark border border-sky/20 p-4">
      <p className="text-xs font-black uppercase text-sky">Pourquoi ce programme</p>
      <h2 className="mt-1 text-2xl font-black text-white">
        {program?.name ?? "Programme personnalise"}
      </h2>
      <div className="mt-4 space-y-2">
        {reasons.map((reason) => (
          <p className="rounded-md bg-white/5 px-3 py-3 text-sm font-semibold leading-relaxed text-white/70" key={reason}>
            {reason}
          </p>
        ))}
      </div>
    </section>
  );
}

function ProgramBasisCard({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <details className="card-dark group p-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Profil utilise</p>
          <p className="mt-1 text-sm font-bold text-white/55">Ce que l&apos;app a pris en compte pour construire ton plan</p>
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

function ProgramSwitchSection({
  activeTemplateId,
  allPrograms,
  message,
  onChoose,
  recommendations
}: {
  activeTemplateId?: string;
  allPrograms: ProgramTemplate[];
  message: string;
  onChoose: (template: ProgramTemplate) => void;
  recommendations: ProgramRecommendation[];
}) {
  return (
    <details className="card-dark group p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Changer de programme</p>
          <h2 className="mt-1 text-2xl font-black text-white">Choix rapides</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">
            Un recommande et deux alternatives maximum, pour choisir sans te perdre.
          </p>
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55 group-open:bg-sky/10 group-open:text-sky">
          Ouvrir
        </span>
      </summary>

      {message ? (
        <p className="mt-3 rounded-md border border-sky/20 bg-sky/10 px-3 py-2 text-sm font-semibold text-sky">
          {message}
        </p>
      ) : null}

      <div className="mt-4 space-y-3">
        {recommendations.map((recommendation) => (
          <ProgramTemplateCard
            isActive={activeTemplateId === recommendation.program.id}
            key={recommendation.program.id}
            onChoose={() => onChoose(recommendation.program)}
            program={recommendation.program}
            recommendation={recommendation}
          />
        ))}
      </div>

      <details className="mt-4 rounded-xl border border-white/8 bg-white/5 p-3">
        <summary className="cursor-pointer list-none text-sm font-black text-white/65">
          Voir tout le catalogue ({allPrograms.length})
        </summary>
        <div className="mt-3 space-y-3">
          {allPrograms
            .filter((program) => !recommendations.some((recommendation) => recommendation.program.id === program.id))
            .map((program) => (
              <ProgramTemplateCard
                isActive={activeTemplateId === program.id}
                key={program.id}
                onChoose={() => onChoose(program)}
                program={program}
              />
            ))}
        </div>
      </details>
    </details>
  );
}

function ProgramTemplateCard({
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
    <article className={`rounded-xl border p-3 ${isActive ? "border-sea/40 bg-sea/10" : "border-white/8 bg-white/5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            {isActive ? <Badge tone="calm">Actif</Badge> : null}
            {recommendation ? <Badge tone="info">Reco #{recommendation.rank}</Badge> : null}
            <Badge tone="muted">{program.level}</Badge>
            <Badge tone="warn">{program.frequency} j/sem.</Badge>
          </div>
          <h3 className="mt-2 text-lg font-black leading-tight text-white">{program.name}</h3>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-white/60">{program.description}</p>
        </div>
        <button
          className={`h-11 shrink-0 rounded-md px-3 text-sm font-black transition ${
            isActive
              ? "border border-sea/30 bg-sea/10 text-sea"
              : "bg-coral text-white hover:bg-coral/90"
          }`}
          disabled={isActive}
          onClick={onChoose}
          type="button"
        >
          {isActive ? "Actif" : "Choisir"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat label="Objectif" value={program.primaryObjective} />
        <MiniStat label="Duree" value={program.averageDuration} />
        <MiniStat label="Seances" value={String(program.sessions.length)} />
      </div>

      {recommendation?.reasons.length ? (
        <p className="mt-3 rounded-md bg-sky/10 px-3 py-2 text-xs font-semibold leading-relaxed text-sky">
          {recommendation.reasons.slice(0, 2).join(" ")}
        </p>
      ) : null}
    </article>
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
          <p className="text-xs font-black uppercase text-white/45">Ajustement du bloc</p>
          <h2 className="mt-1 text-2xl font-black text-white">Semaine allegee en cours</h2>
        </div>
        <span className="rounded-md bg-amber/15 px-3 py-2 text-xs font-black uppercase text-amber">
          {state.remainingSessions}/{state.totalSessions} restantes
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/70">
        {trendDetail ?? state.guideNote ?? "Le programme reduit un peu la charge pour relancer la recuperation."}
      </p>
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
  const mainExercise = session.exercises[0];

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
      <div className="flex flex-wrap gap-2">
        <Badge tone={isToday ? "info" : "muted"}>{isToday ? "Aujourd'hui" : weekdayLabels[session.weekday]}</Badge>
        <Badge tone={session.intensity === "Soutenue" ? "force" : session.intensity === "Légère" ? "calm" : "info"}>
          {session.intensity}
        </Badge>
        {isCardioSession(session) ? <Badge tone="info">Cardio</Badge> : null}
        {isDeloadSession(session) ? <Badge tone="warn">Deload</Badge> : null}
        {externalSports.map((sport) => (
          <Badge key={sport} tone="warn">{sport}</Badge>
        ))}
      </div>

      <h3 className="mt-3 text-xl font-black leading-tight text-white">
        {weekdayLabels[session.weekday]} : {session.title}
      </h3>
      <p className="mt-1 text-sm font-semibold text-white/60">{session.focus}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniStat label="Duree" value={session.duration} />
        <MiniStat label="Focus" value={mainExercise?.name ?? "Repos"} />
      </div>
    </article>
  );
}

void ProgramDayCard;

function SessionPreviewCard({
  onStart,
  session
}: {
  onStart: () => void;
  session: PlannedSession;
}) {
  return (
    <section className="card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase text-sky">Detail de seance</p>
          <h2 className="mt-1 text-2xl font-black text-white">{session.title}</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">{session.focus}</p>
        </div>
        <button
          className="h-11 shrink-0 rounded-md bg-coral px-4 text-sm font-black text-white shadow-sm"
          onClick={onStart}
          type="button"
        >
          Commencer
        </button>
      </div>

      {session.notes?.length ? (
        <div className="mt-3 space-y-2">
          {session.notes.map((note) => (
            <p className="rounded-md bg-coral/10 px-3 py-2 text-sm font-semibold text-coral" key={note}>
              {note}
            </p>
          ))}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {session.exercises.map((exercise, index) => (
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
                <p className="mt-2 text-sm font-semibold leading-relaxed text-white/55">{exercise.cue}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function HeroTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3 text-center">
      <p className="text-sm font-black leading-tight">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-white/60">{label}</p>
    </div>
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

function Badge({ children, tone }: { children: ReactNode; tone: "calm" | "force" | "info" | "muted" | "warn" }) {
  const toneClass = {
    calm: "bg-sea/10 text-sea",
    force: "bg-coral/10 text-coral",
    info: "bg-sky/10 text-sky",
    muted: "bg-white/8 text-white/55",
    warn: "bg-amber/10 text-amber"
  }[tone];

  return <span className={`rounded-md px-2 py-1 text-xs font-black ${toneClass}`}>{children}</span>;
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

void getExternalSportsForDay;

function isCardioSession(session: PlannedSession) {
  return /cardio|tapis|marche|rameur|stairmaster|intervalles|zone 2/i.test(
    `${session.title} ${session.focus} ${session.exercises.map((exercise) => exercise.name).join(" ")}`
  );
}

function isDeloadSession(session: PlannedSession) {
  return session.notes?.some((note) => /deload|allege|recuperation/i.test(note)) ?? false;
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
      value: formatProgramObjective(undefined, settings)
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
    `Ton objectif principal est ${formatProgramObjective(undefined, settings).toLowerCase()}.`,
    `Le plan est cale sur ${sessionsCount} seance${sessionsCount > 1 ? "s" : ""} par semaine.`,
    "La structure reste stable pour te laisser progresser sans complexite visible."
  ];
}
