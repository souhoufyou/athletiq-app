import { buildAdaptationExplanation } from "@/lib/explanations";
import type {
  AdaptationExplanation,
  BreathFeedback,
  EffortStatus,
  Exercise,
  ExerciseLog,
  ProgressionConfidence,
  ExerciseProgressionLog,
  ProgressionDecisionCode,
  ProgressionEvidenceTag,
  PlannedSession,
  ProgramGoal,
  ProgressionDecision,
  ProgressionStyle
} from "@/types/training";

export type ExercisePerformance = Pick<ExerciseLog, "usedLoad" | "completedReps" | "comment">;

export type ProgressionInput = {
  plannedExercise: Exercise;
  performance: ExercisePerformance;
  feedback: EffortStatus;
  comment?: string;
  sleepHours?: number;
  badSleepStreak?: number;
  recentPainCount?: number;
  recentHardCount?: number;
  recentFailureCount?: number;
  recentStagnationCount?: number;
  recentUnavailableCount?: number;
  weeklyVolume?: Partial<Record<MuscleGroup, number>>;
  judoRecentlyHard?: boolean;
  sessionDifficulty: number;
  globalPain: number;
  energy: number;
  breath: BreathFeedback | string;
  session?: PlannedSession;
  progressionStyle?: ProgressionStyle;
  programGoal?: ProgramGoal;
};

export type ProgressionResult = {
  nextLoad: string;
  nextTarget: string;
  nextReps?: string;
  nextSets?: string;
  decision: ProgressionDecision;
  decisionCode?: ProgressionDecisionCode;
  reason: string;
  warning?: string;
  confidence?: ProgressionConfidence;
  evidenceTag?: ProgressionEvidenceTag;
  adaptationExplanation?: AdaptationExplanation;
  replacementSuggestion?: string;
};

export type ProgressionSummary = {
  progressing: string[];
  unchanged: string[];
  watch: string[];
  nextSessionAdjustments: string[];
};

type ExerciseKind = "bench" | "upper-machine" | "leg-machine" | "isolation" | "cardio" | "hinge" | "other";

type MuscleGroup = "pecs" | "back" | "legs" | "shoulders" | "arms" | "core" | "cardio";

type ParsedTarget = {
  sets?: number;
  minReps?: number;
  maxReps?: number;
  minutes?: number;
};

type ParsedLoad = {
  value?: number;
  unit: "kg";
  prefix: string;
};

type CompletionState = {
  allValidated: boolean;
  almostDone: boolean;
  manyMissed: boolean;
  topOfRange: boolean;
};

type ExerciseContext = {
  kind: ExerciseKind;
  muscleGroup: MuscleGroup;
  isFridayJudo: boolean;
  isJudoDay: boolean;
  isGripHeavy: boolean;
  isHeavyLegs: boolean;
  isViolentCardio: boolean;
  isProtectedExercise: boolean;
};

type CommentSignals = {
  alerts: string[];
  bodyParts: Array<"back" | "knee" | "shoulder" | "wrist">;
  hasPainLanguage: boolean;
  isUnavailable: boolean;
  safetyAlert?: string;
};

export type AIProgressionRecommendation = {
  decision?: ProgressionDecision | "increase" | "maintain" | "decrease" | "replace" | "watch";
  nextLoad?: string;
  nextTarget?: string;
  reason?: string;
};

export type AIRecommendationValidationInput = {
  localResult: ProgressionResult;
  aiRecommendation: AIProgressionRecommendation;
  plannedExercise: Exercise;
  performance: ExercisePerformance;
  session?: PlannedSession;
  globalPain?: number;
  sleepHours?: number;
  recentPainCount?: number;
  recentHardCount?: number;
  recentUnavailableCount?: number;
  recentStagnationCount?: number;
  weeklyVolume?: Partial<Record<MuscleGroup, number>>;
};

const safetyPatterns = [
  "vertige",
  "malaise",
  "oppression",
  "douleur poitrine",
  "douleur thoracique",
  "essoufflement inhabituel",
  "souffle inquietant",
  "souffle tres mauvais"
];

const bannedRecommendationPatterns = ["burpees", "crossfit", "course", "pompes"];

const weeklyVolumeTargets: Record<MuscleGroup, { min: number; max: number }> = {
  pecs: { min: 10, max: 16 },
  back: { min: 14, max: 22 },
  legs: { min: 10, max: 18 },
  shoulders: { min: 8, max: 16 },
  arms: { min: 6, max: 14 },
  core: { min: 4, max: 8 },
  cardio: { min: 3, max: 5 }
};

export function calculateProgression(input: ProgressionInput): ProgressionResult {
  const comment = normalize(`${input.performance.comment} ${input.comment ?? ""}`);
  const context = getExerciseContext(input.plannedExercise, input.session);
  const target = parseTarget(input.plannedExercise.target);
  const load = parseLoad(input.performance.usedLoad || input.plannedExercise.plannedLoad);
  const completedReps = parseCompletedReps(input.performance.completedReps);
  const completed = getCompletionState(target, completedReps, input.feedback);
  const commentSignals = detectCommentSignals(comment);
  const effectiveFeedback =
    input.feedback === "pain" || (commentSignals.hasPainLanguage && commentSignals.bodyParts.length > 0)
      ? "pain"
      : input.feedback;
  const breathAlert = hasBreathAlert(input.breath, comment) || Boolean(commentSignals.safetyAlert);
  let result: ProgressionResult;

  if (breathAlert) {
    result = safetyAlert(input.plannedExercise, context.kind, commentSignals.safetyAlert);
  } else if (effectiveFeedback === "pain") {
    result =
      context.kind === "cardio"
        ? progressCardio(input, context, comment)
        : progressPain(input.plannedExercise, context.kind, load, commentSignals);
  } else if (input.globalPain === 3) {
    result = {
      ...keepSame(input.plannedExercise, load),
      reason: "Douleur globale a 3/10: maintenir ou alleger, sans chercher de progression.",
      warning: "Douleur moderee: surveiller la zone avant toute hausse."
    };
  } else if (input.globalPain >= 4) {
    result = {
      nextLoad: reduceLoad(load, 10),
      nextTarget: reduceTarget(input.plannedExercise.target),
      decision: "alerte",
      reason: "Douleur globale a 4/10 ou plus: la prochaine seance doit etre reduite.",
      warning:
        input.globalPain > 5
          ? "Alerte forte: arreter ou remplacer l'exercice si la douleur persiste."
          : "Alerte prudence: reduire l'intensite globale et ne pas chercher de progression."
    };
  } else if (context.kind === "cardio") {
    result = progressCardio(input, context, comment);
  } else if (effectiveFeedback === "skipped") {
    result = progressSkipped(input.plannedExercise, load, commentSignals);
  } else if (effectiveFeedback === "hard") {
    result = progressHard(input, load, completed, comment);
  } else if (effectiveFeedback === "easy") {
    result = progressEasy(input.plannedExercise, context.kind, load, target, completed, comment);
  } else if (effectiveFeedback === "ok" && completed.allValidated) {
    result = progressOk(input.plannedExercise, context.kind, load, target, completed);
  } else if (effectiveFeedback === "ok" && context.kind === "isolation" && completed.almostDone) {
    result = {
      nextLoad: formatLoad(load),
      nextTarget: nextRepTarget(input.plannedExercise.target, target, 1),
      decision: "maintenir",
      reason: "Double progression: garder la charge et completer toutes les series dans la fourchette avant d'augmenter."
    };
  } else {
    result = {
      ...keepSame(input.plannedExercise, load),
      reason: "Retour OK mais les series ne semblent pas toutes validees: maintien de la prescription."
    };
  }

  return finalizeProgression(result, input, context, commentSignals, load);
}

export function validateAIRecommendation(input: AIRecommendationValidationInput): ProgressionResult {
  const local = input.localResult;
  const aiLoad = parseLoad(input.aiRecommendation.nextLoad);
  const localLoad = parseLoad(local.nextLoad);
  const currentLoad = parseLoad(input.performance.usedLoad || input.plannedExercise.plannedLoad);
  const context = getExerciseContext(input.plannedExercise, input.session);
  const recommendationText = normalize(
    `${input.aiRecommendation.decision ?? ""} ${input.aiRecommendation.nextLoad ?? ""} ${
      input.aiRecommendation.nextTarget ?? ""
    } ${input.aiRecommendation.reason ?? ""}`
  );
  const aiWantsIncrease =
    input.aiRecommendation.decision === "increase" ||
    input.aiRecommendation.decision === "augmenter" ||
    (aiLoad.value !== undefined && currentLoad.value !== undefined && aiLoad.value > currentLoad.value);
  const aiWantsReplace =
    input.aiRecommendation.decision === "replace" ||
    input.aiRecommendation.decision === "remplacer" ||
    includesAny(recommendationText, ["remplacer", "remplacement", "changer d'exercice", "changer exercice"]);
  const aiAddsVolume = addsVolume(recommendationText);
  const aiSuggestsViolentCardio = includesAny(recommendationText, ["hiit", "sprint", "intervalles", "course", "fort"]);
  const aiSuggestsGripHeavy = includesAny(recommendationText, ["grip lourd", "farmer", "traction lourde", "rowing lourd"]);
  const localBlocksIncrease =
    local.decision === "alerte" ||
    local.decision === "baisser" ||
    local.decision === "remplacer" ||
    Boolean(local.warning) ||
    (input.globalPain ?? 0) > 0 ||
    (input.recentPainCount ?? 0) > 0;
  const volume = input.weeklyVolume?.[context.muscleGroup];
  const volumeLimit = weeklyVolumeTargets[context.muscleGroup];

  if (aiWantsIncrease && localBlocksIncrease) {
    return moderateAIRecommendation(local, input.plannedExercise, "progression malgré douleur, alerte ou décision locale prudente.");
  }

  if (aiWantsIncrease && context.kind === "cardio" && context.isViolentCardio && hasLowSleep(input.sleepHours)) {
    return moderateAIRecommendation(
      {
        ...local,
        decision: "maintenir",
        nextLoad: "Cardio facile uniquement",
        nextTarget: input.plannedExercise.target,
        reason: `${local.reason} Sommeil bas: cardio intense refuse.`
      },
      input.plannedExercise,
      "pas de HIIT dur avec sommeil bas."
    );
  }

  if (context.isJudoDay && context.kind === "cardio" && (aiWantsIncrease || aiSuggestsViolentCardio)) {
    return moderateAIRecommendation(
      {
        ...local,
        decision: "maintenir",
        nextLoad: "Cardio facile uniquement",
        nextTarget: input.plannedExercise.target,
        reason: `${local.reason} Judo proche: cardio violent refuse.`
      },
      input.plannedExercise,
      "cardio violent proche du judo."
    );
  }

  if (context.isFridayJudo && context.isGripHeavy && (aiWantsIncrease || aiSuggestsGripHeavy)) {
    return moderateAIRecommendation(
      {
        ...local,
        decision: "maintenir",
        nextLoad: formatLoad(currentLoad),
        nextTarget: input.plannedExercise.target,
        reason: `${local.reason} Vendredi avant judo: grip lourd refuse.`
      },
      input.plannedExercise,
      "grip lourd vendredi avant judo."
    );
  }

  if (aiAddsVolume && (volume === undefined || volume >= volumeLimit.max || local.warning || (input.globalPain ?? 0) > 0)) {
    return moderateAIRecommendation(local, input.plannedExercise, "volume excessif ou insuffisamment justifie.");
  }

  if (context.kind === "cardio" && countCardioParameterChanges(input) > 1) {
    return moderateAIRecommendation(local, input.plannedExercise, "plusieurs paramètres cardio augmentés en même temps.");
  }

  if (aiWantsReplace && local.decision !== "remplacer" && local.decision !== "alerte") {
    return moderateAIRecommendation(local, input.plannedExercise, "changement de structure inutile.");
  }

  if (
    aiWantsReplace &&
    context.isProtectedExercise &&
    (input.recentPainCount ?? 0) < 2 &&
    (input.recentUnavailableCount ?? 0) < 2
  ) {
    return moderateAIRecommendation(local, input.plannedExercise, "remplacement abusif d'un exercice principal.");
  }

  if (
    aiWantsIncrease &&
    aiLoad.value !== undefined &&
    localLoad.value !== undefined &&
    aiLoad.value > localLoad.value
  ) {
    return moderateAIRecommendation(local, input.plannedExercise, "hausse plus élevée que la progression locale.");
  }

  return withAIValidationMetadata(local, input.plannedExercise);
}

function moderateAIRecommendation(
  local: ProgressionResult,
  plannedExercise: Exercise,
  reason: string
): ProgressionResult {
  return withAIValidationMetadata(
    {
      ...local,
      warning: appendWarning(local.warning, "Suggestion IA modérée par les garde-fous du programme."),
      reason: `${local.reason} Suggestion IA bloquee ou moderee: ${reason}`
    },
    plannedExercise
  );
}

function withAIValidationMetadata(result: ProgressionResult, plannedExercise: Exercise): ProgressionResult {
  const next = sanitizeProgression({
    ...result,
    decisionCode: getDecisionCode(result),
    nextReps: getNextReps(result.nextTarget),
    nextSets: getNextSets(result.nextTarget),
    confidence: result.confidence ?? (result.warning ? "medium" : "high"),
    evidenceTag: result.evidenceTag ?? "guardrail_rule"
  });

  return {
    ...next,
    adaptationExplanation: buildAdaptationExplanation(next, plannedExercise.name)
  };
}

function addsVolume(text: string): boolean {
  return includesAny(text, ["ajouter une serie", "+1 serie", "serie en plus", "volume", "sets en plus"]);
}

function countCardioParameterChanges(input: AIRecommendationValidationInput): number {
  const currentLoad = normalize(input.performance.usedLoad || input.plannedExercise.plannedLoad || "");
  const currentTarget = normalize(input.plannedExercise.target);
  const aiLoad = normalize(input.aiRecommendation.nextLoad ?? "");
  const aiTarget = normalize(input.aiRecommendation.nextTarget ?? "");
  let changes = 0;

  if (hasDifferentMinutes(currentTarget, aiTarget)) changes += 1;
  if (hasDifferentRounds(currentTarget, aiTarget)) changes += 1;
  if (hasDifferentPercent(currentLoad, aiLoad)) changes += 1;
  if (hasDifferentSpeed(currentLoad, aiLoad)) changes += 1;

  return changes;
}

function hasDifferentMinutes(currentValue: string, nextValue: string): boolean {
  const current = currentValue.match(/(\d+)\s*min/);
  const next = nextValue.match(/(\d+)\s*min/);
  return Boolean(current && next && Number(next[1]) > Number(current[1]));
}

function hasDifferentRounds(currentValue: string, nextValue: string): boolean {
  const current = currentValue.match(/(\d+)\s*round/);
  const next = nextValue.match(/(\d+)\s*round/);
  return Boolean(current && next && Number(next[1]) > Number(current[1]));
}

function hasDifferentPercent(currentValue: string, nextValue: string): boolean {
  const current = currentValue.match(/(\d+(?:[,.]\d+)?)\s*%/);
  const next = nextValue.match(/(\d+(?:[,.]\d+)?)\s*%/);
  return Boolean(current && next && Number(next[1].replace(",", ".")) > Number(current[1].replace(",", ".")));
}

function hasDifferentSpeed(currentValue: string, nextValue: string): boolean {
  const current = currentValue.match(/(\d+(?:[,.]\d+)?)\s*(?:km\/h|kmh)/);
  const next = nextValue.match(/(\d+(?:[,.]\d+)?)\s*(?:km\/h|kmh)/);
  return Boolean(current && next && Number(next[1].replace(",", ".")) > Number(current[1].replace(",", ".")));
}

export function summarizeProgressions(
  progressions: Record<string, ExerciseProgressionLog>
): ProgressionSummary {
  const entries = Object.values(progressions);

  return {
    progressing: entries
      .filter((item) => item.decision === "augmenter")
      .map((item) => `${item.exerciseName}: ${item.nextLoad}, ${item.nextTarget}`),
    unchanged: entries
      .filter((item) => item.decision === "maintenir")
      .map((item) => `${item.exerciseName}: ${item.reason}`),
    watch: entries
      .filter((item) => item.decision === "baisser" || item.decision === "remplacer" || item.decision === "alerte" || item.warning)
      .map((item) => `${item.exerciseName}: ${item.warning ?? item.reason}`),
    nextSessionAdjustments: entries.map((item) => {
      const replacement = item.replacementSuggestion ? ` Remplacement: ${item.replacementSuggestion}` : "";
      return `${item.exerciseName}: ${formatDecisionLabel(item.decision)} - ${item.nextLoad} - ${item.nextTarget}.${replacement}`;
    })
  };
}

function progressOk(
  exercise: Exercise,
  kind: ExerciseKind,
  load: ParsedLoad,
  target: ParsedTarget,
  completed: CompletionState
): ProgressionResult {
  if (kind === "bench") {
    return {
      nextLoad: increaseLoad(load, 2.5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: "Developpe couche valide: progression standard de +2,5 kg."
    };
  }

  if (kind === "upper-machine") {
    return {
      nextLoad: increaseLoad(load, 2.5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: "Mouvement haut du corps valide: hausse prudente de +2,5 kg."
    };
  }

  if (kind === "leg-machine") {
    return {
      nextLoad: increaseLoad(load, 5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: "Presse ou machine jambes validee: hausse de +5 kg."
    };
  }

  if (kind === "isolation") {
    if (completed.topOfRange && load.value) {
      return {
        nextLoad: increaseLoad(load, 1),
        nextTarget: resetRepTargetToLowEnd(exercise.target, target),
        decision: "augmenter",
        reason: "Isolation au haut de fourchette: legere hausse de charge, puis retour au bas de fourchette."
      };
    }

    return {
      nextLoad: formatLoad(load),
      nextTarget: nextRepTarget(exercise.target, target, 1),
      decision: "maintenir",
      reason: "Isolation validee: garder la charge et viser plus de repetitions avant d'augmenter."
    };
  }

  if (kind === "hinge") {
    return {
      nextLoad: increaseLoad(load, 2.5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: "Hinge valide: petite hausse seulement si la technique reste solide."
    };
  }

  return {
    nextLoad: increaseLoad(load, 2.5),
    nextTarget: exercise.target,
    decision: load.value ? "augmenter" : "maintenir",
    reason: load.value
      ? "Exercice valide: petite hausse de charge proposee."
      : "Exercice valide sans charge renseignee: conserver la prescription."
  };
}

function progressEasy(
  exercise: Exercise,
  kind: ExerciseKind,
  load: ParsedLoad,
  target: ParsedTarget,
  completed: CompletionState,
  comment: string
): ProgressionResult {
  const veryEasy = mentionsVeryEasy(comment);

  if (kind === "bench") {
    return {
      nextLoad: increaseLoad(load, 2.5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: "Developpe couche facile: +2,5 kg, sans saut agressif."
    };
  }

  if (kind === "leg-machine") {
    if (!completed.allValidated) {
      return {
        nextLoad: formatLoad(load),
        nextTarget: exercise.target,
        decision: "maintenir",
        reason: "Machine jambes facile mais reps incompletes: maintenir avant toute hausse."
      };
    }

    return {
      nextLoad: increaseLoad(load, veryEasy ? 10 : 5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: veryEasy ? "Presse tres facile: +10 kg possible." : "Presse facile: +5 kg prudent."
    };
  }

  if (kind === "upper-machine") {
    if (!completed.allValidated) {
      return {
        nextLoad: formatLoad(load),
        nextTarget: exercise.target,
        decision: "maintenir",
        reason: "Machine haut du corps facile mais reps incompletes: maintenir avant toute hausse."
      };
    }

    return {
      nextLoad: increaseLoad(load, veryEasy ? 5 : 2.5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: "Rowing, tirage ou machine haut du corps facile: hausse de 2,5 a 5 kg selon la marge."
    };
  }

  if (kind === "isolation") {
    if (completed.topOfRange && load.value) {
      return {
        nextLoad: increaseLoad(load, 1),
        nextTarget: resetRepTargetToLowEnd(exercise.target, target),
        decision: "augmenter",
        reason: "Isolation facile et haut de fourchette atteint: legere hausse de charge."
      };
    }

    return {
      nextLoad: formatLoad(load),
      nextTarget: nextRepTarget(exercise.target, target, 2),
      decision: "maintenir",
      reason: "Isolation facile: augmenter d'abord les repetitions, puis la charge seulement au haut de fourchette."
    };
  }

  if (kind === "hinge") {
    return {
      nextLoad: increaseLoad(load, 2.5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: "Mouvement technique facile: hausse moderee, priorite a la qualite d'execution."
    };
  }

  return {
    nextLoad: increaseLoad(load, 2.5),
    nextTarget: exercise.target,
    decision: load.value ? "augmenter" : "maintenir",
    reason: load.value ? "Retour facile: progression moderee proposee." : "Retour facile sans charge renseignee."
  };
}

function progressHard(
  input: ProgressionInput,
  load: ParsedLoad,
  completed: CompletionState,
  comment: string
): ProgressionResult {
  const fatigueHigh = input.sessionDifficulty >= 8 || input.energy <= 3;

  if (mentionsLackOfTime(comment)) {
    return {
      ...keepSame(input.plannedExercise, load),
      reason: "Retour trop dur lie au manque de temps: aucune baisse appliquee."
    };
  }

  if (completed.allValidated) {
    return {
      ...keepSame(input.plannedExercise, load),
      reason: fatigueHigh
        ? "Toutes les series sont faites, mais avec fatigue globale elevee: maintenir et consolider."
        : "Toutes les series sont faites malgre la difficulte: maintenir avant d'augmenter.",
      warning: fatigueHigh ? "Fatigue haute: eviter d'ajouter du volume sur la prochaine exposition." : undefined
    };
  }

  if (completed.manyMissed) {
    if (fatigueHigh) {
      return {
        nextLoad: formatLoad(load),
        nextTarget: reduceTarget(input.plannedExercise.target),
        decision: "baisser",
        reason: "Plusieurs series ratees avec fatigue globale elevee: reduire surtout le volume.",
        warning: "Surveiller sommeil, souffle et recuperation avant de recharger."
      };
    }

    return {
      nextLoad: reduceLoad(load, 5),
      nextTarget: input.plannedExercise.target,
      decision: "baisser",
      reason: "Plusieurs series ou repetitions ratees: baisse legere de 2,5 a 5 %."
    };
  }

  return {
    ...keepSame(input.plannedExercise, load),
    reason: fatigueHigh
      ? "Exercice dur avec fatigue globale: maintenir, sans punir la seance."
      : "Exercice dur mais proche de la prescription: maintien."
  };
}

function progressSkipped(
  exercise: Exercise,
  load: ParsedLoad,
  commentSignals: CommentSignals
): ProgressionResult {
  if (commentSignals.isUnavailable) {
    return {
      ...keepSame(exercise, load),
      reason: "Machine occupee ou materiel indisponible: report ou remplacement, sans compter comme un echec.",
      replacementSuggestion: getReplacementSuggestion(exercise, commentSignals)
    };
  }

  return {
    ...keepSame(exercise, load),
    reason: "Exercice non fait: prescription conservee, sans compter comme un echec."
  };
}

function progressPain(
  exercise: Exercise,
  kind: ExerciseKind,
  load: ParsedLoad,
  commentSignals: CommentSignals
): ProgressionResult {
  const replacementSuggestion = getReplacementSuggestion(exercise, commentSignals);

  return {
    nextLoad: reduceLoad(load, kind === "isolation" ? 5 : 10),
    nextTarget: exercise.target,
    decision: replacementSuggestion ? "remplacer" : "alerte",
    reason: "Douleur signalee: ne jamais augmenter, baisser la charge et adapter l'exercice.",
    warning: "Alerte douleur visible: arreter si la douleur revient, augmente ou modifie le geste.",
    replacementSuggestion
  };
}

function progressCardio(input: ProgressionInput, context: ExerciseContext, comment: string): ProgressionResult {
  const target = parseTarget(input.plannedExercise.target);

  if (input.feedback === "pain" || hasBreathAlert(input.breath, comment)) {
    return {
      nextLoad: "Marche douce sur tapis incline",
      nextTarget: "10-20 min tres facile",
      decision: "alerte",
      reason: "Cardio avec douleur ou souffle inquietant: passer en marche douce.",
      warning: "Reduire l'intensite et consulter si le symptome est inhabituel, intense ou persistant."
    };
  }

  if (input.feedback === "easy") {
    if (
      context.isViolentCardio &&
      (context.isJudoDay || input.sessionDifficulty >= 8 || input.energy <= 3 || hasLowSleep(input.sleepHours))
    ) {
      return {
        nextLoad: "Tapis incline, rameur facile ou Stairmaster doux",
        nextTarget: input.plannedExercise.target,
        decision: "maintenir",
        reason: context.isJudoDay
          ? "Jour de judo: ne pas ajouter de cardio violent avant le tatami."
          : "Intervalles faciles mais fatigue/sommeil insuffisants: pas d'ajout dur.",
        warning: "Priorite au souffle durable, pas aux intervalles intenses."
      };
    }

    if (context.isViolentCardio) {
      return {
        nextLoad: "Meme intensite",
        nextTarget: nextRoundTarget(input.plannedExercise.target),
        decision: "augmenter",
        reason: "Intervalles faciles: ajouter 1 round maximum, sans changer vitesse et intensite en meme temps."
      };
    }

    return {
      nextLoad: "Meme intensite",
      nextTarget: target.minutes ? `${target.minutes + 5} min` : `${input.plannedExercise.target} + 5 min`,
      decision: "augmenter",
      reason: "Cardio facile: ajouter 5 min ou, si la duree ne bouge pas, +1 % d'inclinaison. Jamais les deux en meme temps."
    };
  }

  if (input.feedback === "hard") {
    return {
      nextLoad: "Meme intensite ou intensite plus basse",
      nextTarget: target.minutes ? `${Math.max(10, target.minutes - 5)} min` : "Reduire de 5 min si necessaire",
      decision: "maintenir",
      reason: "Cardio trop dur: maintenir ou reduire de 5 min pour rester durable."
    };
  }

  if (input.feedback === "skipped") {
    return {
      nextLoad: "Meme intensite",
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: "Cardio non fait: prescription conservee."
    };
  }

  return {
    nextLoad: "Meme intensite",
    nextTarget: input.plannedExercise.target,
    decision: "maintenir",
    reason: "Cardio valide: conserver jusqu'a ce que l'effort devienne facile."
  };
}

function safetyAlert(exercise: Exercise, kind: ExerciseKind, detected?: string): ProgressionResult {
  const reason = detected
    ? `Signal de securite detecte dans le commentaire: ${detected}.`
    : "Souffle tres mauvais, vertige, oppression ou commentaire inquietant detecte.";

  if (kind === "cardio") {
    return {
      nextLoad: "Marche douce sur tapis incline",
      nextTarget: "10-20 min tres facile",
      decision: "alerte",
      reason,
      warning: "Alerte securite: reduire l'intensite et consulter si le symptome est inhabituel, intense ou persistant."
    };
  }

  return {
    nextLoad: "Reduire fortement ou arreter",
    nextTarget: reduceTarget(exercise.target),
    decision: "alerte",
    reason,
    warning: "Alerte securite: reduire l'intensite et consulter si le symptome est inhabituel, intense ou persistant."
  };
}

function finalizeProgression(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext,
  commentSignals: CommentSignals,
  load: ParsedLoad
): ProgressionResult {
  let next = { ...result };

  if (commentSignals.alerts.length > 0) {
    next.warning = appendWarning(next.warning, commentSignals.alerts.join(" "));
  }

  if (
    !input.performance.usedLoad.trim() &&
    !input.performance.completedReps.trim() &&
    next.decision === "augmenter"
  ) {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Donnees insuffisantes: maintien prudent, sans progression automatique.`,
      warning: appendWarning(next.warning, "Donnees insuffisantes: l'app choisit l'option la plus prudente.")
    };
  }

  if (hasLowSleep(input.sleepHours) && context.kind === "cardio" && context.isViolentCardio) {
    next = {
      ...next,
      nextLoad: context.kind === "cardio" ? "Cardio facile uniquement" : formatLoad(load),
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Sommeil sous 5 h: pas de max, pas de HIIT dur, pas d'augmentation agressive.`,
      warning: appendWarning(next.warning, "Sommeil bas: rester sur une seance stable.")
    };
  }

  if ((input.badSleepStreak ?? 0) >= 2 && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: reduceTarget(input.plannedExercise.target),
      decision: "maintenir",
      reason: `${next.reason} Deux mauvaises nuits d'affilee: volume reduit de 10-20 % plutot qu'une hausse.`,
      warning: appendWarning(next.warning, "Sommeil mauvais repete: alleger la prochaine exposition.")
    };
  }

  if ((input.sessionDifficulty >= 9 || input.energy <= 3) && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Fatigue elevee: maintenir les charges pour la prochaine seance similaire.`,
      warning: appendWarning(next.warning, "Difficulte globale haute: pas de progression ajoutee.")
    };
  }

  if (
    context.isFridayJudo &&
    context.isGripHeavy &&
    next.decision === "augmenter"
  ) {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Vendredi avec judo le soir: pas d'ajout de grip lourd.`,
      warning: appendWarning(next.warning, "Garder le grip frais avant le judo du vendredi soir.")
    };
  }

  if (context.isJudoDay && context.isHeavyLegs && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Jour de judo: pas de jambes lourdes avant le tatami.`,
      warning: appendWarning(next.warning, "Garder de la fraicheur pour le judo.")
    };
  }

  if (input.session?.weekday === "saturday" && input.judoRecentlyHard && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Judo du vendredi dur: samedi ajuste sans hausse.`,
      warning: appendWarning(next.warning, "Adapter selon la durete du judo vendredi.")
    };
  }

  if (context.kind === "bench" && commentSignals.bodyParts.includes("wrist")) {
    next.warning = appendWarning(
      next.warning,
      "Poignet signale sur le developpe couche: prise stable, poignets neutres, pas de saut agressif."
    );

    if (commentSignals.hasPainLanguage && next.decision === "augmenter") {
      next = {
        ...next,
        nextLoad: formatLoad(load),
        decision: "maintenir",
        reason: `${next.reason} Douleur poignet detectee: progression annulee pour cette fois.`
      };
    }
  }

  if (
    context.isProtectedExercise &&
    next.decision === "remplacer" &&
    (input.recentPainCount ?? 0) < 2 &&
    commentSignals.hasPainLanguage
  ) {
    next = {
      ...next,
      decision: "alerte",
      reason: `${next.reason} Exercice protege: alternative temporaire possible, mais pas de remplacement durable apres une seule alerte.`,
      warning: appendWarning(next.warning, "Garde-fou structure: conserver le mouvement principal si la douleur ne se repete pas.")
    };
  }

  if (context.isJudoDay && context.kind === "cardio" && context.isViolentCardio && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: "Tapis incline, rameur facile ou Stairmaster doux",
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Jour de judo: pas de cardio violent ajoute.`,
      warning: appendWarning(next.warning, "Avant judo, rester en zone facile.")
    };
  }

  if ((input.recentPainCount ?? 0) >= 2 && commentSignals.hasPainLanguage) {
    next = {
      ...next,
      decision: "remplacer",
      replacementSuggestion: next.replacementSuggestion ?? getReplacementSuggestion(input.plannedExercise, commentSignals),
      reason: `${next.reason} Douleur repetee sur cet exercice: proposer une variante de remplacement.`,
      warning: appendWarning(
        next.warning,
        (input.recentPainCount ?? 0) >= 3
          ? "Douleur repetee 3 fois: exercice mis en surveillance."
          : "Douleur repetee: ne pas insister sur la meme variante."
      )
    };
  }

  if ((input.recentHardCount ?? 0) >= 2 && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: input.plannedExercise.target,
      decision: "maintenir",
      reason: `${next.reason} Exercice trop souvent note trop dur: ajuster legerement avant de progresser.`,
      warning: appendWarning(next.warning, "Difficulte repetee: garder charge/reps avant modification structurelle.")
    };
  }

  if ((input.recentStagnationCount ?? 0) >= 3 && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      nextTarget: nextRepTarget(input.plannedExercise.target, parseTarget(input.plannedExercise.target), 1),
      decision: "maintenir",
      reason: `${next.reason} Trois expositions sans progression: viser reps/repos/tempo avant de changer la structure.`,
      warning: appendWarning(next.warning, "Stagnation repetee: changer la structure seulement apres les ajustements simples.")
    };
  }

  if ((input.recentUnavailableCount ?? 0) < 2 && commentSignals.isUnavailable && next.replacementSuggestion) {
    next = {
      ...next,
      decision: "maintenir",
      reason: `${next.reason} Indisponibilite ponctuelle: remplacement temporaire ou report uniquement.`,
      warning: appendWarning(next.warning, "Ne pas remplacer durablement apres une seule machine occupee.")
    };
  }

  const volume = input.weeklyVolume?.[context.muscleGroup];

  if (volume !== undefined && next.decision === "augmenter") {
    const target = weeklyVolumeTargets[context.muscleGroup];

    if (volume >= target.max || input.globalPain > 0 || input.sessionDifficulty >= 8) {
      next = {
        ...next,
        nextLoad: formatLoad(load),
        nextTarget: input.plannedExercise.target,
        decision: "maintenir",
        reason: `${next.reason} Volume hebdomadaire deja haut ou fatigue/douleur presente: ne pas ajouter de charge/volume.`,
        warning: appendWarning(next.warning, "Garde-fou volume: rester dans la cible hebdomadaire.")
      };
    }
  }

  next = applyPersonalProgressionStyle(next, input, load);

  return withDecisionMetadata(sanitizeProgression(next), input, context);
}

function applyPersonalProgressionStyle(
  result: ProgressionResult,
  input: ProgressionInput,
  load: ParsedLoad
): ProgressionResult {
  if (result.decision !== "augmenter" || !load.value) {
    return result;
  }

  if (input.progressionStyle === "regular" && input.feedback !== "easy") {
    return {
      ...result,
      nextLoad: formatLoad(load),
      decision: "maintenir",
      reason: `${result.reason} Style regulier: validation consolidee avant hausse.`
    };
  }

  if (input.programGoal === "fat_loss" && input.sessionDifficulty >= 7) {
    return {
      ...result,
      nextLoad: formatLoad(load),
      decision: "maintenir",
      reason: `${result.reason} Objectif perte de gras avec fatigue haute: maintenir la charge.`
    };
  }

  if (
    input.progressionStyle === "controlled_aggressive" &&
    input.feedback === "easy" &&
    input.globalPain <= 1 &&
    input.energy >= 6 &&
    !hasLowSleep(input.sleepHours) &&
    (input.recentFailureCount ?? 0) === 0 &&
    input.programGoal !== "cardio_health"
  ) {
    const kind = getExerciseKind(input.plannedExercise);
    const comment = normalize(`${input.performance.comment} ${input.comment ?? ""}`);

    return {
      ...result,
      nextLoad: increaseLoad(load, getControlledAggressiveIncrement(kind, comment)),
      reason: `${result.reason} Style agressif controle: bonus applique car energie et douleur sont OK.`,
      warning: appendWarning(
        result.warning,
        "Garde-fou progression: le bonus agressif reste autorise seulement avec series validees, energie haute, sommeil correct, aucune douleur et aucun echec recent."
      )
    };
  }

  return result;
}

function getControlledAggressiveIncrement(kind: ExerciseKind, comment: string): number {
  const veryEasy = mentionsVeryEasy(comment);

  if (kind === "bench") return veryEasy ? 5 : 2.5;
  if (kind === "leg-machine") return veryEasy ? 10 : 5;
  if (kind === "upper-machine") return veryEasy ? 5 : 2.5;
  if (kind === "isolation") return veryEasy ? 1.5 : 1;
  return veryEasy ? 5 : 2.5;
}

function getExerciseContext(exercise: Exercise, session?: PlannedSession): ExerciseContext {
  const kind = getExerciseKind(exercise);
  const text = normalize(`${exercise.id} ${exercise.name} ${exercise.cue}`);
  const isJudoDay = session?.weekday === "monday" || session?.weekday === "friday";
  const isFridayJudo = session?.weekday === "friday";

  return {
    kind,
    muscleGroup: getMuscleGroup(exercise, kind),
    isFridayJudo,
    isJudoDay,
    isGripHeavy: includesAny(text, [
      "farmer",
      "suspension",
      "traction",
      "tirage lourd",
      "rowing lourd",
      "souleve de terre",
      "deadlift"
    ]),
    isHeavyLegs: includesAny(text, ["presse", "squat", "hack", "fentes", "souleve", "roumain", "rdl", "hip thrust"]),
    isViolentCardio: includesAny(text, ["intervalles", "sprint", "hiit", "fort", "course"]),
    isProtectedExercise: isProtectedExercise(text, kind)
  };
}

function getMuscleGroup(exercise: Exercise, kind: ExerciseKind): MuscleGroup {
  const text = normalize(`${exercise.id} ${exercise.name} ${exercise.cue}`);

  if (kind === "cardio") return "cardio";
  if (kind === "bench" || includesAny(text, ["chest", "pec", "developpe couche", "pec deck", "ecarte"])) return "pecs";
  if (kind === "leg-machine" || kind === "hinge" || includesAny(text, ["leg", "presse", "squat", "hip thrust", "mollets"])) return "legs";
  if (includesAny(text, ["tirage", "rowing", "traction", "pullover"])) return "back";
  if (includesAny(text, ["epaule", "shoulder", "elevation", "face pull", "arriere d epaule"])) return "shoulders";
  if (includesAny(text, ["curl", "triceps", "biceps", "bras"])) return "arms";
  if (includesAny(text, ["gainage", "core", "abdos"])) return "core";

  return "pecs";
}

function isProtectedExercise(text: string, kind: ExerciseKind): boolean {
  return (
    kind === "bench" ||
    kind === "leg-machine" ||
    kind === "hinge" ||
    includesAny(text, ["tirage vertical", "rowing", "developpe epaules", "shoulder press"])
  );
}

function getExerciseKind(exercise: Exercise): ExerciseKind {
  const text = normalize(`${exercise.id} ${exercise.name} ${exercise.cue}`);

  if (includesAny(text, ["cardio", "tapis", "marche", "rameur", "stairmaster", "intervalles", "zone 2"])) {
    return "cardio";
  }

  if (includesAny(text, ["developpe couche", "bench"])) {
    return "bench";
  }

  if (includesAny(text, ["presse", "hack squat", "goblet squat"])) {
    return "leg-machine";
  }

  if (
    includesAny(text, [
      "leg curl",
      "leg extension",
      "mollets",
      "curl",
      "triceps",
      "elevation",
      "ecarte",
      "pec deck",
      "face pull",
      "pullover",
      "reverse pec deck",
      "arriere d epaule"
    ])
  ) {
    return "isolation";
  }

  if (includesAny(text, ["souleve de terre", "rdl", "roumain", "hip thrust"])) {
    return "hinge";
  }

  if (includesAny(text, ["machine", "chest press", "tirage", "rowing", "developpe epaules", "developpe incline"])) {
    return "upper-machine";
  }

  return "other";
}

function detectCommentSignals(comment: string): CommentSignals {
  const alerts: string[] = [];
  const bodyParts: CommentSignals["bodyParts"] = [];
  let safetyAlert: string | undefined;

  if (comment.includes("poignet")) {
    bodyParts.push("wrist");
    alerts.push("Poignet signale: privilegier prises neutres, machines ou poulies, et eviter l'extension douloureuse.");
  }

  if (comment.includes("epaule")) {
    bodyParts.push("shoulder");
    alerts.push("Epaule signalee: reduire l'amplitude douloureuse et privilegier machines stables ou poulies.");
  }

  if (comment.includes("dos")) {
    bodyParts.push("back");
    alerts.push("Dos signale: rester sur charges controlees, appuis stables, hip thrust ou machines si besoin.");
  }

  if (comment.includes("genou")) {
    bodyParts.push("knee");
    alerts.push("Genou signale: amplitude controlee, machines et tapis incline doux en priorite.");
  }

  const safetyMatch = safetyPatterns.find((pattern) => comment.includes(normalize(pattern)));

  if (safetyMatch) {
    safetyAlert = safetyMatch;
    alerts.push("Signal souffle/securite detecte: reduire l'intensite et consulter si inhabituel ou persistant.");
  }

  return {
    alerts,
    bodyParts,
    hasPainLanguage: includesAny(comment, ["douleur", "mal", "gene", "tendinite", "pince", "bloque", "irrite"]),
    isUnavailable: includesAny(comment, ["machine occupee", "materiel occupe", "materiel indisponible", "pas disponible", "remplace", "remplacement"]),
    safetyAlert
  };
}

function getReplacementSuggestion(exercise: Exercise, commentSignals: CommentSignals): string | undefined {
  const text = normalize(`${exercise.id} ${exercise.name}`);

  if (commentSignals.bodyParts.includes("wrist")) {
    if (includesAny(text, ["curl"])) {
      return "Curl marteau, curl cable corde ou machine avec prise neutre.";
    }

    if (includesAny(text, ["developpe couche", "chest press"])) {
      return "Chest press prise neutre, machine convergente ou amplitude reduite sans douleur.";
    }
  }

  if (commentSignals.bodyParts.includes("shoulder")) {
    return "Machine guidee, poulie controlee ou prise neutre dans une amplitude sans douleur.";
  }

  if (commentSignals.bodyParts.includes("back") && includesAny(text, ["souleve", "roumain", "rdl"])) {
    return "Hip thrust, leg curl ou machine avec appui stable.";
  }

  if (commentSignals.bodyParts.includes("knee")) {
    return "Presse amplitude controlee, leg curl, hip thrust ou marche douce sur tapis incline.";
  }

  if (includesAny(text, ["souleve de terre roumain", "romanian", "rdl"])) {
    return "Hip thrust ou leg curl.";
  }

  if (includesAny(text, ["developpe couche", "chest press"])) {
    return "Chest press prise neutre, machine convergente ou amplitude reduite sans douleur.";
  }

  if (includesAny(text, ["curl"])) {
    return "Curl marteau ou curl cable corde.";
  }

  return "Machine stable, poulie controlee ou variante sans douleur.";
}

function parseTarget(target: string): ParsedTarget {
  const normalized = normalize(target);
  const setsMatch = normalized.match(/(\d+)\s*x\s*(\d+)(?:\s*[-a]\s*(\d+))?/);
  const minutesMatch = normalized.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/);

  return {
    sets: setsMatch ? Number(setsMatch[1]) : undefined,
    minReps: setsMatch ? Number(setsMatch[2]) : undefined,
    maxReps: setsMatch ? Number(setsMatch[3] ?? setsMatch[2]) : undefined,
    minutes: minutesMatch ? Number(minutesMatch[2] ?? minutesMatch[1]) : undefined
  };
}

function parseCompletedReps(value: string): number[] {
  const normalized = normalize(value);
  const repeated = normalized.match(/^(\d+)\s*x\s*(\d+)$/);

  if (repeated) {
    return Array.from({ length: Number(repeated[1]) }, () => Number(repeated[2]));
  }

  return (normalized.match(/\d+(?:[,.]\d+)?/g) ?? []).map((item) => Number(item.replace(",", ".")));
}

function getCompletionState(target: ParsedTarget, completedReps: number[], feedback: EffortStatus): CompletionState {
  if ((feedback === "ok" || feedback === "easy") && completedReps.length === 0) {
    return {
      allValidated: true,
      almostDone: true,
      manyMissed: false,
      topOfRange: false
    };
  }

  if (!target.sets || !target.minReps) {
    return {
      allValidated: completedReps.length > 0 || feedback === "ok" || feedback === "easy",
      almostDone: completedReps.length > 0 || feedback === "ok" || feedback === "easy",
      manyMissed: false,
      topOfRange: false
    };
  }

  const sets = target.sets;
  const minReps = target.minReps;
  const maxReps = target.maxReps ?? target.minReps;
  const expectedTotal = sets * minReps;
  const completedForSets = completedReps.slice(0, sets);
  const completedTotal = completedForSets.reduce((sum, reps) => sum + reps, 0);
  const validSets = completedForSets.filter((reps) => reps >= minReps).length;

  return {
    allValidated: completedForSets.length >= sets && validSets >= sets,
    almostDone: completedTotal >= expectedTotal * 0.85 || validSets >= sets - 1,
    manyMissed: completedTotal < expectedTotal * 0.7 || validSets <= Math.max(0, sets - 2),
    topOfRange: completedForSets.length >= sets && completedForSets.every((reps) => reps >= maxReps)
  };
}

function parseLoad(value?: string): ParsedLoad {
  if (!value) {
    return { unit: "kg", prefix: "" };
  }

  const kgMatch = value.match(/^(.*?)(\d+(?:[,.]\d+)?)\s*kg/i);
  const numberMatch = value.match(/(\d+(?:[,.]\d+)?)/);
  const match = kgMatch ?? numberMatch;

  return {
    value: match ? Number(match[kgMatch ? 2 : 1].replace(",", ".")) : undefined,
    unit: "kg",
    prefix: kgMatch ? kgMatch[1].trimEnd() : ""
  };
}

function formatLoad(load: ParsedLoad): string {
  if (!load.value) {
    return "Même charge";
  }

  const value = Number.isInteger(load.value) ? String(load.value) : load.value.toFixed(1).replace(".", ",");
  return `${load.prefix ? `${load.prefix} ` : ""}${value} ${load.unit}`;
}

function increaseLoad(load: ParsedLoad, increment: number): string {
  if (!load.value) {
    return "Même charge, à renseigner";
  }

  return formatLoad({ ...load, value: roundToHalf(load.value + increment) });
}

function reduceLoad(load: ParsedLoad, percent: number): string {
  if (!load.value) {
    return `Baisser de ${percent} % si une charge est utilisée`;
  }

  return formatLoad({ ...load, value: roundToHalf(load.value * (1 - percent / 100)) });
}

function nextRepTarget(originalTarget: string, target: ParsedTarget, increment: number): string {
  if (!target.sets || !target.minReps || !target.maxReps) {
    return `${originalTarget}, viser +${increment} rep par série`;
  }

  if (target.minReps >= target.maxReps) {
    return `${target.sets} x ${target.minReps + increment}`;
  }

  const nextMin = Math.min(target.maxReps, target.minReps + increment);

  if (nextMin >= target.maxReps) {
    return `${target.sets} x ${target.maxReps}`;
  }

  return `${target.sets} x ${nextMin}-${target.maxReps}`;
}

function nextRoundTarget(target: string): string {
  const match = normalize(target).match(/(\d+)\s*round/);

  if (!match) {
    return `${target}, +1 round maximum`;
  }

  return target.replace(/\d+\s*rounds?/i, `${Number(match[1]) + 1} rounds`);
}

function resetRepTargetToLowEnd(originalTarget: string, target: ParsedTarget): string {
  if (!target.sets || !target.minReps || !target.maxReps || target.minReps === target.maxReps) {
    return originalTarget;
  }

  return `${target.sets} x ${target.minReps}-${target.maxReps}`;
}

function reduceTarget(target: string): string {
  const parsed = parseTarget(target);

  if (parsed.minutes) {
    return `${Math.max(10, parsed.minutes - 5)} min facile`;
  }

  if (parsed.sets && parsed.minReps) {
    return `${Math.max(1, parsed.sets - 1)} x ${parsed.minReps}`;
  }

  return `${target}, volume réduit`;
}

function keepSame(exercise: Exercise, load: ParsedLoad): ProgressionResult {
  return {
    nextLoad: formatLoad(load),
    nextTarget: exercise.target,
    decision: "maintenir",
    reason: "Prescription conservée."
  };
}

function hasBreathAlert(breath: BreathFeedback | string, comment: string): boolean {
  const normalizedBreath = normalize(String(breath));

  return includesAny(normalizedBreath, ["tres-mauvais", "tres mauvais", "vertige", "oppression"]) ||
    safetyPatterns.some((pattern) => comment.includes(normalize(pattern)));
}

function mentionsVeryEasy(comment: string): boolean {
  return includesAny(comment, ["tres facile", "beaucoup plus", "large", "facile facile", "rpe bas"]);
}

function mentionsLackOfTime(comment: string): boolean {
  return includesAny(comment, ["manque de temps", "pas eu le temps", "temps", "presse"]);
}

function hasLowSleep(sleepHours: number | undefined): boolean {
  return sleepHours !== undefined && sleepHours < 5;
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(normalize(needle)));
}

function appendWarning(current: string | undefined, next: string): string {
  return current ? `${current} ${next}` : next;
}

function withDecisionMetadata(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext
): ProgressionResult {
  const withMetadata = {
    ...result,
    decisionCode: getDecisionCode(result),
    nextReps: getNextReps(result.nextTarget),
    nextSets: getNextSets(result.nextTarget),
    confidence: getDecisionConfidence(result, input),
    evidenceTag: getEvidenceTag(result, input, context)
  };

  return {
    ...withMetadata,
    adaptationExplanation: buildAdaptationExplanation(withMetadata, input.plannedExercise.name)
  };
}

function getDecisionCode(result: ProgressionResult): ProgressionDecisionCode {
  if (result.decision === "augmenter") return "increase";
  if (result.decision === "baisser") return "decrease";
  if (result.decision === "remplacer") return "replace";
  if (result.decision === "alerte") return "watch";

  return "maintain";
}

function getNextSets(target: string): string | undefined {
  const match = normalize(target).match(/(\d+)\s*x\s*\d+/);
  return match?.[1];
}

function getNextReps(target: string): string | undefined {
  const match = normalize(target).match(/\d+\s*x\s*(\d+(?:\s*-\s*\d+)?)/);
  return match?.[1]?.replace(/\s/g, "");
}

function getDecisionConfidence(result: ProgressionResult, input: ProgressionInput): ProgressionConfidence {
  const text = normalize(`${result.reason} ${result.warning ?? ""}`);

  if (!input.performance.usedLoad.trim() && !input.performance.completedReps.trim()) {
    return "low";
  }

  if (result.decision === "alerte" || input.globalPain >= 4 || includesAny(text, ["vertige", "oppression", "alerte forte"])) {
    return "low";
  }

  if (result.warning || (input.recentPainCount ?? 0) > 0 || (input.recentStagnationCount ?? 0) > 0) {
    return "medium";
  }

  return "high";
}

function getEvidenceTag(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext
): ProgressionEvidenceTag {
  const text = normalize(`${result.reason} ${result.warning ?? ""}`);

  if (includesAny(text, ["douleur", "poignet", "epaule", "genou", "dos", "tendinite"])) return "pain_rule";
  if (includesAny(text, ["sommeil", "fatigue", "energie", "difficulte"])) return "fatigue_rule";
  if (context.isJudoDay || includesAny(text, ["judo", "tatami", "grip"])) return "judo_rule";
  if (context.kind === "cardio" || includesAny(text, ["cardio", "hiit", "intervalles", "souffle"])) return "cardio_rule";
  if (includesAny(text, ["volume", "series/semaine", "hebdomadaire"])) return "volume_rule";
  if (includesAny(text, ["stagnation", "expositions", "reps/repos/tempo", "trop dur"])) return "stagnation_rule";
  if (includesAny(text, ["garde-fou", "structure", "machine occupee", "indisponibilite", "remplacement durable"])) {
    return "guardrail_rule";
  }
  if ((input.recentHardCount ?? 0) >= 2 || (input.recentUnavailableCount ?? 0) > 0) return "guardrail_rule";

  return "progression_rule";
}

function sanitizeProgression(result: ProgressionResult): ProgressionResult {
  return {
    ...result,
    reason: sanitizeRecommendationText(result.reason),
    warning: result.warning ? sanitizeRecommendationText(result.warning) : undefined,
    replacementSuggestion: result.replacementSuggestion
      ? sanitizeRecommendationText(result.replacementSuggestion)
      : undefined
  };
}

function sanitizeRecommendationText(value: string): string {
  let next = value;

  for (const banned of bannedRecommendationPatterns) {
    const regex = new RegExp(banned, "gi");
    next = next.replace(regex, "option non recommandée");
  }

  return next;
}

function formatDecisionLabel(decision: ProgressionDecision): string {
  const labels: Record<ProgressionDecision, string> = {
    augmenter: "augmenter",
    maintenir: "maintenir",
    baisser: "baisser",
    remplacer: "remplacer",
    alerte: "alerte"
  };

  return labels[decision];
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, " ")
    .trim();
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export const progressionExamples = [
  {
    name: "OK sans commentaire ni reps: considere comme valide",
    input: {
      plannedExercise: {
        id: "bench",
        name: "Développé couché",
        target: "5x5",
        plannedLoad: "90 kg",
        rest: "2min30",
        cue: "Contrôle et trajectoire stable."
      },
      performance: { usedLoad: "", completedReps: "", comment: "" },
      feedback: "ok",
      sessionDifficulty: 6,
      globalPain: 0,
      energy: 7,
      breath: "bon"
    } satisfies ProgressionInput,
    expectedDecision: "augmenter" satisfies ProgressionDecision
  },
  {
    name: "Isolation facile: reps avant charge",
    input: {
      plannedExercise: {
        id: "curl-cable",
        name: "Curl câble",
        target: "3x12-15",
        plannedLoad: "20 kg",
        rest: "90 sec",
        cue: "Coudes fixes."
      },
      performance: { usedLoad: "20 kg", completedReps: "12/12/12", comment: "" },
      feedback: "easy",
      sessionDifficulty: 5,
      globalPain: 0,
      energy: 8,
      breath: "bon"
    } satisfies ProgressionInput,
    expectedDecision: "maintenir" satisfies ProgressionDecision
  },
  {
    name: "Douleur poignet sur bench: pas de hausse",
    input: {
      plannedExercise: {
        id: "bench",
        name: "Développé couché",
        target: "5x5",
        plannedLoad: "90 kg",
        rest: "2min30",
        cue: "Contrôle."
      },
      performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "douleur poignet droit" },
      feedback: "easy",
      sessionDifficulty: 5,
      globalPain: 0,
      energy: 8,
      breath: "bon"
    } satisfies ProgressionInput,
    expectedDecision: "remplacer" satisfies ProgressionDecision
  }
];

export function runProgressionExamples() {
  return progressionExamples.map((example) => ({
    name: example.name,
    expectedDecision: example.expectedDecision,
    result: calculateProgression(example.input)
  }));
}
