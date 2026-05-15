"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { SessionExerciseIcon } from "@/components/session/SessionExerciseIcon";
import { WeekTimelineCompact } from "@/components/WeekTimeline";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { estimateCalories } from "@/lib/calories";
import { getWeekday } from "@/lib/date";
import { getSessionCategory, getSessionTypeLabel, parseDurationToMs } from "@/lib/sessionMeta";
import { useCoachStorage } from "@/lib/storage";
import { formatDurationLong } from "@/lib/time";
import { buildWeekTimeline, getCompletedThisWeek } from "@/lib/weekTimeline";
import type { CompletedSession, PlannedSession, Weekday } from "@/types/training";

const goalLabels: Record<string, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de masse",
  cardio: "Cardio",
  "cardio-sante": "Cardio / santé",
  performance: "Performance",
  recomposition: "Recomposition",
  sante: "Santé"
};

export function Dashboard() {
  const {
    activeProfileId,
    activeSession,
    currentProgram,
    dateKey,
    history,
    isReady,
    profiles,
    settings,
    startSession,
    todaySession,
    todaysCompletedSession
  } = useCoachStorage();
  const router = useRouter();

  const todayWeekday = useMemo(() => getWeekday(), []);
  const todaysPlannedSession = useMemo(
    () => currentProgram.find((s) => s.weekday === todayWeekday),
    [currentProgram, todayWeekday]
  );
  const isRestDay = !todaysPlannedSession;
  const activeProgram = useMemo(() => getActiveProgramTemplate(currentProgram), [currentProgram]);
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId),
    [profiles, activeProfileId]
  );
  const weeklySessions = useMemo(() => getCompletedThisWeek(history), [history]);
  const nextSession = useMemo(() => findNextSession(currentProgram, todayWeekday), [currentProgram, todayWeekday]);
  const recentSessions = useMemo(() => history.slice(0, 3), [history]);
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

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const mainGoal = formatGoal(settings.primaryGoal, settings.mainGoal);

  return (
    <div className="space-y-4">
      <ProfileHeader
        avatar={activeProfile?.avatar ?? "💪"}
        goal={mainGoal}
        name={settings.athleteName || activeProfile?.name || "Athlète"}
        programName={activeProgram?.name ?? "Programme personnalisé"}
      />

      {isRestDay ? (
        <RestDayCard nextSession={nextSession} />
      ) : (
        <TodaySessionCard
          activeToday={activeToday}
          isCompleted={Boolean(todaysCompletedSession)}
          onStart={() => {
            if (!activeToday && !todaysCompletedSession) {
              startSession(todaySession);
            }
            router.push("/seance");
          }}
          session={todaySession}
          weightKg={settings.currentWeightKg}
        />
      )}

      <WeekTimelineCompact days={timelineDays} validatedCount={weeklySessions.length} />

      <RecentSessionsCard sessions={recentSessions} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PROFILE HEADER
// ─────────────────────────────────────────────────────────────────────────

function ProfileHeader({
  avatar,
  goal,
  name,
  programName
}: {
  avatar: string;
  goal: string;
  name: string;
  programName: string;
}) {
  return (
    <section className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-coral/30 bg-coral/15 text-2xl">
        {avatar}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-black leading-tight text-white">{name}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-white/55">{programName}</p>
      </div>
      <span className="shrink-0 max-w-[8rem] truncate rounded-full border border-sky/25 bg-sky/10 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-sky">
        {goal}
      </span>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// TODAY SESSION CARD
// ─────────────────────────────────────────────────────────────────────────

function TodaySessionCard({
  activeToday,
  isCompleted,
  onStart,
  session,
  weightKg
}: {
  activeToday: boolean;
  isCompleted: boolean;
  onStart: () => void;
  session: PlannedSession;
  weightKg: number;
}) {
  const category = getSessionCategory(session);
  const typeLabel = getSessionTypeLabel(category);
  const exerciseCount = session.exercises.length;
  const plannedMs = parseDurationToMs(session.duration);
  const calorieEstimate = estimateCalories(session.intensity, weightKg, plannedMs);

  const status: "to-do" | "in-progress" | "done" = isCompleted
    ? "done"
    : activeToday
      ? "in-progress"
      : "to-do";

  const statusLabel = {
    "to-do": "À faire",
    "in-progress": "En cours",
    done: "Faite"
  }[status];

  const statusTone = {
    "to-do": "border-coral/30 bg-coral/15 text-coral",
    "in-progress": "border-amber/30 bg-amber/15 text-amber",
    done: "border-sea/30 bg-sea/15 text-sea"
  }[status];

  const ctaLabel = {
    "to-do": "Commencer la séance",
    "in-progress": "Reprendre la séance",
    done: "Voir le résumé"
  }[status];

  return (
    <section className="session-step-card p-5">
      <div className="session-step-accent" />

      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-coral">
          Séance du jour · {typeLabel}
        </p>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${statusTone}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-4 flex items-start gap-4">
        <SessionExerciseIcon category={category} className="size-20 shrink-0" />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl">
            {session.title}
          </h1>
          {session.focus ? (
            <p className="mt-1 line-clamp-2 text-xs font-semibold text-white/55">{session.focus}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <Stat label="Durée" value={session.duration || "—"} />
        <Stat label="Exercices" value={String(exerciseCount)} />
        <Stat label="Calories" value={`${calorieEstimate.low}–${calorieEstimate.high}`} />
      </div>

      <button className="session-cta-primary mt-6" onClick={onStart} type="button">
        {ctaLabel}
      </button>

      <Link
        className="session-cta-secondary mt-3 inline-flex items-center justify-center"
        href="/programme"
      >
        Voir le programme
      </Link>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// REST DAY CARD
// ─────────────────────────────────────────────────────────────────────────

function RestDayCard({
  nextSession
}: {
  nextSession?: { session: PlannedSession; weekdayLabel: string };
}) {
  return (
    <section className="session-step-card p-5">
      <div className="session-step-accent" style={{ background: "linear-gradient(90deg, #24c07a, #ff9f1a)" }} />

      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sea">Aujourd&apos;hui</p>
      <h1 className="mt-2 text-3xl font-black leading-tight text-white">Jour de repos</h1>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/65">
        Pas de séance prévue aujourd&apos;hui. Hydrate-toi, mange bien, dors.
      </p>

      {nextSession ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-white/55">Prochaine séance</p>
          <p className="mt-1 text-lg font-black text-white">{nextSession.session.title}</p>
          <p className="mt-1 text-xs font-semibold text-white/55">
            {nextSession.weekdayLabel} · {nextSession.session.duration}
          </p>
        </div>
      ) : null}

      <Link
        className="session-cta-secondary mt-5 inline-flex items-center justify-center"
        href="/programme"
      >
        Voir le programme
      </Link>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// RECENT SESSIONS
// ─────────────────────────────────────────────────────────────────────────

function RecentSessionsCard({ sessions }: { sessions: CompletedSession[] }) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-2xl border border-white/8 bg-white/4 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Dernières séances</p>
        <p className="mt-2 text-sm font-semibold text-white/55">
          Pas encore de séance enregistrée. Lance la première pour suivre tes progrès.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-white/55">Dernières séances</p>
        <Link
          className="text-[11px] font-black uppercase tracking-wide text-sky"
          href="/historique"
        >
          Voir tout l&apos;historique
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {sessions.map((session) => (
          <li key={session.id}>
            <RecentSessionRow session={session} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RecentSessionRow({ session }: { session: CompletedSession }) {
  const dateLabel = formatRelativeDate(session.completedAt);
  const duration = session.totalDurationMs ? formatDurationLong(session.totalDurationMs) : "—";
  const validatedCount = countValid(session);
  const totalCount = Object.keys(session.logs ?? {}).length;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sea/15 text-sm font-black text-sea">
        ✓
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-white">{session.title}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-white/55">
          {dateLabel} · {duration} · {validatedCount}/{totalCount} ex.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-3 text-center">
      <p className="text-base font-black leading-tight text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/55">{label}</p>
    </div>
  );
}

function formatGoal(primaryGoal?: string, fallback?: string): string {
  if (primaryGoal && goalLabels[primaryGoal]) {
    return goalLabels[primaryGoal];
  }
  if (!fallback) return "Objectif";
  // Legacy mainGoal can be a long sentence — trim to the first segment
  const short = fallback.split(/[:.]/)[0].trim();
  return short.length > 24 ? `${short.slice(0, 24).trim()}…` : short || "Objectif";
}

function findNextSession(
  program: PlannedSession[],
  todayWeekday: Weekday
): { session: PlannedSession; weekdayLabel: string } | undefined {
  const order: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const todayIndex = order.indexOf(todayWeekday);
  for (let offset = 1; offset <= 7; offset += 1) {
    const candidate = order[(todayIndex + offset) % 7];
    const planned = program.find((s) => s.weekday === candidate);
    if (planned) {
      return {
        session: planned,
        weekdayLabel: weekdayLabel(candidate, offset === 1)
      };
    }
  }
  return undefined;
}

function weekdayLabel(day: Weekday, isTomorrow: boolean): string {
  if (isTomorrow) return "Demain";
  const labels: Record<Weekday, string> = {
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche"
  };
  return labels[day];
}

function countValid(session: CompletedSession): number {
  return Object.values(session.logs ?? {}).filter(
    (log) => log.status === "ok" || log.status === "easy"
  ).length;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDate) / dayMs);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays > 1 && diffDays < 7) return `Il y a ${diffDays} j`;
  if (diffDays >= 7 && diffDays < 14) return "La semaine dernière";

  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short" }).format(date);
}
