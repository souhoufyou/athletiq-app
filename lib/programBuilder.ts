import { EXERCISE_LIBRARY, type LibraryExercise } from "@/lib/exerciseLibrary";
import { getRememberedSwapId } from "@/lib/exerciseSwapPreferences";
import { normalizeProgramV2 } from "@/lib/programSchema";
import type {
  BodyArea,
  ConstraintSeverity,
  Equipment,
  Exercise,
  ExerciseSelectionInsight,
  ExperienceLevel,
  MovementPattern,
  PlannedSession,
  PrimaryGoal,
  SessionDurationPreference,
  UserSettings,
  Weekday
} from "@/types/training";

type SessionTemplate = {
  key: string;
  title: string;
  focus: string;
  intensity: "Légère" | "Modérée" | "Soutenue";
  duration: string;
  notes?: string[];
  patterns: MovementPattern[];
};

type BuildContext = {
  desiredFrequency: number;
  effectiveFrequency: number;
  equipment: Equipment;
  experience: ExperienceLevel;
  goal: PrimaryGoal;
  settings: UserSettings;
  availableDays: Weekday[];
  externalBusyDays: Weekday[];
  highExternalDays: Weekday[];
  avoidTokens: string[];
  lowerStress: boolean;
  durationPreference: SessionDurationPreference;
};

type LoadReference = {
  kg: number;
  source: "direct" | "related" | "baseline";
};

type ExerciseLoadProfile = {
  display?: "normal" | "bilateral-dumbbell" | "per-arm";
  maxKg?: number;
  multiplier?: number;
};

const WEEKDAY_LABEL: Record<Weekday, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche"
};

const ALL_WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const PREFERRED_WEEKDAY_ORDER: Weekday[] = ["monday", "tuesday", "thursday", "friday", "wednesday", "saturday", "sunday"];

// Each goal has up to 6 distinct sessions; fewer days = first N picked.
const GOAL_TEMPLATES: Record<PrimaryGoal, SessionTemplate[]> = {
  "prise-masse": [
    {
      key: "push",
      title: "Push",
      focus: "Pectoraux, épaules, triceps",
      intensity: "Soutenue",
      duration: "60-75 min",
      patterns: ["chest-compound", "shoulders-compound", "chest-isolation", "shoulders-lateral", "arms-triceps"]
    },
    {
      key: "pull",
      title: "Pull",
      focus: "Dos, biceps",
      intensity: "Soutenue",
      duration: "60-75 min",
      patterns: ["back-vertical", "back-horizontal", "back-horizontal", "shoulders-rear", "arms-biceps"]
    },
    {
      key: "legs",
      title: "Legs",
      focus: "Jambes complètes",
      intensity: "Soutenue",
      duration: "60-75 min",
      patterns: ["legs-quad", "legs-hinge", "legs-quad", "legs-calf", "core"]
    },
    {
      key: "upper-vol",
      title: "Upper volume",
      focus: "Volume haut du corps",
      intensity: "Modérée",
      duration: "55-65 min",
      patterns: ["chest-isolation", "back-horizontal", "shoulders-lateral", "arms-biceps", "arms-triceps"]
    },
    {
      key: "lower-vol",
      title: "Lower volume",
      focus: "Volume bas du corps",
      intensity: "Modérée",
      duration: "55-65 min",
      patterns: ["legs-hinge", "legs-quad", "legs-calf", "core", "mobility"]
    },
    {
      key: "recovery",
      title: "Cardio léger + mobilité",
      focus: "Récupération active",
      intensity: "Légère",
      duration: "30-45 min",
      patterns: ["cardio-steady", "mobility", "core"]
    }
  ],
  "perte-gras": [
    {
      key: "fullbody-A",
      title: "Full body A",
      focus: "Force + finisseur cardio",
      intensity: "Soutenue",
      duration: "55-65 min",
      patterns: ["chest-compound", "back-vertical", "legs-quad", "core", "cardio-steady"]
    },
    {
      key: "cardio-hiit",
      title: "Cardio HIIT",
      focus: "Brûle calorique + cœur",
      intensity: "Soutenue",
      duration: "30-40 min",
      patterns: ["cardio-hiit", "core", "mobility"]
    },
    {
      key: "fullbody-B",
      title: "Full body B",
      focus: "Force + finisseur cardio",
      intensity: "Soutenue",
      duration: "55-65 min",
      patterns: ["shoulders-compound", "back-horizontal", "legs-hinge", "core", "cardio-steady"]
    },
    {
      key: "cardio-steady",
      title: "Cardio steady-state",
      focus: "Zone 2 longue",
      intensity: "Modérée",
      duration: "40-50 min",
      patterns: ["cardio-steady", "mobility"]
    },
    {
      key: "fullbody-C",
      title: "Full body C",
      focus: "Mix puissance + cardio",
      intensity: "Soutenue",
      duration: "55-65 min",
      patterns: ["fullbody", "legs-quad", "back-horizontal", "core", "cardio-hiit"]
    },
    {
      key: "mobility",
      title: "Mobilité + abdos",
      focus: "Récupération active",
      intensity: "Légère",
      duration: "25-35 min",
      patterns: ["mobility", "core", "mobility"]
    }
  ],
  recomposition: [
    {
      key: "upper-strength",
      title: "Haut du corps force",
      focus: "Pectoraux, dos, épaules",
      intensity: "Soutenue",
      duration: "55-65 min",
      patterns: ["chest-compound", "back-vertical", "shoulders-compound", "back-horizontal", "arms-triceps"]
    },
    {
      key: "lower-strength",
      title: "Bas du corps force",
      focus: "Jambes + tronc",
      intensity: "Soutenue",
      duration: "55-65 min",
      patterns: ["legs-quad", "legs-hinge", "legs-calf", "core", "cardio-steady"]
    },
    {
      key: "upper-volume",
      title: "Haut du corps volume",
      focus: "Volume + accessoires",
      intensity: "Modérée",
      duration: "55-65 min",
      patterns: ["back-horizontal", "chest-isolation", "shoulders-lateral", "arms-biceps", "arms-triceps"]
    },
    {
      key: "cardio",
      title: "Cardio + abdos",
      focus: "Brûle calorique modérée",
      intensity: "Modérée",
      duration: "35-45 min",
      patterns: ["cardio-steady", "core", "mobility"]
    },
    {
      key: "fullbody-mobility",
      title: "Full body + mobilité",
      focus: "Mix complet",
      intensity: "Modérée",
      duration: "45-55 min",
      patterns: ["fullbody", "core", "mobility"]
    },
    {
      key: "active-recovery",
      title: "Récupération active",
      focus: "Mobilité + marche",
      intensity: "Légère",
      duration: "25-35 min",
      patterns: ["mobility", "cardio-steady"]
    }
  ],
  performance: [
    {
      key: "strength-A",
      title: "Force A",
      focus: "Push lourd",
      intensity: "Soutenue",
      duration: "60-75 min",
      patterns: ["chest-compound", "shoulders-compound", "legs-quad", "core"]
    },
    {
      key: "strength-B",
      title: "Force B",
      focus: "Pull + posterior chain",
      intensity: "Soutenue",
      duration: "60-75 min",
      patterns: ["back-vertical", "back-horizontal", "legs-hinge", "core"]
    },
    {
      key: "strength-C",
      title: "Force C",
      focus: "Volume compound",
      intensity: "Modérée",
      duration: "55-65 min",
      patterns: ["chest-compound", "back-horizontal", "legs-quad", "core"]
    },
    {
      key: "conditioning",
      title: "Conditionnement",
      focus: "Explosivité + cardio",
      intensity: "Soutenue",
      duration: "30-40 min",
      patterns: ["cardio-hiit", "fullbody", "core"]
    },
    {
      key: "mobility",
      title: "Mobilité + accessoires",
      focus: "Souplesse + équilibre",
      intensity: "Légère",
      duration: "30-40 min",
      patterns: ["mobility", "shoulders-rear", "core"]
    },
    {
      key: "active-recovery",
      title: "Récupération active",
      focus: "Cardio léger",
      intensity: "Légère",
      duration: "25-35 min",
      patterns: ["cardio-steady", "mobility"]
    }
  ],
  sante: [
    {
      key: "fullbody",
      title: "Full body santé",
      focus: "Mouvement complet",
      intensity: "Modérée",
      duration: "40-50 min",
      patterns: ["fullbody", "legs-quad", "back-horizontal", "core", "mobility"]
    },
    {
      key: "cardio-mobility",
      title: "Cardio + mobilité",
      focus: "Bouger mieux",
      intensity: "Légère",
      duration: "30-40 min",
      patterns: ["cardio-steady", "mobility", "mobility"]
    },
    {
      key: "fullbody-light",
      title: "Full body léger",
      focus: "Renforcement doux",
      intensity: "Légère",
      duration: "35-45 min",
      patterns: ["chest-compound", "back-vertical", "legs-quad", "core", "mobility"]
    },
    {
      key: "mobility",
      title: "Mobilité + posture",
      focus: "Articulations + tronc",
      intensity: "Légère",
      duration: "25-35 min",
      patterns: ["mobility", "shoulders-rear", "core", "mobility"]
    }
  ]
};

function pickExercise(
  pattern: MovementPattern,
  equipment: Equipment,
  sessionExcludeIds: Set<string>,
  avoidTokens: string[],
  ctx: BuildContext,
  weekday: Weekday
): LibraryExercise | undefined {
  const matches = (ex: LibraryExercise) =>
    ex.pattern === pattern &&
    !sessionExcludeIds.has(ex.id) &&
    !shouldAvoidExercise(ex, avoidTokens);

  const applyRememberedSwap = (candidate: LibraryExercise | undefined): LibraryExercise | undefined => {
    if (!candidate) return candidate;

    const rememberedId = getRememberedSwapId(ctx.settings, candidate.id);
    if (!rememberedId) return candidate;

    const remembered = EXERCISE_LIBRARY.find((exercise) =>
      exercise.id === rememberedId
      && matches(exercise)
      && exercise.equipment.includes(equipment)
    );

    return remembered ?? candidate;
  };

  const exact = EXERCISE_LIBRARY
    .filter((ex) => matches(ex) && ex.equipment.includes(equipment))
    .sort((a, b) => scoreExerciseCandidate(b, ctx, weekday) - scoreExerciseCandidate(a, ctx, weekday))[0];
  if (exact) return applyRememberedSwap(exact);

  return applyRememberedSwap(EXERCISE_LIBRARY
    .filter(matches)
    .sort((a, b) => scoreExerciseCandidate(b, ctx, weekday) - scoreExerciseCandidate(a, ctx, weekday))[0]);
}

function chooseWeekdays(frequency: number, availableDays: Weekday[], externalBusyDays: Weekday[]): Weekday[] {
  const available = normalizeWeekdays(availableDays, ALL_WEEKDAYS);
  const blocked = new Set(externalBusyDays);
  const orderedAvailable = PREFERRED_WEEKDAY_ORDER.filter((day) => available.includes(day));
  const free = orderedAvailable.filter((day) => !blocked.has(day));

  if (free.length >= frequency) return free.slice(0, frequency);

  const fallback = [
    ...free,
    ...orderedAvailable.filter((day) => blocked.has(day))
  ];

  return fallback.slice(0, Math.max(1, Math.min(frequency, fallback.length)));
}

function adjustForExperience(target: string, level: ExperienceLevel): string {
  if (level === "debutant") {
    // Reduce sets by 1 and reps to lower bound
    return target.replace(/^(\d+)\s*x\s*(.+)$/, (_, sets) => {
      const next = Math.max(2, Number(sets) - 1);
      return `${next} x ${target.split("x")[1]?.trim() ?? ""}`.trim();
    });
  }
  return target;
}

function adjustTargetForContext(target: string, exercise: LibraryExercise, weekday: Weekday, ctx: BuildContext): string {
  let next = adjustForExperience(target, ctx.experience);
  const shouldReduce =
    ctx.lowerStress ||
    ctx.highExternalDays.includes(weekday) ||
    (ctx.durationPreference === "short" && !exercise.isCompound);
  const personalSetBias = ctx.settings.setBiasByPattern?.[exercise.pattern] ?? 0;
  const personalRepBias = ctx.settings.repBiasByPattern?.[exercise.pattern] ?? 0;

  if (shouldReduce) {
    next = reduceSetCount(next);
  }

  if (personalSetBias <= -0.5) {
    next = reduceSetCount(next);
  } else if (personalSetBias >= 0.5 && !shouldReduce && ctx.durationPreference !== "short") {
    next = increaseSetCount(next);
  }

  if (personalRepBias <= -1) {
    next = shiftRepTarget(next, -2);
  } else if (personalRepBias >= 1) {
    next = shiftRepTarget(next, 2);
  }

  return next;
}

function adjustNotes(goal: PrimaryGoal, weekday: Weekday, ctx: BuildContext): string[] | undefined {
  const notes: string[] = [];
  const sportsToday = ctx.settings.externalSports.filter((sport) => sport.days.includes(weekday));

  if (sportsToday.length > 0) {
    notes.push(`${sportsToday.map((sport) => sport.name).join(" + ")} le meme jour: garde 1-2 reps en reserve.`);
  } else if (ctx.settings.judoDays.includes(weekday)) {
    notes.push("Sport le soir: garde 1-2 reps en reserve sur les accessoires.");
  }

  if (goal === "perte-gras") {
    notes.push("Hydrate-toi bien et garde un bon tempo entre les series.");
  }

  if (ctx.lowerStress) {
    notes.push("Recuperation limitee: volume et intensite abaisses pour consolider.");
  }

  if (ctx.effectiveFrequency < ctx.desiredFrequency) {
    notes.push(`Frequence adaptee a tes jours disponibles: ${ctx.effectiveFrequency}/${ctx.desiredFrequency} seances.`);
  }

  const constraintNotes = ctx.settings.constraints
    .filter((constraint) => constraint.severity !== "info")
    .slice(0, 2)
    .map((constraint) => `Vigilance: ${constraint.label}`);

  notes.push(...constraintNotes);

  return notes.length > 0 ? notes : undefined;
}

/**
 * Build a personalized weekly program from user settings.
 * Falls back to sensible defaults if optional fields are missing.
 */
export function buildProgram(settings: UserSettings): PlannedSession[] {
  const goal: PrimaryGoal = settings.primaryGoal ?? "recomposition";
  const equipment: Equipment = settings.equipment ?? "salle-complete";
  const experience: ExperienceLevel = settings.experienceLevel ?? "intermediaire";
  const desiredFrequency = clamp(settings.weeklyFrequency ?? 4, 1, 6);
  const availableDays = normalizeWeekdays(settings.availableDays, ALL_WEEKDAYS);
  const externalBusyDays = getExternalBusyDays(settings);
  const effectiveFrequency = Math.max(1, Math.min(desiredFrequency, availableDays.length, GOAL_TEMPLATES[goal].length));
  const avoidTokens = buildAvoidTokens(settings);
  const durationPreference = settings.sessionDurationPreference ?? "standard";
  const lowerStress =
    settings.cautionLevel === "prudent" ||
    settings.recoveryProfile === "poor" ||
    settings.recoveryProfile === "irregular";
  const ctx: BuildContext = {
    desiredFrequency,
    effectiveFrequency,
    equipment,
    experience,
    goal,
    settings,
    availableDays,
    externalBusyDays,
    highExternalDays: getHighExternalDays(settings),
    avoidTokens,
    lowerStress,
    durationPreference
  };

  const templates = selectStructuredTemplates(goal, ctx);
  const weekdays = chooseWeekdays(effectiveFrequency, availableDays, externalBusyDays);

  return normalizeProgramV2(templates.map((template, idx) => {
    const weekday = weekdays[idx] ?? weekdays[weekdays.length - 1];
    const patterns = adjustPatternsForContext(template, ctx);
    const sessionExclude = new Set<string>();
    const exercises: Exercise[] = [];

    for (const pattern of patterns) {
      const lib = pickExercise(pattern, equipment, sessionExclude, avoidTokens, ctx, weekday);
      if (!lib) continue;
      sessionExclude.add(lib.id);
      exercises.push({
        id: lib.id,
        name: lib.name,
        target: adjustTargetForContext(lib.target, lib, weekday, ctx),
        plannedLoad: inferPlannedLoad(lib, ctx),
        rest: adjustRestForContext(lib.rest, lib, ctx),
        cue: lib.cue,
        muscleGroups: lib.muscleGroups,
        classification: lib.classification,
        selectionInsight: buildExerciseSelectionInsight(lib, ctx, weekday)
      });
    }

    const notes = mergeNotes(template.notes, adjustNotes(goal, weekday, ctx));

    return {
      id: `gen-${goal}-${template.key}`,
      weekday,
      title: template.title,
      focus: template.focus,
      duration: adjustDuration(template.duration, durationPreference),
      intensity: adjustIntensity(template.intensity, weekday, ctx),
      phase: getTemplatePhase(template, goal),
      mesocycleLength: getMesocycleLength(ctx),
      deloadEvery: getDeloadFrequency(ctx),
      weekIndex: 1,
      scheduleLabel: WEEKDAY_LABEL[weekday],
      notes,
      exercises
    };
  }));
}

function selectStructuredTemplates(goal: PrimaryGoal, ctx: BuildContext): SessionTemplate[] {
  const beginnerPlan = getBeginnerLowFrequencyTemplates(goal, ctx);
  if (beginnerPlan.length > 0) {
    return beginnerPlan.slice(0, ctx.effectiveFrequency);
  }

  return selectTemplates(goal, ctx);
}

function selectTemplates(goal: PrimaryGoal, ctx: BuildContext): SessionTemplate[] {
  return GOAL_TEMPLATES[goal]
    .map((template, index) => ({
      score: scoreTemplate(template, goal, ctx, index),
      template
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, ctx.effectiveFrequency)
    .map((item) => item.template);
}

function getBeginnerLowFrequencyTemplates(goal: PrimaryGoal, ctx: BuildContext): SessionTemplate[] {
  if (ctx.experience !== "debutant" || ctx.effectiveFrequency > 3) {
    return [];
  }

  const sharedNote = "Structure full body pour mieux progresser avec 2-3 seances par semaine.";

  if (goal === "prise-masse") {
    return [
      {
        key: "beginner-fullbody-a",
        title: "Full body A",
        focus: "Base complete + technique",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote],
        patterns: ["legs-quad", "chest-compound", "back-horizontal", "core"]
      },
      {
        key: "beginner-fullbody-b",
        title: "Full body B",
        focus: "Posterior chain + epaules",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote],
        patterns: ["legs-hinge", "back-vertical", "shoulders-compound", "core"]
      },
      {
        key: "beginner-fullbody-c",
        title: "Full body C",
        focus: "Volume global + mobilite",
        intensity: "Modérée",
        duration: "40-50 min",
        notes: [sharedNote],
        patterns: ["chest-isolation", "legs-quad", "back-horizontal", "mobility"]
      }
    ];
  }

  if (goal === "performance") {
    return [
      {
        key: "beginner-strength-a",
        title: "Force full body A",
        focus: "Patterns fondamentaux",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote, "Accent sur la technique et les reserves de reps."],
        patterns: ["chest-compound", "legs-quad", "back-horizontal", "core"]
      },
      {
        key: "beginner-strength-b",
        title: "Force full body B",
        focus: "Tirage + chaine posterieure",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote, "Accent sur la technique et les reserves de reps."],
        patterns: ["back-vertical", "legs-hinge", "shoulders-compound", "core"]
      },
      {
        key: "beginner-strength-c",
        title: "Force full body C",
        focus: "Consolidation + mobilite",
        intensity: "Légère",
        duration: "35-45 min",
        notes: [sharedNote, "Accent sur la technique et les reserves de reps."],
        patterns: ["legs-quad", "chest-compound", "back-vertical", "mobility"]
      }
    ];
  }

  if (goal === "recomposition") {
    return [
      {
        key: "beginner-recomp-a",
        title: "Full body A",
        focus: "Renforcement complet",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote],
        patterns: ["chest-compound", "back-horizontal", "legs-quad", "core"]
      },
      {
        key: "beginner-recomp-b",
        title: "Full body B",
        focus: "Posterior chain + cardio simple",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote],
        patterns: ["back-vertical", "legs-hinge", "core", "cardio-steady"]
      },
      {
        key: "beginner-recomp-c",
        title: "Cardio + mobilite",
        focus: "Recuperation active",
        intensity: "Légère",
        duration: "30-40 min",
        notes: [sharedNote],
        patterns: ["cardio-steady", "mobility", "core"]
      }
    ];
  }

  if (goal === "perte-gras") {
    return [
      {
        key: "beginner-fatloss-a",
        title: "Full body A",
        focus: "Renforcement + cardio facile",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote, "Priorite a la regularite avant les blocs HIIT."],
        patterns: ["chest-compound", "back-horizontal", "legs-quad", "cardio-steady"]
      },
      {
        key: "beginner-fatloss-b",
        title: "Full body B",
        focus: "Jambes + haut du corps",
        intensity: "Modérée",
        duration: "45-55 min",
        notes: [sharedNote, "Priorite a la regularite avant les blocs HIIT."],
        patterns: ["legs-hinge", "back-vertical", "shoulders-compound", "core"]
      },
      {
        key: "beginner-fatloss-c",
        title: "Cardio steady-state",
        focus: "Zone 2 + mobilite",
        intensity: "Légère",
        duration: "30-40 min",
        notes: [sharedNote, "Priorite a la regularite avant les blocs HIIT."],
        patterns: ["cardio-steady", "mobility", "core"]
      }
    ];
  }

  return [];
}

function scoreTemplate(template: SessionTemplate, goal: PrimaryGoal, ctx: BuildContext, index: number): number {
  let score = 100 - index * 2;
  const hasHiit = template.patterns.includes("cardio-hiit");
  const hasMobility = template.patterns.includes("mobility");
  const lowerFocus = template.patterns.filter((pattern) => pattern.startsWith("legs")).length >= 2;
  const isRecovery = hasMobility || /recovery|mobilite/i.test(normalizeForMatch(`${template.key} ${template.title}`));
  const isConditioning = hasHiit || /conditioning|hiit/i.test(normalizeForMatch(`${template.key} ${template.title}`));

  if (goal === "prise-masse" && ctx.settings.sex === "female") {
    if (lowerFocus) score += 4;
    if (/upper volume/i.test(template.title)) score -= 2;
  }

  if (goal === "recomposition" && ctx.effectiveFrequency === 3) {
    if (template.key === "fullbody-mobility") score += 10;
    if (template.key === "upper-volume") score -= 8;
  }

  if (goal === "performance") {
    if (template.key.startsWith("strength")) score += 8;
    if (ctx.highExternalDays.length > 0 || ctx.lowerStress) {
      if (isConditioning) score -= 22;
      if (isRecovery) score += 14;
    }
  }

  if (goal === "perte-gras" && (ctx.highExternalDays.length > 0 || ctx.lowerStress)) {
    if (hasHiit) score -= 25;
    if (template.key === "cardio-steady" || template.key === "mobility" || isRecovery) score += 14;
  }

  if (ctx.effectiveFrequency <= 2 && isRecovery) {
    score -= 8;
  }

  return score;
}

function getMesocycleLength(ctx: BuildContext): number {
  if (ctx.experience === "debutant") return 4;
  if (ctx.experience === "avance" && ctx.durationPreference !== "short") return 7;
  return 6;
}

function getDeloadFrequency(ctx: BuildContext): number {
  if (ctx.lowerStress) return 4;
  if (ctx.experience === "avance") return 4;
  return 5;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeWeekdays(value: Weekday[] | undefined, fallback: Weekday[]): Weekday[] {
  if (!value || value.length === 0) return fallback;
  const valid = value.filter((day) => ALL_WEEKDAYS.includes(day));
  return Array.from(new Set(valid));
}

function getExternalBusyDays(settings: UserSettings): Weekday[] {
  const days = [
    ...(settings.judoDays ?? []),
    ...settings.externalSports
      .filter((sport) => sport.intensity !== "low")
      .flatMap((sport) => sport.days)
  ];

  return Array.from(new Set(days));
}

function getHighExternalDays(settings: UserSettings): Weekday[] {
  const days = settings.externalSports
    .filter((sport) => sport.intensity === "high")
    .flatMap((sport) => sport.days);

  return Array.from(new Set(days));
}

function buildAvoidTokens(settings: UserSettings): string[] {
  const raw = [
    ...settings.avoid,
    ...settings.constraints
      .filter((constraint) => constraint.severity === "avoid")
      .map((constraint) => constraint.label)
  ];

  return Array.from(new Set(raw.map(normalizeForMatch).filter((item) => item.length >= 3)));
}

function scoreExerciseCandidate(exercise: LibraryExercise, ctx: BuildContext, weekday: Weekday): number {
  let score = 0;
  const name = normalizeForMatch(exercise.name);
  const highStressDay = ctx.lowerStress || ctx.highExternalDays.includes(weekday);
  const profileText = normalizeForMatch(
    `${exercise.name} ${exercise.pattern} ${(exercise.tags ?? []).join(" ")}`
  );

  if (ctx.goal === "performance") {
    if (exercise.classification === "force") score += 5;
    if (exercise.isCompound) score += 2;
    if (/amrap/.test(normalizeForMatch(exercise.target))) score -= 3;
  }

  if (ctx.goal === "prise-masse") {
    if (exercise.classification === "hypertrophie") score += 4;
    if (/machine|poulie/.test(name)) score += 2;
    if (/amrap/.test(normalizeForMatch(exercise.target))) score -= 4;
  }

  if (ctx.goal === "perte-gras") {
    if (exercise.classification === "cardio") score += 4;
    if (exercise.isCompound) score += 2;
  }

  if (isPrimaryPattern(exercise.pattern) && exercise.isCompound) {
    score += 2;
  }

  if (isPrimaryPattern(exercise.pattern) && !exercise.isCompound) {
    score -= 3;
  }

  if (highStressDay) {
    if (exercise.classification === "force") score -= 4;
    if (/barre|souleve de terre roumain|tractions/.test(name)) score -= 3;
    if (/machine|poulie|marche|zone 2|hip thrust|pont fessier/.test(name)) score += 3;
  }

  if (ctx.settings.sex === "female") {
    if (exercise.pattern === "legs-hinge" && /hip thrust|pont fessier/.test(name)) score += 2;
    if (exercise.pattern === "legs-quad" && /presse|goblet/.test(name)) score += 1;
  }

  score += scoreConstraintFit(exercise, ctx, profileText);
  score += scorePreferenceFit(ctx.settings.preferences, profileText);

  return score;
}

function scoreConstraintFit(exercise: LibraryExercise, ctx: BuildContext, profileText: string): number {
  let score = 0;
  const jointStress = inferSelectionJointStress(exercise, profileText);

  for (const constraint of ctx.settings.constraints) {
    if (constraint.severity === "info") continue;

    const severity = jointStress[constraint.area];
    if (severity) {
      score -= getConstraintPenalty(constraint.severity, severity);
    }

    if (isSupportiveVariation(exercise, constraint.area, profileText)) {
      score += 6;
    }
  }

  return score;
}

function scorePreferenceFit(preferences: string[], profileText: string): number {
  const tokens = preferences
    .map(normalizeForMatch)
    .filter((token) => token.length >= 4);

  return tokens.reduce((total, token) => {
    if (profileText.includes(token)) {
      return total + 3;
    }

    if (token.includes("machine") && /machine|poulie|pec deck/.test(profileText)) {
      return total + 2;
    }

    if (token.includes("halter") && /haltere|dumbbell/.test(profileText)) {
      return total + 2;
    }

    if (token.includes("poids du corps") && /pompes|bodyweight|marche|traction/.test(profileText)) {
      return total + 2;
    }

    return total;
  }, 0);
}

function buildExerciseSelectionInsight(
  exercise: LibraryExercise,
  ctx: BuildContext,
  weekday: Weekday
): ExerciseSelectionInsight | undefined {
  const reasons: ExerciseSelectionInsight["reasons"] = [];
  const profileText = normalizeForMatch(
    `${exercise.name} ${exercise.pattern} ${(exercise.tags ?? []).join(" ")}`
  );

  for (const constraint of ctx.settings.constraints) {
    if (constraint.severity === "info") continue;

    if (isSupportiveVariation(exercise, constraint.area, profileText)) {
      reasons.push({
        title: constraintTitle(constraint.area),
        detail: constraintDetail(constraint.area, exercise.name),
        tone: "warn"
      });
    }
  }

  const matchingPreferences = getMatchingPreferences(ctx.settings.preferences, profileText);
  if (matchingPreferences.length > 0) {
    reasons.push({
      title: "Preference respectee",
      detail: `Cette variante colle mieux a tes preferences (${matchingPreferences.slice(0, 2).join(", ")}).`,
      tone: "info"
    });
  }

  if (ctx.lowerStress || ctx.highExternalDays.includes(weekday)) {
    if (/machine|guided|stable|poulie/.test(profileText)) {
      reasons.push({
        title: "Recuperation protegee",
        detail: "Variante plus stable retenue pour garder de la marge avec la fatigue ou le sport externe.",
        tone: "calm"
      });
    }
  }

  if (ctx.goal === "performance" && exercise.classification === "force" && exercise.isCompound) {
    reasons.push({
      title: "Priorite performance",
      detail: "Exercice garde parce qu'il porte bien la progression en charge sur ton objectif performance.",
      tone: "info"
    });
  }

  if (ctx.goal === "prise-masse" && exercise.classification === "hypertrophie") {
    reasons.push({
      title: "Volume utile",
      detail: "Choisi pour accumuler du volume de qualite sans te cramer trop vite.",
      tone: "calm"
    });
  }

  if (ctx.goal === "perte-gras" && (exercise.pattern === "cardio-steady" || exercise.pattern === "fullbody")) {
    reasons.push({
      title: "Depense durable",
      detail: "Selectionne pour faire monter la depense tout en gardant une recuperation tenable.",
      tone: "info"
    });
  }

  const uniqueReasons = dedupeSelectionReasons(reasons).slice(0, 3);
  if (uniqueReasons.length === 0) {
    return undefined;
  }

  return {
    summary: buildSelectionSummary(uniqueReasons),
    reasons: uniqueReasons
  };
}

function dedupeSelectionReasons(reasons: ExerciseSelectionInsight["reasons"]) {
  const seen = new Set<string>();
  return reasons.filter((reason) => {
    const key = `${reason.title}:${reason.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSelectionSummary(reasons: ExerciseSelectionInsight["reasons"]): string {
  const titles = reasons.map((reason) => reason.title.toLowerCase());
  if (titles.length === 1) {
    return `Choix oriente ${titles[0]}.`;
  }

  if (titles.length === 2) {
    return `Choix oriente ${titles[0]} et ${titles[1]}.`;
  }

  return `Choix oriente ${titles[0]}, ${titles[1]} et ${titles[2]}.`;
}

function getMatchingPreferences(preferences: string[], profileText: string): string[] {
  return preferences
    .map((preference) => preference.trim())
    .filter(Boolean)
    .filter((preference) => {
      const token = normalizeForMatch(preference);
      return token.length >= 4 && (
        profileText.includes(token)
        || (token.includes("machine") && /machine|poulie|pec deck/.test(profileText))
        || (token.includes("halter") && /haltere|dumbbell/.test(profileText))
        || (token.includes("poids du corps") && /pompes|bodyweight|marche|traction/.test(profileText))
      );
    });
}

function constraintTitle(area: BodyArea): string {
  if (area === "wrist") return "Poignet protege";
  if (area === "shoulder") return "Epaule protegee";
  if (area === "back") return "Dos protege";
  if (area === "knee") return "Genou protege";
  if (area === "cardio") return "Souffle preserve";
  return "Contrainte respectee";
}

function constraintDetail(area: BodyArea, exerciseName: string): string {
  if (area === "wrist") return `${exerciseName} a ete prefere pour limiter le stress direct sur le poignet.`;
  if (area === "shoulder") return `${exerciseName} a ete prefere pour garder un pattern plus stable pour l'epaule.`;
  if (area === "back") return `${exerciseName} a ete retenu pour moins charger le bas du dos que les variantes plus agressives.`;
  if (area === "knee") return `${exerciseName} aide a garder un travail plus tolérant pour le genou.`;
  if (area === "cardio") return `${exerciseName} garde le travail utile sans faire exploser la fatigue cardio.`;
  return `${exerciseName} a ete retenu pour mieux respecter une contrainte de ton profil.`;
}

function isPrimaryPattern(pattern: MovementPattern): boolean {
  return [
    "chest-compound",
    "back-vertical",
    "back-horizontal",
    "legs-quad",
    "legs-hinge",
    "shoulders-compound",
    "fullbody"
  ].includes(pattern);
}

function inferSelectionJointStress(
  exercise: LibraryExercise,
  profileText: string
): Partial<Record<BodyArea, ConstraintSeverity>> {
  if (exercise.jointStress) {
    return exercise.jointStress;
  }

  const stress: Partial<Record<BodyArea, ConstraintSeverity>> = {};

  const set = (area: BodyArea, severity: ConstraintSeverity) => {
    stress[area] = severity;
  };

  if (/barre|pompes|dips/.test(profileText)) set("wrist", "caution");
  if (/developpe|overhead|pike|pullup|traction|dips/.test(profileText)) set("shoulder", "caution");
  if (/souleve de terre roumain|rowing haltere|goblet squat|kettlebell swing/.test(profileText)) set("back", "caution");
  if (/hip thrust|pont fessier|rowing poulie|leg press/.test(profileText)) set("back", "info");
  if (/leg press|goblet squat|leg extension/.test(profileText)) set("knee", "caution");
  if (/squat poids du corps|leg curl/.test(profileText)) set("knee", "info");
  if (/interval|hiit|corde a sauter|velo intervalles/.test(profileText)) set("cardio", "caution");
  if (/thruster|kettlebell swing/.test(profileText)) set("cardio", "info");
  if (/pullup|curl|extension triceps/.test(profileText)) set("elbow", "info");

  return stress;
}

function getConstraintPenalty(
  constraintSeverity: Exclude<ConstraintSeverity, "info">,
  exerciseSeverity: ConstraintSeverity
): number {
  if (constraintSeverity === "avoid") {
    if (exerciseSeverity === "avoid") return 18;
    if (exerciseSeverity === "caution") return 14;
    return 8;
  }

  if (exerciseSeverity === "avoid") return 14;
  if (exerciseSeverity === "caution") return 10;
  return 4;
}

function isSupportiveVariation(exercise: LibraryExercise, area: BodyArea, profileText: string): boolean {
  if (area === "cardio") {
    return exercise.pattern === "cardio-steady" || exercise.pattern === "mobility";
  }

  if (area === "wrist") {
    return /machine|poulie|neutral|haltere/.test(profileText);
  }

  if (area === "shoulder") {
    return /machine|poulie|face pull|reverse pec deck/.test(profileText);
  }

  if (area === "back") {
    return /machine|poulie|hip thrust|pont fessier|leg curl/.test(profileText);
  }

  if (area === "knee") {
    return /machine|leg curl|hip thrust|pont fessier/.test(profileText);
  }

  return false;
}

function shouldAvoidExercise(exercise: LibraryExercise, avoidTokens: string[]): boolean {
  if (avoidTokens.length === 0) return false;
  const haystack = normalizeForMatch(`${exercise.id} ${exercise.name} ${exercise.pattern}`);
  return avoidTokens.some((token) => haystack.includes(token.replace(/^eviter\s*:?\s*/, "")));
}

function adjustPatternsForContext(template: SessionTemplate, ctx: BuildContext): MovementPattern[] {
  const maxPatterns = getPatternCapacity(ctx);
  let next = [...template.patterns];

  if (ctx.durationPreference === "short") {
    return next.slice(0, Math.min(3, next.length));
  }

  if (next.length > maxPatterns) {
    next = next.slice(0, maxPatterns);
  }

  const additions = getPatternAdditions(template, ctx);
  for (const addition of additions) {
    if (next.length >= maxPatterns) break;
    next.push(addition);
  }

  return next;
}

function getPatternCapacity(ctx: BuildContext): number {
  if (ctx.durationPreference === "short") return 3;
  if (ctx.durationPreference === "long") {
    return ctx.experience === "avance" ? 7 : ctx.experience === "debutant" ? 5 : 6;
  }

  if (ctx.experience === "debutant") return 4;
  if (ctx.experience === "avance" && ctx.effectiveFrequency >= 4) return 6;
  return 5;
}

function getPatternAdditions(template: SessionTemplate, ctx: BuildContext): MovementPattern[] {
  if (ctx.lowerStress) {
    return ctx.durationPreference === "long" ? ["mobility"] : [];
  }

  if (ctx.experience === "avance") {
    if (ctx.goal === "prise-masse") {
      if (template.patterns.includes("chest-compound")) return ["arms-triceps", "shoulders-lateral"];
      if (template.patterns.includes("back-vertical") || template.patterns.includes("back-horizontal")) {
        return ["arms-biceps", "shoulders-rear"];
      }
      if (template.patterns.includes("legs-hinge") || template.patterns.includes("legs-quad")) {
        return ["legs-calf", "core"];
      }
    }

    if (ctx.goal === "performance") {
      return ["core", "shoulders-rear"];
    }

    if (ctx.goal === "perte-gras") {
      return ["core", "cardio-steady"];
    }

    return ["core"];
  }

  if (ctx.durationPreference === "long") {
    return ["core", "mobility"];
  }

  return [];
}

function adjustDuration(duration: string, preference: SessionDurationPreference): string {
  if (preference === "short") return "35-45 min";
  if (preference === "long") return "70-85 min";
  return duration;
}

function mergeNotes(...noteGroups: Array<string[] | undefined>): string[] | undefined {
  const merged = noteGroups.flatMap((group) => group ?? []);
  return merged.length > 0 ? Array.from(new Set(merged)) : undefined;
}

function adjustIntensity(
  intensity: PlannedSession["intensity"],
  weekday: Weekday,
  ctx: BuildContext
): PlannedSession["intensity"] {
  if (ctx.lowerStress || ctx.highExternalDays.includes(weekday)) {
    return stepDownIntensity(intensity);
  }

  return intensity;
}

function stepDownIntensity(intensity: PlannedSession["intensity"]): PlannedSession["intensity"] {
  if (intensity === "Soutenue") return "Modérée";
  if (intensity === "Modérée") return "Légère";
  return intensity;
}

function getTemplatePhase(template: SessionTemplate, goal: PrimaryGoal): PlannedSession["phase"] {
  const text = normalizeForMatch(`${template.key} ${template.title} ${template.focus}`);

  if (text.includes("cardio") || text.includes("conditioning") || goal === "perte-gras") {
    return "conditioning";
  }

  if (text.includes("recovery") || text.includes("mobilite")) {
    return "maintenance";
  }

  if (template.intensity === "Soutenue") {
    return "intensification";
  }

  return "accumulation";
}

function reduceSetCount(target: string): string {
  return target.replace(/^(\d+)(?:-(\d+))?\s*x\s*(.+)$/i, (_, low, high, rest) => {
    const nextLow = Math.max(1, Number(low) - 1);
    const nextHigh = high ? Math.max(nextLow, Number(high) - 1) : undefined;
    return `${nextHigh ? `${nextLow}-${nextHigh}` : nextLow} x ${rest}`.trim();
  });
}

function increaseSetCount(target: string): string {
  return target.replace(/^(\d+)(?:-(\d+))?\s*x\s*(.+)$/i, (_, low, high, rest) => {
    const nextLow = Math.min(6, Number(low) + 1);
    const nextHigh = high ? Math.min(6, Math.max(nextLow, Number(high) + 1)) : undefined;
    return `${nextHigh ? `${nextLow}-${nextHigh}` : nextLow} x ${rest}`.trim();
  });
}

function shiftRepTarget(target: string, repDelta: number): string {
  return target.replace(/^(\d+)(?:-(\d+))?\s*x\s*(\d+)(?:\s*-\s*(\d+))?$/i, (_, setsLow, setsHigh, repsLow, repsHigh) => {
    const low = clamp(Number(repsLow) + repDelta, 3, 20);
    const high = repsHigh ? clamp(Number(repsHigh) + repDelta, low, 22) : undefined;
    const setRange = setsHigh ? `${setsLow}-${setsHigh}` : setsLow;
    const repRange = high ? `${low}-${high}` : `${low}`;
    return `${setRange} x ${repRange}`;
  });
}

function adjustRestForContext(rest: string, exercise: LibraryExercise, ctx: BuildContext): string {
  const bias = ctx.settings.restBiasByPattern?.[exercise.pattern] ?? 0;
  if (bias === 0) return rest;

  return shiftRestTarget(rest, bias > 0 ? 15 : -15);
}

function shiftRestTarget(rest: string, secondsDelta: number): string {
  const normalized = rest.toLowerCase();
  if (normalized.includes("libre") || normalized.includes("inclus")) {
    return rest;
  }

  const minuteRange = normalized.match(/(\d+)\s*min(?:\s*(\d+))?(?:\s*-\s*(\d+)\s*min)?/);
  if (minuteRange) {
    const start = Number(minuteRange[1]) * 60 + Number(minuteRange[2] ?? 0);
    const end = minuteRange[3] ? Number(minuteRange[3]) * 60 : undefined;
    const nextStart = clamp(start + secondsDelta, 30, 300);
    const nextEnd = end ? clamp(end + secondsDelta, nextStart, 360) : undefined;
    return formatRestRange(nextStart, nextEnd);
  }

  const secondRange = normalized.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:s|sec)/);
  if (secondRange) {
    const start = Number(secondRange[1]);
    const end = secondRange[2] ? Number(secondRange[2]) : undefined;
    const nextStart = clamp(start + secondsDelta, 30, 300);
    const nextEnd = end ? clamp(end + secondsDelta, nextStart, 360) : undefined;
    return formatRestRange(nextStart, nextEnd);
  }

  return rest;
}

function formatRestRange(startSec: number, endSec?: number): string {
  if (endSec && endSec !== startSec) {
    return `${formatRestValue(startSec)}-${formatRestValue(endSec)}`;
  }

  return formatRestValue(startSec);
}

function formatRestValue(totalSec: number): string {
  if (totalSec % 60 === 0) {
    const minutes = totalSec / 60;
    return minutes >= 2 ? `${minutes} min` : `${minutes} min`;
  }

  if (totalSec >= 60) {
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    return `${minutes} min ${seconds}`;
  }

  return `${totalSec} s`;
}

function inferPlannedLoad(exercise: LibraryExercise, ctx: BuildContext): string | undefined {
  if (!exercise.isCompound || exercise.classification === "cardio" || exercise.classification === "mobilite") {
    return exercise.plannedLoad;
  }

  if (/amrap|sec|min/i.test(exercise.target) || exercise.equipment.every((item) => item === "poids-corps")) {
    return exercise.plannedLoad;
  }

  const reference = getLoadReference(exercise.pattern, ctx);

  if (!reference) return exercise.plannedLoad;

  const baseRatio = exercise.classification === "force" ? 0.72 : 0.62;
  const experienceAdjustment = ctx.experience === "debutant" ? -0.07 : ctx.experience === "avance" ? 0.04 : 0;
  const stressAdjustment = ctx.lowerStress ? -0.05 : 0;
  const biasAdjustment = ctx.settings.loadBiasByPattern?.[exercise.pattern] ?? 0;
  const precision = reference.source === "direct" ? 2.5 : 5;
  const rawLoadKg = reference.kg * Math.max(0.45, baseRatio + experienceAdjustment + stressAdjustment + biasAdjustment);
  const loadKg = roundToNearest(rawLoadKg, precision);

  return formatPlannedLoad(exercise, loadKg, reference.source, precision, ctx);
}

function getLoadReference(pattern: MovementPattern, ctx: BuildContext): LoadReference | undefined {
  const direct = getDeclaredReferenceKg(pattern, ctx.settings);
  if (direct) {
    return { kg: direct, source: "direct" };
  }

  const related = inferRelatedReferenceKg(pattern, ctx.settings);
  if (related) {
    return { kg: related, source: "related" };
  }

  const baseline = inferBaselineOneRepMaxKg(pattern, ctx);
  return baseline ? { kg: baseline, source: "baseline" } : undefined;
}

function inferRelatedReferenceKg(pattern: MovementPattern, settings: UserSettings): number | undefined {
  if (pattern !== "shoulders-compound") return undefined;

  const chestReference = getDeclaredReferenceKg("chest-compound", settings);
  return chestReference ? chestReference * 0.58 : undefined;
}

function formatPlannedLoad(
  exercise: LibraryExercise,
  loadKg: number,
  source: LoadReference["source"],
  precision: number,
  ctx: BuildContext
): string | undefined {
  if (loadKg < 5) return exercise.plannedLoad;

  const profile = getExerciseLoadProfile(exercise, ctx);
  const adjusted = Math.min(
    loadKg * (profile.multiplier ?? 1),
    profile.maxKg ?? Number.POSITIVE_INFINITY
  );
  const prefix = source === "direct" ? "" : "env. ";

  if (profile.display === "bilateral-dumbbell") {
    const perDumbbell = roundToNearest(adjusted / 2, 2.5);
    return perDumbbell >= 2.5 ? `${prefix}2 x ${formatNumber(perDumbbell)} kg` : exercise.plannedLoad;
  }

  const rounded = roundToNearest(adjusted, precision);
  if (rounded < 5) return exercise.plannedLoad;

  if (profile.display === "per-arm") {
    return `${prefix}${formatNumber(rounded)} kg / bras`;
  }

  return `${prefix}${formatNumber(rounded)} kg`;
}

function getExerciseLoadProfile(exercise: LibraryExercise, ctx: BuildContext): ExerciseLoadProfile {
  if (exercise.id === "ex-bench-dumbbell") {
    return { display: "bilateral-dumbbell", multiplier: 0.85 };
  }

  if (exercise.id === "ex-row-dumbbell") {
    return { display: "per-arm", maxKg: ctx.experience === "avance" ? 50 : 40, multiplier: 0.8 };
  }

  if (exercise.id === "ex-goblet-squat") {
    return { maxKg: ctx.experience === "avance" ? 45 : 40, multiplier: 0.55 };
  }

  return {};
}

function getDeclaredReferenceKg(pattern: MovementPattern, settings: UserSettings): number | undefined {
  const reference = findMatchingReference(pattern, settings);
  if (reference?.estimatedOneRepMaxKg) {
    return reference.estimatedOneRepMaxKg;
  }

  if (pattern === "chest-compound" && settings.benchOneRepMaxKg > 0) {
    return settings.benchOneRepMaxKg;
  }

  return undefined;
}

function getReferenceKeywords(pattern: MovementPattern): string[] {
  if (pattern === "chest-compound") return ["developpe couche", "bench"];
  if (pattern === "legs-quad") return ["squat", "presse", "leg"];
  if (pattern === "back-horizontal" || pattern === "back-vertical") return ["tirage", "rowing", "traction", "pull"];
  if (pattern === "legs-hinge") return ["hip thrust", "souleve", "hinge", "rdl"];
  if (pattern === "shoulders-compound") return ["developpe militaire", "developpe epaules", "shoulder"];
  return [];
}

function findMatchingReference(pattern: MovementPattern, settings: UserSettings) {
  const keywords = getReferenceKeywords(pattern);
  if (keywords.length === 0) return undefined;

  return [...settings.strengthReferences]
    .filter((item) => {
      const lift = normalizeForMatch(item.lift);
      return keywords.some((keyword) => lift.includes(keyword));
    })
    .sort((a, b) => {
      const aOrigin = getReferenceOriginRank(a.origin);
      const bOrigin = getReferenceOriginRank(b.origin);
      if (a.locked !== b.locked) return Number(b.locked) - Number(a.locked);
      if (aOrigin !== bOrigin) return bOrigin - aOrigin;
      const aTime = a.lastTestedAt ? new Date(a.lastTestedAt).getTime() : 0;
      const bTime = b.lastTestedAt ? new Date(b.lastTestedAt).getTime() : 0;
      return bTime - aTime;
    })[0];
}

function getReferenceOriginRank(origin: UserSettings["strengthReferences"][number]["origin"]): number {
  if (origin === "manual") return 3;
  if (origin === "learned") return 2;
  if (origin === "onboarding") return 1;
  return 0;
}

function inferBaselineOneRepMaxKg(pattern: MovementPattern, ctx: BuildContext): number | undefined {
  const bodyweight = ctx.settings.currentWeightKg;
  if (!bodyweight || bodyweight <= 0) return undefined;

  const ratios = getBaselineRatios(ctx.settings.sex);
  const baseRatio = ratios[pattern];
  if (!baseRatio) return undefined;

  const experienceMultiplier = ctx.experience === "debutant" ? 0.78 : ctx.experience === "avance" ? 1.18 : 1;
  return bodyweight * baseRatio * experienceMultiplier;
}

function getBaselineRatios(sex: UserSettings["sex"]): Partial<Record<MovementPattern, number>> {
  if (sex === "male") {
    return {
      "chest-compound": 0.72,
      "legs-quad": 1.25,
      "back-horizontal": 0.72,
      "back-vertical": 0.62,
      "legs-hinge": 1.05,
      "shoulders-compound": 0.45
    };
  }

  if (sex === "female") {
    return {
      "chest-compound": 0.43,
      "legs-quad": 1,
      "back-horizontal": 0.52,
      "back-vertical": 0.45,
      "legs-hinge": 0.82,
      "shoulders-compound": 0.3
    };
  }

  return {
    "chest-compound": 0.55,
    "legs-quad": 1.12,
    "back-horizontal": 0.6,
    "back-vertical": 0.52,
    "legs-hinge": 0.92,
    "shoulders-compound": 0.37
  };
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function roundToNearest(value: number, step: number): number {
  return Math.round(value / step) * step;
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}
