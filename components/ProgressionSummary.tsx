"use client";

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
    <section className="card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white/55">Résumé validé</p>
          <h2 className="mt-1 text-xl font-black text-white">{session.title}</h2>
          {session.totalDurationMs ? (
            <p className="mt-1 text-sm font-black text-sky">
              Séance terminée en {formatDurationLong(session.totalDurationMs)}
            </p>
          ) : null}
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-sm font-black text-white">{session.feedback.difficulty}/10</span>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => {
          const items = progressions.filter((item) => group.decisions.includes(item.decision));

          return (
            <div className="rounded-md bg-white/8 p-3" key={group.title}>
              <h3 className={`inline-flex rounded-md px-2 py-1 text-sm font-black ${group.tone}`}>{group.title}</h3>
              {items.length === 0 ? <p className="mt-2 text-sm font-semibold text-white/55">Aucun</p> : null}
              <div className="mt-2 space-y-2">
                {items.map((item) => (
                  <div className="border-t border-white/10 pt-2 first:border-t-0 first:pt-0" key={item.exerciseId}>
                    <p className="font-bold text-white">{item.exerciseName}</p>
                    <p className="text-sm font-semibold text-white/55">
                      {item.nextLoad} - {item.nextTarget}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white/65">{item.reason}</p>
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

      <div className="mt-4 rounded-md bg-white/8 p-3">
        <p className="text-sm font-bold text-white/55">Prochaine séance prévue</p>
        <p className="mt-1 text-lg font-black text-white">{session.nextSessionTitle || "À venir"}</p>
      </div>

      {session.aiCoach ? (
        <div className="mt-4 rounded-md border border-sky/20 bg-sky/5 p-3">
          <p className="text-sm font-bold text-sky">Analyse IA</p>
          <p className="mt-1 font-black text-white">{session.aiCoach.summary}</p>
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
                <p className="text-sm font-semibold text-white/65" key={adjustment}>
                  {adjustment}
                </p>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-sm font-black text-white">{session.aiCoach.motivationalMessage}</p>
        </div>
      ) : null}
    </section>
  );
}
