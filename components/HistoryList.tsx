"use client";

import { useMemo, useState } from "react";
import { AdaptationExplanationCard } from "@/components/AdaptationExplanation";
import { estimateCalories } from "@/lib/calories";
import { formatDateTime } from "@/lib/date";
import { useCoachStorage } from "@/lib/storage";
import { formatDurationLong } from "@/lib/time";
import type { EffortStatus, ProgressionDecision } from "@/types/training";

const statusLabels: Record<EffortStatus, string> = {
  ok: "OK",
  easy: "Facile",
  hard: "Trop dur",
  pain: "Douleur",
  skipped: "Pas fait"
};

const statusClasses: Record<EffortStatus, string> = {
  ok: "bg-sea/10 text-sea",
  easy: "bg-sea/10 text-sea",
  hard: "bg-coral/10 text-coral",
  pain: "bg-red-500/10 text-red-600",
  skipped: "bg-white/10 text-white/50"
};

const decisionTone: Record<"alerts" | "down" | "same" | "up", string> = {
  alerts: "border-coral/20 bg-coral/10 text-coral",
  down: "border-red-500/20 bg-red-500/10 text-red-600",
  same: "border-sky/20 bg-sky/10 text-sky",
  up: "border-sea/20 bg-sea/10 text-sea"
};

export function HistoryList() {
  const { currentProgram, history, isReady, settings } = useCoachStorage();
  const [openAdaptationSessionId, setOpenAdaptationSessionId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [showAllHistory, setShowAllHistory] = useState(false);
  const exerciseNames = useMemo(
    () => new Map(currentProgram.flatMap((session) => session.exercises.map((exercise) => [exercise.id, exercise.name]))),
    [currentProgram]
  );
  const visibleHistory = useMemo(
    () => (showAllHistory ? history : history.slice(0, 12)),
    [history, showAllHistory]
  );
  const prBySessionId = useMemo(
    () =>
      new Map(
        visibleHistory.map((session, sessionIndex) => [
          session.id,
          detectPRs(session, history.slice(sessionIndex + 1))
        ])
      ),
    [history, visibleHistory]
  );

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  if (history.length === 0) {
    return (
      <section className="card-dark p-5">
        <h2 className="text-xl font-black text-white">Aucune séance</h2>
        <p className="mt-2 text-sm font-semibold text-white/55">
          Les séances validées apparaîtront ici automatiquement.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {visibleHistory.map((session) => {
        const durationText =
          typeof session.totalDurationMs === "number" ? formatDurationLong(session.totalDurationMs) : undefined;
        const plannedSession = currentProgram.find((s) => s.id === session.sessionId);
        const calorieEstimate =
          plannedSession && session.totalDurationMs
            ? estimateCalories(plannedSession.intensity, settings.currentWeightKg, session.totalDurationMs)
            : undefined;
        const decisionSummary = countDecisionSummary(session.progressions ?? {});

        const prExerciseIds = prBySessionId.get(session.id) ?? new Set<string>();
        const logsExpanded = expandedLogs.has(session.id);

        return (
          <article className="card-dark p-4" key={session.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-moss">{formatDateTime(session.completedAt)}</p>
                <h2 className="mt-1 text-xl font-black leading-tight text-white">{session.title}</h2>
                <p className="text-sm font-semibold text-white/55">{session.focus}</p>
                {(durationText || prExerciseIds.size > 0) ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {durationText ? (
                      <span className="rounded-md bg-sky/10 px-3 py-2 text-sm font-black text-sky">
                        {durationText}
                      </span>
                    ) : null}
                    {calorieEstimate ? (
                      <span className="rounded-md bg-amber/10 px-3 py-2 text-sm font-black text-amber">
                        🔥 ~{Math.round((calorieEstimate.low + calorieEstimate.high) / 2)} kcal
                      </span>
                    ) : null}
                    {prExerciseIds.size > 0 ? (
                      <span className="rounded-md bg-sea/10 px-3 py-2 text-sm font-black text-sea">
                        🏆 {prExerciseIds.size} PR
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-2 text-sm font-bold text-white/60">
                  Difficulté {session.feedback?.difficulty ?? "-"} /10 - Douleur{" "}
                  {session.feedback?.globalPain ?? "-"} /10
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  <DecisionPill label="Hausse" tone="up" value={decisionSummary.up} />
                  <DecisionPill label="Stable" tone="same" value={decisionSummary.same} />
                  <DecisionPill label="Baisse" tone="down" value={decisionSummary.down} />
                  <DecisionPill label="Alertes" tone="alerts" value={decisionSummary.alerts} />
                </div>
              </div>
              <span className="rounded-md bg-white/8 px-3 py-2 text-sm font-black text-white">
                {Object.values(session.logs).filter((log) => log.status).length}
              </span>
            </div>

            <div className="mt-4 rounded-md bg-white/8 p-3">
              <p className="text-sm font-bold text-white/45">Exercices principaux</p>
              <p className="mt-1 font-black text-white">{session.mainExercises?.join(", ") || "Non renseigné"}</p>
            </div>

            <button
              className="mt-3 w-full rounded-md border border-white/8 bg-white/5 px-4 py-2.5 text-sm font-black text-white/60 transition hover:bg-white/10 hover:text-white"
              onClick={() =>
                setExpandedLogs((prev) => {
                  const next = new Set(prev);
                  if (next.has(session.id)) next.delete(session.id);
                  else next.add(session.id);
                  return next;
                })
              }
              type="button"
            >
              {logsExpanded
                ? "Masquer les exercices"
                : `Voir les ${Object.values(session.logs).length} exercices`}
            </button>

            {logsExpanded ? (
              <div className="mt-3 space-y-2">
                {Object.values(session.logs).map((log) => {
                  const progression = session.progressions?.[log.exerciseId];
                  const exerciseDuration =
                    session.exerciseDurationsMs?.[log.exerciseId] !== undefined
                      ? formatDurationLong(session.exerciseDurationsMs[log.exerciseId])
                      : undefined;
                  const status = log.status;
                  const isPR = prExerciseIds.has(log.exerciseId);

                  return (
                    <div className="rounded-md border border-white/8 bg-white/5 p-3" key={log.exerciseId}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-black leading-tight text-white">
                          {progression?.exerciseName ?? exerciseNames.get(log.exerciseId) ?? log.exerciseId}
                          {isPR ? <span className="ml-2 text-xs font-black text-sea">🏆 PR</span> : null}
                        </p>
                        <p
                          className={`shrink-0 rounded-md px-2 py-1 text-xs font-black ${
                            status ? statusClasses[status] : "bg-white/10 text-white/50"
                          }`}
                        >
                          {status ? statusLabels[status] : "Non noté"}
                        </p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white/55">
                        Charge {log.usedLoad || "-"} - Reps {log.completedReps || "-"}
                        {exerciseDuration ? ` - ${exerciseDuration}` : ""}
                      </p>
                      {progression ? (
                        <p className="mt-2 text-sm font-black text-sea">
                          Décision {formatDecision(progression.decision)} - {progression.nextLoad} -{" "}
                          {progression.nextTarget}
                        </p>
                      ) : null}
                      {log.comment ? <p className="mt-2 text-sm font-semibold text-white/65">{log.comment}</p> : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {session.aiCoach ? (
              <div className="mt-4 rounded-md border border-moss/20 bg-white/5 p-3">
                <p className="text-sm font-bold text-moss">IA</p>
                <p className="mt-1 font-black text-white">{session.aiCoach.summary}</p>
                {session.aiCoach.motivationalMessage ? (
                  <p className="mt-1 text-sm font-semibold text-white/65">{session.aiCoach.motivationalMessage}</p>
                ) : null}
              </div>
            ) : null}

            {session.adaptationExplanations &&
            Object.keys(session.adaptationExplanations).length > 0 ? (
              <div className="mt-4">
                <button
                  className="w-full rounded-md border border-sky/20 bg-sky/10 px-4 py-3 text-sm font-black text-sky shadow-sm"
                  onClick={() =>
                    setOpenAdaptationSessionId(
                      openAdaptationSessionId === session.id ? null : session.id
                    )
                  }
                  type="button"
                >
                  {openAdaptationSessionId === session.id
                    ? "Masquer les adaptations"
                    : "Voir les adaptations"}
                </button>
                {openAdaptationSessionId === session.id ? (
                  <div className="mt-3 space-y-3">
                    <p className="text-sm font-black text-sky">
                      Pourquoi le programme a évolué après cette séance
                    </p>
                    {Object.entries(session.adaptationExplanations).map(
                      ([exerciseId, summary]) => (
                        <AdaptationExplanationCard
                          confidence={summary.confidence}
                          exerciseName={
                            session.progressions?.[exerciseId]?.exerciseName ??
                            exerciseId
                          }
                          explanation={summary.explanation}
                          key={exerciseId}
                          violations={summary.violations}
                        />
                      )
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
      {!showAllHistory && history.length > visibleHistory.length ? (
        <button
          className="h-12 w-full rounded-md border border-white/10 bg-white/8 px-4 font-black text-white/70"
          onClick={() => setShowAllHistory(true)}
          type="button"
        >
          Afficher les {history.length - visibleHistory.length} seances plus anciennes
        </button>
      ) : null}
    </div>
  );
}

function DecisionPill({
  label,
  tone,
  value
}: {
  label: string;
  tone: "alerts" | "down" | "same" | "up";
  value: number;
}) {
  return (
    <div className={`rounded-md border px-2 py-2 text-center ${decisionTone[tone]}`}>
      <p className="text-lg font-black leading-none">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/55">{label}</p>
    </div>
  );
}

function countDecisionSummary(progressions: Record<string, { decision: ProgressionDecision; warning?: string }>) {
  return Object.values(progressions).reduce(
    (summary, progression) => {
      if (progression.decision === "augmenter") {
        summary.up += 1;
      } else if (progression.decision === "maintenir") {
        summary.same += 1;
      } else if (progression.decision === "baisser") {
        summary.down += 1;
      }

      if (progression.decision === "alerte" || progression.decision === "remplacer" || progression.warning) {
        summary.alerts += 1;
      }

      return summary;
    },
    { alerts: 0, down: 0, same: 0, up: 0 }
  );
}

function formatDecision(decision: ProgressionDecision): string {
  const labels: Record<ProgressionDecision, string> = {
    augmenter: "augmenter",
    maintenir: "maintenir",
    baisser: "baisser",
    remplacer: "remplacer",
    alerte: "alerte"
  };

  return labels[decision];
}

function parseLoadKg(value?: string): number | undefined {
  if (!value) return undefined;
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*kg/i) ?? value.match(/^(\d+(?:[,.]\d+)?)$/);
  return match ? Number(match[1].replace(",", ".")) : undefined;
}

function detectPRs(
  session: { logs: Record<string, { usedLoad: string }> },
  previousSessions: Array<{ logs: Record<string, { usedLoad: string }> }>
): Set<string> {
  const prs = new Set<string>();

  for (const [exerciseId, log] of Object.entries(session.logs)) {
    const currentLoad = parseLoadKg(log.usedLoad);
    if (currentLoad === undefined) continue;

    let prevMax = 0;
    for (const prevSession of previousSessions) {
      const prevLoad = parseLoadKg(prevSession.logs[exerciseId]?.usedLoad);
      if (prevLoad !== undefined && prevLoad > prevMax) prevMax = prevLoad;
    }

    if (prevMax > 0 && currentLoad > prevMax) {
      prs.add(exerciseId);
    }
  }

  return prs;
}
