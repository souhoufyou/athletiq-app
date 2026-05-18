"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { athleteProfile, weeklyProgram } from "@/data/program";
import { applyComplementsToProgram } from "@/lib/applyComplements";
import { getDateKey } from "@/lib/date";
import { adaptProgramAfterSession } from "@/lib/programAdaptation";
import { adaptSettingsAfterSession } from "@/lib/profileAdaptation";
import { buildProgram } from "@/lib/programBuilder";
import { normalizeExerciseV2, normalizeProgramV2 } from "@/lib/programSchema";
import { scheduleSessionsFlexibly } from "@/lib/programScheduling";
import { getUniqueSessions } from "@/lib/sessionMeta";
import { calculateProgression, type ProgressionSessionContext } from "@/lib/progression";
import { CURRENT_SETTINGS_SCHEMA_VERSION, normalizeUserSettings } from "@/lib/settingsSchema";
import { createEmptyLogs, defaultSessionFeedback, getNextSession, getTodaySession } from "@/lib/session";
import type {
  ActiveProgramConfig,
  ActiveSession,
  CoachAiResponse,
  CompletedSession,
  ExternalSport,
  EffortStatus,
  Exercise,
  ExerciseHistoryPoint,
  ExerciseLog,
  ExerciseProgressionLog,
  GuardrailSummary,
  MuscleGroup,
  PlannedSession,
  Profile,
  ProgramSessionTemplate,
  SessionFeedback,
  UserSettings,
  Weekday
} from "@/types/training";

const PROFILES_KEY = "coach-adaptatif:profiles";

type SyncEntity = "settings" | "program" | "history" | "profile";

function enqueueSyncIfAuthenticated(...entities: SyncEntity[]) {
  import("@/lib/sync")
    .then(({ syncManager, touchSyncMeta }) => {
      const profilesState = readJson<ProfilesState | null>(PROFILES_KEY, null);
      const profileId = profilesState?.activeProfileId ?? "default";
      touchSyncMeta(profileId, ...entities);
      syncManager.enqueue(...entities);
    })
    .catch(() => {});
}

type ProfilesState = {
  profiles: Profile[];
  activeProfileId: string;
};

const DEFAULT_PROFILE_ID = "default";

function profileKey(profileId: string, suffix: string): string {
  return `coach-adaptatif:p:${profileId}:${suffix}`;
}

function activeSessionKeyFor(profileId: string) {
  return profileKey(profileId, "active-session");
}

function historyKeyFor(profileId: string) {
  return profileKey(profileId, "history");
}

function programKeyFor(profileId: string) {
  return profileKey(profileId, "program");
}

function settingsKeyFor(profileId: string) {
  return profileKey(profileId, "settings");
}

function onboardingKeyFor(profileId: string) {
  return profileKey(profileId, "onboarding-done");
}

function programConfigKeyFor(profileId: string) {
  return profileKey(profileId, "program-config");
}

const LEGACY_ACTIVE_SESSION_KEY = "coach-adaptatif:active-session";
const LEGACY_HISTORY_KEY = "coach-adaptatif:history";
const LEGACY_PROGRAM_KEY = "coach-adaptatif:program";
const LEGACY_SETTINGS_KEY = "coach-adaptatif:settings";
const LEGACY_ONBOARDING_KEY = "coach-adaptatif:onboarding-done";

const allWeekdays: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const defaultExternalSports: ExternalSport[] =
  athleteProfile.judoDays.length > 0
    ? [
        {
          id: "judo",
          name: "Judo",
          days: athleteProfile.judoDays,
          intensity: "high",
          notes: "Sport externe a integrer dans la fatigue et la recuperation."
        }
      ]
    : [];

const defaultSettings: UserSettings = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  athleteName: athleteProfile.firstName,
  sex: "prefer-not-to-say",
  loadUnit: "kg",
  currentWeightKg: athleteProfile.startingWeightKg,
  targetWeightKg: athleteProfile.targetWeightKg,
  benchOneRepMaxKg: 127,
  judoDays: athleteProfile.judoDays,
  cautionLevel: "normal",
  aiEnabled: false,
  darkMode: true,
  age: athleteProfile.age,
  heightCm: athleteProfile.heightCm,
  gym: athleteProfile.gym,
  mainGoal: athleteProfile.mainGoal,
  cardioLevel: athleteProfile.cardioLevel,
  sleepQuality: athleteProfile.sleep,
  recoveryProfile: "irregular",
  medicalNotes: athleteProfile.medicalNotes.join("\n"),
  watchPoints: athleteProfile.watchPoints,
  preferences: athleteProfile.preferences,
  avoid: athleteProfile.avoid,
  availableDays: allWeekdays,
  externalSports: defaultExternalSports,
  constraints: [
    ...athleteProfile.watchPoints.map((point, index) => ({
      id: `seed-watch-${index}`,
      area: point.toLowerCase().includes("poignet") ? ("wrist" as const) : ("other" as const),
      label: point,
      severity: "caution" as const
    })),
    ...athleteProfile.medicalNotes.map((note, index) => ({
      id: `seed-medical-${index}`,
      area: "other" as const,
      label: note,
      severity: "info" as const
    }))
  ],
  strengthReferences: athleteProfile.strengthReferences,
  loadBiasByPattern: {},
  exerciseSwapPreferences: {},
  setBiasByPattern: {},
  repBiasByPattern: {},
  restBiasByPattern: {},
  calibrationEvents: [],
  sessionDurationPreference: "standard"
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

const serializedStorageCache = new Map<string, string>();

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  const serialized = JSON.stringify(value);

  if (serializedStorageCache.get(key) === serialized) {
    return;
  }

  if (window.localStorage.getItem(key) === serialized) {
    serializedStorageCache.set(key, serialized);
    return;
  }

  window.localStorage.setItem(key, serialized);
  serializedStorageCache.set(key, serialized);
}

function removeStoredJson(key: string): void {
  if (typeof window === "undefined") {
    return;
  }

  serializedStorageCache.delete(key);
  window.localStorage.removeItem(key);
}

function migrateLegacyDataIfNeeded(): ProfilesState {
  if (typeof window === "undefined") {
    return { profiles: [{ id: DEFAULT_PROFILE_ID, name: "Moi", avatar: "💪" }], activeProfileId: DEFAULT_PROFILE_ID };
  }

  const existing = readJson<ProfilesState | null>(PROFILES_KEY, null);
  if (existing && existing.profiles.length > 0) return existing;

  // Migrate legacy un-prefixed keys to default profile
  const legacyKeys: Array<[string, string]> = [
    [LEGACY_ACTIVE_SESSION_KEY, activeSessionKeyFor(DEFAULT_PROFILE_ID)],
    [LEGACY_HISTORY_KEY, historyKeyFor(DEFAULT_PROFILE_ID)],
    [LEGACY_PROGRAM_KEY, programKeyFor(DEFAULT_PROFILE_ID)],
    [LEGACY_SETTINGS_KEY, settingsKeyFor(DEFAULT_PROFILE_ID)],
    [LEGACY_ONBOARDING_KEY, onboardingKeyFor(DEFAULT_PROFILE_ID)]
  ];

  const legacySettings = readJson<Partial<UserSettings> | null>(LEGACY_SETTINGS_KEY, null);
  const legacyName = legacySettings?.athleteName || "Moi";

  for (const [legacy, target] of legacyKeys) {
    const value = window.localStorage.getItem(legacy);
    if (value !== null && window.localStorage.getItem(target) === null) {
      window.localStorage.setItem(target, value);
    }
  }

  const state: ProfilesState = {
    profiles: [{ id: DEFAULT_PROFILE_ID, name: legacyName, avatar: "💪" }],
    activeProfileId: DEFAULT_PROFILE_ID
  };
  writeJson(PROFILES_KEY, state);
  return state;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level shared store (singleton).
// All hook instances subscribe to this — switching profiles, starting sessions,
// etc. propagate to every mounted component that uses useCoachStorage.
// ─────────────────────────────────────────────────────────────────────────────

type StoreState = {
  isReady: boolean;
  isOnboardingDone: boolean;
  profiles: Profile[];
  activeProfileId: string;
  activeSession: ActiveSession | null;
  history: CompletedSession[];
  currentProgram: PlannedSession[];
  settings: UserSettings;
};

const initialStore: StoreState = {
  isReady: false,
  isOnboardingDone: false,
  profiles: [],
  activeProfileId: DEFAULT_PROFILE_ID,
  activeSession: null,
  history: [],
  currentProgram: weeklyProgram,
  settings: defaultSettings
};

let store: StoreState = initialStore;
const listeners = new Set<() => void>();
let storeInitialized = false;

function getStoreSnapshot(): StoreState {
  return store;
}

function getServerSnapshot(): StoreState {
  return initialStore;
}

function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function setStore(patch: Partial<StoreState>) {
  store = { ...store, ...patch };
  emit();
}

function loadProfileIntoStore(profileId: string, profilesOverride?: Profile[]) {
  const savedActiveSession = readJson<ActiveSession | null>(activeSessionKeyFor(profileId), null);
  const history = readJson<CompletedSession[]>(historyKeyFor(profileId), []);
  const program = normalizeProgramV2(readJson<PlannedSession[]>(programKeyFor(profileId), weeklyProgram));
  const rawSettings = readJson<Partial<UserSettings> | null>(settingsKeyFor(profileId), null);
  const settings = normalizeUserSettings(rawSettings, defaultSettings);
  const hasExistingData =
    typeof window !== "undefined" && window.localStorage.getItem(settingsKeyFor(profileId)) !== null;
  const onboardingFlag = readJson<boolean>(onboardingKeyFor(profileId), false);
  const shouldBootstrapSeedProfile =
    typeof window !== "undefined" &&
    profileId === DEFAULT_PROFILE_ID &&
    !hasExistingData &&
    !onboardingFlag &&
    window.localStorage.getItem(programKeyFor(profileId)) === null &&
    window.localStorage.getItem(historyKeyFor(profileId)) === null;

  if (hasExistingData) {
    writeJson(settingsKeyFor(profileId), settings);
  }

  if (shouldBootstrapSeedProfile) {
    writeJson(settingsKeyFor(profileId), settings);
    writeJson(programKeyFor(profileId), program);
    writeJson(onboardingKeyFor(profileId), true);
  }

  setStore({
    isReady: true,
    isOnboardingDone: onboardingFlag || hasExistingData || shouldBootstrapSeedProfile,
    profiles: profilesOverride ?? store.profiles,
    activeProfileId: profileId,
    activeSession: savedActiveSession ? normalizeActiveSession(savedActiveSession) : null,
    history,
    currentProgram: program,
    settings
  });

  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", settings.darkMode);
  }
}

function ensureStoreInitialized() {
  if (storeInitialized || typeof window === "undefined") return;
  storeInitialized = true;
  const profilesState = migrateLegacyDataIfNeeded();
  loadProfileIntoStore(profilesState.activeProfileId, profilesState.profiles);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mutations (module-level, stable references — no useCallback needed)
// ─────────────────────────────────────────────────────────────────────────────

function persistProfilesAndUpdate(nextProfiles: Profile[], nextActiveId: string) {
  writeJson<ProfilesState>(PROFILES_KEY, { profiles: nextProfiles, activeProfileId: nextActiveId });
  setStore({ profiles: nextProfiles });
}

function setActiveSessionStore(updater: (curr: ActiveSession | null) => ActiveSession | null) {
  const next = updater(store.activeSession);
  if (next === store.activeSession) {
    return;
  }

  store = { ...store, activeSession: next };
  if (next) {
    writeJson(activeSessionKeyFor(store.activeProfileId), next);
  } else {
    removeStoredJson(activeSessionKeyFor(store.activeProfileId));
  }
  emit();
}

function setHistoryStore(updater: (curr: CompletedSession[]) => CompletedSession[]) {
  const next = updater(store.history);
  store = { ...store, history: next };
  writeJson(historyKeyFor(store.activeProfileId), next);
  emit();
}

function setSettingsStore(next: UserSettings) {
  const normalized = normalizeUserSettings(next, defaultSettings);
  if (JSON.stringify(normalized) === JSON.stringify(store.settings)) {
    return;
  }

  store = { ...store, settings: normalized };
  writeJson(settingsKeyFor(store.activeProfileId), normalized);
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", normalized.darkMode);
  }
  emit();
  enqueueSyncIfAuthenticated("settings");
}

function startSessionAction(session: PlannedSession): ActiveSession {
  const startedAt = new Date().toISOString();
  const next: ActiveSession = {
    dateKey: getDateKey(),
    sessionId: session.id,
    startedAt,
    logs: createEmptyLogs(session),
    feedback: defaultSessionFeedback,
    timer: { startedAt, isPaused: false, pausedTotalMs: 0 },
    timing: {
      activeExerciseId: session.exercises[0]?.id,
      activeExerciseStartedAt: startedAt,
      elapsedByExerciseMs: {}
    }
  };
  setActiveSessionStore(() => next);
  return next;
}

function cancelActiveSessionAction() {
  setActiveSessionStore(() => null);
}

function pauseSessionTimerAction() {
  setActiveSessionStore((current) => {
    if (!current || getTimer(current).isPaused) return current;
    const now = new Date().toISOString();
    const normalized = normalizeActiveSession(current);
    const timing = finalizeActiveExerciseTiming(normalized, now);
    return {
      ...normalized,
      timer: { ...normalized.timer, isPaused: true, pausedAt: now },
      timing: { ...timing, activeExerciseStartedAt: undefined }
    };
  });
}

function resumeSessionTimerAction() {
  setActiveSessionStore((current) => {
    if (!current || !getTimer(current).isPaused) return current;
    const now = new Date();
    const normalized = normalizeActiveSession(current);
    const pausedAt = normalized.timer.pausedAt
      ? new Date(normalized.timer.pausedAt).getTime()
      : now.getTime();
    return {
      ...normalized,
      timer: {
        startedAt: normalized.timer.startedAt,
        isPaused: false,
        pausedTotalMs: normalized.timer.pausedTotalMs + Math.max(0, now.getTime() - pausedAt)
      },
      timing: {
        ...normalized.timing,
        activeExerciseStartedAt: normalized.timing.activeExerciseId ? now.toISOString() : undefined
      }
    };
  });
}

function setActiveExerciseAction(exerciseId: string) {
  setActiveSessionStore((current) => {
    if (!current) return current;
    const normalized = normalizeActiveSession(current);
    if (normalized.timing.activeExerciseId === exerciseId) return normalized;
    const now = new Date().toISOString();
    const timing = finalizeActiveExerciseTiming(normalized, now);
    return {
      ...normalized,
      timing: {
        ...timing,
        activeExerciseId: exerciseId,
        activeExerciseStartedAt: normalized.timer.isPaused ? undefined : now
      }
    };
  });
}

function replaceExerciseAction(exerciseId: string, replacement: Exercise) {
  setActiveSessionStore((current) => {
    if (!current) return current;
    return {
      ...current,
      replacements: { ...current.replacements, [exerciseId]: normalizeExerciseV2(replacement) }
    };
  });
}

function clearReplacementAction(exerciseId: string) {
  setActiveSessionStore((current) => {
    if (!current?.replacements) return current;
    const next = { ...current.replacements };
    delete next[exerciseId];
    return { ...current, replacements: Object.keys(next).length > 0 ? next : undefined };
  });
}

function updateExerciseLogAction(exerciseId: string, patch: Partial<ExerciseLog>) {
  const safePatch: Partial<ExerciseLog> = { ...patch };
  delete safePatch.exerciseId;
  setActiveSessionStore((current) => {
    if (!current) return current;
    const currentLog = current.logs[exerciseId] ?? {
      exerciseId,
      usedLoad: "",
      completedReps: "",
      comment: ""
    };
    const nextLog = { ...currentLog, ...safePatch, exerciseId };
    if (JSON.stringify(currentLog) === JSON.stringify(nextLog)) {
      return current;
    }

    return {
      ...current,
      logs: {
        ...current.logs,
        [exerciseId]: nextLog
      }
    };
  });
}

function updateExerciseLogsBatchAction(updates: Array<{ exerciseId: string; patch: Partial<ExerciseLog> }>) {
  const sanitized = updates.map(({ exerciseId, patch }) => {
    const safePatch: Partial<ExerciseLog> = { ...patch };
    delete safePatch.exerciseId;
    return { exerciseId, patch: safePatch };
  });

  setActiveSessionStore((current) => {
    if (!current || sanitized.length === 0) return current;

    const logs = { ...current.logs };
    let changed = false;

    for (const { exerciseId, patch } of sanitized) {
      const currentLog = logs[exerciseId] ?? {
        exerciseId,
        usedLoad: "",
        completedReps: "",
        comment: ""
      };
      const nextLog = { ...currentLog, ...patch, exerciseId };

      if (JSON.stringify(currentLog) !== JSON.stringify(nextLog)) {
        logs[exerciseId] = nextLog;
        changed = true;
      }
    }

    return changed ? { ...current, logs } : current;
  });
}

function updateSessionFeedbackAction(patch: Partial<SessionFeedback>) {
  setActiveSessionStore((current) => {
    if (!current) return current;
    return { ...current, feedback: { ...current.feedback, ...patch } };
  });
}

function completeSessionAction(session: PlannedSession): CompletedSession | undefined {
  const activeSession = store.activeSession;
  if (!activeSession) return undefined;

  const completedAt = new Date().toISOString();
  const normalizedActive = normalizeActiveSession(activeSession);
  const finalTiming = finalizeActiveExerciseTiming(normalizedActive, completedAt);
  const totalDurationMs = getSessionElapsedMs(normalizedActive, new Date(completedAt));
  const sessionFeedback = activeSession.feedback ?? defaultSessionFeedback;
  const completedLogs = Object.fromEntries(
    session.exercises.map((exercise) => {
      const log = normalizedActive.logs[exercise.id] ?? createEmptyExerciseLog(exercise.id);
      return [exercise.id, normalizeExerciseLogForCompletion(exercise, log)];
    })
  ) as Record<string, ExerciseLog>;

  const todayWday = getTodayWeekday();
  const judoTonight = store.settings.judoDays.includes(todayWday);
  const judoTomorrow = store.settings.judoDays.includes(getNextWeekday(todayWday));
  const weeklySetsByMuscle = getWeeklySetsByMuscle(store.history, store.currentProgram);

  const adaptationExplanations: Record<string, GuardrailSummary> = {};

  const progressions = Object.fromEntries(
    session.exercises.map((exercise) => {
      const log = completedLogs[exercise.id] ?? createEmptyExerciseLog(exercise.id);
      const sessionCtx: ProgressionSessionContext = {
        benchOneRepMaxKg: store.settings.benchOneRepMaxKg,
        cautionLevel: store.settings.cautionLevel,
        experienceLevel: store.settings.experienceLevel,
        primaryGoal: store.settings.primaryGoal,
        recoveryProfile: store.settings.recoveryProfile,
        weeklySetsByMuscle,
        judoTonight,
        judoTomorrow,
        weeksSinceLastChange: getWeeksSinceLastChange(store.history, exercise.id),
        recentHistory: getRecentExerciseHistory(store.history, exercise.id, 5)
      };
      const result = calculateProgression(
        {
          plannedExercise: exercise,
          performance: log,
          feedback: log.status ?? "skipped",
          comment: log.comment,
          sessionDifficulty: sessionFeedback.difficulty,
          globalPain: sessionFeedback.globalPain,
          energy: sessionFeedback.energy,
          breath: sessionFeedback.breath,
          session
        },
        sessionCtx
      );

      if (result.guardrailResult) {
        const gr = result.guardrailResult;
        adaptationExplanations[exercise.id] = {
          allowed: gr.allowed,
          adjustedDecision: gr.adjustedDecision,
          adjustedLoad: gr.adjustedLoad,
          confidence: gr.confidence,
          explanation: gr.explanation,
          violations: gr.violations
        };
      }

      const { guardrailResult, ...progressionFields } = result;
      void guardrailResult;
      const progression: ExerciseProgressionLog = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        ...progressionFields
      };
      return [exercise.id, progression];
    })
  );

  const next = getNextSession(store.currentProgram);
  const completed: CompletedSession = {
    ...normalizedActive,
    logs: completedLogs,
    timing: finalTiming,
    feedback: sessionFeedback,
    id: `${activeSession.dateKey}-${activeSession.sessionId}-${Date.now()}`,
    completedAt,
    title: session.title,
    focus: session.focus,
    mainExercises: session.exercises.slice(0, 4).map((exercise) => exercise.name),
    nextSessionTitle: next.session.title,
    nextSessionDateKey: getDateKey(next.date),
    progressions,
    totalDurationMs,
    exerciseDurationsMs: finalTiming.elapsedByExerciseMs,
    adaptationExplanations:
      Object.keys(adaptationExplanations).length > 0 ? adaptationExplanations : undefined
  };

  // Apply all three changes in one batched store update so subscribers see consistency
  const nextHistory = [completed, ...store.history];
  const nextSettings = adaptSettingsAfterSession(store.settings, completed, session, nextHistory);
  const progressedProgram = applyProgressionsToProgram(store.currentProgram, session.id, progressions);
  const nextProgram = normalizeProgramV2(adaptProgramAfterSession(progressedProgram, completed, nextSettings, nextHistory));
  store = {
    ...store,
    history: nextHistory,
    currentProgram: nextProgram,
    settings: nextSettings,
    activeSession: null
  };
  writeJson(historyKeyFor(store.activeProfileId), nextHistory);
  writeJson(settingsKeyFor(store.activeProfileId), nextSettings);
  writeJson(programKeyFor(store.activeProfileId), nextProgram);
  removeStoredJson(activeSessionKeyFor(store.activeProfileId));
  emit();
  enqueueSyncIfAuthenticated("history", "settings", "program");

  return completed;
}

function completeOnboardingAction(next: UserSettings) {
  const normalizedSettings = normalizeUserSettings(next, defaultSettings);
  // Generate a tailored program from the captured goals/equipment/frequency
  const program = normalizeProgramV2(buildProgram(normalizedSettings));
  writeJson(settingsKeyFor(store.activeProfileId), normalizedSettings);
  writeJson(programKeyFor(store.activeProfileId), program);
  writeJson(onboardingKeyFor(store.activeProfileId), true);
  store = {
    ...store,
    settings: normalizedSettings,
    currentProgram: program,
    isOnboardingDone: true
  };
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", normalizedSettings.darkMode);
  }
  emit();
  enqueueSyncIfAuthenticated("settings", "program");
}

/**
 * Regenerate the active profile's program from current settings.
 * Useful when the user changes their goal, frequency, or equipment after onboarding.
 * Also applies flexible scheduling config if present.
 */
function regenerateProgramAction() {
  let program = normalizeProgramV2(buildProgram(store.settings));

  // Apply flexible scheduling config if it exists
  const config = readJson<ActiveProgramConfig | null>(
    programConfigKeyFor(store.activeProfileId),
    null
  );

  if (config && program.length > 0) {
    // Convert PlannedSession[] to ProgramSessionTemplate[] (keeping structure, removing weekday)
    const templates: ProgramSessionTemplate[] = program.map(session => ({
      id: session.id,
      scheduleLabel: session.scheduleLabel,
      title: session.title,
      focus: session.focus,
      duration: session.duration,
      intensity: session.intensity,
      phase: session.phase,
      notes: session.notes,
      exercises: session.exercises
    }));

    // Re-schedule with flexible config
    program = normalizeProgramV2(
      scheduleSessionsFlexibly(
        templates,
        config.availableWeekdays,
        config.startingSessionIndex
      )
    );
  }

  if (JSON.stringify(program) === JSON.stringify(store.currentProgram)) {
    return;
  }

  writeJson(programKeyFor(store.activeProfileId), program);
  store = { ...store, currentProgram: program };
  emit();
  enqueueSyncIfAuthenticated("program");
}

function setCurrentProgramAction(program: PlannedSession[]) {
  const normalized = normalizeProgramV2(program);
  if (JSON.stringify(normalized) === JSON.stringify(store.currentProgram)) {
    return;
  }

  writeJson(programKeyFor(store.activeProfileId), normalized);
  store = { ...store, currentProgram: normalized };
  emit();
  enqueueSyncIfAuthenticated("program");
}

function setFlexibleConfigAction(config: ActiveProgramConfig) {
  const current = readJson<ActiveProgramConfig | null>(
    programConfigKeyFor(store.activeProfileId),
    null
  );

  if (JSON.stringify(current) === JSON.stringify(config)) {
    return; // No change
  }

  writeJson(programConfigKeyFor(store.activeProfileId), config);
  // Regenerate program with new config
  regenerateProgramAction();
  enqueueSyncIfAuthenticated("program");
}

function attachAiCoachResponseAction(sessionId: string, aiCoach: CoachAiResponse) {
  setHistoryStore((current) =>
    current.map((s) => (s.id === sessionId ? { ...s, aiCoach } : s))
  );
}

function switchProfileAction(profileId: string) {
  const target = store.profiles.find((p) => p.id === profileId);
  if (!target) return;
  writeJson<ProfilesState>(PROFILES_KEY, {
    profiles: store.profiles,
    activeProfileId: profileId
  });
  loadProfileIntoStore(profileId);
}

function createProfileAction(name: string, avatar: string = "🏋️"): Profile {
  const id = `profile-${Date.now().toString(36)}`;
  const next: Profile = { id, name: name.trim() || "Nouveau", avatar };
  const nextProfiles = [...store.profiles, next];
  // Bare defaults — onboarding will replace mainGoal, primaryGoal, etc. then regenerate program.
  const freshSettings: UserSettings = {
    ...defaultSettings,
    athleteName: next.name,
    judoDays: [],
    benchOneRepMaxKg: 0,
    primaryGoal: undefined,
    experienceLevel: undefined,
    equipment: undefined,
    weeklyFrequency: undefined
  };
  // Empty placeholder program until onboarding completes
  const placeholderProgram: PlannedSession[] = [];

  writeJson<ProfilesState>(PROFILES_KEY, { profiles: nextProfiles, activeProfileId: id });
  writeJson(settingsKeyFor(id), freshSettings);
  writeJson(programKeyFor(id), placeholderProgram);
  writeJson(onboardingKeyFor(id), false);

  store = {
    ...store,
    profiles: nextProfiles,
    activeProfileId: id,
    activeSession: null,
    history: [],
    currentProgram: placeholderProgram,
    settings: freshSettings,
    isOnboardingDone: false
  };
  emit();
  enqueueSyncIfAuthenticated("profile");
  return next;
}

function renameProfileAction(profileId: string, name: string, avatar?: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const nextProfiles = store.profiles.map((p) =>
    p.id === profileId ? { ...p, name: trimmed, avatar: avatar ?? p.avatar } : p
  );
  persistProfilesAndUpdate(nextProfiles, store.activeProfileId);
  enqueueSyncIfAuthenticated("profile");

  // If renaming the active profile, sync the athleteName on settings too
  if (profileId === store.activeProfileId && store.settings.athleteName !== trimmed) {
    setSettingsStore({ ...store.settings, athleteName: trimmed });
  }
}

function setProfilePhotoAction(profileId: string, photoUrl: string | undefined) {
  const nextProfiles = store.profiles.map((p) =>
    p.id === profileId ? { ...p, photoUrl: photoUrl || undefined } : p
  );
  persistProfilesAndUpdate(nextProfiles, store.activeProfileId);
  enqueueSyncIfAuthenticated("profile");
}

function deleteProfileAction(profileId: string) {
  if (store.profiles.length <= 1) return;
  const remaining = store.profiles.filter((p) => p.id !== profileId);
  const nextActive = store.activeProfileId === profileId ? remaining[0].id : store.activeProfileId;

  removeStoredJson(activeSessionKeyFor(profileId));
  removeStoredJson(historyKeyFor(profileId));
  removeStoredJson(programKeyFor(profileId));
  removeStoredJson(settingsKeyFor(profileId));
  removeStoredJson(onboardingKeyFor(profileId));

  writeJson<ProfilesState>(PROFILES_KEY, { profiles: remaining, activeProfileId: nextActive });

  if (store.activeProfileId === profileId) {
    loadProfileIntoStore(nextActive, remaining);
  } else {
    setStore({ profiles: remaining });
  }
}

function resetAllAction() {
  const profileId = store.activeProfileId;
  removeStoredJson(activeSessionKeyFor(profileId));
  removeStoredJson(historyKeyFor(profileId));
  removeStoredJson(programKeyFor(profileId));
  removeStoredJson(settingsKeyFor(profileId));
  removeStoredJson(onboardingKeyFor(profileId));
  store = {
    ...store,
    activeSession: null,
    history: [],
    currentProgram: weeklyProgram,
    settings: defaultSettings,
    isOnboardingDone: false
  };
  emit();
}

// ─────────────────────────────────────────────────────────────────────────────
// Cloud sync — called by SyncManager when pulling newer data from Supabase
// ─────────────────────────────────────────────────────────────────────────────

export function loadCloudDataIntoStore(cloud: {
  settings?: UserSettings;
  program?: PlannedSession[];
  history?: CompletedSession[];
}) {
  const patch: Partial<StoreState> = {};
  if (cloud.settings) {
    const normalized = normalizeUserSettings(cloud.settings, defaultSettings);
    patch.settings = normalized;
    writeJson(settingsKeyFor(store.activeProfileId), normalized);
  }
  if (cloud.program) {
    const normalized = normalizeProgramV2(cloud.program);
    patch.currentProgram = normalized;
    writeJson(programKeyFor(store.activeProfileId), normalized);
  }
  if (cloud.history) {
    patch.history = cloud.history;
    writeJson(historyKeyFor(store.activeProfileId), cloud.history);
  }
  if (Object.keys(patch).length > 0) {
    store = { ...store, ...patch };
    emit();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useCoachStorage() {
  const snapshot = useSyncExternalStore(subscribeStore, getStoreSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureStoreInitialized();
  }, []);

  const {
    isReady,
    isOnboardingDone,
    profiles,
    activeProfileId,
    activeSession,
    history,
    currentProgram: rawProgram,
    settings
  } = snapshot;

  // Inject activated complements (abdos / mobilite / cardio…) into each session.
  // The raw program persisted in storage is never mutated — augmentation is purely
  // derived, so disabling a complement removes its exercises automatically.
  const currentProgram = useMemo(
    () =>
      applyComplementsToProgram(
        rawProgram,
        settings.complementaryPrograms,
        settings.primaryGoal
      ),
    [rawProgram, settings.complementaryPrograms, settings.primaryGoal]
  );

  const todaySession = useMemo(() => getTodaySession(currentProgram), [currentProgram]);
  const nextSession = useMemo(() => getNextSession(currentProgram), [currentProgram]);
  const dateKey = useMemo(() => getDateKey(), []);
  const todaysCompletedSession = useMemo(
    () => history.find((item) => item.dateKey === dateKey && item.sessionId === todaySession.id),
    [dateKey, history, todaySession.id]
  );

  const currentFlexibleConfig = useMemo(
    () => readJson<ActiveProgramConfig | null>(
      programConfigKeyFor(activeProfileId),
      null
    ),
    [activeProfileId]
  );

  const startSession = useCallback(
    (session: PlannedSession = todaySession) => startSessionAction(session),
    [todaySession]
  );
  const completeSession = useCallback(
    (session: PlannedSession = todaySession) => completeSessionAction(session),
    [todaySession]
  );

  return {
    activeProfileId,
    activeSession,
    attachAiCoachResponse: attachAiCoachResponseAction,
    cancelActiveSession: cancelActiveSessionAction,
    clearReplacement: clearReplacementAction,
    completeOnboarding: completeOnboardingAction,
    completeSession,
    createProfile: createProfileAction,
    currentFlexibleConfig,
    currentProgram,
    dateKey,
    deleteProfile: deleteProfileAction,
    history,
    isOnboardingDone,
    isReady,
    nextSession,
    pauseSessionTimer: pauseSessionTimerAction,
    profiles,
    regenerateProgram: regenerateProgramAction,
    setFlexibleConfig: setFlexibleConfigAction,
    renameProfile: renameProfileAction,
    setProfilePhoto: setProfilePhotoAction,
    replaceExercise: replaceExerciseAction,
    resetAll: resetAllAction,
    resumeSessionTimer: resumeSessionTimerAction,
    setActiveExercise: setActiveExerciseAction,
    setCurrentProgram: setCurrentProgramAction,
    setSettings: setSettingsStore,
    settings,
    startSession,
    switchProfile: switchProfileAction,
    todaySession,
    todaysCompletedSession,
    updateExerciseLog: updateExerciseLogAction,
    updateExerciseLogsBatch: updateExerciseLogsBatchAction,
    updateSessionFeedback: updateSessionFeedbackAction
  };
}

function applyProgressionsToProgram(
  program: PlannedSession[],
  sessionId: string,
  progressions: Record<string, ExerciseProgressionLog>
): PlannedSession[] {
  return program.map((session) => {
    if (session.id !== sessionId) {
      return session;
    }

    return {
      ...session,
      exercises: session.exercises.map((exercise) => applyProgressionToExercise(exercise, progressions[exercise.id]))
    };
  });
}

function applyProgressionToExercise(exercise: Exercise, progression?: ExerciseProgressionLog): Exercise {
  if (!progression) {
    return exercise;
  }

  const nextLoad = resolveNextLoad(exercise.plannedLoad, progression.nextLoad);

  return normalizeExerciseV2({
    ...exercise,
    target: progression.nextTarget || exercise.target,
    plannedLoad: nextLoad,
    cue: progression.replacementSuggestion
      ? `${exercise.cue} Remplacement proposé: ${progression.replacementSuggestion}`
      : exercise.cue
  });
}

function resolveNextLoad(currentLoad: string | undefined, nextLoad: string): string | undefined {
  if (!nextLoad || nextLoad.startsWith("Même charge")) {
    return currentLoad;
  }

  if (nextLoad.startsWith("Baisser de")) {
    return currentLoad;
  }

  if (
    nextLoad === "Marche douce" ||
    nextLoad.includes("Marche douce") ||
    nextLoad.includes("intensité") ||
    nextLoad.includes("Reduire fortement") ||
    nextLoad.includes("Réduire fortement")
  ) {
    return currentLoad;
  }

  return nextLoad;
}

function normalizeExerciseLogForCompletion(exercise: Exercise, log: ExerciseLog): ExerciseLog {
  const normalized: ExerciseLog = {
    ...createEmptyExerciseLog(exercise.id),
    ...log,
    exerciseId: exercise.id,
    usedLoad: log.usedLoad ?? "",
    completedReps: log.completedReps ?? "",
    comment: log.comment ?? ""
  };

  if (normalized.status && normalized.status !== "skipped" && !normalized.usedLoad && exercise.plannedLoad) {
    normalized.usedLoad = exercise.plannedLoad;
  }

  if ((normalized.status === "ok" || normalized.status === "easy") && !normalized.completedReps) {
    normalized.completedReps = exercise.target;
  }

  return normalized;
}

function createEmptyExerciseLog(exerciseId: string): ExerciseLog {
  return {
    exerciseId,
    usedLoad: "",
    completedReps: "",
    comment: ""
  };
}

function normalizeActiveSession(session: ActiveSession): ActiveSession {
  return {
    ...session,
    feedback: session.feedback ?? defaultSessionFeedback,
    timer: getTimer(session),
    timing: getTiming(session)
  };
}

function getTimer(session: ActiveSession) {
  return (
    session.timer ?? {
      startedAt: session.startedAt,
      isPaused: false,
      pausedTotalMs: 0
    }
  );
}

function getTiming(session: ActiveSession) {
  return (
    session.timing ?? {
      activeExerciseId: undefined,
      activeExerciseStartedAt: undefined,
      elapsedByExerciseMs: {}
    }
  );
}

function finalizeActiveExerciseTiming(session: ActiveSession, finishedAt: string) {
  const timing = getTiming(session);

  if (!timing.activeExerciseId || !timing.activeExerciseStartedAt || getTimer(session).isPaused) {
    return timing;
  }

  const elapsed = Math.max(0, new Date(finishedAt).getTime() - new Date(timing.activeExerciseStartedAt).getTime());

  return {
    ...timing,
    activeExerciseStartedAt: undefined,
    elapsedByExerciseMs: {
      ...timing.elapsedByExerciseMs,
      [timing.activeExerciseId]: (timing.elapsedByExerciseMs[timing.activeExerciseId] ?? 0) + elapsed
    }
  };
}

function getSessionElapsedMs(session: ActiveSession, now = new Date()): number {
  const timer = getTimer(session);
  const startedAt = new Date(timer.startedAt).getTime();
  const pausedAt = timer.isPaused && timer.pausedAt ? new Date(timer.pausedAt).getTime() : now.getTime();
  const rawElapsed = (timer.isPaused ? pausedAt : now.getTime()) - startedAt;

  return Math.max(0, rawElapsed - timer.pausedTotalMs);
}

// ---------------------------------------------------------------------------
// Guardrail context helpers
// ---------------------------------------------------------------------------

function getTodayWeekday(): Weekday {
  const weekdays: Weekday[] = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
  ];
  return weekdays[new Date().getDay()];
}

function getNextWeekday(day: Weekday): Weekday {
  const weekdays: Weekday[] = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
  ];
  return weekdays[(weekdays.indexOf(day) + 1) % 7];
}

function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Monday = 0 offset
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function countSetsFromReps(completedReps: string): number {
  if (!completedReps) return 0;
  const repeatedMatch = completedReps.match(/^(\d+)\s*x\s*\d+/);
  if (repeatedMatch) return Number(repeatedMatch[1]);
  const slashParts = completedReps.split("/").filter(Boolean);
  if (slashParts.length > 1) return slashParts.length;
  return 1;
}

function getWeeklySetsByMuscle(
  history: CompletedSession[],
  program: PlannedSession[]
): Partial<Record<MuscleGroup, number>> {
  const result: Partial<Record<MuscleGroup, number>> = {};
  const weekStart = getWeekStart();
  const thisWeekSessions = history.filter(
    (s) => new Date(s.completedAt) >= weekStart
  );

  const exerciseToMuscles = new Map<string, MuscleGroup[]>();
  for (const plannedSession of program) {
    for (const exercise of plannedSession.exercises) {
      if (exercise.muscleGroups?.length) {
        exerciseToMuscles.set(exercise.id, exercise.muscleGroups);
      }
    }
  }

  for (const session of thisWeekSessions) {
    for (const [exerciseId, log] of Object.entries(session.logs)) {
      if (!log.status || log.status === "skipped") continue;
      const muscles = exerciseToMuscles.get(exerciseId) ?? [];
      const sets = countSetsFromReps(log.completedReps);
      for (const muscle of muscles) {
        result[muscle] = (result[muscle] ?? 0) + sets;
      }
    }
  }

  return result;
}

function getWeeksSinceLastChange(history: CompletedSession[], exerciseId: string): number {
  for (const session of history) {
    const prog = session.progressions?.[exerciseId];
    if (prog && (prog.decision === "augmenter" || prog.decision === "baisser")) {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      return Math.max(0, (Date.now() - new Date(session.completedAt).getTime()) / msPerWeek);
    }
  }
  return Number.POSITIVE_INFINITY;
}

function feedbackToRpe(status?: EffortStatus, sessionDifficulty = 5): number {
  switch (status) {
    case "easy": return Math.max(1, sessionDifficulty - 2);
    case "ok": return sessionDifficulty;
    case "hard": return Math.min(10, sessionDifficulty + 1);
    case "pain": return 9;
    case "skipped": return 0;
    default: return sessionDifficulty;
  }
}

function getRecentExerciseHistory(
  history: CompletedSession[],
  exerciseId: string,
  n: number
): ExerciseHistoryPoint[] {
  const results: ExerciseHistoryPoint[] = [];

  for (const session of history) {
    if (results.length >= n) break;
    const log = session.logs[exerciseId];
    if (!log) continue;

    results.push({
      load: log.usedLoad || undefined,
      rpe: log.rpe ?? feedbackToRpe(log.status, session.feedback?.difficulty),
      completedReps: log.completedReps || undefined,
      dateKey: session.dateKey,
      decision: session.progressions?.[exerciseId]?.decision,
      energy: session.feedback?.energy,
      globalPain: session.feedback?.globalPain,
      status: log.status
    });
  }

  return results;
}
