import type { DailyJudoChoice, PlannedSession, ProgramGoal, ProgressionStyle, UserSettings, Weekday } from "@/types/training";

export const goalLabels: Record<ProgramGoal, string> = {
  fat_loss: "Perte de gras",
  muscle_gain: "Prise de muscle",
  strength: "Force",
  recomposition: "Recomposition",
  cardio_health: "Cardio / sante",
  judo_prep: "Preparation judo",
  custom_mix: "Mix personnalise"
};

export const progressionStyleLabels: Record<ProgressionStyle, string> = {
  regular: "Regulier",
  dynamic: "Dynamique",
  controlled_aggressive: "Agressif controle"
};

export const progressionStyleDescriptions: Record<ProgressionStyle, string> = {
  regular: "Progression lente et stable.",
  dynamic: "Progression normale selon les sensations.",
  controlled_aggressive: "Progression ambitieuse avec garde-fous douleur et fatigue."
};

export const dailyJudoLabels: Record<DailyJudoChoice, string> = {
  judo: "Aujourd'hui je fais judo",
  no_judo: "Aujourd'hui je ne fais pas judo",
  replace_cardio: "Je remplace par cardio",
  strength_only: "Je garde seulement muscu"
};

const weekdayOrder: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const goalPriority: Record<ProgramGoal, string[]> = {
  fat_loss: ["cardio", "lower", "full", "upper-volume", "upper-force", "shoulders"],
  muscle_gain: ["upper-volume", "lower", "full", "upper-force", "shoulders", "cardio"],
  strength: ["upper-force", "lower", "full", "upper-volume", "shoulders", "cardio"],
  recomposition: ["upper-force", "lower", "upper-volume", "cardio", "shoulders", "full"],
  cardio_health: ["cardio", "lower", "full", "upper-volume", "upper-force", "shoulders"],
  judo_prep: ["upper-force", "lower", "cardio", "shoulders", "full", "upper-volume"],
  custom_mix: ["upper-force", "lower", "upper-volume", "cardio", "shoulders", "full"]
};

export function personalizeProgram(program: PlannedSession[], settings: UserSettings): PlannedSession[] {
  const selectedIds = pickSessionIds(program, settings);

  return program
    .filter((session) => selectedIds.has(session.id))
    .map((session) => tuneSessionForGoal(session, settings))
    .sort((left, right) => weekdayOrder.indexOf(left.weekday) - weekdayOrder.indexOf(right.weekday));
}

export function getGoalPriorities(goal: ProgramGoal): string[] {
  const labels: Record<ProgramGoal, string[]> = {
    fat_loss: ["Deficit propre", "Cardio zone 2", "Volume musculaire maintenu"],
    muscle_gain: ["Volume musculation", "Progression reps", "Recuperation"],
    strength: ["Charges lourdes", "Repos long", "Technique"],
    recomposition: ["Muscle + cardio", "Regularite", "Tour de taille"],
    cardio_health: ["Souffle", "Zone 2", "Fatigue basse"],
    judo_prep: ["Judo frais", "Grip protege", "Conditioning utile"],
    custom_mix: ["Priorites libres", "Equilibre semaine", "Adaptation terrain"]
  };

  return labels[goal];
}

export function getGoalPlanSummary(settings: UserSettings) {
  const volume = {
    fat_loss: "modere",
    muscle_gain: "eleve",
    strength: "cible lourd",
    recomposition: "equilibre",
    cardio_health: "leger a modere",
    judo_prep: "utile sans casser le judo",
    custom_mix: "ajuste"
  }[settings.mainObjective];

  const cardio = {
    fat_loss: "prioritaire",
    muscle_gain: "entretien",
    strength: "minimal controle",
    recomposition: "regulier",
    cardio_health: "prioritaire",
    judo_prep: "oriente souffle et recuperation",
    custom_mix: "selon disponibilites"
  }[settings.mainObjective];

  return {
    volume,
    cardio,
    frequency: `${settings.sessionsPerWeek} seances/semaine`,
    progression: progressionStyleLabels[settings.progressionStyle]
  };
}

export function getDailyJudoAdvice(settings: UserSettings, dateKey: string): string {
  const choice = settings.dailyJudoChoiceDateKey === dateKey ? settings.dailyJudoChoice : "judo";

  if (choice === "no_judo") {
    return "Judo retire pour aujourd'hui sans echec: marche, mobilite, cardio doux ou repos selon energie.";
  }

  if (choice === "replace_cardio") {
    return "Judo remplace par cardio: vise zone 2 ou intervalles controles, sans impact inutile.";
  }

  if (choice === "strength_only") {
    return "Muscu seulement: garde la seance, sans ajouter de dette de fatigue pour demain.";
  }

  return "Judo maintenu: preserve le grip et garde une marge sur les accessoires.";
}

function pickSessionIds(program: PlannedSession[], settings: UserSettings): Set<string> {
  const trainingSessions = program.filter((session) => session.weekday !== "sunday");
  const available = settings.availableDays.length ? settings.availableDays : weekdayOrder;
  const availableSessions = trainingSessions.filter((session) => available.includes(session.weekday));
  const pool = availableSessions.length >= settings.sessionsPerWeek ? availableSessions : trainingSessions;
  const priorities = goalPriority[settings.mainObjective];
  const ranked = [...pool].sort((left, right) => {
    const leftRank = getSessionRank(left, priorities, settings);
    const rightRank = getSessionRank(right, priorities, settings);

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return weekdayOrder.indexOf(left.weekday) - weekdayOrder.indexOf(right.weekday);
  });

  return new Set(ranked.slice(0, settings.sessionsPerWeek).map((session) => session.id));
}

function getSessionRank(session: PlannedSession, priorities: string[], settings: UserSettings): number {
  const signature = getSessionSignature(session);
  const baseRank = priorities.findIndex((priority) => signature.includes(priority));
  const rank = baseRank === -1 ? priorities.length : baseRank;
  const judoBonus = settings.mainObjective === "judo_prep" && settings.judoDays.includes(session.weekday) ? -0.5 : 0;

  return rank + judoBonus;
}

function getSessionSignature(session: PlannedSession): string {
  const text = `${session.id} ${session.title} ${session.focus} ${session.exercises.map((exercise) => exercise.name).join(" ")}`.toLowerCase();

  if (/force|5x5|lourd/.test(text)) return "upper-force";
  if (/volume|dos|pectoraux|bras/.test(text)) return "upper-volume";
  if (/jambe|presse|leg|lower|posterieur/.test(text)) return "lower";
  if (/cardio|zone 2|tapis|marche|respiration/.test(text)) return "cardio";
  if (/epaule|bras|rappel/.test(text)) return "shoulders";
  if (/full body|progression/.test(text)) return "full";

  return "other";
}

function tuneSessionForGoal(session: PlannedSession, settings: UserSettings): PlannedSession {
  const notes = [...(session.notes ?? [])];
  const addNote = (note: string) => {
    if (!notes.includes(note)) {
      notes.push(note);
    }
  };

  if (settings.mainObjective === "fat_loss") {
    addNote("Objectif perte de gras: garder le rythme, finir par 10-20 min cardio facile si energie OK.");
  }

  if (settings.mainObjective === "muscle_gain") {
    addNote("Objectif muscle: priorite aux series propres et a la congestion, sans sacrifier l'amplitude.");
  }

  if (settings.mainObjective === "strength") {
    addNote("Objectif force: repos plus long sur les mouvements principaux, technique avant ego.");
  }

  if (settings.mainObjective === "cardio_health") {
    addNote("Objectif cardio/sante: intensite respiratoire controlable, recuperation prioritaire.");
  }

  if (settings.mainObjective === "judo_prep") {
    addNote("Objectif judo: proteger le grip, eviter l'echec musculaire avant tapis.");
  }

  if (settings.progressionStyle === "regular") {
    addNote("Style regulier: hausse seulement si la seance etait nette.");
  }

  if (settings.progressionStyle === "controlled_aggressive") {
    addNote("Style agressif controle: viser mieux, mais douleur ou fatigue bloque la hausse.");
  }

  return {
    ...session,
    focus: getGoalFocus(session.focus, settings.mainObjective),
    notes,
    exercises: session.exercises.filter((exercise) => !isRefusedExercise(exercise.name, settings.refusedExercises))
  };
}

function getGoalFocus(focus: string, goal: ProgramGoal): string {
  const suffix: Record<ProgramGoal, string> = {
    fat_loss: "priorite depense + maintien muscle",
    muscle_gain: "priorite hypertrophie",
    strength: "priorite force",
    recomposition: "priorite recomposition",
    cardio_health: "priorite souffle et sante",
    judo_prep: "priorite judo",
    custom_mix: "priorite mix personnalise"
  };

  return `${focus} - ${suffix[goal]}`;
}

function isRefusedExercise(exerciseName: string, refusedExercises: string[]): boolean {
  return refusedExercises.some((item) => item.trim() && exerciseName.toLowerCase().includes(item.trim().toLowerCase()));
}
