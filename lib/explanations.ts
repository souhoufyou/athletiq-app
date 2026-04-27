import type {
  AdaptationExplanation,
  ProgressionConfidence,
  ProgressionDecision,
  ProgressionDecisionCode,
  ProgressionEvidenceTag
} from "@/types/training";

type ExplainableProgression = {
  decision: ProgressionDecision;
  decisionCode?: ProgressionDecisionCode;
  nextLoad: string;
  nextTarget: string;
  reason: string;
  warning?: string;
  confidence?: ProgressionConfidence;
  evidenceTag?: ProgressionEvidenceTag;
};

export const ruleExplanations = {
  "Surcharge progressive":
    "Pour progresser, on augmente progressivement la difficulte : charge, reps, duree ou intensite. On le fait petit a petit pour eviter de bruler les etapes.",
  "Double progression":
    "Sur les exercices en fourchette de reps, on augmente d'abord les repetitions. Quand toutes les series atteignent le haut de fourchette proprement, on augmente la charge.",
  "Surcharge progressive + double progression":
    "Quand toutes les repetitions sont validees proprement, l'app augmente legerement la difficulte. Sur les fourchettes de reps, elle remplit d'abord les reps avant la charge.",
  "Douleur prioritaire":
    "Une douleur passe avant la performance. L'app maintient, allege ou propose une alternative pour continuer sans aggraver le signal.",
  Consolidation:
    "Si une charge est trop dure, on la garde jusqu'a ce qu'elle devienne maitrisee. Progresser, ce n'est pas augmenter a chaque seance.",
  "Garde-fou judo":
    "Les jours proches du judo, l'app evite les jambes lourdes, le grip lourd et le cardio violent pour garder de la fraicheur.",
  "Garde-fou fatigue":
    "Quand sommeil, energie ou difficulte globale envoient un signal fort, l'app choisit une progression plus prudente.",
  Stagnation:
    "Si un exercice bloque plusieurs fois, l'app ajuste d'abord reps, repos, tempo ou variante proche avant de changer la structure.",
  "Volume hebdomadaire":
    "Le volume doit rester dans une zone utile. Ajouter des series quand le groupe est deja haut augmente surtout la fatigue.",
  "Garde-fou anti-derive":
    "L'app ne change pas la structure sans raison claire. Tant que la progression est saine, elle garde le plan stable."
} as const;

export function buildAdaptationExplanation(
  progression: ExplainableProgression,
  exerciseName: string
): AdaptationExplanation {
  const ruleApplied = getRuleApplied(progression);

  return {
    decisionLabel: getDecisionLabel(progression),
    simpleReason: getSimpleReason(progression),
    ruleApplied,
    whatUserShouldLearn: ruleExplanations[ruleApplied],
    nextSessionImpact: getNextSessionImpact(progression, exerciseName)
  };
}

export function getConfidenceLabel(confidence?: ProgressionConfidence): string {
  if (confidence === "high") return "elevee";
  if (confidence === "low") return "faible";
  return "moyenne";
}

export function getLowConfidenceMessage(confidence?: ProgressionConfidence): string | undefined {
  return confidence === "low" ? "Donnees insuffisantes : l'app choisit l'option la plus prudente." : undefined;
}

function getDecisionLabel(progression: ExplainableProgression): string {
  if (progression.decisionCode === "increase" || progression.decision === "augmenter") return "Charge augmentee";
  if (progression.decisionCode === "decrease" || progression.decision === "baisser") return "Charge allegee";
  if (progression.decisionCode === "replace" || progression.decision === "remplacer") return "Alternative proposee";
  if (progression.decisionCode === "watch" || progression.decision === "alerte") return "Progression suspendue";
  return "Charge maintenue";
}

function getRuleApplied(progression: ExplainableProgression): keyof typeof ruleExplanations {
  const text = normalize(`${progression.reason} ${progression.warning ?? ""}`);

  if (progression.evidenceTag === "pain_rule") return "Douleur prioritaire";
  if (progression.evidenceTag === "judo_rule") return "Garde-fou judo";
  if (progression.evidenceTag === "fatigue_rule") return "Garde-fou fatigue";
  if (progression.evidenceTag === "stagnation_rule") return "Stagnation";
  if (progression.evidenceTag === "volume_rule") return "Volume hebdomadaire";
  if (progression.evidenceTag === "guardrail_rule") return "Garde-fou anti-derive";
  if (progression.decision === "maintenir" && includesAny(text, ["trop dur", "difficile", "consolid"])) return "Consolidation";
  if (includesAny(text, ["double progression", "fourchette", "isolation"])) return "Double progression";
  if (includesAny(text, ["cardio", "intervalles", "round", "min"])) return "Surcharge progressive";

  return progression.decision === "augmenter" ? "Surcharge progressive + double progression" : "Consolidation";
}

function getSimpleReason(progression: ExplainableProgression): string {
  const text = normalize(`${progression.reason} ${progression.warning ?? ""}`);

  if (progression.evidenceTag === "pain_rule" || includesAny(text, ["douleur", "poignet", "genou", "epaule", "dos"])) {
    return "Une douleur ou un signal a ete indique.";
  }

  if (progression.evidenceTag === "judo_rule") {
    return "Le judo est proche, donc l'app evite d'ajouter de la fatigue inutile.";
  }

  if (progression.evidenceTag === "fatigue_rule") {
    return "La fatigue, l'energie ou le sommeil demandent une progression plus prudente.";
  }

  if (progression.evidenceTag === "volume_rule") {
    return "Le volume hebdomadaire est deja assez haut pour ce groupe musculaire.";
  }

  if (progression.evidenceTag === "stagnation_rule") {
    return "L'exercice bloque ou reste difficile sur plusieurs expositions.";
  }

  if (progression.decision === "augmenter") {
    return "Tu as valide la cible avec un signal favorable.";
  }

  if (progression.decision === "baisser") {
    return "La cible etait trop loin ou la fatigue etait trop haute.";
  }

  if (progression.decision === "remplacer" || progression.decision === "alerte") {
    return "L'app choisit la prudence avant de chercher la performance.";
  }

  if (includesAny(text, ["trop dur", "difficile"])) {
    return "Tu as termine l'exercice, mais il etait encore dur.";
  }

  return "La meilleure option est de consolider avant de changer.";
}

function getNextSessionImpact(progression: ExplainableProgression, exerciseName: string): string {
  if (progression.decision === "augmenter") {
    return `Prochaine seance : ${exerciseName} ${progression.nextLoad} au lieu de la charge actuelle.`;
  }

  if (progression.decision === "maintenir") {
    return `Prochaine seance : ${exerciseName} ${progression.nextLoad}, objectif meilleure execution.`;
  }

  if (progression.decision === "baisser") {
    return `Prochaine seance : ${exerciseName} ${progression.nextLoad}, cible ${progression.nextTarget}.`;
  }

  if (progression.decision === "remplacer") {
    return `Prochaine seance : alternative possible pour ${exerciseName}, sans compter ca comme un echec.`;
  }

  return `Prochaine seance : ${exerciseName} sous surveillance, progression suspendue.`;
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(normalize(needle)));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ");
}
