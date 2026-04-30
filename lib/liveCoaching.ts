import { calculateProgression } from "@/lib/progression";
import type {
  Exercise,
  ExerciseLog,
  PlannedSession,
  ProgressionDecision,
  SessionFeedback
} from "@/types/training";

export type LiveCoachTone = "calm" | "info" | "warn" | "danger";

export type LiveCoachAdvice = {
  decision: ProgressionDecision;
  message: string;
  nextLoad: string;
  nextTarget: string;
  primaryAction: string;
  reason: string;
  replacementSuggestion?: string;
  title: string;
  tone: LiveCoachTone;
  warning?: string;
};

export type LiveCoachInput = {
  exercise: Exercise;
  feedback: SessionFeedback;
  log: ExerciseLog;
  session: PlannedSession;
};

export function getLiveCoachAdvice(input: LiveCoachInput): LiveCoachAdvice | undefined {
  const status = input.log.status;

  if (!status) {
    return undefined;
  }

  const result = calculateProgression({
    plannedExercise: input.exercise,
    performance: input.log,
    feedback: status,
    comment: input.log.comment,
    sessionDifficulty: input.feedback.difficulty,
    globalPain: input.feedback.globalPain,
    energy: input.feedback.energy,
    breath: input.feedback.breath,
    session: input.session
  });

  const preset = getAdvicePreset({
    decision: result.decision,
    status,
    hasReplacement: Boolean(result.replacementSuggestion),
    hasWarning: Boolean(result.warning)
  });

  return {
    decision: result.decision,
    message: preset.message,
    nextLoad: result.nextLoad,
    nextTarget: result.nextTarget,
    primaryAction: preset.primaryAction,
    reason: result.reason,
    replacementSuggestion: result.replacementSuggestion,
    title: preset.title,
    tone: preset.tone,
    warning: result.warning
  };
}

function getAdvicePreset({
  decision,
  hasReplacement,
  hasWarning,
  status
}: {
  decision: ProgressionDecision;
  hasReplacement: boolean;
  hasWarning: boolean;
  status: ExerciseLog["status"];
}): Pick<LiveCoachAdvice, "message" | "primaryAction" | "title" | "tone"> {
  if (status === "pain" || decision === "alerte") {
    return {
      message: "Stoppe l'exercice si le signal revient, augmente ou change ton geste. On privilegie une variante sans douleur.",
      primaryAction: hasReplacement ? "Voir une alternative" : "Arreter ou alleger fortement",
      title: "Stop securite",
      tone: "danger"
    };
  }

  if (decision === "remplacer" || hasReplacement) {
    return {
      message: "Cet exercice n'est pas le meilleur choix ce soir. Remplace-le par une variante plus stable et note la raison.",
      primaryAction: "Remplacer maintenant",
      title: "Remplacement conseille",
      tone: "danger"
    };
  }

  if (decision === "baisser") {
    return {
      message: "Le retour indique que la prescription est trop haute aujourd'hui. Reduis la charge, le volume ou garde plus de marge.",
      primaryAction: "Baisser la difficulte",
      title: "Allege maintenant",
      tone: "warn"
    };
  }

  if (status === "hard" || hasWarning) {
    return {
      message: "Tu peux finir proprement, mais sans forcer la progression. Le prochain passage doit consolider avant de charger.",
      primaryAction: "Maintenir et surveiller",
      title: "Garde la charge",
      tone: "warn"
    };
  }

  if (decision === "augmenter") {
    return {
      message: "La seance valide une progression prudente. Ne transforme pas le reste de la seance en test max: note, puis progresse au prochain passage.",
      primaryAction: "Noter la progression",
      title: status === "easy" ? "Progression possible" : "Progression calculee",
      tone: "info"
    };
  }

  if (status === "skipped") {
    return {
      message: "L'exercice est saute sans penalite. La prescription reste disponible pour une prochaine exposition.",
      primaryAction: "Passer a la suite",
      title: "Exercice non fait",
      tone: "info"
    };
  }

  return {
    message: "La prescription reste adaptee pour l'instant. Continue proprement et garde une marge technique.",
    primaryAction: "Maintenir",
    title: "Prescription stable",
    tone: "calm"
  };
}
