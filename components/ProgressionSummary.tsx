"use client";

import { AdaptationExplanationSection } from "@/components/AdaptationExplanationSection";
import { formatDurationLong } from "@/lib/time";
import type { CompletedSession, ProgressionDecision } from "@/types/training";

const groups: Array<{ decisions: ProgressionDecision[]; title: string; tone: string }> = [
  { decisions: ["augmenter"], title: "Exercices augmentés", tone: "bg-amber/10 text-amber" },
  { decisions: ["maintenir"], title: "Exercices maintenus", tone: "bg-sky/10 text-sky" },
  { decisions: ["baisser"], title: "Exercices baissés", tone: "bg-coral/10 text-coral" },
  { decisions: ["remplacer", "alerte"], title: "Alertes douleur", tone: "bg-red-500/10 text-red-600" }
];

type ProgressionSummaryProps = {
  session: CompletedSession;
};

export function ProgressionSummary({ session }: ProgressionSummaryProps) {
  const progressions = Object.values(session.progressions ?? {});

  return (
    <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-moss">Résumé validé</p>
          <h2 className="mt-1 text-xl font-black">{session.title}</h2>
          {session.totalDurationMs ? (
            <p className="mt-1 text-sm font-black text-sky">
              Séance terminée en {formatDurationLong(session.totalDurationMs)}
            </p>
          ) : null}
          {session.calorieEstimate ? (
            <p className="mt-1 text-sm font-black text-amber">
              {session.calorieEstimate.label} : ~{session.calorieEstimate.calories} kcal
            </p>
          ) : null}
        </div>
        <span className="rounded-md bg-mist px-3 py-2 text-sm font-black">{session.feedback.difficulty}/10</span>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => {
          const items = progressions.filter((item) => group.decisions.includes(item.decision));

          return (
            <div className="rounded-md bg-mist p-3" key={group.title}>
              <h3 className={`inline-flex rounded-md px-2 py-1 text-sm font-black ${group.tone}`}>{group.title}</h3>
              {items.length === 0 ? <p className="mt-2 text-sm font-semibold text-ink/60">Aucun</p> : null}
              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <div className="border-t border-black/10 pt-2 first:border-t-0 first:pt-0" key={item.exerciseId}>
                    <p className="font-bold">{item.exerciseName}</p>
                    <p className="text-sm font-semibold text-ink/60">
                      {item.nextLoad} - {item.nextTarget}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink/70">{item.reason}</p>
                    {item.warning ? <p className="mt-1 text-sm font-black text-coral">{item.warning}</p> : null}
                    {item.replacementSuggestion ? (
                      <p className="mt-1 text-sm font-black text-coral">{item.replacementSuggestion}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <AdaptationExplanationSection compact progressions={session.progressions ?? {}} />
      </div>

      <div className="mt-4 rounded-md bg-ink p-3 text-white">
        <p className="text-sm font-bold text-white/70">Prochaine séance prévue</p>
        <p className="mt-1 text-lg font-black">{session.nextSessionTitle || "À venir"}</p>
      </div>

      {session.aiCoach ? (
        <div className="mt-4 rounded-md border border-moss/20 bg-white p-3">
          <p className="text-sm font-bold text-moss">Analyse IA</p>
          <p className="mt-1 font-black">{session.aiCoach.summary}</p>
          {session.aiCoach.warnings.length ? (
            <div className="mt-2 space-y-1">
              {session.aiCoach.warnings.map((warning) => (
                <p className="text-sm font-black text-coral" key={warning}>
                  {warning}
                </p>
              ))}
            </div>
          ) : null}
          {session.aiCoach.nextSessionAdjustments.length ? (
            <div className="mt-2 space-y-1">
              {session.aiCoach.nextSessionAdjustments.map((adjustment) => (
                <p className="text-sm font-semibold text-ink/70" key={adjustment}>
                  {adjustment}
                </p>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-sm font-black text-ink">{session.aiCoach.motivationalMessage}</p>
        </div>
      ) : null}
    </section>
  );
}
