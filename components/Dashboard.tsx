"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { getSessionImage } from "@/lib/session-images";
import { useCoachStorage } from "@/lib/storage";
import { formatDurationLong } from "@/lib/time";
import type { CompletedSession, PlannedSession, ProgramTemplate, UserSettings, Weekday } from "@/types/training";

const goalLabels: Record<string, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de masse",
  cardio: "Cardio",
  "cardio-sante": "Cardio / sante",
  performance: "Performance",
  recomposition: "Recomposition",
  sante: "Sante"
};

export function Dashboard() {
  const {
    activeSession,
    currentProgram,
    dateKey,
    history,
    isReady,
    settings,
    startSession,
    todaySession,
    todaysCompletedSession
  } = useCoachStorage();
  const router = useRouter();
  const latest = history[0];
  const activeToday = activeSession?.dateKey === dateKey && activeSession.sessionId === todaySession.id;
  const weeklySessions = useMemo(() => getSessionsThisWeek(history), [history]);
  const cardioDone = useMemo(() => countCardioThisWeek(weeklySessions), [weeklySessions]);
  const lastCompound = useMemo(() => getLastCompoundPerformance(history, currentProgram), [history, currentProgram]);
  const todayExternalSports = useMemo(() => getTodayExternalSports(settings), [settings]);
  const hasEveningSport = settings.externalSports.length > 0 || settings.judoDays.length > 0;
  const eveningSportTonight = todayExternalSports.length > 0;
  const streak = useMemo(() => computeStreak(history), [history]);
  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);
  const latestPlanned = latest ? currentProgram.find((session) => session.id === latest.sessionId) : undefined;
  const latestDuration = latest?.totalDurationMs ? formatDurationLong(latest.totalDurationMs) : undefined;

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const todayStatus = todaysCompletedSession ? "Validee" : activeToday ? "En cours" : "Prete";
  const ctaLabel = todaysCompletedSession ? "Voir le resume" : activeToday ? "Reprendre la seance" : "Commencer la seance";
  const mainGoal = formatGoal(settings.primaryGoal, settings.mainGoal);

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] border border-white/10 premium-gradient text-white shadow-soft">
        <div
          className="relative h-[16.5rem] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${getSessionImage(todaySession.title, todaySession.focus)})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#090b12]/96 via-[#0f111a]/72 to-[#ff6a1a]/28" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_32%,rgba(255,255,255,0)_100%)]" />
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/55">Accueil coach</p>
              <h1 className="mt-2 text-3xl font-black leading-none">Salut {settings.athleteName}</h1>
              <p className="mt-2 text-sm font-semibold text-white/72">{mainGoal}</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-white backdrop-blur">
              {todayStatus}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 p-5">
            <div className="rounded-[24px] border border-white/10 bg-[#0b0d14]/82 p-4 backdrop-blur">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-sky">Aujourd&apos;hui</p>
                  <h2 className="mt-2 text-3xl font-black leading-tight">{todaySession.title}</h2>
                  <p className="mt-2 text-sm font-semibold text-white/70">{todaySession.focus}</p>
                </div>
                <div className="grid min-w-[7.5rem] gap-2">
                  <DashboardPill label="Duree" value={todaySession.duration} />
                  <DashboardPill label="Exercices" value={String(todaySession.exercises.length)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#0b0d14]/92 p-5">
          <div className="grid grid-cols-2 gap-2">
            <Link
              className="flex h-14 items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 text-center font-black text-white"
              href="/programme"
            >
              Voir le programme
            </Link>
            <button
              className="h-14 rounded-xl premium-action px-4 font-black transition"
              onClick={() => {
                if (!activeToday && !todaysCompletedSession) {
                  startSession(todaySession);
                }

                router.push("/seance");
              }}
              type="button"
            >
              {ctaLabel}
            </button>
          </div>

          <div className={`mt-4 grid gap-2 ${hasEveningSport ? "grid-cols-3" : "grid-cols-2"}`}>
            <HeroMetric label="Programme actif" value={activeProgram?.name ?? "Programme perso"} />
            <HeroMetric label="Cette semaine" value={`${weeklySessions.length} seance${weeklySessions.length > 1 ? "s" : ""}`} />
            {hasEveningSport ? (
              <HeroMetric label="Sport ce soir" value={eveningSportTonight ? todayExternalSports.join(" + ") : "Repos"} />
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <ActiveProgramCard
          athleteName={settings.athleteName}
          goal={mainGoal}
          program={activeProgram}
          sessionsCount={currentProgram.length}
        />
        <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky">Progression rapide</p>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <MetricCard label="Cardio valide" value={cardioDone} />
            <MetricCard label={lastCompound.label} value={lastCompound.value} />
            <MetricCard label="Serie active" value={streak > 0 ? `${streak} semaine${streak > 1 ? "s" : ""}` : "A relancer"} />
          </div>
        </section>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky">Plan d&apos;attaque</p>
            <h2 className="mt-2 text-2xl font-black text-white">Les 3 prochains exos</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">Ce que tu vas faire en ouvrant la seance.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/65">
            {todaySession.exercises.length} blocs
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {todaySession.exercises.slice(0, 3).map((exercise, index) => (
            <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-4" key={exercise.id}>
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-coral font-black text-white">
                {index + 1}
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-white">{exercise.name}</p>
                <p className="mt-1 text-sm font-semibold text-white/65">
                  {exercise.plannedLoad ? `${exercise.plannedLoad} · ` : ""}
                  {exercise.target}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <WeeklyTracker currentProgram={currentProgram} sessions={weeklySessions} streak={streak} />

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-sky">Progression recente</p>
            <h2 className="mt-2 text-2xl font-black text-white">
              {latest ? latest.title : "Tu n'as pas encore valide de seance"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-white/55">
              {latest
                ? latestDuration
                  ? `Derniere seance terminee en ${latestDuration}.`
                  : "Derniere seance enregistree dans ton historique."
                : "Valide une premiere seance pour commencer a suivre tes progres."}
            </p>
          </div>
          <Link
            className="shrink-0 rounded-xl border border-sky/25 bg-sky/10 px-3 py-2 text-xs font-black text-sky"
            href={latest ? "/historique" : "/seance"}
          >
            {latest ? "Voir l'historique" : "Lancer la seance"}
          </Link>
        </div>

        {latestPlanned ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <MiniMetric label="Bloc valide" value={latestPlanned.title} />
            <MiniMetric label="Duree" value={latestDuration ?? "Enregistre"} />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DashboardPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur">
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">{label}</p>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function ActiveProgramCard({
  athleteName,
  goal,
  program,
  sessionsCount
}: {
  athleteName: string;
  goal: string;
  program?: ProgramTemplate;
  sessionsCount: number;
}) {
  return (
    <section className="rounded-[24px] border border-sky/20 bg-[linear-gradient(180deg,rgba(17,20,30,1),rgba(11,13,20,1))] p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-sky">Ton plan</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-white">
            {program?.name ?? "Programme personnalise"}
          </h2>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-white/55">
            {program?.description ?? "Programme actif adapte depuis tes reglages et tes retours."}
          </p>
        </div>
        <Link
          className="shrink-0 rounded-xl border border-sky/25 bg-sky/10 px-3 py-2 text-xs font-black text-sky"
          href="/programme"
        >
          Ouvrir
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Profil actif" value={athleteName || "Profil"} />
        <MiniMetric label="Objectif" value={goal} />
        <MiniMetric label="Frequence" value={program ? `${program.frequency} j/sem.` : `${sessionsCount} jours`} />
        <MiniMetric label="Niveau" value={program?.level ?? "Perso"} />
      </div>
    </section>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 text-lg font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function getSessionsThisWeek(history: CompletedSession[]) {
  const start = new Date();
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);

  return history.filter((session) => new Date(session.completedAt) >= start);
}

function countCardioThisWeek(history: CompletedSession[]) {
  const count = history.reduce((total, session) => {
    const cardioLogs = Object.values(session.progressions ?? {}).filter((progression) =>
      /cardio|tapis|marche|rameur|stairmaster|intervalles|zone 2/i.test(progression.exerciseName)
    );
    const completed = cardioLogs.filter((progression) => {
      const status = session.logs[progression.exerciseId]?.status;
      return Boolean(status) && status !== "skipped";
    });

    return total + completed.length;
  }, 0);

  return count ? `${count} bloc${count > 1 ? "s" : ""}` : "0 bloc";
}

function getLastCompoundPerformance(
  history: CompletedSession[],
  program: PlannedSession[]
): { label: string; value: string } {
  const compoundExerciseNames = new Set<string>();
  for (const session of program) {
    for (const exercise of session.exercises) {
      const isCompoundShape =
        (exercise.muscleGroups?.length ?? 0) >= 2 &&
        (exercise.classification === "force" || exercise.classification === "hypertrophie");
      if (isCompoundShape) {
        compoundExerciseNames.add(exercise.name);
      }
    }
  }

  for (const session of history) {
    for (const progression of Object.values(session.progressions ?? {})) {
      if (!compoundExerciseNames.has(progression.exerciseName)) continue;
      const log = session.logs[progression.exerciseId];
      if (!log?.usedLoad && !log?.completedReps) continue;
      const value = `${log.usedLoad || "-"} · ${log.completedReps || "-"}`;
      const shortName = progression.exerciseName.split(" ").slice(0, 2).join(" ");
      return { label: shortName, value };
    }
  }

  return { label: "Charge cle", value: "Non renseignee" };
}

function getTodayWeekday(): Weekday {
  const weekdays: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return weekdays[new Date().getDay()];
}

function getTodayExternalSports(settings: UserSettings): string[] {
  const today = getTodayWeekday();
  const names = settings.externalSports
    .filter((sport) => sport.days.includes(today))
    .map((sport) => sport.name);

  if (names.length === 0 && settings.judoDays.includes(today)) {
    return ["Sport"];
  }

  return names;
}

function getWeekStart(offsetWeeks: number): Date {
  const date = new Date();
  const day = date.getDay() === 0 ? 6 : date.getDay() - 1;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day + offsetWeeks * 7);
  return date;
}

function computeStreak(history: CompletedSession[]): number {
  if (!history.length) return 0;

  const thisWeekStart = getWeekStart(0);
  const hasThisWeek = history.some((session) => new Date(session.completedAt) >= thisWeekStart);
  const startOffset = hasThisWeek ? 0 : -1;
  let streak = 0;

  for (let i = startOffset; i >= -52; i--) {
    const start = getWeekStart(i);
    const end = getWeekStart(i + 1);
    const hasSession = history.some((session) => {
      const completedAt = new Date(session.completedAt);
      return completedAt >= start && completedAt < end;
    });
    if (!hasSession) break;
    streak++;
  }

  return streak;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/8 p-3 text-center">
      <p className="text-sm font-black leading-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/45">{label}</p>
    </div>
  );
}

const WEEKDAYS: Array<{ key: Weekday; short: string }> = [
  { key: "monday", short: "L" },
  { key: "tuesday", short: "M" },
  { key: "wednesday", short: "M" },
  { key: "thursday", short: "J" },
  { key: "friday", short: "V" },
  { key: "saturday", short: "S" },
  { key: "sunday", short: "D" }
];

function WeeklyTracker({
  currentProgram,
  sessions,
  streak
}: {
  currentProgram: PlannedSession[];
  sessions: CompletedSession[];
  streak: number;
}) {
  const todayKey = getTodayWeekday();
  const completedSessionIds = new Set(sessions.map((session) => session.sessionId));

  return (
    <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">Ta semaine</p>
          <h2 className="mt-2 text-2xl font-black text-white">Ou tu en es</h2>
        </div>
        {streak > 0 ? (
          <span className="rounded-full bg-amber/10 px-3 py-2 text-xs font-black text-amber">
            {streak} sem. d&apos;affilee
          </span>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map(({ key, short }) => {
          const planned = currentProgram.find((session) => session.weekday === key);
          const isToday = key === todayKey;
          const isDone = planned ? completedSessionIds.has(planned.id) : false;
          const isRestDay = !planned || planned.id.includes("sunday");

          let dotClass = "bg-white/10 text-white/25";
          if (isDone) dotClass = "bg-sea text-white";
          else if (isToday && !isDone) dotClass = "bg-sky/20 text-sky ring-1 ring-sky/60";
          else if (planned && !isDone) dotClass = "bg-white/8 text-white/40";

          return (
            <div className="flex flex-col items-center gap-1" key={key}>
              <div className={`flex size-9 items-center justify-center rounded-full text-xs font-black ${dotClass}`}>
                {isDone ? "✓" : isRestDay ? "-" : short}
              </div>
              <p className={`text-[9px] font-black uppercase ${isToday ? "text-sky" : "text-white/30"}`}>{short}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs font-semibold text-white/40">
        {sessions.length} seance{sessions.length > 1 ? "s" : ""} validee{sessions.length > 1 ? "s" : ""} cette semaine
      </p>
    </section>
  );
}

function formatGoal(primaryGoal?: string, fallback?: string) {
  if (primaryGoal && goalLabels[primaryGoal]) {
    return goalLabels[primaryGoal];
  }

  return fallback || "Objectif en cours";
}
