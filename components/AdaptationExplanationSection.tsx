import {
  getConfidenceLabel,
  getLowConfidenceMessage,
  ruleExplanations
} from "@/lib/explanations";
import type { ExerciseProgressionLog, ProgressionDecisionCode } from "@/types/training";

type AdaptationGroup = {
  key: string;
  title: string;
  tone: string;
  match: (item: ExerciseProgressionLog) => boolean;
};

const groups: AdaptationGroup[] = [
  {
    key: "increased",
    title: "Exercices augmentes",
    tone: "border-amber/20 bg-amber/10 text-amber",
    match: (item) => item.decisionCode === "increase" || item.decision === "augmenter"
  },
  {
    key: "maintained",
    title: "Exercices maintenus",
    tone: "border-sky/20 bg-sky/10 text-sky",
    match: (item) =>
      (item.decisionCode === "maintain" || item.decision === "maintenir") && !item.warning
  },
  {
    key: "decreased",
    title: "Exercices baisses",
    tone: "border-coral/20 bg-coral/10 text-coral",
    match: (item) => item.decisionCode === "decrease" || item.decision === "baisser"
  },
  {
    key: "replaced",
    title: "Exercices remplaces",
    tone: "border-red-500/20 bg-red-500/10 text-red-600",
    match: (item) => item.decisionCode === "replace" || item.decision === "remplacer"
  },
  {
    key: "watch",
    title: "Exercices a surveiller",
    tone: "border-coral/20 bg-coral/10 text-coral",
    match: (item) =>
      item.decision !== "remplacer" &&
      (item.decisionCode === "watch" ||
        item.decisionCode === "deload" ||
        item.decision === "alerte" ||
        Boolean(item.warning))
  }
];

export function AdaptationExplanationSection({
  compact = false,
  progressions,
  title = "Pourquoi ton programme evolue ?"
}: {
  compact?: boolean;
  progressions: Record<string, ExerciseProgressionLog>;
  title?: string;
}) {
  const items = Object.values(progressions);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
      <div>
        <p className="text-sm font-black uppercase text-sky">Adaptations</p>
        <h3 className="mt-1 text-xl font-black leading-tight">{title}</h3>
      </div>

      <div className="mt-4 space-y-3">
        {groups.map((group) => {
          const groupItems = items.filter(group.match);

          if (!groupItems.length) {
            return null;
          }

          return (
            <div className={`rounded-lg border p-3 ${group.tone}`} key={group.key}>
              <h4 className="text-sm font-black text-ink">{group.title}</h4>
              <div className="mt-3 space-y-2">
                {groupItems.map((item) => (
                  <AdaptationCard compact={compact} item={item} key={`${group.key}-${item.exerciseId}`} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AdaptationCard({ compact, item }: { compact: boolean; item: ExerciseProgressionLog }) {
  const explanation = item.adaptationExplanation;
  const confidence = getConfidenceLabel(item.confidence);
  const lowConfidenceMessage = getLowConfidenceMessage(item.confidence);
  const ruleApplied = explanation?.ruleApplied ?? getFallbackRule(item.decisionCode);
  const ruleDetail = ruleExplanations[ruleApplied as keyof typeof ruleExplanations];

  return (
    <article className="rounded-md bg-white/85 p-3 text-ink">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-black leading-tight">{item.exerciseName}</p>
          <p className="mt-1 text-sm font-black text-ink/70">
            {explanation?.decisionLabel ?? getFallbackDecisionLabel(item.decisionCode)}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-mist px-2 py-1 text-[11px] font-black text-ink/65">
          {confidence}
        </span>
      </div>

      <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/70">
        {explanation?.simpleReason ?? item.reason}
      </p>
      <p className="mt-2 text-sm font-black text-sky">{ruleApplied}</p>
      <p className="mt-1 text-sm font-semibold text-ink/65">
        Prochaine cible : {item.nextLoad} - {item.nextTarget}
      </p>
      {lowConfidenceMessage ? <p className="mt-2 text-sm font-black text-coral">{lowConfidenceMessage}</p> : null}

      {!compact && ruleDetail ? (
        <details className="mt-2 rounded-md bg-mist px-3 py-2">
          <summary className="cursor-pointer text-sm font-black text-ink">Comprendre la regle</summary>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/70">
            {explanation?.whatUserShouldLearn ?? ruleDetail}
          </p>
          {explanation?.nextSessionImpact ? (
            <p className="mt-2 text-sm font-black text-ink">{explanation.nextSessionImpact}</p>
          ) : null}
        </details>
      ) : null}
    </article>
  );
}

function getFallbackRule(decisionCode?: ProgressionDecisionCode): keyof typeof ruleExplanations {
  if (decisionCode === "increase") return "Surcharge progressive";
  if (decisionCode === "decrease") return "Consolidation";
  if (decisionCode === "replace" || decisionCode === "watch") return "Douleur prioritaire";
  return "Consolidation";
}

function getFallbackDecisionLabel(decisionCode?: ProgressionDecisionCode): string {
  if (decisionCode === "increase") return "Charge augmentee";
  if (decisionCode === "decrease") return "Charge allegee";
  if (decisionCode === "replace") return "Alternative proposee";
  if (decisionCode === "watch") return "Progression suspendue";
  return "Charge maintenue";
}
