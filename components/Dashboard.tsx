"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { getAdaptiveSnapshot, type AdaptiveSnapshot } from "@/lib/adaptiveInsights";
import { estimateCalories } from "@/lib/calories";
import { getProgramDeloadState } from "@/lib/deloadState";
import { getSessionImage } from "@/lib/session-images";
import { useCoachStorage } from "@/lib/storage";
import { formatDurationLong } from "@/lib/time";
import { getTrainingTrendReport, type TrainingTrendReport } from "@/lib/trainingTrends";
import type { CompletedSession, PlannedSession, UserSettings, Weekday } from "@/types/training";

export function Dashboard() {
  const {
    activeSession,
    currentProgram,
    dateKey,
    history,
    isReady,
    nextSession,
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
  const adaptiveSnapshot = useMemo(
    () => getAdaptiveSnapshot(settings, currentProgram, history),
    [settings, currentProgram, history]
  );
  const trendReport = useMemo(
    () => getTrainingTrendReport(history, currentProgram, settings),
    [history, currentProgram, settings]
  );
  const deloadState = useMemo(() => getProgramDeloadState(currentProgram, history), [currentProgram, history]);

  // Latest session enrichment
  const latestPlanned = latest ? currentProgram.find((s) => s.id === latest.sessionId) : undefined;
  const latestCalories =
    latestPlanned && latest?.totalDurationMs
      ? estimateCalories(latestPlanned.intensity, settings.currentWeightKg, latest.totalDurationMs)
      : undefined;
  const latestDuration = latest?.totalDurationMs ? formatDurationLong(latest.totalDurationMs) : undefined;

  // Weekly calorie total
  const weeklyCalories = useMemo(
    () =>
      weeklySessions.reduce((total, session) => {
        const planned = currentProgram.find((s) => s.id === session.sessionId);
        if (!planned || !session.totalDurationMs) return total;
        const est = estimateCalories(planned.intensity, settings.currentWeightKg, session.totalDurationMs);
        return total + Math.round((est.low + est.high) / 2);
      }, 0),
    [currentProgram, settings.currentWeightKg, weeklySessions]
  );

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const todayStatus = todaysCompletedSession ? "Validée" : activeToday ? "En cours" : "Prête";
  const ctaLabel = todaysCompletedSession ? "Voir le résumé" : activeToday ? "Reprendre" : "Commencer";

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-white/10 premium-gradient text-white shadow-soft">
        <div
          className="relative h-40 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${getSessionImage(todaySession.title, todaySession.focus)})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f111a] via-[#0f111a]/40 to-transparent" />
          <span className="absolute right-3 top-3 rounded-md border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-black text-white backdrop-blur">
            {todayStatus}
          </span>
        </div>
        <div className="p-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-sky">Séance du jour</p>
            <h3 className="mt-1 text-3xl font-black leading-tight">{todaySession.title}</h3>
            <p className="mt-2 text-sm font-semibold text-white/70">{todaySession.focus}</p>
          </div>

          <div className={`mt-5 grid gap-2 text-center ${hasEveningSport ? "grid-cols-3" : "grid-cols-2"}`}>
            <DashboardPill label="Exos" value={String(todaySession.exercises.length)} />
            <DashboardPill label="Durée" value={todaySession.duration} />
            {hasEveningSport ? (
              <DashboardPill label="Sport soir" value={eveningSportTonight ? todayExternalSports.join(" + ") : "Non"} />
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              className="flex h-14 items-center justify-center rounded-md border border-white/15 bg-white/10 px-4 text-center font-black text-white"
              href="/programme"
            >
              Voir le détail
            </Link>
            <button
              className="h-14 rounded-md premium-action px-4 font-black transition"
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

          {todaySession.notes?.length ? (
            <div className="mt-4 rounded-md bg-coral/15 p-3">
              {todaySession.notes.map((note) => (
                <p className="text-sm font-black text-white" key={note}>
                  {note}
                </p>
              ))}
            </div>
          ) : null}

          <div className="mt-4 space-y-2">
            {todaySession.exercises.slice(0, 3).map((exercise, index) => (
              <div className="rounded-md bg-white/10 p-3" key={exercise.id}>
                <p className="text-xs font-black uppercase text-white/55">Exercice {index + 1}</p>
                <p className="mt-1 font-black">
                  {exercise.name}
                  {exercise.plannedLoad ? ` - ${exercise.plannedLoad}` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-white/65">{exercise.target}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Suivi semaine ── */}
      <WeeklyTracker currentProgram={currentProgram} sessions={weeklySessions} streak={streak} />

      <DeloadStatusCard state={deloadState} trendReport={trendReport} />
      <AdaptiveCoachCard snapshot={adaptiveSnapshot} />
      <TrendPreviewCard report={trendReport} />

      {/* ── Métriques rapides ── */}
      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Séances semaine" value={String(weeklySessions.length)} tone="calm" />
        <MetricCard label="Cardio semaine" value={cardioDone} tone="info" />
        <MetricCard label="Calories semaine" value={weeklyCalories > 0 ? `~${weeklyCalories} kcal` : "—"} tone="warn" />
        <MetricCard label={lastCompound.label} value={lastCompound.value} tone="warn" />
      </section>

      {/* ── À venir ── */}
      <section className="card-dark p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-sky">À venir</p>
            <h2 className="mt-1 text-xl font-black text-white">{nextSession.session.title}</h2>
            <p className="mt-1 text-sm font-semibold text-white/60">{nextSession.session.focus}</p>
          </div>
          <span className="rounded-md bg-sky/10 px-3 py-2 text-sm font-black text-sky">
            {nextSession.session.duration}
          </span>
        </div>
      </section>

      {/* ── Dernière séance enrichie ── */}
      <section className="card-dark p-4">
        <p className="text-xs font-black uppercase text-white/40">Dernière séance</p>
        {latest ? (
          <>
            <p className="mt-1 text-base font-black text-white">{latest.title}</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <MiniMetric
                label="Exos"
                value={String(Object.values(latest.logs).filter((log) => log.status).length)}
              />
              <MiniMetric label="Durée" value={latestDuration ?? "—"} />
              <MiniMetric
                label="Calories"
                value={latestCalories ? `~${Math.round((latestCalories.low + latestCalories.high) / 2)}` : "—"}
              />
            </div>
            {latest.aiCoach?.summary && latest.aiCoach.summary !== "IA désactivée" ? (
              <p className="mt-3 rounded-md bg-white/5 px-3 py-2 text-xs font-semibold italic text-white/55">
                &ldquo;{latest.aiCoach.summary}&rdquo;
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-1 text-sm font-semibold text-white/50">Aucune séance validée pour le moment.</p>
        )}
      </section>
    </div>
  );
}

function DashboardPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/10 p-3">
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase text-white/65">{label}</p>
    </div>
  );
}

function AdaptiveCoachCard({ snapshot }: { snapshot: AdaptiveSnapshot }) {
  return (
    <section className="card-dark border border-sky/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Coach adaptatif</p>
          <h2 className="mt-1 text-xl font-black text-white">Ce que l&apos;app prend en compte</h2>
        </div>
        <span className="rounded-md bg-sky/10 px-3 py-2 text-xs font-black text-sky">
          Actif
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <MiniMetric label="Planning" value={snapshot.scheduleLabel} />
        <MiniMetric label="Récupération" value={snapshot.recoveryLabel} />
        <MiniMetric label="Charges" value={snapshot.loadBasisLabel} />
        <MiniMetric label="Contraintes" value={snapshot.constraintsLabel} />
      </div>
      <div className="mt-3 rounded-md bg-white/5 px-3 py-2">
        <p className="text-[10px] font-black uppercase text-white/40">Sport externe</p>
        <p className="mt-1 text-sm font-black text-white">{snapshot.externalSportsLabel}</p>
      </div>
      {snapshot.notes.length > 0 ? (
        <div className="mt-3 space-y-2">
          {snapshot.notes.map((note) => (
            <p className="rounded-md bg-sky/10 px-3 py-2 text-xs font-semibold leading-relaxed text-sky" key={note}>
              {note}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function DeloadStatusCard({
  state,
  trendReport
}: {
  state: ReturnType<typeof getProgramDeloadState>;
  trendReport: TrainingTrendReport;
}) {
  if (!state.active) {
    return null;
  }

  const deloadReason = trendReport.items.find((item) =>
    item.action === "deload_next_week" || item.action === "protect_recovery"
  );

  return (
    <section className="rounded-xl border border-amber/20 bg-amber/10 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-white/45">Semaine allegee</p>
          <h2 className="mt-1 text-xl font-black text-white">Deload en cours</h2>
        </div>
        <span className="rounded-md bg-amber/15 px-3 py-2 text-xs font-black uppercase text-amber">
          {state.remainingSessions}/{state.totalSessions} restantes
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/70">
        {deloadReason?.detail ?? state.guideNote ?? "Le programme a ete allege pour refaire monter la recuperation avant de pousser de nouveau."}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniMetric label="Deja faites" value={String(state.completedSessions)} />
        <MiniMetric label="Prochaine allegee" value={state.nextSessionTitle ?? "Cycle en cours"} />
      </div>
    </section>
  );
}

function TrendPreviewCard({ report }: { report: TrainingTrendReport }) {
  const topTrend = report.items[0];
  const toneClass = topTrend
    ? {
        critical: "border-coral/20 bg-coral/10 text-coral",
        positive: "border-sea/20 bg-sea/10 text-sea",
        watch: "border-amber/20 bg-amber/10 text-amber"
      }[topTrend.severity]
    : "border-white/10 bg-white/5 text-white/60";

  return (
    <section className={`rounded-xl border p-4 shadow-soft ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-white/45">Apprentissage</p>
          <h2 className="mt-1 text-xl font-black text-white">
            {topTrend ? topTrend.title : "Pas encore de tendance forte"}
          </h2>
        </div>
        <span className="rounded-md bg-white/10 px-3 py-2 text-xs font-black uppercase text-white/70">
          {report.confidence}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-white/70">
        {topTrend ? topTrend.detail : report.summary}
      </p>
      {topTrend?.evidence[0] ? (
        <p className="mt-3 rounded-md bg-white/8 px-3 py-2 text-xs font-semibold leading-relaxed text-white/60">
          {topTrend.evidence[0]}
        </p>
      ) : null}
    </section>
  );
}

function MetricCard({ label, tone, value }: { label: string; value: string; tone: "calm" | "info" | "warn" }) {
  const toneClass = {
    calm: "bg-sea/10 text-sea border-sea/20",
    info: "bg-sky/10 text-sky border-sky/20",
    warn: "bg-amber/10 text-amber border-amber/20"
  }[tone];

  return (
    <div className={`min-h-24 rounded-xl border p-4 shadow-soft ${toneClass}`}>
      <p className="text-xs font-black uppercase text-white/60">{label}</p>
      <p className="mt-2 line-clamp-2 text-xl font-black leading-tight">{value}</p>
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

/**
 * Pulls the most recent completed compound exercise from history,
 * derived from the user's actual program (no hardcoded movement bias).
 */
function getLastCompoundPerformance(
  history: CompletedSession[],
  program: PlannedSession[]
): { label: string; value: string } {
  // Build set of compound exercise names by classification "force"/"hypertrophie" + multiple muscle groups
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
      // Keep the label compact: first 2 words of the exercise
      const shortName = progression.exerciseName.split(" ").slice(0, 2).join(" ");
      return { label: shortName, value };
    }
  }

  return { label: "Charge récente", value: "Non renseigné" };
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
  const d = new Date();
  const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day + offsetWeeks * 7);
  return d;
}

function computeStreak(history: CompletedSession[]): number {
  if (!history.length) return 0;

  const thisWeekStart = getWeekStart(0);
  const hasThisWeek = history.some((s) => new Date(s.completedAt) >= thisWeekStart);
  const startOffset = hasThisWeek ? 0 : -1;
  let streak = 0;

  for (let i = startOffset; i >= -52; i--) {
    const start = getWeekStart(i);
    const end = getWeekStart(i + 1);
    const hasSession = history.some((s) => {
      const d = new Date(s.completedAt);
      return d >= start && d < end;
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
  const completedSessionIds = new Set(sessions.map((s) => s.sessionId));

  return (
    <section className="card-dark p-4">
      <p className="text-xs font-black uppercase text-white/40">Semaine en cours</p>
      <div className="mt-3 grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map(({ key, short }) => {
          const planned = currentProgram.find((s) => s.weekday === key);
          const isToday = key === todayKey;
          const isDone = planned ? completedSessionIds.has(planned.id) : false;
          const isRestDay = !planned || planned.id.includes("sunday");

          let dotClass = "bg-white/10 text-white/25"; // rest / not planned
          if (isDone) dotClass = "bg-sea text-white";
          else if (isToday && !isDone) dotClass = "bg-sky/20 text-sky ring-1 ring-sky/60";
          else if (planned && !isDone) dotClass = "bg-white/8 text-white/40";

          return (
            <div className="flex flex-col items-center gap-1" key={key}>
              <div
                className={`flex size-9 items-center justify-center rounded-full text-xs font-black transition ${dotClass}`}
              >
                {isDone ? "✓" : isRestDay ? "—" : short}
              </div>
              <p className={`text-[9px] font-black uppercase ${isToday ? "text-sky" : "text-white/30"}`}>{short}</p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-white/40">
          {sessions.length} séance{sessions.length > 1 ? "s" : ""} validée{sessions.length > 1 ? "s" : ""} cette semaine
        </p>
        {streak > 0 ? (
          <p className="text-xs font-black text-amber">
            {streak} sem.{streak > 1 ? "" : ""} d&apos;affilée 🔥
          </p>
        ) : null}
      </div>
    </section>
  );
}
