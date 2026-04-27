export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type EffortStatus = "ok" | "easy" | "hard" | "pain" | "skipped";

export type LoadUnit = "kg" | "lb";

export type BreathFeedback =
  | "bon"
  | "correct"
  | "difficile"
  | "tres-mauvais"
  | "vertige"
  | "oppression";

export type ProgramGoal =
  | "fat_loss"
  | "muscle_gain"
  | "strength"
  | "recomposition"
  | "cardio_health"
  | "judo_prep"
  | "custom_mix";

export type ProgressionStyle = "regular" | "dynamic" | "controlled_aggressive";

export type DetailPreference = "simple" | "detailed";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type DailyJudoChoice = "judo" | "no_judo" | "replace_cardio" | "strength_only";

export type ProgressionDecision = "augmenter" | "maintenir" | "baisser" | "remplacer" | "alerte";

export type ProgressionDecisionCode = "increase" | "maintain" | "decrease" | "replace" | "watch" | "deload";

export type ProgressionEvidenceTag =
  | "progression_rule"
  | "pain_rule"
  | "fatigue_rule"
  | "judo_rule"
  | "cardio_rule"
  | "volume_rule"
  | "stagnation_rule"
  | "guardrail_rule";

export type ProgressionConfidence = "low" | "medium" | "high";

export type AdaptationExplanation = {
  decisionLabel: string;
  simpleReason: string;
  ruleApplied: string;
  whatUserShouldLearn: string;
  nextSessionImpact: string;
};

export type StrengthReference = {
  lift: string;
  value: string;
  note?: string;
};

export type UserSportProfile = {
  firstName: string;
  age: number;
  heightCm: number;
  startingWeightKg: number;
  targetWeightKg: number;
  mainGoal: string;
  secondaryGoals: string[];
  gym: string;
  judoDays: Weekday[];
  cardioLevel: string;
  sleep: string;
  medicalNotes: string[];
  watchPoints: string[];
  preferences: string[];
  avoid: string[];
  strengthReferences: StrengthReference[];
};

export type Exercise = {
  id: string;
  name: string;
  target: string;
  plannedLoad?: string;
  rest: string;
  cue: string;
};

export type PlannedSession = {
  id: string;
  weekday: Weekday;
  title: string;
  focus: string;
  duration: string;
  intensity: "Légère" | "Modérée" | "Soutenue";
  scheduleLabel?: string;
  notes?: string[];
  exercises: Exercise[];
};

export type CoachSeed = {
  profile: UserSportProfile;
  weeklyProgram: PlannedSession[];
};

export type ExerciseLog = {
  exerciseId: string;
  status?: EffortStatus;
  usedLoad: string;
  completedReps: string;
  comment: string;
};

export type SessionFeedback = {
  difficulty: number;
  globalPain: number;
  energy: number;
  breath: BreathFeedback;
};

export type SessionTimer = {
  startedAt: string;
  isPaused: boolean;
  pausedAt?: string;
  pausedTotalMs: number;
};

export type ExerciseTiming = {
  activeExerciseId?: string;
  activeExerciseStartedAt?: string;
  elapsedByExerciseMs: Record<string, number>;
};

export type ExerciseProgressionLog = {
  exerciseId: string;
  exerciseName: string;
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

export type CoachAiDecision = {
  exercise: string;
  recommendation: "augmenter" | "maintenir" | "baisser" | "remplacer";
  reason: string;
};

export type CoachAiResponse = {
  summary: string;
  decisions: CoachAiDecision[];
  warnings: string[];
  nextSessionAdjustments: string[];
  motivationalMessage: string;
};

export type SessionActivityType = "muscu" | "cardio" | "judo" | "marche";

export type CalorieEstimate = {
  activityType: SessionActivityType;
  calories: number;
  durationMinutes: number;
  intensity: number;
  weightKg: number;
  label: "Estimation approximative";
  note: string;
};

export type ActiveSession = {
  dateKey: string;
  sessionId: string;
  startedAt: string;
  logs: Record<string, ExerciseLog>;
  feedback: SessionFeedback;
  timer: SessionTimer;
  timing: ExerciseTiming;
};

export type CompletedSession = ActiveSession & {
  id: string;
  completedAt: string;
  title: string;
  focus: string;
  mainExercises: string[];
  progressions: Record<string, ExerciseProgressionLog>;
  nextSessionTitle: string;
  nextSessionDateKey: string;
  aiCoach?: CoachAiResponse;
  calorieEstimate?: CalorieEstimate;
  totalDurationMs: number;
  exerciseDurationsMs: Record<string, number>;
};

export type UserSettings = {
  athleteName: string;
  age: number;
  heightCm: number;
  loadUnit: LoadUnit;
  currentWeightKg: number;
  targetWeightKg: number;
  mainObjective: ProgramGoal;
  sessionsPerWeek: 3 | 4 | 5 | 6;
  availableDays: Weekday[];
  sports: {
    judo: boolean;
    other: string;
  };
  equipment: string[];
  likedExercises: string[];
  refusedExercises: string[];
  painWatchList: string[];
  level: ExperienceLevel;
  detailPreference: DetailPreference;
  progressionStyle: ProgressionStyle;
  dailyJudoChoice: DailyJudoChoice;
  dailyJudoChoiceDateKey?: string;
  onboardingCompleted: boolean;
  benchOneRepMaxKg: number;
  judoDays: Weekday[];
  aiEnabled: boolean;
  darkMode: boolean;
};
