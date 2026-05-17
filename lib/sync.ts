"use client";

import { supabase } from "@/lib/supabaseClient";
import type { CompletedSession, PlannedSession, UserSettings } from "@/types/training";

// ---------------------------------------------------------------------------
// Sync metadata — tracks local modification timestamps per entity
// ---------------------------------------------------------------------------

type SyncEntity = "settings" | "program" | "history" | "profile";

type SyncMeta = {
  settingsUpdatedAt: string | null;
  programUpdatedAt: string | null;
  historyUpdatedAt: string | null;
  profileUpdatedAt: string | null;
};

const PROFILES_KEY = "coach-adaptatif:profiles";

function syncMetaKey(profileId: string): string {
  return `coach-adaptatif:p:${profileId}:sync-meta`;
}

function profileDataKey(profileId: string, suffix: string): string {
  return `coach-adaptatif:p:${profileId}:${suffix}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const v = window.localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readSyncMeta(profileId: string): SyncMeta {
  return readJson<SyncMeta>(syncMetaKey(profileId), {
    settingsUpdatedAt: null,
    programUpdatedAt: null,
    historyUpdatedAt: null,
    profileUpdatedAt: null,
  });
}

function writeSyncMeta(profileId: string, meta: SyncMeta): void {
  writeLocalJson(syncMetaKey(profileId), meta);
}

export function touchSyncMeta(profileId: string, ...entities: SyncEntity[]): void {
  const meta = readSyncMeta(profileId);
  const now = new Date().toISOString();
  for (const e of entities) {
    meta[`${e}UpdatedAt`] = now;
  }
  writeSyncMeta(profileId, meta);
}

// ---------------------------------------------------------------------------
// Mapping helpers: localStorage (camelCase) ↔ Supabase (snake_case)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settingsToRow(userId: string, settings: Record<string, any>, updatedAt: string) {
  return {
    user_id: userId,
    athlete_name: settings.athleteName,
    sex: settings.sex,
    load_unit: settings.loadUnit,
    current_weight_kg: settings.currentWeightKg,
    target_weight_kg: settings.targetWeightKg,
    bench_one_rep_max_kg: settings.benchOneRepMaxKg,
    age: settings.age,
    height_cm: settings.heightCm,
    gym: settings.gym,
    main_goal: settings.mainGoal,
    cardio_level: settings.cardioLevel,
    sleep_quality: settings.sleepQuality,
    recovery_profile: settings.recoveryProfile,
    medical_notes: settings.medicalNotes,
    watch_points: settings.watchPoints,
    preferences: settings.preferences,
    avoid: settings.avoid,
    available_days: settings.availableDays,
    external_sports: settings.externalSports,
    constraints: settings.constraints,
    strength_references: settings.strengthReferences,
    load_bias_by_pattern: settings.loadBiasByPattern,
    exercise_swap_preferences: settings.exerciseSwapPreferences,
    set_bias_by_pattern: settings.setBiasByPattern,
    rep_bias_by_pattern: settings.repBiasByPattern,
    rest_bias_by_pattern: settings.restBiasByPattern,
    calibration_events: settings.calibrationEvents,
    session_duration_preference: settings.sessionDurationPreference,
    ai_enabled: settings.aiEnabled,
    dark_mode: settings.darkMode,
    caution_level: settings.cautionLevel,
    experience_level: settings.experienceLevel,
    primary_goal: settings.primaryGoal,
    equipment: settings.equipment,
    weekly_frequency: settings.weeklyFrequency,
    judo_days: settings.judoDays,
    complementary_programs: settings.complementaryPrograms,
    schema_version: settings.schemaVersion,
    weight_log: settings.weightLog,
    secondary_goal: settings.secondaryGoal,
    updated_at: updatedAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSettings(row: Record<string, any>): Partial<UserSettings> {
  return {
    athleteName: row.athlete_name,
    sex: row.sex,
    loadUnit: row.load_unit,
    currentWeightKg: row.current_weight_kg,
    targetWeightKg: row.target_weight_kg,
    benchOneRepMaxKg: row.bench_one_rep_max_kg,
    age: row.age,
    heightCm: row.height_cm,
    gym: row.gym,
    mainGoal: row.main_goal,
    cardioLevel: row.cardio_level,
    sleepQuality: row.sleep_quality,
    recoveryProfile: row.recovery_profile,
    medicalNotes: row.medical_notes,
    watchPoints: row.watch_points,
    preferences: row.preferences,
    avoid: row.avoid,
    availableDays: row.available_days,
    externalSports: row.external_sports,
    constraints: row.constraints,
    strengthReferences: row.strength_references,
    loadBiasByPattern: row.load_bias_by_pattern,
    exerciseSwapPreferences: row.exercise_swap_preferences,
    setBiasByPattern: row.set_bias_by_pattern,
    repBiasByPattern: row.rep_bias_by_pattern,
    restBiasByPattern: row.rest_bias_by_pattern,
    calibrationEvents: row.calibration_events,
    sessionDurationPreference: row.session_duration_preference,
    aiEnabled: row.ai_enabled,
    darkMode: row.dark_mode,
    cautionLevel: row.caution_level,
    experienceLevel: row.experience_level,
    primaryGoal: row.primary_goal,
    equipment: row.equipment,
    weeklyFrequency: row.weekly_frequency,
    judoDays: row.judo_days,
    complementaryPrograms: row.complementary_programs,
    schemaVersion: row.schema_version,
    weightLog: row.weight_log,
    secondaryGoal: row.secondary_goal,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sessionToRow(userId: string, s: Record<string, any>) {
  return {
    user_id: userId,
    completion_id: s.id,
    date_key: s.dateKey,
    session_id: s.sessionId,
    title: s.title,
    focus: s.focus,
    started_at: s.startedAt,
    completed_at: s.completedAt,
    logs: s.logs,
    feedback: s.feedback,
    timer: s.timer,
    timing: s.timing,
    progressions: s.progressions,
    main_exercises: s.mainExercises,
    next_session_title: s.nextSessionTitle,
    next_session_date_key: s.nextSessionDateKey,
    total_duration_ms: s.totalDurationMs,
    exercise_durations_ms: s.exerciseDurationsMs,
    adaptation_explanations: s.adaptationExplanations,
    ai_coach: s.aiCoach,
    updated_at: new Date().toISOString(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSession(row: Record<string, any>): CompletedSession {
  return {
    id: row.completion_id,
    dateKey: row.date_key,
    sessionId: row.session_id,
    title: row.title,
    focus: row.focus,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    logs: row.logs,
    feedback: row.feedback,
    timer: row.timer,
    timing: row.timing,
    progressions: row.progressions,
    mainExercises: row.main_exercises,
    nextSessionTitle: row.next_session_title,
    nextSessionDateKey: row.next_session_date_key,
    totalDurationMs: row.total_duration_ms,
    exerciseDurationsMs: row.exercise_durations_ms,
    adaptationExplanations: row.adaptation_explanations,
    aiCoach: row.ai_coach,
    replacements: row.replacements,
  } as CompletedSession;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToPlannedSession(row: Record<string, any>): PlannedSession {
  return {
    id: row.session_id,
    title: row.title,
    focus: row.focus,
    weekday: row.weekday,
    exercises: row.exercises,
    duration: row.duration ?? "",
    intensity: row.intensity ?? "Modérée",
  } as PlannedSession;
}

// ---------------------------------------------------------------------------
// SyncManager — singleton
// ---------------------------------------------------------------------------

type ProfilesState = {
  profiles: Array<{ id: string; name: string; avatar: string; photoUrl?: string }>;
  activeProfileId: string;
};

class SyncManager {
  private userId: string | null = null;
  private pending = new Set<SyncEntity>();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private retryCount = 0;
  private flushing = false;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        if (this.pending.size > 0) this.scheduleFlush();
      });
    }
  }

  setUserId(id: string | null) {
    this.userId = id;
  }

  // Called by storage.ts after each mutation
  enqueue(...entities: SyncEntity[]) {
    if (!this.userId) return;
    for (const e of entities) this.pending.add(e);
    this.scheduleFlush();
  }

  private scheduleFlush() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.flush(), 2000);
  }

  private async flush() {
    if (!this.userId || this.pending.size === 0 || this.flushing) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    this.flushing = true;
    const toFlush = new Set(this.pending);
    this.pending.clear();

    try {
      const profilesState = readJson<ProfilesState | null>(PROFILES_KEY, null);
      const profileId = profilesState?.activeProfileId ?? "default";
      const now = new Date().toISOString();

      const promises: Promise<void>[] = [];

      if (toFlush.has("profile") && profilesState) {
        const p = profilesState.profiles.find((x) => x.id === profileId) ?? profilesState.profiles[0];
        if (p) promises.push(this.pushProfile(this.userId, p, now));
      }

      if (toFlush.has("settings")) {
        const s = readJson<Record<string, unknown> | null>(profileDataKey(profileId, "settings"), null);
        if (s) promises.push(this.pushSettings(this.userId, s, now));
      }

      if (toFlush.has("program")) {
        const prog = readJson<PlannedSession[]>(profileDataKey(profileId, "program"), []);
        if (prog.length > 0) promises.push(this.pushProgram(this.userId, prog, now));
      }

      if (toFlush.has("history")) {
        const hist = readJson<CompletedSession[]>(profileDataKey(profileId, "history"), []);
        if (hist.length > 0) promises.push(this.pushCompletedSessions(this.userId, hist));
      }

      await Promise.all(promises);
      this.retryCount = 0;
    } catch (err) {
      console.error("[sync] flush failed, will retry:", err);
      for (const e of toFlush) this.pending.add(e);
      this.retryCount++;
      const delay = Math.min(2000 * Math.pow(2, this.retryCount), 60000);
      setTimeout(() => this.flush(), delay);
    } finally {
      this.flushing = false;
    }
  }

  // ---- Push methods -------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async pushProfile(userId: string, profile: Record<string, any>, updatedAt: string) {
    const { error } = await supabase.from("profiles").upsert({
      user_id: userId,
      name: profile.name,
      avatar: profile.avatar,
      photo_url: profile.photoUrl || null,
      updated_at: updatedAt,
    }, { onConflict: "user_id" });
    if (error) throw error;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async pushSettings(userId: string, settings: Record<string, any>, updatedAt: string) {
    const { error } = await supabase
      .from("user_settings")
      .upsert(settingsToRow(userId, settings, updatedAt), { onConflict: "user_id" });
    if (error) throw error;
  }

  // FIX: replaces the destructive delete().eq() with upsert + targeted cleanup
  private async pushProgram(userId: string, program: PlannedSession[], updatedAt: string) {
    const localIds = new Set(program.map((s) => s.id));

    // Upsert all local sessions
    const rows = program.map((session, index) => ({
      user_id: userId,
      session_id: session.id,
      title: session.title,
      focus: session.focus || "",
      weekday: session.weekday,
      exercises: session.exercises,
      order_index: index,
      updated_at: updatedAt,
    }));

    const { error: upsertErr } = await supabase
      .from("planned_sessions")
      .upsert(rows, { onConflict: "user_id,session_id" });
    if (upsertErr) throw upsertErr;

    // Delete orphaned cloud sessions no longer in local program
    const { data: cloudSessions } = await supabase
      .from("planned_sessions")
      .select("session_id")
      .eq("user_id", userId);

    if (cloudSessions) {
      const orphanIds = cloudSessions
        .map((r) => r.session_id as string)
        .filter((id) => !localIds.has(id));

      if (orphanIds.length > 0) {
        await supabase
          .from("planned_sessions")
          .delete()
          .eq("user_id", userId)
          .in("session_id", orphanIds);
      }
    }
  }

  private async pushCompletedSessions(userId: string, sessions: CompletedSession[]) {
    // Batch upsert in chunks of 50
    const chunk = 50;
    for (let i = 0; i < sessions.length; i += chunk) {
      const batch = sessions.slice(i, i + chunk).map((s) => sessionToRow(userId, s));
      const { error } = await supabase
        .from("completed_sessions")
        .upsert(batch, { onConflict: "completion_id" });
      if (error) throw error;
    }
  }

  // ---- Reconciliation (bidirectional sync on login) -----------------------

  async reconcile(userId: string) {
    this.setUserId(userId);

    const profilesState = readJson<ProfilesState | null>(PROFILES_KEY, null);
    const profileId = profilesState?.activeProfileId ?? "default";
    const meta = readSyncMeta(profileId);

    // Load loadCloudDataIntoStore dynamically to avoid circular imports
    const { loadCloudDataIntoStore } = await import("@/lib/storage");

    await Promise.all([
      this.reconcileSettings(userId, profileId, meta, loadCloudDataIntoStore),
      this.reconcileProgram(userId, profileId, meta, loadCloudDataIntoStore),
      this.reconcileHistory(userId, profileId, loadCloudDataIntoStore),
      this.reconcileProfile(userId, profileId, meta),
    ]);
  }

  private async reconcileSettings(
    userId: string,
    profileId: string,
    meta: SyncMeta,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadIntoStore: (data: any) => void,
  ) {
    const { data: cloudRow } = await supabase
      .from("user_settings")
      .select("*, updated_at")
      .eq("user_id", userId)
      .single();

    const localSettings = readJson<Record<string, unknown> | null>(
      profileDataKey(profileId, "settings"),
      null,
    );

    if (!cloudRow && localSettings) {
      // Cloud empty → push local
      await this.pushSettings(userId, localSettings, meta.settingsUpdatedAt ?? new Date().toISOString());
      return;
    }

    if (cloudRow && !localSettings) {
      // Local empty → pull cloud
      const pulled = rowToSettings(cloudRow);
      writeLocalJson(profileDataKey(profileId, "settings"), pulled);
      loadIntoStore({ settings: pulled as UserSettings });
      touchSyncMeta(profileId, "settings");
      return;
    }

    if (!cloudRow || !localSettings) return;

    const cloudTime = new Date(cloudRow.updated_at ?? 0).getTime();
    const localTime = new Date(meta.settingsUpdatedAt ?? 0).getTime();

    if (cloudTime > localTime) {
      // Cloud is newer → pull
      const pulled = rowToSettings(cloudRow);
      const merged = { ...localSettings, ...pulled };
      writeLocalJson(profileDataKey(profileId, "settings"), merged);
      loadIntoStore({ settings: merged as UserSettings });
      const newMeta = readSyncMeta(profileId);
      newMeta.settingsUpdatedAt = cloudRow.updated_at;
      writeSyncMeta(profileId, newMeta);
    } else if (localTime > cloudTime) {
      // Local is newer → push
      await this.pushSettings(userId, localSettings, meta.settingsUpdatedAt!);
    }
  }

  private async reconcileProgram(
    userId: string,
    profileId: string,
    meta: SyncMeta,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadIntoStore: (data: any) => void,
  ) {
    const { data: cloudRows } = await supabase
      .from("planned_sessions")
      .select("*, updated_at")
      .eq("user_id", userId)
      .order("order_index", { ascending: true });

    const localProgram = readJson<PlannedSession[]>(profileDataKey(profileId, "program"), []);

    if ((!cloudRows || cloudRows.length === 0) && localProgram.length > 0) {
      await this.pushProgram(userId, localProgram, meta.programUpdatedAt ?? new Date().toISOString());
      return;
    }

    if (cloudRows && cloudRows.length > 0 && localProgram.length === 0) {
      const pulled = cloudRows.map(rowToPlannedSession);
      writeLocalJson(profileDataKey(profileId, "program"), pulled);
      loadIntoStore({ program: pulled });
      touchSyncMeta(profileId, "program");
      return;
    }

    if (!cloudRows || cloudRows.length === 0) return;

    const cloudMaxTime = Math.max(...cloudRows.map((r) => new Date(r.updated_at ?? 0).getTime()));
    const localTime = new Date(meta.programUpdatedAt ?? 0).getTime();

    if (cloudMaxTime > localTime) {
      const pulled = cloudRows.map(rowToPlannedSession);
      writeLocalJson(profileDataKey(profileId, "program"), pulled);
      loadIntoStore({ program: pulled });
      const newMeta = readSyncMeta(profileId);
      newMeta.programUpdatedAt = new Date(cloudMaxTime).toISOString();
      writeSyncMeta(profileId, newMeta);
    } else if (localTime > cloudMaxTime) {
      await this.pushProgram(userId, localProgram, meta.programUpdatedAt!);
    }
  }

  private async reconcileHistory(
    userId: string,
    profileId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    loadIntoStore: (data: any) => void,
  ) {
    // Additive merge: union of local and cloud sessions by completion_id
    const { data: cloudRows } = await supabase
      .from("completed_sessions")
      .select("*")
      .eq("user_id", userId);

    const localHistory = readJson<CompletedSession[]>(profileDataKey(profileId, "history"), []);
    const localIds = new Set(localHistory.map((s) => s.id));

    // Cloud sessions not in local → add to local
    const cloudOnly: CompletedSession[] = [];
    if (cloudRows) {
      for (const row of cloudRows) {
        if (!localIds.has(row.completion_id)) {
          cloudOnly.push(rowToSession(row));
        }
      }
    }

    if (cloudOnly.length > 0) {
      const merged = [...cloudOnly, ...localHistory].sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
      );
      writeLocalJson(profileDataKey(profileId, "history"), merged);
      loadIntoStore({ history: merged });
    }

    // Local sessions not in cloud → push
    const cloudIds = new Set((cloudRows ?? []).map((r) => r.completion_id as string));
    const localOnly = localHistory.filter((s) => !cloudIds.has(s.id));
    if (localOnly.length > 0) {
      await this.pushCompletedSessions(userId, localOnly);
    }

    touchSyncMeta(profileId, "history");
  }

  private async reconcileProfile(userId: string, profileId: string, meta: SyncMeta) {
    const { data: cloudProfile } = await supabase
      .from("profiles")
      .select("*, updated_at")
      .eq("user_id", userId)
      .single();

    const profilesState = readJson<ProfilesState | null>(PROFILES_KEY, null);
    const localProfile = profilesState?.profiles.find((p) => p.id === profileId);

    if (!cloudProfile && localProfile) {
      await this.pushProfile(userId, localProfile, meta.profileUpdatedAt ?? new Date().toISOString());
      return;
    }

    if (cloudProfile && localProfile) {
      const cloudTime = new Date(cloudProfile.updated_at ?? 0).getTime();
      const localTime = new Date(meta.profileUpdatedAt ?? 0).getTime();

      if (cloudTime > localTime && profilesState) {
        const updatedProfiles = profilesState.profiles.map((p) =>
          p.id === profileId
            ? { ...p, name: cloudProfile.name, avatar: cloudProfile.avatar, photoUrl: cloudProfile.photo_url }
            : p,
        );
        writeLocalJson(PROFILES_KEY, { ...profilesState, profiles: updatedProfiles });
      } else if (localTime > cloudTime) {
        await this.pushProfile(userId, localProfile, meta.profileUpdatedAt!);
      }
    }
  }
}

export const syncManager = new SyncManager();
