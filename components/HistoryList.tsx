"use client";

import { formatDateTime } from "@/lib/date";
import { getConfidenceLabel, getLowConfidenceMessage, ruleExplanations } from "@/lib/explanations";
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
  skipped: "bg-mist text-ink/60"
};

const decisionTone: Record<"alerts" | "down" | "same" | "up", string> = {
  alerts: "border-coral/20 bg-coral/10 text-coral",
  down: "border-red-500/20 bg-red-500/10 text-red-600",
  same: "border-sky/20 bg-sky/10 text-sky",
  up: "border-sea/20 bg-sea/10 text-sea"
};

export function HistoryList() {
  const { currentProgram, history, isReady } = useCoachStorage();
  const exerciseNames = new Map(
    currentProgram.flatMap((session) => session.exercises.map((exercise) => [exercise.id, exercise.name]))
  );

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  if (history.length === 0) {
    return (
      <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
        <h2 className="text-xl font-black">Aucune séance</h2>
        <p className="mt-2 text-sm font-semibold text-ink/60">
          Les séances validées apparaîtront ici automatiquement.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((session) => {
        const durationText =
          typeof session.totalDurationMs === "number" ? formatDurationLong(session.totalDurationMs) : undefined;
        const decisionSummary = countDecisionSummary(session.progressions ?? {});

        return (
          <article className="rounded-lg border border-black/10 bg-white p-4 shadow-soft" key={session.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-moss">{formatDateTime(session.completedAt)}</p>
                <h2 className="mt-1 text-xl font-black leading-tight">{session.title}</h2>
                <p className="text-sm font-semibold text-ink/60">{session.focus}</p>
                {durationText ? (
                  <p className="mt-2 rounded-md bg-sky/10 px-3 py-2 text-sm font-black text-sky">
                    Séance terminée en {durationText}
                  </p>
                ) : null}
                {session.calorieEstimate ? (
                  <p className="mt-2 rounded-md bg-amber/10 px-3 py-2 text-sm font-black text-amber">
                    {session.calorieEstimate.label} : ~{session.calorieEstimate.calories} kcal
                  </p>
                ) : null}
                <p className="mt-2 text-sm font-bold text-ink/70">
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
              <span className="rounded-md bg-mist px-3 py-2 text-sm font-black">
                {Object.values(session.logs).filter((log) => log.status).length}
              </span>
            </div>

            <div className="mt-4 rounded-md bg-mist p-3">
              <p className="text-sm font-bold text-ink/60">Exercices principaux</p>
              <p className="mt-1 font-black">{session.mainExercises?.join(", ") || "Non renseigné"}</p>
            </div>

            <div className="mt-4 space-y-2">
              {Object.values(session.logs).map((log) => {
                const progression = session.progressions?.[log.exerciseId];
                const exerciseDuration =
                  session.exerciseDurationsMs?.[log.exerciseId] !== undefined
                    ? formatDurationLong(session.exerciseDurationsMs[log.exerciseId])
                    : undefined;
                const status = log.status;

                return (
                  <div className="rounded-md border border-black/10 bg-mist p-3" key={log.exerciseId}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black leading-tight">
                        {progression?.exerciseName ?? exerciseNames.get(log.exerciseId) ?? log.exerciseId}
                      </p>
                      <p
                        className={`shrink-0 rounded-md px-2 py-1 text-xs font-black ${
                          status ? statusClasses[status] : "bg-white text-ink/60"
                        }`}
                      >
                        {status ? statusLabels[status] : "Non noté"}
                      </p>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-ink/60">
                      Charge {log.usedLoad || "-"} - Reps {log.completedReps || "-"}
                      {exerciseDuration ? ` - ${exerciseDuration}` : ""}
                    </p>
                    {progression ? (
                      <div className="mt-2 rounded-md bg-white p-3">
                        <p className="text-sm font-black text-moss">
                          {progression.adaptationExplanation?.decisionLabel ?? formatDecision(progression.decision)} -{" "}
                          {progression.nextLoad} - {progression.nextTarget}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/70">
                          {progression.adaptationExplanation?.simpleReason ?? progression.reason}
                        </p>
                        {progression.adaptationExplanation ? (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm font-black text-sky">
                              Comprendre la regle
                            </summary>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/70">
                              {progression.adaptationExplanation.ruleApplied} -{" "}
                              {ruleExplanations[
                                progression.adaptationExplanation.ruleApplied as keyof typeof ruleExplanations
                              ] ?? progression.adaptationExplanation.whatUserShouldLearn}
                            </p>
                          </details>
                        ) : null}
                        <p className="mt-2 text-xs font-black uppercase text-ink/50">
                          Confiance {getConfidenceLabel(progression.confidence)}
                        </p>
                        {getLowConfidenceMessage(progression.confidence) ? (
                          <p className="mt-1 text-sm font-black text-coral">
                            {getLowConfidenceMessage(progression.confidence)}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {log.comment ? <p className="mt-2 text-sm font-semibold text-ink/70">{log.comment}</p> : null}
                  </div>
                );
              })}
            </div>

            {session.aiCoach ? (
              <div className="mt-4 rounded-md border border-moss/20 bg-white p-3">
                <p className="text-sm font-bold text-moss">IA</p>
                <p className="mt-1 font-black">{session.aiCoach.summary}</p>
                {session.aiCoach.motivationalMessage ? (
                  <p className="mt-1 text-sm font-semibold text-ink/70">{session.aiCoach.motivationalMessage}</p>
                ) : null}
              </div>
            ) : null}
          </article>
        );
      })}
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
      <p className="mt-1 text-[10px] font-black uppercase text-ink/60">{label}</p>
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
