// ---------------------------------------------------------------------------
// Guardrail shared types (defined here to avoid circular imports with lib/guardrails)
// ---------------------------------------------------------------------------

export type MuscleGroup =
  | "pectoraux"
  | "dos"
  | "epaules"
  | "biceps"
  | "triceps"
  | "jambes"
  | "abdos"
  | "cardio"
  | "autre";

export type ExerciseClassification = "force" | "hypertrophie" | "cardio" | "mobilite" | "technique";

export type AdaptationExplanation = {
  decision: string;
  raison: string;
  regleAppliquee: string;
  ceQueDevraisComprendre: string;
  impact: string;
};

/** Subset of GuardrailResult stored in CompletedSession (avoids circular import with lib/guardrails). */
export type GuardrailSummary = {
  allowed: boolean;
  adjustedDecision: ProgressionDecision;
  adjustedLoad?: string;
  confidence: "élevé" | "moyen" | "faible";
  explanation: AdaptationExplanation;
  violations: Array<{ rule: string; reason: string; severity: "block" | "warn" }>;
};

// ---------------------------------------------------------------------------

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

export type CautionLevel = "prudent" | "normal" | "agressif";

export type UserSex = "female" | "male" | "other" | "prefer-not-to-say";

export type RecoveryProfile = "poor" | "irregular" | "regular" | "good";

export type SessionDurationPreference = "short" | "standard" | "long";

export type ExternalSportIntensity = "low" | "moderate" | "high";

export type BodyArea =
  | "wrist"
  | "shoulder"
  | "back"
  | "knee"
  | "hip"
  | "ankle"
  | "elbow"
  | "neck"
  | "cardio"
  | "other";

export type ConstraintSeverity = "info" | "caution" | "avoid";

export type PrimaryGoal =
  | "perte-gras"
  | "prise-masse"
  | "recomposition"
  | "performance"
  | "sante";

export type ExperienceLevel = "debutant" | "intermediaire" | "avance";

export type Equipment = "salle-complete" | "halteres-maison" | "poids-corps";

export type MovementPattern =
  | "chest-compound"
  | "chest-isolation"
  | "back-vertical"
  | "back-horizontal"
  | "legs-quad"
  | "legs-hinge"
  | "legs-calf"
  | "shoulders-compound"
  | "shoulders-lateral"
  | "shoulders-rear"
  | "arms-biceps"
  | "arms-triceps"
  | "core"
  | "cardio-steady"
  | "cardio-hiit"
  | "mobility"
  | "fullbody";

export type ProgressionDecision = "augmenter" | "maintenir" | "baisser" | "remplacer" | "alerte";

export type TrainingPhase = "accumulation" | "conditioning" | "deload" | "intensification" | "maintenance";

export type LoadPrescription = {
  display?: string;
  kg?: number;
  kind: "bodyweight" | "estimated" | "fixed" | "free" | "percent-1rm";
  percent1Rm?: number;
  source?: "declared" | "estimated" | "manual" | "parsed";
  unit?: LoadUnit;
};

export type ExercisePrescription = {
  durationMin?: number;
  durationMinMax?: number;
  durationSec?: number;
  durationSecMax?: number;
  load?: LoadPrescription;
  repsMax?: number;
  repsMin?: number;
  restSec?: number;
  restSecMax?: number;
  rirTarget?: number;
  sets?: number;
  setsMax?: number;
  targetRpe?: number;
  work?: "amrap" | "duration" | "reps" | "rounds";
};

export type ExerciseTaxonomy = {
  equipment?: Equipment[];
  isCompound?: boolean;
  jointStress?: Partial<Record<BodyArea, ConstraintSeverity>>;
  pattern?: MovementPattern;
  tags?: string[];
};

export type ExerciseSelectionReason = {
  title: string;
  detail: string;
  tone: "calm" | "info" | "warn";
};

export type ExerciseSelectionInsight = {
  summary: string;
  reasons: ExerciseSelectionReason[];
};

export type StrengthReference = {
  lift: string;
  value: string;
  note?: string;
  loadKg?: number;
  reps?: number;
  estimatedOneRepMaxKg?: number;
  confidence?: "declared" | "estimated" | "measured";
  lastTestedAt?: string;
  origin?: "learned" | "manual" | "onboarding";
  locked?: boolean;
};

export type LoadBiasByPattern = Partial<Record<MovementPattern, number>>;

export type ExerciseSwapPreferences = Partial<Record<string, string>>;

export type SetBiasByPattern = Partial<Record<MovementPattern, number>>;

export type RepBiasByPattern = Partial<Record<MovementPattern, number>>;

export type RestBiasByPattern = Partial<Record<MovementPattern, number>>;

export type CalibrationEventKind =
  | "load-feedback"
  | "reference-deleted"
  | "reference-learned"
  | "reference-locked"
  | "reference-unlocked";

export type CalibrationEventTone = "info" | "progress" | "warn";

export type CalibrationEvent = {
  id: string;
  createdAt: string;
  kind: CalibrationEventKind;
  tone: CalibrationEventTone;
  title: string;
  subject: string;
  detail: string;
};

export type ExternalSport = {
  id: string;
  name: string;
  days: Weekday[];
  intensity: ExternalSportIntensity;
  notes?: string;
};

export type TrainingConstraint = {
  id: string;
  area: BodyArea;
  label: string;
  severity: ConstraintSeverity;
  notes?: string;
  avoidExerciseIds?: string[];
  createdAt?: string;
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
  muscleGroups?: MuscleGroup[];
  classification?: ExerciseClassification;
  prescription?: ExercisePrescription;
  selectionInsight?: ExerciseSelectionInsight;
  taxonomy?: ExerciseTaxonomy;
};

export type PlannedSession = {
  id: string;
  weekday: Weekday;
  title: string;
  focus: string;
  duration: string;
  intensity: "Légère" | "Modérée" | "Soutenue";
  deloadEvery?: number;
  mesocycleLength?: number;
  phase?: TrainingPhase;
  scheduleLabel?: string;
  weekIndex?: number;
  notes?: string[];
  exercises: Exercise[];
};

export type CoachSeed = {
  profile: UserSportProfile;
  weeklyProgram: PlannedSession[];
};

/**
 * Per-set entry captured by the guided session flow.
 * Optional field on ExerciseLog — older completed sessions don't have it
 * and the progression engine continues to read usedLoad / completedReps.
 */
export type SetLog = {
  setIndex: number;       // 1-based
  usedLoad: string;       // load entered by the user for this set
  completedReps: string;  // reps actually performed for this set
};

export type ExerciseLog = {
  exerciseId: string;
  status?: EffortStatus;
  usedLoad: string;
  completedReps: string;
  comment: string;
  rir?: number;
  rpe?: number;
  sets?: SetLog[];
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
  decision: ProgressionDecision;
  reason: string;
  warning?: string;
  replacementSuggestion?: string;
};

export type ExerciseHistoryPoint = {
  completedReps?: string;
  dateKey: string;
  decision?: ProgressionDecision;
  energy?: number;
  globalPain?: number;
  load?: string;
  rpe: number;
  status?: EffortStatus;
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

export type ActiveSession = {
  dateKey: string;
  sessionId: string;
  startedAt: string;
  logs: Record<string, ExerciseLog>;
  feedback: SessionFeedback;
  timer: SessionTimer;
  timing: ExerciseTiming;
  replacements?: Record<string, Exercise>;
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
  totalDurationMs: number;
  exerciseDurationsMs: Record<string, number>;
  adaptationExplanations?: Record<string, GuardrailSummary>;
};

export type WeightEntry = {
  date: string; // ISO date string
  kg: number;
};

export type ProgramLevel = "debutant" | "intermediaire" | "avance";

export type ProgramObjective =
  | PrimaryGoal
  | "force"
  | "cardio-sante"
  | "judo"
  | "fessiers"
  | "post-partum";

export type ProgramTag =
  | "cardio"
  | "debutant"
  | "fessiers"
  | "force"
  | "femme"
  | "homme"
  | "judo"
  | "machines"
  | "perte-gras"
  | "post-partum"
  | "prise-masse"
  | "recomposition"
  | "sante";

export type ProgramProgressionRules = {
  loadStepKg?: {
    compoundUpper?: number;
    compoundLower?: number;
    isolation?: number;
    machineUpper?: number;
    machineLower?: number;
  };
  method:
    | "double-progression"
    | "linear-load"
    | "rep-first"
    | "technique-first";
  notes?: string[];
};

export type CardioProgressionRules = {
  allowedModalities: string[];
  method: "duration-first" | "incline-first" | "intensity-first";
  maxSingleChange?: "duration" | "incline" | "speed" | "resistance";
  notes?: string[];
};

export type ReplacementRules = {
  avoidPatterns?: MovementPattern[];
  preferEquipment?: Equipment[];
  rules?: string[];
};

export type ProgramGuardrails = {
  contraindications: string[];
  deloadEveryWeeks?: number;
  notes?: string[];
  painRules?: string[];
};

export type ProgramSessionTemplate = {
  id: string;
  weekday?: Weekday;
  scheduleLabel?: string;
  title: string;
  focus: string;
  duration: string;
  intensity: PlannedSession["intensity"];
  phase?: TrainingPhase;
  notes?: string[];
  exercises: Exercise[];
};

export type ProgramTemplate = {
  id: string;
  name: string;
  description: string;
  level: ProgramLevel;
  primaryObjective: ProgramObjective;
  secondaryObjectives: ProgramObjective[];
  frequency: 3 | 4 | 5 | 6;
  averageDuration: string;
  requiredEquipment: Equipment[];
  contraindications: string[];
  tags: ProgramTag[];
  weeklyStructure: string[];
  sessions: ProgramSessionTemplate[];
  progressionRules: ProgramProgressionRules;
  cardioRules?: CardioProgressionRules;
  replacementRules?: ReplacementRules;
  guardrails: ProgramGuardrails;
};

export type ProgramRecommendation = {
  program: ProgramTemplate;
  score: number;
  rank: number;
  reasons: string[];
  warnings: string[];
};

export type ActiveProgramMeta = {
  programId: string;
  programName: string;
  selectedAt: string;
  source: "manual" | "onboarding" | "preset" | "recommended";
  profileId?: string;
  templateVersion?: number;
};

export type Profile = {
  id: string;
  name: string;
  avatar: string;     // emoji (fallback when no photo)
  photoUrl?: string;  // base64 data URL of a user-uploaded photo
};

export type UserSettings = {
  schemaVersion: number;
  athleteName: string;
  sex: UserSex;
  loadUnit: LoadUnit;
  currentWeightKg: number;
  targetWeightKg: number;
  benchOneRepMaxKg: number;
  judoDays: Weekday[];
  cautionLevel: CautionLevel;
  aiEnabled: boolean;
  darkMode: boolean;
  age: number;
  heightCm: number;
  gym: string;
  mainGoal: string;
  cardioLevel: string;
  sleepQuality: string;
  recoveryProfile: RecoveryProfile;
  medicalNotes: string;
  watchPoints: string[];
  preferences: string[];
  avoid: string[];
  availableDays: Weekday[];
  externalSports: ExternalSport[];
  constraints: TrainingConstraint[];
  strengthReferences: StrengthReference[];
  loadBiasByPattern?: LoadBiasByPattern;
  exerciseSwapPreferences?: ExerciseSwapPreferences;
  setBiasByPattern?: SetBiasByPattern;
  repBiasByPattern?: RepBiasByPattern;
  restBiasByPattern?: RestBiasByPattern;
  calibrationEvents?: CalibrationEvent[];
  sessionDurationPreference: SessionDurationPreference;
  weightLog?: WeightEntry[];
  primaryGoal?: PrimaryGoal;
  secondaryGoal?: PrimaryGoal;
  experienceLevel?: ExperienceLevel;
  equipment?: Equipment;
  weeklyFrequency?: number; // 2-6
  complementaryPrograms?: string[]; // IDs of activated complements (see lib/complementaryPrograms)
};
