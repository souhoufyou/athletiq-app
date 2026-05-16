"use client";

import { supabase } from "@/lib/supabaseClient";

const PROFILES_KEY = "coach-adaptatif:profiles";

type LocalProfilesState = {
  profiles: Array<{ id: string; name: string; avatar: string; photoUrl?: string }>;
  activeProfileId: string;
};

function profileKey(profileId: string, suffix: string): string {
  return `coach-adaptatif:p:${profileId}:${suffix}`;
}

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function migrateLocalStorageToSupabase(userId: string): Promise<boolean> {
  const localProfiles = readLocalJson<LocalProfilesState | null>(PROFILES_KEY, null);
  if (!localProfiles || localProfiles.profiles.length === 0) {
    return false;
  }

  const activeProfileId = localProfiles.activeProfileId;
  const profile = localProfiles.profiles.find(p => p.id === activeProfileId) || localProfiles.profiles[0];

  // 1. Upsert profile
  await supabase.from("profiles").upsert({
    user_id: userId,
    name: profile.name,
    avatar: profile.avatar,
    photo_url: profile.photoUrl || null
  }, { onConflict: "user_id" });

  // 2. Migrate settings
  const settings = readLocalJson<any>(profileKey(activeProfileId, "settings"), null);
  if (settings) {
    await supabase.from("user_settings").upsert({
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
      schema_version: settings.schemaVersion
    }, { onConflict: "user_id" });
  }

  // 3. Migrate program
  const program = readLocalJson<any[]>(profileKey(activeProfileId, "program"), []);
  if (program.length > 0) {
    // Delete existing planned sessions for this user
    await supabase.from("planned_sessions").delete().eq("user_id", userId);

    const rows = program.map((session, index) => ({
      user_id: userId,
      session_id: session.id,
      title: session.title,
      focus: session.focus || "",
      weekday: session.weekday,
      exercises: session.exercises,
      order_index: index
    }));

    await supabase.from("planned_sessions").insert(rows);
  }

  // 4. Migrate history
  const history = readLocalJson<any[]>(profileKey(activeProfileId, "history"), []);
  if (history.length > 0) {
    for (const session of history) {
      await supabase.from("completed_sessions").upsert({
        user_id: userId,
        completion_id: session.id,
        date_key: session.dateKey,
        session_id: session.sessionId,
        title: session.title,
        focus: session.focus,
        started_at: session.startedAt,
        completed_at: session.completedAt,
        logs: session.logs,
        feedback: session.feedback,
        timer: session.timer,
        timing: session.timing,
        progressions: session.progressions,
        main_exercises: session.mainExercises,
        next_session_title: session.nextSessionTitle,
        next_session_date_key: session.nextSessionDateKey,
        total_duration_ms: session.totalDurationMs,
        exercise_durations_ms: session.exerciseDurationsMs,
        adaptation_explanations: session.adaptationExplanations,
        ai_coach: session.aiCoach
      }, { onConflict: "completion_id" });
    }
  }

  return true;
}

export async function ensureSupabaseProfile(userId: string, email: string) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (!data) {
    const name = email.split("@")[0] || "Athlète";
    await supabase.from("profiles").insert({
      user_id: userId,
      name,
      avatar: "💪"
    });
  }
}
