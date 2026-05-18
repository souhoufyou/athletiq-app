import type {
  AdaptationExplanation,
  ExerciseHistoryPoint,
  ExerciseClassification,
  MuscleGroup,
  ProgressionDecision
} from "@/types/training";

// Re-export so consumers only need to import from one place
export type { AdaptationExplanation, ExerciseClassification, MuscleGroup };

// ---------------------------------------------------------------------------
// Core classification types
// ---------------------------------------------------------------------------

export type ExerciseKind =
  | "bench"
  | "upper-machine"
  | "leg-machine"
  | "isolation"
  | "cardio"
  | "hinge"
  | "other";

// ---------------------------------------------------------------------------
// Guardrail result types
// ---------------------------------------------------------------------------

export type ConfidenceLevel = "élevé" | "moyen" | "faible";

export type GuardrailViolation = {
  rule: string;
  reason: string;
  severity: "block" | "warn";
};

export type GuardrailInput = {
  exerciseId: string;
  exerciseName: string;
  exerciseKind: ExerciseKind;
  muscleGroups: MuscleGroup[];
  proposedDecision: ProgressionDecision;
  proposedLoad?: string;
  currentLoad?: string;
  recentHistory: ExerciseHistoryPoint[];
  weeklySetsByMuscle: Record<MuscleGroup, number>;
  sessionRPE: number;
  judoTonight: boolean;
  judoTomorrow: boolean;
  weeksSinceLastChange: number;
  hasNewPain: boolean;
  painKeywords: string[];
};

export type GuardrailResult = {
  allowed: boolean;
  adjustedDecision: ProgressionDecision;
  adjustedLoad?: string;
  confidence: ConfidenceLevel;
  explanation: AdaptationExplanation;
  violations: GuardrailViolation[];
};

// ---------------------------------------------------------------------------
// Weekly volume targets (sets per muscle group per week)
// ---------------------------------------------------------------------------

export type WeeklyVolumeTarget = {
  muscleGroup: MuscleGroup;
  minSets: number;
  maxSets: number;
};

export const WEEKLY_VOLUME_TARGETS: WeeklyVolumeTarget[] = [
  { muscleGroup: "pectoraux", minSets: 12, maxSets: 20 },
  { muscleGroup: "dos",       minSets: 14, maxSets: 22 },
  { muscleGroup: "epaules",   minSets: 12, maxSets: 20 },
  { muscleGroup: "biceps",    minSets: 8,  maxSets: 14 },
  { muscleGroup: "triceps",   minSets: 8,  maxSets: 14 },
  { muscleGroup: "jambes",    minSets: 14, maxSets: 20 },
  { muscleGroup: "abdos",     minSets: 8,  maxSets: 16 },
  { muscleGroup: "cardio",    minSets: 3,  maxSets: 5  },
];

// ---------------------------------------------------------------------------
// Progression caps
// ---------------------------------------------------------------------------

/** Maximum load increase allowed per week (percentage) */
export const MAX_LOAD_INCREASE_PERCENT = 5;

/** Maximum absolute load increase for most exercises (kg) */
export const MAX_ABSOLUTE_INCREASE_KG = 2.5;

/** Maximum absolute load increase for big compound lifts (squat, deadlift, etc.) */
export const MAX_ABSOLUTE_INCREASE_KG_BIG = 5;

/** Maximum load decrease allowed per adjustment */
export const MAX_LOAD_DECREASE_PERCENT = 10;

/** Minimum weeks at current load before an increase is allowed */
export const MIN_WEEKS_BEFORE_PROGRESSION = 2;

/** RPE above which fatigue is considered critical */
export const HIGH_RPE_THRESHOLD = 8.5;

// ---------------------------------------------------------------------------
// Exercise keyword lists for judo-day rules
// ---------------------------------------------------------------------------

/** Exercise name fragments to avoid before a judo session (grip-intensive) */
export const JUDO_GRIP_EXERCISES: string[] = [
  "tirage",
  "rowing",
  "curl",
  "pronation",
  "supination",
  "avant-bras",
  "farmer",
  "shrug",
  "traction",
];

/** Exercise name fragments to avoid before a judo session (lower-body / hip-intensive) */
export const JUDO_LOWER_EXERCISES: string[] = [
  "squat",
  "leg press",
  "deadlift",
  "soulevé",
  "fente",
  "hip thrust",
  "mollet",
  "leg curl",
  "leg extension",
  "rdl",
  "good morning",
];

// ---------------------------------------------------------------------------
// Pain / safety keywords
// ---------------------------------------------------------------------------

export const PAIN_KEYWORDS: string[] = [
  "douleur",
  "mal",
  "blesse",
  "blessure",
  "gene",
  "gêne",
  "inconfort",
  "vertige",
  "malaise",
  "brule",
  "brûle",
  "contracture",
  "claquage",
  "choc",
  "nausee",
  "nausée",
  "vision",
  "oppression",
  "crampe",
  "tiraillement",
];

// ===========================================================================
// Internal helpers
// ===========================================================================

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/'/g, " ")
    .trim();
}

function containsKeyword(text: string, keywords: string[]): boolean {
  const normalized = normalizeText(text);
  return keywords.some((kw) => normalized.includes(normalizeText(kw)));
}

function parseLoadKg(value?: string): { value?: number; prefix: string } {
  if (!value) return { prefix: "" };
  const kgMatch = value.match(/^(.*?)(\d+(?:[,.]\d+)?)\s*kg/i);
  if (kgMatch) {
    return {
      value: Number(kgMatch[2].replace(",", ".")),
      prefix: kgMatch[1].trimEnd(),
    };
  }
  const numMatch = value.match(/(\d+(?:[,.]\d+)?)/);
  if (numMatch) {
    return { value: Number(numMatch[1].replace(",", ".")), prefix: "" };
  }
  return { prefix: "" };
}

function formatLoadKg(value: number, prefix = ""): string {
  const formatted = Number.isInteger(value)
    ? String(value)
    : value.toFixed(1).replace(".", ",");
  return `${prefix ? `${prefix} ` : ""}${formatted} kg`;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

const BIG_COMPOUND_KEYWORDS = [
  "squat",
  "deadlift",
  "souleve de terre",
  "leg press",
  "developpe couche",
  "bench press",
];

function isBigCompoundLift(name: string): boolean {
  const t = normalizeText(name);
  return BIG_COMPOUND_KEYWORDS.some((k) => t.includes(k));
}

function maxSetsForMuscle(group: MuscleGroup): number {
  const target = WEEKLY_VOLUME_TARGETS.find((x) => x.muscleGroup === group);
  return target?.maxSets ?? Number.POSITIVE_INFINITY;
}

function avgRecentRPE(history: GuardrailInput["recentHistory"], n: number): number {
  if (history.length === 0) return 0;
  const recent = history.slice(0, n);
  if (recent.length === 0) return 0;
  return recent.reduce((sum, h) => sum + (h.rpe || 0), 0) / recent.length;
}

/**
 * Severity ranking — used to ensure guardrails never *downgrade* an already
 * conservative decision (e.g. don't soften "alerte" to "maintenir").
 * Higher rank = more conservative.
 */
function severityRank(decision: ProgressionDecision): number {
  switch (decision) {
    case "augmenter":
      return 0;
    case "maintenir":
      return 1;
    case "baisser":
      return 2;
    case "remplacer":
      return 3;
    case "alerte":
      return 4;
    default:
      return 1;
  }
}

function defaultDecisionLabel(
  decision: ProgressionDecision,
  load?: string
): string {
  switch (decision) {
    case "augmenter":
      return load ? `Augmentation à ${load}` : "Augmentation";
    case "maintenir":
      return "Maintien de la charge";
    case "baisser":
      return load ? `Diminution à ${load}` : "Diminution de la charge";
    case "remplacer":
      return "Remplacement de l'exercice";
    case "alerte":
      return "Alerte sécurité";
    default:
      return "Maintien de la charge";
  }
}

// ===========================================================================
// applyGuardrails — main safety net
// ===========================================================================

export function applyGuardrails(input: GuardrailInput): GuardrailResult {
  const violations: GuardrailViolation[] = [];
  let adjustedDecision: ProgressionDecision = input.proposedDecision;
  let adjustedLoad: string | undefined = input.proposedLoad;

  // Default explanation — overridden by the first block-rule that fires.
  let explanation: AdaptationExplanation = {
    decision: defaultDecisionLabel(input.proposedDecision, input.proposedLoad),
    raison: "Aucun signal d'alarme détecté — progression normale.",
    regleAppliquee: "Progression standard",
    ceQueDevraisComprendre:
      "Tes signaux récents (douleur, fatigue, judo, volume) permettent d'appliquer la décision proposée.",
    impact: "",
  };
  let primaryExplanationSet = false;

  const setPrimaryExplanation = (next: AdaptationExplanation) => {
    if (!primaryExplanationSet) {
      explanation = next;
      primaryExplanationSet = true;
    }
  };

  const exerciseNameLower = normalizeText(input.exerciseName);
  const isGripExercise = JUDO_GRIP_EXERCISES.some((kw) =>
    exerciseNameLower.includes(normalizeText(kw))
  );
  const isLowerExercise = JUDO_LOWER_EXERCISES.some((kw) =>
    exerciseNameLower.includes(normalizeText(kw))
  );

  // -------------------------------------------------------------------------
  // RÈGLE 1 — Douleur / blessure (block)
  // -------------------------------------------------------------------------
  const painDetected =
    input.hasNewPain ||
    input.painKeywords.some((src) => containsKeyword(src, PAIN_KEYWORDS));

  if (painDetected) {
    if (severityRank(adjustedDecision) < severityRank("maintenir")) {
      adjustedDecision = "maintenir";
      adjustedLoad = input.currentLoad;
    }
    setPrimaryExplanation({
      decision: "Maintien de la charge",
      raison: "Signal de douleur détecté dans tes retours",
      regleAppliquee: "Règle sécurité absolue : aucune progression sur douleur",
      ceQueDevraisComprendre:
        "La douleur est un signal d'alarme. Progrès ≠ souffrance. On maintient, on surveille, on adapte la prochaine fois.",
      impact: "Toute progression est suspendue jusqu'à disparition du signal.",
    });
    violations.push({
      rule: "pain-block",
      reason: "Douleur ou inconfort signalé",
      severity: "block",
    });
  }

  // -------------------------------------------------------------------------
  // RÈGLE 2 — Judo le soir même (block sur grip/jambes si augmentation)
  // -------------------------------------------------------------------------
  if (input.judoTonight && (isGripExercise || isLowerExercise)) {
    if (input.proposedDecision === "augmenter") {
      if (severityRank(adjustedDecision) < severityRank("maintenir")) {
        adjustedDecision = "maintenir";
        adjustedLoad = input.currentLoad;
      }
      setPrimaryExplanation({
        decision: "Maintien de la charge",
        raison: "Judo prévu ce soir — préserver la fraîcheur neuromusculaire",
        regleAppliquee:
          "Règle judo : pas d'augmentation de charge les jours de judo sur les muscles sollicités",
        ceQueDevraisComprendre:
          "Le judo sollicite intensément les jambes/hanches et le grip. Augmenter la charge avant le tatami compromet la performance et la récupération.",
        impact: "On reprendra la progression sur la prochaine séance non-judo.",
      });
      violations.push({
        rule: "judo-tonight",
        reason: "Judo le soir même — pas de hausse sur grip/jambes",
        severity: "block",
      });
    } else {
      violations.push({
        rule: "judo-tonight-soft",
        reason: "Judo ce soir — exécution avec marge sur les muscles sollicités",
        severity: "warn",
      });
    }
  }

  // -------------------------------------------------------------------------
  // RÈGLE 3 — Judo demain (warn)
  // -------------------------------------------------------------------------
  if (
    input.judoTomorrow &&
    isLowerExercise &&
    input.proposedDecision === "augmenter"
  ) {
    violations.push({
      rule: "judo-tomorrow",
      reason: "Judo demain — augmentation risquée pour la récupération",
      severity: "warn",
    });
  }

  // -------------------------------------------------------------------------
  // RÈGLE 4 — Stabilité minimale (block)
  // -------------------------------------------------------------------------
  if (
    input.weeksSinceLastChange < MIN_WEEKS_BEFORE_PROGRESSION &&
    input.proposedDecision === "augmenter"
  ) {
    if (severityRank(adjustedDecision) < severityRank("maintenir")) {
      adjustedDecision = "maintenir";
      adjustedLoad = input.currentLoad;
    }
    setPrimaryExplanation({
      decision: "Maintien de la charge",
      raison: `Dernière modification il y a ${input.weeksSinceLastChange} semaine(s) — attendre au moins ${MIN_WEEKS_BEFORE_PROGRESSION} semaines`,
      regleAppliquee:
        "Règle de stabilité : laisser le corps s'adapter avant de progresser",
      ceQueDevraisComprendre:
        "La surcompensation prend 10-14 jours. Changer trop vite empêche l'adaptation réelle.",
      impact: `Progression possible dans ${Math.max(
        0,
        MIN_WEEKS_BEFORE_PROGRESSION - input.weeksSinceLastChange
      )} semaine(s).`,
    });
    violations.push({
      rule: "stability-min",
      reason: `Stabilité insuffisante (${input.weeksSinceLastChange} < ${MIN_WEEKS_BEFORE_PROGRESSION} semaines)`,
      severity: "block",
    });
  }

  // -------------------------------------------------------------------------
  // RÈGLE 5 — Cap de progression de charge (warn, plafonne la charge)
  // -------------------------------------------------------------------------
  if (adjustedDecision === "augmenter" && adjustedLoad && input.currentLoad) {
    const proposed = parseLoadKg(adjustedLoad);
    const current = parseLoadKg(input.currentLoad);

    if (
      proposed.value !== undefined &&
      current.value !== undefined &&
      current.value > 0
    ) {
      const increaseKg = proposed.value - current.value;
      const increasePct = (increaseKg / current.value) * 100;
      const maxKg = isBigCompoundLift(input.exerciseName)
        ? MAX_ABSOLUTE_INCREASE_KG_BIG
        : MAX_ABSOLUTE_INCREASE_KG;

      const exceedsPct = increasePct > MAX_LOAD_INCREASE_PERCENT;
      const exceedsKg = increaseKg > maxKg;

      if (exceedsPct || exceedsKg) {
        const cappedByPct = current.value * (1 + MAX_LOAD_INCREASE_PERCENT / 100);
        const cappedByKg = current.value + maxKg;
        const capped = roundToHalf(Math.min(cappedByPct, cappedByKg));
        adjustedLoad = formatLoadKg(capped, current.prefix);
        violations.push({
          rule: "load-increase-cap",
          reason: `Augmentation plafonnée à +${MAX_LOAD_INCREASE_PERCENT}% max (proposée : +${increasePct.toFixed(1)}%)`,
          severity: "warn",
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // RÈGLE 6 — Cap de décharge (warn)
  // -------------------------------------------------------------------------
  if (adjustedDecision === "baisser" && adjustedLoad && input.currentLoad) {
    const proposed = parseLoadKg(adjustedLoad);
    const current = parseLoadKg(input.currentLoad);

    if (
      proposed.value !== undefined &&
      current.value !== undefined &&
      current.value > 0
    ) {
      const decreaseKg = current.value - proposed.value;
      const decreasePct = (decreaseKg / current.value) * 100;

      if (decreasePct > MAX_LOAD_DECREASE_PERCENT) {
        const capped = roundToHalf(
          current.value * (1 - MAX_LOAD_DECREASE_PERCENT / 100)
        );
        adjustedLoad = formatLoadKg(capped, current.prefix);
        violations.push({
          rule: "load-decrease-cap",
          reason: `Décharge limitée à -${MAX_LOAD_DECREASE_PERCENT}% max pour éviter la régression excessive`,
          severity: "warn",
        });
      }
    }
  }

  // -------------------------------------------------------------------------
  // RÈGLE 7 — RPE élevé chronique (warn)
  // -------------------------------------------------------------------------
  const recentRPE = avgRecentRPE(input.recentHistory, 2);
  const highRPEDetected =
    recentRPE > HIGH_RPE_THRESHOLD &&
    input.proposedDecision === "augmenter";

  if (highRPEDetected) {
    setPrimaryExplanation({
      decision: defaultDecisionLabel(adjustedDecision, adjustedLoad),
      raison: "RPE moyen élevé sur les dernières séances",
      regleAppliquee:
        "Règle fatigue : haute charge interne accumulée → progression suspendue",
      ceQueDevraisComprendre:
        "Un RPE chroniquement élevé indique une fatigue accumulée. Maintenir permet au corps de récupérer et de progresser ensuite.",
      impact:
        "Surveille ta récupération et ton sommeil sur les 7 prochains jours.",
    });
    violations.push({
      rule: "high-rpe",
      reason: `RPE moyen ${recentRPE.toFixed(1)} > ${HIGH_RPE_THRESHOLD}`,
      severity: "warn",
    });
  }

  // -------------------------------------------------------------------------
  // RÈGLE 8 — Volume hebdomadaire (warn)
  // -------------------------------------------------------------------------
  for (const muscle of input.muscleGroups) {
    const currentSets = input.weeklySetsByMuscle[muscle] ?? 0;
    const max = maxSetsForMuscle(muscle);

    if (currentSets > max && input.proposedDecision === "augmenter") {
      if (severityRank(adjustedDecision) < severityRank("maintenir")) {
        adjustedDecision = "maintenir";
        adjustedLoad = input.currentLoad;
      }
      setPrimaryExplanation({
        decision: "Maintien de la charge",
        raison: `Volume hebdomadaire ${muscle} déjà au maximum`,
        regleAppliquee: `Règle de volume : maximum ${max} séries / semaine pour ${muscle}`,
        ceQueDevraisComprendre:
          "Au-delà du volume cible, le bénéfice diminue et le risque de blessure augmente. On consolide avant d'ajouter.",
        impact: "Le volume sera ajusté en début de semaine prochaine.",
      });
      violations.push({
        rule: "weekly-volume-cap",
        reason: `Volume ${muscle} déjà au maximum (${currentSets} séries — cible ${max})`,
        severity: "warn",
      });
    }
  }

  // -------------------------------------------------------------------------
  // RÈGLE 9 — Stagnation prolongée (warn)
  // -------------------------------------------------------------------------
  if (Number.isFinite(input.weeksSinceLastChange) && input.weeksSinceLastChange >= 6 && input.proposedDecision === "maintenir") {
    violations.push({
      rule: "stagnation",
      reason: `Stagnation de ${Math.round(input.weeksSinceLastChange)} semaines — envisager une variation de stimulus`,
      severity: "warn",
    });
    if (!explanation.impact) {
      explanation = {
        ...explanation,
        impact:
          "Si la stagnation continue, on explorera d'autres leviers : tempo, ROM, variation d'exercice.",
      };
    }
  }

  // -------------------------------------------------------------------------
  // Logique de confidence globale
  // -------------------------------------------------------------------------
  const blockViolations = violations.filter((v) => v.severity === "block");
  const warnViolations = violations.filter((v) => v.severity === "warn");

  let confidence: ConfidenceLevel;
  if (blockViolations.length > 0) {
    // Décision de sécurité — on est sûr
    confidence = "élevé";
  } else if (highRPEDetected) {
    // RPE élevé spécifiquement → faible confiance
    confidence = "faible";
  } else if (warnViolations.length >= 3) {
    // Beaucoup de warnings = signaux contradictoires
    confidence = "faible";
  } else if (warnViolations.length > 0) {
    confidence = "moyen";
  } else {
    confidence = "élevé";
  }

  // Sécurité finale : ne jamais downgrader vers une décision moins conservative
  if (severityRank(adjustedDecision) < severityRank(input.proposedDecision)) {
    adjustedDecision = input.proposedDecision;
  }

  return {
    allowed: blockViolations.length === 0,
    adjustedDecision,
    adjustedLoad,
    confidence,
    explanation,
    violations,
  };
}

// ===========================================================================
// validateAIRecommendation — gate pour les décisions venant de l'IA
// ===========================================================================

export function validateAIRecommendation(
  aiDecision: ProgressionDecision,
  aiLoad: string | undefined,
  input: GuardrailInput
): GuardrailResult {
  return applyGuardrails({
    ...input,
    proposedDecision: aiDecision,
    proposedLoad: aiLoad,
  });
}
