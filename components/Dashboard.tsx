"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { getSessionImage } from "@/lib/session-images";
import { useCoachStorage } from "@/lib/storage";
import { formatDurationLong } from "@/lib/time";
import type { CompletedSession, PlannedSession, UserSettings, Weekday } from "@/types/training";

const goalLabels: Record<string, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de muscle",
  cardio: "Cardio",
  "cardio-sante": "Cardio / sante",
  performance: "Force",
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

  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);
  const weeklySessions = useMemo(() => getSessionsThisWeek(history), [history]);
  const cardioDone = useMemo(() => countCardioThisWeek(weeklySessions), [weeklySessions]);
  const lastCompound = useMemo(() => getLastCompoundPerformance(history, currentProgram), [history, currentProgram]);
  const todayExternalSports = useMemo(() => getTodayExternalSports(settings), [settings]);
  const streak = useMemo(() => computeStreak(history), [history]);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const activeToday = activeSession?.dateKey === dateKey && activeSession.sessionId === todaySession.id;
  const ctaLabel = todaysCompletedSession ? "Voir le resume" : activeToday ? "Reprendre la seance" : "Commencer";
  const mainGoal = formatGoal(settings.primaryGoal, settings.mainGoal);
  const latest = history[0];
  const latestDuration = latest?.totalDurationMs ? formatDurationLong(latest.totalDurationMs) : undefined;
  const weeklyTarget = activeProgram?.frequency ?? currentProgram.length;
  const statusLabel = todaysCompletedSession ? "Validee" : activeToday ? "En cours" : "Prete";
  const sportHint = todayExternalSports.length > 0 ? `Ce soir : ${todayExternalSports.join(" + ")}` : "Jour libre";
  const firstExercises = todaySession.exercises.slice(0, 3);

  const openSession = () => {
    if (!activeToday && !todaysCompletedSession) {
      startSession(todaySession);
    }

    router.push("/seance");
  };

  return (
    <div className="space-y-4 pb-4">
      <section className="relative -mx-4 overflow-hidden border-b border-white/10 bg-[#050607] text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:-mx-6">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50"
          style={{ backgroundImage: `url(${getSessionImage(todaySession.title, todaySession.focus)})` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_4%,rgba(255,90,0,0.46),transparent_32%),linear-gradient(180deg,rgba(3,4,6,0.70),rgba(3,4,6,0.99)_78%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.10)_0_1px,transparent_1px_18px)] opacity-25" />

        <div className="relative px-4 pb-5 pt-5 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-coral">Mission du jour</p>
              <p className="mt-1 truncate text-base font-black text-white">{settings.athleteName} - {mainGoal}</p>
            </div>
            <div className="shrink-0 rounded-2xl border border-coral/35 bg-coral/15 px-3 py-2 text-right backdrop-blur">
              <p className="text-sm font-black leading-none text-coral">{statusLabel}</p>
              <p className="mt-1 text-[10px] font-black uppercase text-white/45">seance</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.75rem] border border-white/12 bg-[#080a0f]/88 p-4 shadow-[0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <p className="text-xs font-black uppercase text-coral">A faire maintenant</p>
            <h1 className="mt-2 text-3xl font-black leading-[0.94] text-white">{todaySession.title}</h1>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-white/65">
              {activeProgram?.name ?? "Programme personnalise"} - {todaySession.focus}
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <StatTile label="Duree" value={todaySession.duration} />
              <StatTile label="Exos" value={String(todaySession.exercises.length)} />
              <StatTile label="Contexte" value={sportHint} />
            </div>

            <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
              <button
                className="h-16 rounded-2xl bg-coral px-4 text-base font-black text-white shadow-[0_18px_46px_rgba(255,90,0,0.34)] transition active:scale-[0.99]"
                onClick={openSession}
                type="button"
              >
                {ctaLabel}
              </button>
              <Link
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/12 bg-white/10 text-xl font-black text-white backdrop-blur"
                href="/programme"
                title="Voir le programme"
              >
                -&gt;
              </Link>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-3 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-white/45">Programme actif</p>
                <p className="mt-1 truncate text-sm font-black text-white">
                  {activeProgram?.name ?? "Programme personnalise"}
                </p>
              </div>
              <Link className="shrink-0 text-xs font-black text-coral" href="/programme">
                Voir
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-sky">Progression</p>
            <h2 className="mt-2 text-2xl font-black text-white">Cette semaine</h2>
          </div>
          <Link
            className="shrink-0 rounded-xl border border-sky/25 bg-sky/10 px-3 py-2 text-xs font-black text-sky"
            href="/performances"
          >
            Details
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <StatTile label="Seances" value={`${weeklySessions.length}/${weeklyTarget}`} />
          <StatTile label="Cardio" value={cardioDone} />
          <StatTile label={lastCompound.label} value={lastCompound.value} />
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-sky">Juste apres</p>
            <h2 className="mt-2 text-2xl font-black text-white">Tes premiers mouvements</h2>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/65">
            {todaySession.exercises.length} exos
          </span>
        </div>
        <div className="mt-4 space-y-2">
          {firstExercises.map((exercise, index) => (
            <ExerciseRow
              index={index + 1}
              key={exercise.id}
              load={exercise.plannedLoad}
              name={exercise.name}
              target={exercise.target}
            />
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-white/40">
              {streak > 0 ? `${streak} semaine${streak > 1 ? "s" : ""} active${streak > 1 ? "s" : ""}` : "Derniere trace"}
            </p>
            <p className="mt-1 truncate text-sm font-black text-white">
              {latest ? `${latest.title}${latestDuration ? ` - ${latestDuration}` : ""}` : "Aucune seance validee"}
            </p>
          </div>
          <Link className="shrink-0 text-xs font-black text-sky" href="/historique">
            Historique
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/8 bg-white/[0.06] p-3 text-center">
      <p className="truncate text-sm font-black leading-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/45">{label}</p>
    </div>
  );
}

function ExerciseRow({
  index,
  load,
  name,
  target
}: {
  index: number;
  load?: string;
  name: string;
  target: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.04] p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-coral/15 text-sm font-black text-coral">
        {index}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-black text-white">{name}</p>
        <p className="mt-0.5 text-xs font-semibold text-white/55">
          {load ? `${load} - ` : ""}
          {target}
        </p>
      </div>
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
      const value = `${log.usedLoad || "-"} - ${log.completedReps || "-"}`;
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

function formatGoal(primaryGoal?: string, fallback?: string) {
  if (primaryGoal && goalLabels[primaryGoal]) {
    return goalLabels[primaryGoal];
  }

  return fallback || "Objectif en cours";
}
