import type {
  BreathFeedback,
  CautionLevel,
  ExperienceLevel,
  EffortStatus,
  Exercise,
  ExerciseHistoryPoint,
  ExerciseLog,
  ExerciseProgressionLog,
  MuscleGroup,
  PlannedSession,
  PrimaryGoal,
  ProgressionDecision
} from "@/types/training";
import {
  applyGuardrails,
  type ExerciseKind,
  type GuardrailInput,
  type GuardrailResult
} from "@/lib/guardrails";
import { getExerciseLoadDisplay, getExerciseTargetNumbers } from "@/lib/programSchema";

export type ExercisePerformance = Pick<ExerciseLog, "usedLoad" | "completedReps" | "comment" | "rir" | "rpe">;

/**
 * Optional context injected from storage.ts (Prompt 1C).
 * When undefined, guardrails fall back to neutral defaults (no judo, empty volume).
 */
export type ProgressionSessionContext = {
  benchOneRepMaxKg?: number;
  cautionLevel?: CautionLevel;
  experienceLevel?: ExperienceLevel;
  primaryGoal?: PrimaryGoal;
  recoveryProfile?: "poor" | "irregular" | "regular" | "good";
  weeklySetsByMuscle?: Partial<Record<MuscleGroup, number>>;
  judoTonight?: boolean;
  judoTomorrow?: boolean;
  weeksSinceLastChange?: number;
  recentHistory?: ExerciseHistoryPoint[];
};

export type ProgressionInput = {
  plannedExercise: Exercise;
  performance: ExercisePerformance;
  feedback: EffortStatus;
  comment?: string;
  sessionDifficulty: number;
  globalPain: number;
  energy: number;
  breath: BreathFeedback | string;
  session?: PlannedSession;
};

export type ProgressionResult = {
  nextLoad: string;
  nextTarget: string;
  decision: ProgressionDecision;
  reason: string;
  warning?: string;
  replacementSuggestion?: string;
  guardrailResult?: GuardrailResult;
};

export type ProgressionSummary = {
  progressing: string[];
  unchanged: string[];
  watch: string[];
  nextSessionAdjustments: string[];
};

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
  isFridayJudo: boolean;
  isJudoDay: boolean;
  isGripHeavy: boolean;
  isViolentCardio: boolean;
};

type RecentExerciseSignal = {
  hardCount: number;
  maintainCount: number;
  painCount: number;
};

type CommentSignals = {
  alerts: string[];
  bodyParts: Array<"back" | "knee" | "shoulder" | "wrist">;
  hasPainLanguage: boolean;
  safetyAlert?: string;
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

export function calculateProgression(
  input: ProgressionInput,
  sessionContext?: ProgressionSessionContext
): ProgressionResult {
  const comment = normalize(`${input.performance.comment} ${input.comment ?? ""}`);
  const context = getExerciseContext(input.plannedExercise, input.session);
  const target = getParsedTarget(input.plannedExercise);
  const load = parseLoad(input.performance.usedLoad || getExerciseLoadDisplay(input.plannedExercise) || input.plannedExercise.plannedLoad);
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
  } else if (input.globalPain >= 4) {
    result = {
      nextLoad: reduceLoad(load, 10),
      nextTarget: reduceTarget(input.plannedExercise.target),
      decision: "alerte",
      reason: "Douleur globale a 4/10 ou plus: la prochaine seance doit etre reduite.",
      warning: "Alerte prudence: reduire l'intensite globale et ne pas chercher de progression."
    };
  } else if (context.kind === "cardio") {
    result = progressCardio(input, context, comment);
  } else if (effectiveFeedback === "skipped") {
    result = {
      ...keepSame(input.plannedExercise, load),
      reason: "Exercice non fait: prescription conservee, sans compter comme un echec."
    };
  } else if (effectiveFeedback === "hard") {
    result = progressHard(input, load, completed, comment);
  } else if (effectiveFeedback === "easy") {
    result = progressEasy(input.plannedExercise, context.kind, load, target, completed, comment);
  } else if (effectiveFeedback === "ok" && completed.allValidated) {
    result = progressOk(input.plannedExercise, context.kind, load, target, completed);
  } else {
    result = {
      ...keepSame(input.plannedExercise, load),
      reason: "Retour OK mais les series ne semblent pas toutes validees: maintien de la prescription."
    };
  }

  const finalized = applyAdaptiveMemory(
    applyGoalSpecificProgression(
      applyRirAutoregulation(finalizeProgression(result, input, context, commentSignals, load), input, context, target, completed, load),
      input,
      context,
      target,
      completed,
      load,
      sessionContext
    ),
    input,
    context,
    load,
    sessionContext
  );
  return runGuardrails(finalized, input, load, comment, commentSignals, sessionContext);
}

function applyRirAutoregulation(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext,
  target: ParsedTarget,
  completed: CompletionState,
  load: ParsedLoad
): ProgressionResult {
  const rir = input.performance.rir;

  if (rir === undefined || context.kind === "cardio" || input.feedback === "pain" || input.feedback === "skipped") {
    return result;
  }

  if (rir >= 3 && result.decision === "augmenter") {
    return {
      ...result,
      nextLoad: formatLoad(load),
      nextTarget: nextRepTarget(input.plannedExercise.target, target, 1),
      decision: "maintenir",
      reason: `${result.reason} RIR ${rir}: marge importante, le moteur ajoute d'abord des reps avant de charger.`,
      warning: appendWarning(result.warning, "Auto-regulation RIR: progression en repetitions avant hausse de charge.")
    };
  }

  if (rir <= 1 && !completed.allValidated && result.decision === "augmenter") {
    return {
      ...result,
      nextLoad: formatLoad(load),
      decision: "maintenir",
      reason: `${result.reason} RIR ${rir} avec prescription incomplete: hausse annulee.`,
      warning: appendWarning(result.warning, "Auto-regulation RIR: trop proche de l'echec pour monter la charge.")
    };
  }

  return result;
}

function applyAdaptiveMemory(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext,
  load: ParsedLoad,
  sessionContext?: ProgressionSessionContext
): ProgressionResult {
  let next = { ...result };
  const history = sessionContext?.recentHistory ?? [];
  const recentDone = history.filter((item) => item.rpe > 0).slice(0, 4);
  const recentHardCount = recentDone.filter((item) =>
    item.status === "hard" || item.rpe >= 8.5 || (item.energy !== undefined && item.energy <= 3)
  ).length;
  const recentPainCount = recentDone.filter((item) =>
    item.status === "pain" || item.globalPain !== undefined && item.globalPain >= 4 ||
    item.decision === "remplacer" || item.decision === "alerte"
  ).length;
  const recentMaintains = recentDone.filter((item) => item.decision === "maintenir").length;
  const recentSignal: RecentExerciseSignal = {
    hardCount: recentHardCount,
    maintainCount: recentMaintains,
    painCount: recentPainCount
  };
  const deloadWindow = isProgrammedDeload(input.session);
  const recoveryLimited =
    sessionContext?.recoveryProfile === "poor" ||
    sessionContext?.recoveryProfile === "irregular" && recentHardCount >= 2;

  if (recentPainCount >= 2 && next.decision === "augmenter") {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      decision: "maintenir",
      reason: `${next.reason} Memoire exercice: douleur repetee recemment, hausse suspendue.`,
      warning: appendWarning(next.warning, "Douleur repetee sur cet exercice: garder une marge ou choisir une variante stable.")
    };
  }

  if ((deloadWindow || recoveryLimited || recentHardCount >= 2) && next.decision === "augmenter") {
    const reason = deloadWindow
      ? "Semaine plus legere programmee: consolidation avant nouvelle hausse."
      : "Fatigue repetee sur cet exercice: consolidation avant nouvelle hausse.";
    next = {
      ...next,
      nextLoad: formatLoad(load),
      decision: "maintenir",
      reason: `${next.reason} ${reason}`,
      warning: appendWarning(next.warning, "Le moteur bloque la progression tant que la recuperation n'est pas redevenue stable.")
    };
  }

  if (
    context.kind !== "cardio" &&
    next.decision === "maintenir" &&
    input.feedback === "hard" &&
    shouldTriggerLocalDeload(recentSignal)
  ) {
    next = {
      nextLoad: reduceLoad(load, 5),
      nextTarget: reduceTarget(input.plannedExercise.target),
      decision: "baisser",
      reason: `${next.reason} Historique difficile repete sur cet exercice: baisse temporaire avant de reconstruire.`,
      warning: appendWarning(
        next.warning,
        "Baisse temporaire: baisser legerement la charge ou le volume sur cet exercice pendant 1 a 2 expositions."
      )
    };
  }

  if (recentMaintains >= 3 && next.decision === "maintenir" && input.feedback !== "hard") {
    next = {
      ...next,
      decision: "remplacer",
      replacementSuggestion: next.replacementSuggestion ?? getStimulusVariationSuggestion(input.plannedExercise, context.kind),
      reason: `${next.reason} Stagnation detectee sur plusieurs passages: changer le stimulus plutot que repeter a l'identique.`,
      warning: appendWarning(next.warning, "Stagnation: essayer une variante proche, un tempo controle ou une plage de reps differente.")
    };
  }

  if (next.decision === "augmenter") {
    next = applyProfileCaps(next, input, context, load, sessionContext);
  }

  return next;
}

function applyGoalSpecificProgression(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext,
  target: ParsedTarget,
  completed: CompletionState,
  load: ParsedLoad,
  sessionContext?: ProgressionSessionContext
): ProgressionResult {
  const goal = sessionContext?.primaryGoal;

  if (!goal || context.kind === "cardio") {
    return result;
  }

  if (goal === "performance") {
    return applyPerformanceGoalProgression(result, input, context, completed, load);
  }

  if (goal === "prise-masse") {
    return applyRepFirstGoalProgression(
      result,
      input,
      context,
      target,
      completed,
      load,
      "Objectif prise de masse: le moteur prolonge le travail dans la fourchette avant d'ajouter de la charge."
    );
  }

  if (goal === "perte-gras") {
    return applyRepFirstGoalProgression(
      result,
      input,
      context,
      target,
      completed,
      load,
      "Objectif perte de gras: charge conservee et progression en repetitions pour proteger la recuperation."
    );
  }

  return result;
}

function applyPerformanceGoalProgression(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext,
  completed: CompletionState,
  load: ParsedLoad
): ProgressionResult {
  if (
    result.decision === "maintenir" &&
    input.feedback === "easy" &&
    completed.allValidated &&
    isPerformanceLoadPriorityKind(context.kind) &&
    load.value
  ) {
    return {
      ...result,
      nextLoad: increaseLoad(load, context.kind === "leg-machine" ? 5 : 2.5),
      nextTarget: input.plannedExercise.target,
      decision: "augmenter",
      reason: `${result.reason} Objectif performance: le moteur privilegie une hausse de charge sur un mouvement prioritaire valide.`,
      warning: appendWarning(result.warning, "Profil performance: progression de charge priorisee quand l'execution reste propre.")
    };
  }

  return result;
}

function applyRepFirstGoalProgression(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext,
  target: ParsedTarget,
  completed: CompletionState,
  load: ParsedLoad,
  goalReason: string
): ProgressionResult {
  if (
    result.decision !== "augmenter" ||
    !load.value ||
    !hasRepRange(target) ||
    completed.topOfRange ||
    !isRepFirstKind(context.kind)
  ) {
    return result;
  }

  const repStep = input.feedback === "easy" ? 2 : 1;

  return {
    ...result,
    nextLoad: formatLoad(load),
    nextTarget: nextRepTarget(input.plannedExercise.target, target, repStep),
    decision: "maintenir",
    reason: `${result.reason} ${goalReason}`,
    warning: appendWarning(result.warning, "Progression orientee repetitions avant hausse de charge.")
  };
}

function shouldTriggerLocalDeload(signal: RecentExerciseSignal): boolean {
  return signal.painCount === 0 && signal.hardCount >= 2 && signal.maintainCount >= 1;
}

function applyProfileCaps(
  result: ProgressionResult,
  input: ProgressionInput,
  context: ExerciseContext,
  load: ParsedLoad,
  sessionContext?: ProgressionSessionContext
): ProgressionResult {
  let next = { ...result };
  const proposed = parseLoad(next.nextLoad);
  const current = load.value;

  if (!current || !proposed.value || proposed.value <= current) {
    return next;
  }

  if (sessionContext?.cautionLevel === "prudent") {
    const delta = proposed.value - current;
    const cautiousDelta = Math.max(0.5, roundToHalf(delta * 0.5));
    next = {
      ...next,
      nextLoad: formatLoad({ ...load, value: roundToHalf(current + cautiousDelta) }),
      reason: `${next.reason} Profil prudent: increment reduit automatiquement.`
    };
  }

  const oneRm = sessionContext?.benchOneRepMaxKg;
  if (context.kind === "bench" && oneRm && oneRm > 0) {
    const capRatio = sessionContext?.cautionLevel === "agressif" ? 0.88 : sessionContext?.cautionLevel === "prudent" ? 0.82 : 0.85;
    const capKg = roundToHalf(oneRm * capRatio);
    const cappedProposed = parseLoad(next.nextLoad);

    if (cappedProposed.value && cappedProposed.value > capKg) {
      const cappedLoad = Math.min(cappedProposed.value, capKg);
      if (cappedLoad <= current) {
        next = {
          ...next,
          nextLoad: formatLoad(load),
          decision: "maintenir",
          reason: `${next.reason} Plafond 1RM atteint: pas de hausse au-dessus de ${Math.round(capRatio * 100)}% du 1RM connu.`,
          warning: appendWarning(next.warning, "Mettre a jour le 1RM si cette charge est devenue trop facile.")
        };
      } else {
        next = {
          ...next,
          nextLoad: formatLoad({ ...load, value: cappedLoad }),
          warning: appendWarning(next.warning, `Charge plafonnee par le 1RM connu (${oneRm} kg).`)
        };
      }
    }
  }

  if (sessionContext?.experienceLevel === "debutant" && next.decision === "augmenter") {
    next.warning = appendWarning(next.warning, "Niveau debutant: priorite a la technique avant d'accelerer les charges.");
  }

  if (sessionContext?.primaryGoal === "perte-gras" && input.energy <= 4) {
    next = {
      ...next,
      nextLoad: formatLoad(load),
      decision: "maintenir",
      reason: `${next.reason} Objectif perte de gras avec energie basse: maintien pour preserver la recuperation.`,
      warning: appendWarning(next.warning, "En deficit, le moteur privilegie la regularite a la hausse de charge.")
    };
  }

  return next;
}

function runGuardrails(
  result: ProgressionResult,
  input: ProgressionInput,
  load: ParsedLoad,
  comment: string,
  commentSignals: CommentSignals,
  sessionContext?: ProgressionSessionContext
): ProgressionResult {
  const muscleGroups: MuscleGroup[] = input.plannedExercise.muscleGroups ?? [];
  const weeklySetsByMuscle: Record<MuscleGroup, number> = {
    pectoraux: 0,
    dos: 0,
    epaules: 0,
    biceps: 0,
    triceps: 0,
    jambes: 0,
    abdos: 0,
    cardio: 0,
    autre: 0
  };
  if (sessionContext?.weeklySetsByMuscle) {
    for (const [k, v] of Object.entries(sessionContext.weeklySetsByMuscle)) {
      weeklySetsByMuscle[k as MuscleGroup] = v ?? 0;
    }
  }

  const guardrailInput: GuardrailInput = {
    exerciseId: input.plannedExercise.id,
    exerciseName: input.plannedExercise.name,
    exerciseKind: getExerciseKind(input.plannedExercise),
    muscleGroups,
    proposedDecision: result.decision,
    proposedLoad: result.nextLoad,
    currentLoad: formatLoad(load),
    recentHistory: sessionContext?.recentHistory ?? [],
    weeklySetsByMuscle,
    sessionRPE: input.sessionDifficulty,
    judoTonight: sessionContext?.judoTonight ?? false,
    judoTomorrow: sessionContext?.judoTomorrow ?? false,
    weeksSinceLastChange: sessionContext?.weeksSinceLastChange ?? Number.POSITIVE_INFINITY,
    hasNewPain: input.feedback === "pain" || commentSignals.hasPainLanguage,
    painKeywords: comment ? [comment] : []
  };

  const guardrail = applyGuardrails(guardrailInput);

  let next: ProgressionResult = { ...result, guardrailResult: guardrail };

  // Block-violations override the algorithmic decision and load
  const hasBlock = guardrail.violations.some((v) => v.severity === "block");
  if (hasBlock && guardrail.adjustedDecision !== result.decision) {
    next = {
      ...next,
      decision: guardrail.adjustedDecision,
      nextLoad: guardrail.adjustedLoad ?? formatLoad(load)
    };
  } else if (guardrail.adjustedLoad && guardrail.adjustedLoad !== result.nextLoad) {
    // Warn-level cap (e.g. load increase plafonné) → ajuste juste la charge
    next = { ...next, nextLoad: guardrail.adjustedLoad };
  }

  // Annoter le warning avec les violations textuelles
  const warnReasons = guardrail.violations
    .filter((v) => v.severity === "warn")
    .map((v) => v.reason);
  if (warnReasons.length > 0) {
    next = { ...next, warning: appendWarning(next.warning, warnReasons.join(" ")) };
  }

  return next;
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
    return {
      nextLoad: increaseLoad(load, veryEasy ? 10 : 5),
      nextTarget: exercise.target,
      decision: load.value ? "augmenter" : "maintenir",
      reason: veryEasy ? "Presse tres facile: +10 kg possible." : "Presse facile: +5 kg prudent."
    };
  }

  if (kind === "upper-machine") {
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
    if (context.isJudoDay && context.isViolentCardio) {
      return {
        nextLoad: "Tapis incline, rameur facile ou Stairmaster doux",
        nextTarget: input.plannedExercise.target,
        decision: "maintenir",
        reason: "Jour de judo: ne pas ajouter de cardio violent avant le tatami.",
        warning: "Priorite au souffle durable, pas aux intervalles intenses avant judo."
      };
    }

    return {
      nextLoad: "Meme intensite ou +1 % inclinaison",
      nextTarget: target.minutes ? `${target.minutes + 5} min` : `${input.plannedExercise.target} + 5 min`,
      decision: "augmenter",
      reason: "Cardio facile: ajouter 5 min ou 1 % d'inclinaison, en priorisant tapis incline, rameur ou Stairmaster."
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

  return sanitizeProgression(next);
}

function getExerciseContext(exercise: Exercise, session?: PlannedSession): ExerciseContext {
  const kind = getExerciseKind(exercise);
  const text = normalize(`${exercise.id} ${exercise.name} ${exercise.cue}`);
  const isJudoDay = session?.weekday === "monday" || session?.weekday === "friday";
  const isFridayJudo = session?.weekday === "friday";

  return {
    kind,
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
    isViolentCardio: includesAny(text, ["intervalles", "sprint", "hiit", "fort", "course"])
  };
}

function getExerciseKind(exercise: Exercise): ExerciseKind {
  const taxonomyKind = exercise.taxonomy?.pattern ? patternToExerciseKind(exercise.taxonomy.pattern) : undefined;
  if (taxonomyKind) {
    return taxonomyKind;
  }

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

function patternToExerciseKind(pattern: NonNullable<Exercise["taxonomy"]>["pattern"]): ExerciseKind | undefined {
  if (!pattern) return undefined;
  if (pattern === "cardio-hiit" || pattern === "cardio-steady") return "cardio";
  if (pattern === "chest-compound") return "bench";
  if (pattern === "legs-quad") return "leg-machine";
  if (pattern === "legs-hinge") return "hinge";
  if (
    pattern === "arms-biceps" ||
    pattern === "arms-triceps" ||
    pattern === "chest-isolation" ||
    pattern === "legs-calf" ||
    pattern === "shoulders-lateral" ||
    pattern === "shoulders-rear"
  ) {
    return "isolation";
  }
  if (
    pattern === "back-horizontal" ||
    pattern === "back-vertical" ||
    pattern === "shoulders-compound" ||
    pattern === "fullbody"
  ) {
    return "upper-machine";
  }
  return undefined;
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

function isPerformanceLoadPriorityKind(kind: ExerciseKind): boolean {
  return kind === "bench" || kind === "hinge" || kind === "leg-machine" || kind === "upper-machine";
}

function isRepFirstKind(kind: ExerciseKind): boolean {
  return kind === "upper-machine" || kind === "leg-machine" || kind === "isolation";
}

function hasRepRange(target: ParsedTarget): boolean {
  return Boolean(target.sets && target.minReps && target.maxReps && target.maxReps > target.minReps);
}

function getStimulusVariationSuggestion(exercise: Exercise, kind: ExerciseKind): string {
  const pattern = exercise.taxonomy?.pattern;

  if (kind === "bench" || pattern === "chest-compound") {
    return "Chest press convergente, developpe incline machine ou meme mouvement en 3 x 8-10 tempo controle.";
  }

  if (kind === "leg-machine" || pattern === "legs-quad") {
    return "Hack squat, presse pieds differents ou meme charge avec tempo 3 secondes en descente.";
  }

  if (kind === "hinge" || pattern === "legs-hinge") {
    return "Hip thrust, leg curl lourd ou RDL plus leger avec tempo controle.";
  }

  if (kind === "isolation") {
    return "Meme muscle en poulie ou machine, plage 12-20 reps avec controle strict.";
  }

  if (kind === "cardio") {
    return "Changer de modalite cardio douce: tapis incline, rameur facile ou velo zone 2.";
  }

  return "Variante proche avec meme groupe musculaire, charge controlee et meilleure sensation.";
}

function isProgrammedDeload(session?: PlannedSession): boolean {
  if (!session) return false;
  if (session.phase === "deload") return true;
  if (!session.weekIndex || !session.deloadEvery) return false;
  return session.weekIndex > 0 && session.weekIndex % session.deloadEvery === 0;
}

function getParsedTarget(exercise: Exercise): ParsedTarget {
  const structured = getExerciseTargetNumbers(exercise);

  if (
    structured.sets ||
    structured.minReps ||
    structured.maxReps ||
    structured.minutes
  ) {
    return {
      sets: structured.sets,
      minReps: structured.minReps,
      maxReps: structured.maxReps,
      minutes: structured.minutes
    };
  }

  return parseTarget(exercise.target);
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

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(normalize(needle)));
}

function appendWarning(current: string | undefined, next: string): string {
  return current ? `${current} ${next}` : next;
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
