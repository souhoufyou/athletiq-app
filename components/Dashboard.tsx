"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";

import { SessionExerciseIcon } from "@/components/session/SessionExerciseIcon";
import { DashboardSkeleton } from "@/components/ui/PageSkeletons";
import { WeekTimelineCompact } from "@/components/WeekTimeline";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { estimateCalories } from "@/lib/calories";
import { getWeekday } from "@/lib/date";
import { getSessionImage } from "@/lib/session-images";
import { getSessionCategory, getSessionTypeLabel, parseDurationToMs } from "@/lib/sessionMeta";
import { useCoachStorage } from "@/lib/storage";
import { formatDurationLong } from "@/lib/time";
import { startSafeViewTransition } from "@/lib/viewTransition";
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
    setSettings,
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
  const historyPreview = useMemo(() => history.slice(0, 4), [history]);
  const currentStreak = useMemo(() => getStreak(history), [history]);
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
    return <DashboardSkeleton />;
  }

  const mainGoal = formatGoal(settings.primaryGoal, settings.mainGoal);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link aria-label="AthletIQ" className="min-w-0" href="/">
          <BrandLogo className="h-10" variant="wordmark" />
        </Link>
        <button
          aria-label={settings.darkMode ? "Passer en mode clair" : "Passer en mode sombre"}
          className="tap-feedback flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
          onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
          title={settings.darkMode ? "Mode clair" : "Mode sombre"}
          type="button"
        >
          {settings.darkMode ? (
            // Sun icon (currently dark → click to go light)
            <svg className="size-5" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
              <path
                d="M12 3v2M12 19v2M4.5 4.5l1.4 1.4M18.1 18.1l1.4 1.4M3 12h2M19 12h2M4.5 19.5l1.4-1.4M18.1 5.9l1.4-1.4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            </svg>
          ) : (
            // Moon icon (currently light → click to go dark)
            <svg className="size-5" fill="none" viewBox="0 0 24 24">
              <path
                d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          )}
        </button>
      </div>

      <ProfileHeader
        goal={mainGoal}
        name={settings.athleteName || activeProfile?.name || "Athlète"}
        photoUrl={activeProfile?.photoUrl}
        programName={activeProgram?.name ?? "Programme personnalisé"}
      />

      <DynamicHeroCard
        athleteName={settings.athleteName || "Athlète"}
        completedThisWeek={weeklySessions.length}
        frequency={settings.weeklyFrequency ?? 4}
        isCompleted={Boolean(todaysCompletedSession)}
        isRestDay={isRestDay}
        recentSessions={recentSessions}
        sessionTitle={todaysPlannedSession?.title}
      />

      {isRestDay ? (
        <RestDayCard nextSession={nextSession} />
      ) : (
        <TodaySessionCard
          activeToday={activeToday}
          isCompleted={Boolean(todaysCompletedSession)}
          onStart={() => {
            startSafeViewTransition(() => {
              if (!activeToday && !todaysCompletedSession) {
                startSession(todaySession);
              }
              router.push("/seance");
            });
          }}
          session={todaySession}
          weightKg={settings.currentWeightKg}
        />
      )}

      <MetricsGrid
        completedThisWeek={weeklySessions.length}
        frequency={settings.weeklyFrequency ?? 4}
        nextSession={nextSession}
        streak={currentStreak}
        targetWeightKg={settings.targetWeightKg}
        weightKg={settings.currentWeightKg}
      />

      <WeekTimelineCompact days={timelineDays} validatedCount={weeklySessions.length} />

      <RecentHistoryCard sessions={historyPreview} totalCount={history.length} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SVG ICONS (no emojis)
// ─────────────────────────────────────────────────────────────────────────

function HeroIcon({ name, color = "currentColor" }: { name: "bolt" | "check" | "flame" | "rest" | "trophy"; color?: string }) {
  const props = { className: "size-5", fill: "none", viewBox: "0 0 24 24", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "check":
      return <svg {...props}><path d="M5 12l5 5 9-11" /></svg>;
    case "trophy":
      return <svg {...props}><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2M6 3h12v6a6 6 0 0 1-12 0V3zM9 21h6M12 15v6" /></svg>;
    case "rest":
      return <svg {...props}><path d="M17 18a5 5 0 0 0-10 0M12 13V2M4.93 10.93l1.41 1.41M2 18h2M20 18h2M17.66 12.34l1.41-1.41" /></svg>;
    case "flame":
      return <svg {...props} fill={color} stroke="none"><path d="M12 2c.5 2.5-.5 4.5-1.5 6C9.5 10 9 12 10 14c.5-1.5 1.5-2.5 3-3 1-.5 2-2 2-4 1 1 2.5 3.5 2.5 6.5a6.5 6.5 0 1 1-13 0C4.5 9 8 5 12 2z" /></svg>;
    case "bolt":
      return <svg {...props}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// DYNAMIC HERO CARD
// ─────────────────────────────────────────────────────────────────────────

function DynamicHeroCard({
  athleteName,
  completedThisWeek,
  frequency,
  isCompleted,
  isRestDay,
  recentSessions,
  sessionTitle
}: {
  athleteName: string;
  completedThisWeek: number;
  frequency: number;
  isCompleted: boolean;
  isRestDay: boolean;
  recentSessions: CompletedSession[];
  sessionTitle?: string;
}) {
  const insight = useMemo(() => {
    if (isCompleted) {
      return {
        icon: "check" as const,
        title: "Séance validée",
        subtitle: `Bravo ${athleteName}. ${completedThisWeek}/${frequency} cette semaine.`,
        tone: "sea" as const
      };
    }

    if (completedThisWeek >= frequency) {
      return {
        icon: "trophy" as const,
        title: "Objectif hebdo atteint",
        subtitle: `${completedThisWeek} séances cette semaine. Continue sur ta lancée.`,
        tone: "sea" as const
      };
    }

    if (isRestDay) {
      return {
        icon: "rest" as const,
        title: "Récupération active",
        subtitle: "Profite de ce jour off. Hydratation, mobilité, sommeil.",
        tone: "amber" as const
      };
    }

    const streak = getStreak(recentSessions);
    if (streak >= 3) {
      return {
        icon: "flame" as const,
        title: `${streak} séances d'affilée`,
        subtitle: `${sessionTitle ?? "Ta séance"} t'attend. La série continue.`,
        tone: "coral" as const
      };
    }

    const remaining = frequency - completedThisWeek;
    return {
      icon: "bolt" as const,
      title: sessionTitle ? `Jour de ${sessionTitle.toLowerCase().split(" ")[0]}` : "C'est l'heure",
      subtitle: `${remaining} séance${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} cette semaine. On y va.`,
      tone: "coral" as const
    };
  }, [athleteName, completedThisWeek, frequency, isCompleted, isRestDay, recentSessions, sessionTitle]);

  const toneStyles = {
    coral: "border-coral/20 bg-coral/10",
    sea: "border-sea/20 bg-sea/10",
    amber: "border-amber/20 bg-amber/10"
  }[insight.tone];

  const iconColor = { coral: "#ff5a00", sea: "#24c07a", amber: "#f59e0b" }[insight.tone];

  return (
    <div className={`session-step-enter flex items-center gap-3 rounded-2xl border p-4 ${toneStyles}`}>
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${iconColor}20` }}>
        <HeroIcon name={insight.icon} color={iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-white">{insight.title}</p>
        <p className="mt-0.5 text-xs font-semibold leading-relaxed text-white/60">{insight.subtitle}</p>
      </div>
    </div>
  );
}

function getStreak(sessions: CompletedSession[]): number {
  if (sessions.length === 0) return 0;
  let streak = 0;
  const now = new Date();
  for (const session of sessions) {
    const diff = (now.getTime() - new Date(session.completedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= streak + 2) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─────────────────────────────────────────────────────────────────────────
// PROFILE HEADER
// ─────────────────────────────────────────────────────────────────────────

function ProfileHeader({
  goal,
  name,
  photoUrl,
  programName
}: {
  goal: string;
  name: string;
  photoUrl?: string;
  programName: string;
}) {
  const initials = name.trim().charAt(0).toUpperCase() || "A";

  return (
    <section className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3">
      <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-coral/30 bg-coral/15">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={name} className="size-full object-cover" src={photoUrl} />
        ) : (
          <span className="text-lg font-bold text-coral">{initials}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-bold leading-tight text-white">{name}</p>
        <p className="mt-0.5 truncate text-xs font-semibold text-white/55">{programName}</p>
      </div>
      <span className="shrink-0 max-w-[7rem] truncate rounded-full border border-sky/25 bg-sky/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky">
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
  const heroImage = getSessionImage(session.title, session.focus, category);

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
    <section className="session-step-card overflow-hidden p-0 [view-transition-name:session-card]">
      <div className="session-step-accent" />

      {/* Hero image */}
      <div
        className="relative h-44 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#04050d] via-[#04050d]/65 to-transparent" />
        <div className="hero-overlay absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="rounded-full bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-coral backdrop-blur">
              Séance du jour · {typeLabel}
            </p>
            <span className={`shrink-0 rounded-full border bg-black/35 px-3 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur ${statusTone}`}>
              {statusLabel}
            </span>
          </div>
          <div className="flex items-end gap-3">
            <SessionExerciseIcon category={category} className="size-14 shrink-0 backdrop-blur" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] [view-transition-name:session-title]">
                {session.title}
              </h1>
              {session.focus ? (
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.7)]">
                  {session.focus}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-5 pt-4">
        <Stat label="Durée" value={session.duration || "—"} />
        <Stat label="Exercices" value={String(exerciseCount)} />
        <Stat label="Calories" value={`${calorieEstimate.low}–${calorieEstimate.high}`} />
      </div>

      <div className="px-5 pb-5">
        <button className="session-cta-primary" onClick={onStart} type="button">
          {ctaLabel}
        </button>
        <Link
          className="session-cta-secondary mt-3 inline-flex items-center justify-center"
          href="/programme?day=today"
        >
          Voir le programme
        </Link>
      </div>
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

      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sea">Aujourd&apos;hui</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-white">Jour de repos</h1>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/65">
        Pas de séance prévue aujourd&apos;hui. Hydrate-toi, mange bien, dors.
      </p>

      {nextSession ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/4 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-white/55">Prochaine séance</p>
          <p className="mt-1 text-lg font-bold text-white">{nextSession.session.title}</p>
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
// METRICS GRID (Bento — compact data cards)
// ─────────────────────────────────────────────────────────────────────────

function MetricsGrid({
  completedThisWeek,
  frequency,
  nextSession,
  streak,
  targetWeightKg,
  weightKg
}: {
  completedThisWeek: number;
  frequency: number;
  nextSession?: { session: PlannedSession; weekdayLabel: string };
  streak: number;
  targetWeightKg: number;
  weightKg: number;
}) {
  return (
    <section className="grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2">
      <MetricCard
        icon="weight"
        label="Poids"
        sub={targetWeightKg > 0 ? `Objectif ${targetWeightKg} kg` : "Poids actuel"}
        tone="data"
        value={weightKg > 0 ? `${weightKg} kg` : "—"}
      />
      <MetricCard
        icon="flame"
        label="Série"
        sub={`séance${streak > 1 ? "s" : ""} d'affilée`}
        tone="coral"
        value={String(streak)}
      />
      <MetricCard
        icon="calendar"
        label="Cette semaine"
        sub="séances validées"
        tone="sea"
        value={`${completedThisWeek}/${frequency}`}
      />
      <MetricCard
        icon="next"
        label="Prochaine séance"
        sub={nextSession ? nextSession.weekdayLabel : "Aucune planifiée"}
        tone="amber"
        value={nextSession ? nextSession.session.title : "—"}
      />
    </section>
  );
}

function MetricCard({
  icon,
  label,
  sub,
  tone,
  value
}: {
  icon: "calendar" | "flame" | "next" | "weight";
  label: string;
  sub: string;
  tone: "amber" | "coral" | "data" | "sea";
  value: string;
}) {
  const iconTone = {
    data: "bg-electric/10 text-electric",
    coral: "bg-coral/15 text-coral",
    sea: "bg-sea/15 text-sea",
    amber: "bg-amber/15 text-amber"
  }[tone];

  return (
    <div className="flex min-w-0 flex-col gap-2.5 rounded-xl border border-white/8 bg-white/4 p-3.5">
      <div className="flex items-center gap-2">
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
          <MetricIcon name={icon} />
        </span>
        <p className="min-w-0 truncate text-[10px] font-bold uppercase tracking-wide text-white/55">
          {label}
        </p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[1.35rem] font-bold leading-none text-white">{value}</p>
        <p className="mt-1 truncate text-[11px] font-semibold text-white/50">{sub}</p>
      </div>
    </div>
  );
}

function MetricIcon({ name }: { name: "calendar" | "flame" | "next" | "weight" }) {
  const props = {
    className: "size-4",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  switch (name) {
    case "weight":
      return <svg {...props}><path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" /></svg>;
    case "flame":
      return <svg {...props} fill="currentColor" stroke="none"><path d="M12 2c.5 2.5-.5 4.5-1.5 6C9.5 10 9 12 10 14c.5-1.5 1.5-2.5 3-3 1-.5 2-2 2-4 1 1 2.5 3.5 2.5 6.5a6.5 6.5 0 1 1-13 0C4.5 9 8 5 12 2z" /></svg>;
    case "calendar":
      return <svg {...props}><rect height="16" rx="2" width="18" x="3" y="5" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "next":
      return <svg {...props}><path d="M5 12h13M12 5l7 7-7 7" /></svg>;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// RECENT HISTORY
// ─────────────────────────────────────────────────────────────────────────

function RecentHistoryCard({ sessions, totalCount }: { sessions: CompletedSession[]; totalCount: number }) {
  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-white/8 bg-white/4 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">
          Historique récent
        </p>
        {totalCount > sessions.length ? (
          <Link
            className="tap-feedback rounded-md bg-white/8 px-2.5 py-1 text-[10px] font-bold text-white/55 transition hover:bg-sky/10 hover:text-sky"
            href="/historique"
          >
            Voir tout ({totalCount})
          </Link>
        ) : null}
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
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sea/15">
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="#24c07a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{session.title}</p>
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
    <div className="rounded-xl border border-electric/15 bg-electric/[0.06] p-2.5 text-center">
      <p className="truncate text-sm font-bold leading-tight text-electric">{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-white/55">{label}</p>
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
