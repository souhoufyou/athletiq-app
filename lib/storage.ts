"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { athleteProfile, weeklyProgram } from "@/data/program";
import { estimateCalories } from "@/lib/analytics";
import { getDateKey } from "@/lib/date";
import { personalizeProgram } from "@/lib/personalization";
import { calculateProgression } from "@/lib/progression";
import { createEmptyLogs, defaultSessionFeedback, getNextSession, getTodaySession } from "@/lib/session";
import type {
  ActiveSession,
  CoachAiResponse,
  CompletedSession,
  DailyJudoChoice,
  Exercise,
  ExerciseLog,
  ExerciseProgressionLog,
  PlannedSession,
  SessionFeedback,
  UserSettings
} from "@/types/training";

const ACTIVE_SESSION_KEY = "coach-adaptatif:active-session";
const HISTORY_KEY = "coach-adaptatif:history";
const PROGRAM_KEY = "coach-adaptatif:program";
const SETTINGS_KEY = "coach-adaptatif:settings";
export const STORAGE_VERSION = 1;

const STORAGE_VERSION_KEY = "coach-adaptatif:storage-version";
const STORAGE_KEYS = [ACTIVE_SESSION_KEY, HISTORY_KEY, PROGRAM_KEY, SETTINGS_KEY] as const;

const defaultSettings: UserSettings = {
  athleteName: athleteProfile.firstName,
  age: athleteProfile.age,
  heightCm: athleteProfile.heightCm,
  loadUnit: "kg",
  currentWeightKg: athleteProfile.startingWeightKg,
  targetWeightKg: athleteProfile.targetWeightKg,
  mainObjective: "recomposition",
  sessionsPerWeek: 6,
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  sports: {
    judo: true,
    other: ""
  },
  equipment: athleteProfile.preferences,
  likedExercises: athleteProfile.preferences,
  refusedExercises: athleteProfile.avoid,
  painWatchList: athleteProfile.watchPoints,
  level: "intermediate",
  detailPreference: "simple",
  progressionStyle: "dynamic",
  dailyJudoChoice: "judo",
  onboardingCompleted: false,
  benchOneRepMaxKg: 127,
  judoDays: athleteProfile.judoDays,
  aiEnabled: false,
  darkMode: false
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    backupLocalStorage(`invalid-json-${key}`);
    window.localStorage.removeItem(key);
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    backupLocalStorage(`write-failed-${key}`);
  }
}

function prepareLocalStorageSchema(): void {
  if (typeof window === "undefined") {
    return;
  }

  const storedVersion = window.localStorage.getItem(STORAGE_VERSION_KEY);

  if (!storedVersion) {
    window.localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
    return;
  }

  const version = Number(storedVersion);

  if (version === STORAGE_VERSION) {
    return;
  }

  backupLocalStorage(`schema-${storedVersion}-to-${STORAGE_VERSION}`);
  STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  window.localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
}

function backupLocalStorage(reason: string): void {
  if (typeof window === "undefined") {
    return;
  }

  const backup = {
    createdAt: new Date().toISOString(),
    reason,
    storageVersion: window.localStorage.getItem(STORAGE_VERSION_KEY),
    values: Object.fromEntries(STORAGE_KEYS.map((key) => [key, window.localStorage.getItem(key)]))
  };

  try {
    window.localStorage.setItem(
      `coach-adaptatif:backup:${Date.now()}`,
      JSON.stringify(backup)
    );
  } catch {
    // If storage quota is full, prefer a clean reset over corrupting active data.
  }
}

export function useCoachStorage() {
  const [isReady, setIsReady] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [history, setHistory] = useState<CompletedSession[]>([]);
  const [currentProgram, setCurrentProgram] = useState<PlannedSession[]>(weeklyProgram);
  const [settings, setSettingsState] = useState<UserSettings>(defaultSettings);
  const dateKey = useMemo(() => getDateKey(), []);
  const personalizedProgram = useMemo(() => personalizeProgram(currentProgram, settings), [currentProgram, settings]);
  const todaySession = useMemo(() => getTodaySession(personalizedProgram), [personalizedProgram]);
  const nextSession = useMemo(() => getNextSession(personalizedProgram), [personalizedProgram]);

  useEffect(() => {
    prepareLocalStorageSchema();
    const savedActiveSession = readJson<ActiveSession | null>(ACTIVE_SESSION_KEY, null);
    setActiveSession(savedActiveSession ? normalizeActiveSession(savedActiveSession) : null);
    setHistory(readJson<CompletedSession[]>(HISTORY_KEY, []));
    setCurrentProgram(readJson<PlannedSession[]>(PROGRAM_KEY, weeklyProgram));
    setSettingsState(normalizeSettings(readJson<Partial<UserSettings>>(SETTINGS_KEY, defaultSettings)));
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (activeSession) {
      writeJson(ACTIVE_SESSION_KEY, activeSession);
    } else {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    }
  }, [activeSession, isReady]);

  useEffect(() => {
    if (isReady) {
      writeJson(HISTORY_KEY, history);
    }
  }, [history, isReady]);

  useEffect(() => {
    if (isReady) {
      writeJson(PROGRAM_KEY, currentProgram);
    }
  }, [currentProgram, isReady]);

  useEffect(() => {
    if (isReady) {
      writeJson(SETTINGS_KEY, settings);
    }
  }, [settings, isReady]);

  const todaysCompletedSession = useMemo(
    () => history.find((item) => item.dateKey === dateKey && item.sessionId === todaySession.id),
    [dateKey, history, todaySession.id]
  );

  const startSession = useCallback(
    (session: PlannedSession = todaySession) => {
      const startedAt = new Date().toISOString();
      const next: ActiveSession = {
        dateKey,
        sessionId: session.id,
        startedAt,
        logs: createEmptyLogs(session),
        feedback: defaultSessionFeedback,
        timer: {
          startedAt,
          isPaused: false,
          pausedTotalMs: 0
        },
        timing: {
          activeExerciseId: session.exercises[0]?.id,
          activeExerciseStartedAt: startedAt,
          elapsedByExerciseMs: {}
        }
      };

      setActiveSession(next);
      return next;
    },
    [dateKey, todaySession]
  );

  const pauseSessionTimer = useCallback(() => {
    setActiveSession((current) => {
      if (!current || getTimer(current).isPaused) {
        return current;
      }

      const now = new Date().toISOString();
      const normalized = normalizeActiveSession(current);
      const timing = finalizeActiveExerciseTiming(normalized, now);

      return {
        ...normalized,
        timer: {
          ...normalized.timer,
          isPaused: true,
          pausedAt: now
        },
        timing: {
          ...timing,
          activeExerciseStartedAt: undefined
        }
      };
    });
  }, []);

  const resumeSessionTimer = useCallback(() => {
    setActiveSession((current) => {
      if (!current || !getTimer(current).isPaused) {
        return current;
      }

      const now = new Date();
      const normalized = normalizeActiveSession(current);
      const pausedAt = normalized.timer.pausedAt ? new Date(normalized.timer.pausedAt).getTime() : now.getTime();

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
  }, []);

  const setActiveExercise = useCallback((exerciseId: string) => {
    setActiveSession((current) => {
      if (!current) {
        return current;
      }

      const normalized = normalizeActiveSession(current);

      if (normalized.timing.activeExerciseId === exerciseId) {
        return normalized;
      }

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
  }, []);

  const updateExerciseLog = useCallback((exerciseId: string, patch: Partial<ExerciseLog>) => {
    const safePatch: Partial<ExerciseLog> = { ...patch };
    delete safePatch.exerciseId;

    setActiveSession((current) => {
      if (!current) {
        return current;
      }

      const currentLog = current.logs[exerciseId] ?? {
        exerciseId,
        usedLoad: "",
        completedReps: "",
        comment: ""
      };

      return {
        ...current,
        logs: {
          ...current.logs,
          [exerciseId]: {
            ...currentLog,
            ...safePatch,
            exerciseId
          }
        }
      };
    });
  }, []);

  const updateSessionFeedback = useCallback((patch: Partial<SessionFeedback>) => {
    setActiveSession((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        feedback: {
          ...current.feedback,
          ...patch
        }
      };
    });
  }, []);

  const completeSession = useCallback(
    (session: PlannedSession = todaySession) => {
      if (!activeSession) {
        return undefined;
      }

      const completedAt = new Date().toISOString();
      const normalizedActive = normalizeActiveSession(activeSession);
      const finalTiming = finalizeActiveExerciseTiming(normalizedActive, completedAt);
      const totalDurationMs = getSessionElapsedMs(normalizedActive, new Date(completedAt));
      const sessionFeedback = activeSession.feedback ?? defaultSessionFeedback;
      const calorieEstimate = estimateCalories({
        durationMs: totalDurationMs,
        feedback: sessionFeedback,
        session,
        weightKg: settings.currentWeightKg
      });
      const completedLogs = Object.fromEntries(
        session.exercises.map((exercise) => {
          const log = normalizedActive.logs[exercise.id] ?? createEmptyExerciseLog(exercise.id);

          return [exercise.id, normalizeExerciseLogForCompletion(exercise, log)];
        })
      ) as Record<string, ExerciseLog>;
      const progressions = Object.fromEntries(
        session.exercises.map((exercise) => {
          const log = completedLogs[exercise.id] ?? createEmptyExerciseLog(exercise.id);
          const result = calculateProgression({
            plannedExercise: exercise,
            performance: log,
            feedback: log.status ?? "skipped",
            comment: log.comment,
            sessionDifficulty: sessionFeedback.difficulty,
            globalPain: sessionFeedback.globalPain,
            energy: sessionFeedback.energy,
            breath: sessionFeedback.breath,
            session,
            progressionStyle: settings.progressionStyle,
            programGoal: settings.mainObjective
          });
          const progression: ExerciseProgressionLog = {
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            ...result
          };

          return [exercise.id, progression];
        })
      );
      const next = getNextSession(personalizedProgram);
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
        calorieEstimate,
        totalDurationMs,
        exerciseDurationsMs: finalTiming.elapsedByExerciseMs
      };

      setHistory((current) => [completed, ...current]);
      setCurrentProgram((program) => applyProgressionsToProgram(program, session.id, progressions));
      setActiveSession(null);
      return completed;
    },
    [
      activeSession,
      personalizedProgram,
      settings.currentWeightKg,
      settings.mainObjective,
      settings.progressionStyle,
      todaySession
    ]
  );

  const setSettings = useCallback((next: UserSettings) => {
    setSettingsState(normalizeSettings(next));
  }, []);

  const setDailyJudoChoice = useCallback(
    (choice: DailyJudoChoice) => {
      setSettingsState((current) =>
        normalizeSettings({
          ...current,
          dailyJudoChoice: choice,
          dailyJudoChoiceDateKey: dateKey
        })
      );
    },
    [dateKey]
  );

  const attachAiCoachResponse = useCallback((sessionId: string, aiCoach: CoachAiResponse) => {
    setHistory((current) =>
      current.map((session) => (session.id === sessionId ? { ...session, aiCoach } : session))
    );
  }, []);

  const resetAll = useCallback(() => {
    setActiveSession(null);
    setHistory([]);
    setCurrentProgram(weeklyProgram);
    setSettingsState(defaultSettings);
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
    window.localStorage.removeItem(HISTORY_KEY);
    window.localStorage.removeItem(PROGRAM_KEY);
    window.localStorage.removeItem(SETTINGS_KEY);
    window.localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
  }, []);

  return {
    activeSession,
    attachAiCoachResponse,
    completeSession,
    currentProgram: personalizedProgram,
    dateKey,
    history,
    isReady,
    nextSession,
    pauseSessionTimer,
    resetAll,
    resumeSessionTimer,
    setActiveExercise,
    setDailyJudoChoice,
    setSettings,
    settings,
    startSession,
    todaySession,
    todaysCompletedSession,
    updateExerciseLog,
    updateSessionFeedback
  };
}

function normalizeSettings(value: Partial<UserSettings> & { cautionLevel?: string }): UserSettings {
  const legacyProgressionStyle =
    value.progressionStyle ??
    (value.cautionLevel === "prudent"
      ? "regular"
      : value.cautionLevel === "agressif"
        ? "controlled_aggressive"
        : "dynamic");

  const sessionsPerWeek = [3, 4, 5, 6].includes(Number(value.sessionsPerWeek))
    ? (Number(value.sessionsPerWeek) as 3 | 4 | 5 | 6)
    : defaultSettings.sessionsPerWeek;

  return {
    ...defaultSettings,
    ...value,
    age: Number(value.age ?? defaultSettings.age) || defaultSettings.age,
    heightCm: Number(value.heightCm ?? defaultSettings.heightCm) || defaultSettings.heightCm,
    currentWeightKg: Number(value.currentWeightKg ?? defaultSettings.currentWeightKg) || defaultSettings.currentWeightKg,
    targetWeightKg: Number(value.targetWeightKg ?? defaultSettings.targetWeightKg) || defaultSettings.targetWeightKg,
    benchOneRepMaxKg: Number(value.benchOneRepMaxKg ?? defaultSettings.benchOneRepMaxKg) || defaultSettings.benchOneRepMaxKg,
    sessionsPerWeek,
    availableDays: value.availableDays?.length ? value.availableDays : defaultSettings.availableDays,
    sports: {
      ...defaultSettings.sports,
      ...value.sports
    },
    equipment: value.equipment?.length ? value.equipment : defaultSettings.equipment,
    likedExercises: value.likedExercises ?? defaultSettings.likedExercises,
    refusedExercises: value.refusedExercises ?? defaultSettings.refusedExercises,
    painWatchList: value.painWatchList ?? defaultSettings.painWatchList,
    progressionStyle: legacyProgressionStyle,
    dailyJudoChoice: value.dailyJudoChoice ?? defaultSettings.dailyJudoChoice,
    judoDays: value.judoDays ?? defaultSettings.judoDays
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

  return {
    ...exercise,
    target: progression.nextTarget || exercise.target,
    plannedLoad: nextLoad,
    cue: progression.replacementSuggestion
      ? `${exercise.cue} Remplacement proposé: ${progression.replacementSuggestion}`
      : exercise.cue
  };
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
