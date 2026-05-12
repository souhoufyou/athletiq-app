import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { Profile, UserSettings } from "@/types/training";

export type ProfilePreset = {
  id: "sofiane" | "alicia";
  profile: Profile;
  settings: UserSettings;
};

const commonSettings: Omit<UserSettings, "athleteName" | "sex" | "currentWeightKg" | "targetWeightKg" | "benchOneRepMaxKg" | "judoDays" | "age" | "heightCm" | "gym" | "mainGoal" | "cardioLevel" | "sleepQuality" | "recoveryProfile" | "medicalNotes" | "watchPoints" | "preferences" | "avoid" | "availableDays" | "externalSports" | "constraints" | "strengthReferences" | "primaryGoal" | "experienceLevel" | "equipment" | "weeklyFrequency"> = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  loadUnit: "kg",
  cautionLevel: "normal",
  aiEnabled: false,
  darkMode: false,
  loadBiasByPattern: {},
  exerciseSwapPreferences: {},
  setBiasByPattern: {},
  repBiasByPattern: {},
  restBiasByPattern: {},
  calibrationEvents: [],
  sessionDurationPreference: "standard"
};

export const SOFIANE_PROFILE_PRESET: ProfilePreset = {
  id: "sofiane",
  profile: {
    id: "preset-sofiane",
    name: "Sofiane",
    avatar: "S"
  },
  settings: {
    ...commonSettings,
    athleteName: "Sofiane",
    sex: "male",
    age: 36,
    heightCm: 181,
    currentWeightKg: 93.5,
    targetWeightKg: 84,
    benchOneRepMaxKg: 127,
    judoDays: ["monday", "friday"],
    gym: "One Air",
    mainGoal: "Recomposition: perdre du gras, garder/prendre du muscle, force et souffle.",
    primaryGoal: "recomposition",
    experienceLevel: "avance",
    equipment: "salle-complete",
    weeklyFrequency: 5,
    cardioLevel: "Faible",
    sleepQuality: "Irregulier",
    recoveryProfile: "irregular",
    medicalNotes: "Apnee du sommeil moderee sans appareillage.",
    watchPoints: ["poignet droit a surveiller"],
    preferences: ["machines", "barres", "halteres", "poulies", "tapis incline", "rameur", "stairmaster"],
    avoid: ["crossfit", "burpees", "pompes", "course"],
    availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
    externalSports: [
      {
        id: "sofiane-judo",
        name: "Judo",
        days: ["monday", "friday"],
        intensity: "high",
        notes: "Sport intense a prendre en compte dans la recuperation."
      }
    ],
    constraints: [
      {
        id: "sofiane-wrist",
        area: "wrist",
        label: "Poignet droit a surveiller",
        severity: "caution"
      }
    ],
    strengthReferences: [
      {
        lift: "Developpe couche",
        value: "127 kg x 1",
        loadKg: 127,
        reps: 1,
        estimatedOneRepMaxKg: 127,
        confidence: "measured",
        origin: "manual",
        locked: true
      }
    ]
  }
};

export const ALICIA_PROFILE_PRESET: ProfilePreset = {
  id: "alicia",
  profile: {
    id: "preset-alicia",
    name: "Alicia",
    avatar: "A"
  },
  settings: {
    ...commonSettings,
    athleteName: "Alicia",
    sex: "female",
    age: 36,
    heightCm: 163,
    currentWeightKg: 69,
    targetWeightKg: 55,
    benchOneRepMaxKg: 0,
    judoDays: [],
    gym: "Salle",
    mainGoal: "Perte de poids, raffermissement, fessiers/cuisses, reprise securisee.",
    primaryGoal: "perte-gras",
    experienceLevel: "debutant",
    equipment: "salle-complete",
    weeklyFrequency: 4,
    cardioLevel: "Faible",
    sleepQuality: "Irregulier",
    recoveryProfile: "irregular",
    medicalNotes: "Post-partum, diastasis connu, sensation de lourdeur pelvienne, spondylarthrite.",
    watchPoints: ["post-partum", "diastasis", "lourdeur pelvienne", "spondylarthrite"],
    preferences: ["machines", "tapis", "velo", "elliptique", "presse", "leg curl", "leg extension", "hip thrust"],
    avoid: ["course", "sauts", "pompes", "crunch", "sit-ups", "burpees", "releves de jambes lourds"],
    availableDays: ["monday", "tuesday", "thursday", "friday", "saturday"],
    externalSports: [],
    constraints: [
      {
        id: "alicia-postpartum",
        area: "other",
        label: "Post-partum, diastasis et perinee a proteger",
        severity: "avoid"
      },
      {
        id: "alicia-pelvic",
        area: "hip",
        label: "Sensation de lourdeur pelvienne",
        severity: "avoid"
      },
      {
        id: "alicia-spondy",
        area: "back",
        label: "Spondylarthrite",
        severity: "caution"
      }
    ],
    strengthReferences: []
  }
};

export const PROFILE_PRESETS: ProfilePreset[] = [SOFIANE_PROFILE_PRESET, ALICIA_PROFILE_PRESET];
