"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Onboarding } from "@/components/Onboarding";
import { formatLongDate } from "@/lib/date";
import { dailyJudoLabels, getDailyJudoAdvice, getGoalPlanSummary, getGoalPriorities, goalLabels } from "@/lib/personalization";
import { useCoachStorage } from "@/lib/storage";
import type { CompletedSession, DailyJudoChoice, Weekday } from "@/types/training";

export function Dashboard() {
  const {
    activeSession,
    dateKey,
    history,
    isReady,
    nextSession,
    setDailyJudoChoice,
    setSettings,
    settings,
    startSession,
    todaySession,
    todaysCompletedSession
  } = useCoachStorage();
  const router = useRouter();
  const latest = history[0];
  const activeToday = activeSession?.dateKey === dateKey && activeSession.sessionId === todaySession.id;
  const weeklySessions = getSessionsThisWeek(history);
  const cardioDone = countCardioThisWeek(weeklySessions);
  const benchPerformance = getLastBenchPerformance(history);
  const judoTonight = settings.judoDays.includes(getTodayWeekday());
  const dailyChoice = settings.dailyJudoChoiceDateKey === dateKey ? settings.dailyJudoChoice : "judo";
  const effectiveJudoTonight = judoTonight && dailyChoice === "judo";
  const goalSummary = getGoalPlanSummary(settings);
  const priorities = getGoalPriorities(settings.mainObjective);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  if (!settings.onboardingCompleted) {
    return <Onboarding setSettings={setSettings} settings={settings} />;
  }

  const todayStatus = todaysCompletedSession ? "Validee" : activeToday ? "En cours" : "Pret";
  const ctaLabel = todaysCompletedSession ? "Resume" : activeToday ? "Reprendre" : "Commencer";

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-2xl border border-white/10 premium-gradient text-white shadow-soft">
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-black uppercase text-white/55">{formatLongDate()}</p>
          <h2 className="mt-1 text-xl font-black leading-tight">Salut {settings.athleteName}</h2>
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase text-sky">Aujourd&apos;hui</p>
              <h3 className="athletiq-hero-title mt-2 font-black">{todaySession.title}</h3>
              <p className="mt-3 line-clamp-2 text-sm font-semibold text-white/70">{todaySession.focus}</p>
            </div>
            <span className="rounded-md border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white">
              {todayStatus}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <DashboardPill label="Exos" value={String(todaySession.exercises.length)} />
            <DashboardPill label="Temps" value={todaySession.duration} />
            <DashboardPill label="Judo" value={effectiveJudoTonight ? "Oui" : "Non"} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              className="flex h-16 items-center justify-center rounded-md border border-white/15 bg-white/10 px-4 text-center text-base font-black text-white"
              href="/programme"
            >
              Detail
            </Link>
            <button
              className="h-16 rounded-md premium-action px-4 text-base font-black"
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

          <div className="mt-4 space-y-2">
            {todaySession.exercises.slice(0, 3).map((exercise, index) => (
              <div className="rounded-md bg-white/10 p-3" key={exercise.id}>
                <p className="text-xs font-black uppercase text-white/50">Bloc {index + 1}</p>
                <p className="mt-1 line-clamp-1 font-black">
                  {exercise.name}
                  {exercise.plannedLoad ? ` - ${exercise.plannedLoad}` : ""}
                </p>
                <p className="mt-1 text-sm font-semibold text-white/65">{exercise.target}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Prochaine" value={nextSession.session.title} tone="info" />
        <MetricCard label="Objectif" value={goalLabels[settings.mainObjective]} tone="warn" />
        <MetricCard label="Semaine" value={String(weeklySessions.length)} tone="calm" />
        <MetricCard label="Cardio" value={cardioDone} tone="info" />
        <div className="col-span-2">
          <MetricCard label="Dernier bench" value={benchPerformance} tone="warn" />
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
        <p className="text-xs font-black uppercase text-sky">Ajustement rapide</p>
        <h2 className="mt-1 text-xl font-black">Judo du jour</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(["judo", "no_judo", "replace_cardio", "strength_only"] as DailyJudoChoice[]).map((choice) => (
            <button
              className={`min-h-16 rounded-md border px-3 text-left text-sm font-black leading-tight ${
                dailyChoice === choice ? "border-sky bg-sky/10 text-sky" : "border-black/10 bg-mist text-ink/70"
              }`}
              key={choice}
              onClick={() => setDailyJudoChoice(choice)}
              type="button"
            >
              {dailyJudoLabels[choice]}
            </button>
          ))}
        </div>
        <p className="mt-3 rounded-md bg-mist p-3 text-sm font-semibold text-ink/70">
          {getDailyJudoAdvice(settings, dateKey)}
        </p>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
        <p className="text-xs font-black uppercase text-sky">Priorites</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniMetric label="Muscu" value={goalSummary.volume} />
          <MiniMetric label="Cardio" value={goalSummary.cardio} />
          <MiniMetric label="Rythme" value={goalSummary.frequency} />
          <MiniMetric label="Style" value={goalSummary.progression} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {priorities.map((priority) => (
            <span className="rounded-md bg-sky/10 px-2 py-1 text-xs font-black text-sky" key={priority}>
              {priority}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
        <p className="text-xs font-black uppercase text-sky">A venir</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{nextSession.session.title}</h2>
            <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink/60">{nextSession.session.focus}</p>
          </div>
          <span className="rounded-md bg-sky/10 px-3 py-2 text-xs font-black text-sky">
            {nextSession.session.duration}
          </span>
        </div>
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Historique</h2>
            <p className="mt-1 text-sm font-semibold text-ink/60">
              {latest
                ? `${latest.title} - ${Object.values(latest.logs).filter((log) => log.status).length} exos`
                : "Aucune seance validee."}
            </p>
          </div>
          <Link className="rounded-md bg-mist px-4 py-3 text-sm font-black text-ink" href="/historique">
            Voir
          </Link>
        </div>
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

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-mist p-3">
      <p className="text-[10px] font-black uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-sm font-black leading-tight">{value}</p>
    </div>
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
      <p className="text-xs font-black uppercase text-ink/60">{label}</p>
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

function getLastBenchPerformance(history: CompletedSession[]) {
  for (const session of history) {
    const bench = Object.values(session.progressions ?? {}).find((progression) =>
      /bench|couche|couch/i.test(progression.exerciseName)
    );

    if (bench) {
      const log = session.logs[bench.exerciseId];
      return `${log?.usedLoad || "-"} - ${log?.completedReps || "-"}`;
    }
  }

  return "Non renseigne";
}

function getTodayWeekday(): Weekday {
  const weekdays: Weekday[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  return weekdays[new Date().getDay()];
}
