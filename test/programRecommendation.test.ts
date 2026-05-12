import test from "node:test";
import assert from "node:assert/strict";
import { PROGRAM_CATALOG } from "@/data/programCatalog";
import { ALICIA_PROFILE_PRESET, SOFIANE_PROFILE_PRESET } from "@/data/profilePresets";
import { instantiateProgramTemplate, createActiveProgramMeta } from "@/lib/programInstantiation";
import { recommendPrograms } from "@/lib/programRecommendation";
import { CURRENT_SETTINGS_SCHEMA_VERSION } from "@/lib/settingsSchema";
import type { ProgramTemplate, UserSettings } from "@/types/training";

const baseSettings: UserSettings = {
  schemaVersion: CURRENT_SETTINGS_SCHEMA_VERSION,
  athleteName: "Test",
  sex: "male",
  loadUnit: "kg",
  currentWeightKg: 90,
  targetWeightKg: 82,
  benchOneRepMaxKg: 120,
  judoDays: ["monday", "friday"],
  cautionLevel: "normal",
  aiEnabled: false,
  darkMode: false,
  age: 36,
  heightCm: 181,
  gym: "Salle",
  mainGoal: "Recomposition",
  cardioLevel: "Faible",
  sleepQuality: "Irregulier",
  recoveryProfile: "irregular",
  medicalNotes: "",
  watchPoints: ["poignet droit"],
  preferences: ["machines"],
  avoid: ["course"],
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  externalSports: [],
  constraints: [],
  strengthReferences: [],
  loadBiasByPattern: {},
  exerciseSwapPreferences: {},
  setBiasByPattern: {},
  repBiasByPattern: {},
  restBiasByPattern: {},
  sessionDurationPreference: "standard",
  primaryGoal: "recomposition",
  experienceLevel: "avance",
  equipment: "salle-complete",
  weeklyFrequency: 5
};

const judoTemplate: ProgramTemplate = {
  id: "ppl-judo",
  name: "PPL Upper Lower Judo",
  description: "Template de test.",
  level: "avance",
  primaryObjective: "recomposition",
  secondaryObjectives: ["force", "judo"],
  frequency: 5,
  averageDuration: "60 min",
  requiredEquipment: ["salle-complete"],
  contraindications: [],
  tags: ["recomposition", "force", "judo", "homme"],
  weeklyStructure: ["Push", "Pull"],
  sessions: [
    {
      id: "push",
      weekday: "monday",
      title: "Push",
      focus: "Haut du corps",
      duration: "60 min",
      intensity: "Soutenue",
      exercises: [
        {
          id: "bench",
          name: "Developpe couche",
          target: "4 x 6",
          plannedLoad: "100 kg",
          rest: "3 min",
          cue: "Technique propre."
        }
      ]
    }
  ],
  progressionRules: {
    method: "double-progression",
    loadStepKg: { compoundUpper: 2.5 }
  },
  cardioRules: {
    allowedModalities: ["tapis incline"],
    method: "duration-first",
    maxSingleChange: "duration"
  },
  guardrails: {
    contraindications: [],
    deloadEveryWeeks: 4
  }
};

const beginnerTemplate: ProgramTemplate = {
  ...judoTemplate,
  id: "fullbody-beginner",
  name: "Full Body Debutant",
  level: "debutant",
  primaryObjective: "sante",
  secondaryObjectives: ["perte-gras"],
  frequency: 3,
  tags: ["debutant", "sante"],
  requiredEquipment: ["poids-corps"],
  sessions: []
};

test("recommendPrograms ranks matching program first", () => {
  const recommendations = recommendPrograms(baseSettings, [beginnerTemplate, judoTemplate]);

  assert.equal(recommendations.length, 2);
  assert.equal(recommendations[0].program.id, "ppl-judo");
  assert.equal(recommendations[0].rank, 1);
  assert.ok(recommendations[0].score > recommendations[1].score);
  assert.ok(recommendations[0].reasons.includes("Objectif principal aligne."));
});

test("instantiateProgramTemplate keeps PlannedSession compatibility", () => {
  const program = instantiateProgramTemplate(judoTemplate, baseSettings);

  assert.equal(program.length, 1);
  assert.equal(program[0].id, "ppl-judo:push");
  assert.equal(program[0].weekday, "monday");
  assert.equal(program[0].exercises[0].name, "Developpe couche");
});

test("createActiveProgramMeta records chosen template without touching history", () => {
  const meta = createActiveProgramMeta(judoTemplate, "recommended", "profile-sofiane");

  assert.equal(meta.programId, "ppl-judo");
  assert.equal(meta.programName, "PPL Upper Lower Judo");
  assert.equal(meta.source, "recommended");
  assert.equal(meta.profileId, "profile-sofiane");
  assert.equal(meta.templateVersion, 1);
  assert.ok(Date.parse(meta.selectedAt) > 0);
});

test("Sofiane preset recommends Push Pull Legs Upper Lower first", () => {
  const recommendations = recommendPrograms(SOFIANE_PROFILE_PRESET.settings, PROGRAM_CATALOG);

  assert.equal(recommendations[0].program.id, "ppl-upper-lower-5j");
  assert.equal(recommendations[0].rank, 1);
  assert.ok(recommendations[0].score > 0);
  assert.ok(recommendations[0].reasons.length > 0);
});

test("Alicia preset recommends Shape & Burn Alicia first", () => {
  const recommendations = recommendPrograms(ALICIA_PROFILE_PRESET.settings, PROGRAM_CATALOG);

  assert.equal(recommendations[0].program.id, "shape-burn-alicia-4j");
  assert.equal(recommendations[0].rank, 1);
  assert.ok(recommendations[0].score > 0);
  assert.ok(recommendations[0].reasons.some((reason) => reason.includes("post-partum")));
});

test("Alicia does not receive classic PPL as main recommendation", () => {
  const recommendations = recommendPrograms(ALICIA_PROFILE_PRESET.settings, PROGRAM_CATALOG);

  assert.notEqual(recommendations[0].program.id, "push-pull-legs-classique-6j");
});

test("Sofiane does not receive Shape & Burn Alicia", () => {
  const recommendations = recommendPrograms(SOFIANE_PROFILE_PRESET.settings, PROGRAM_CATALOG);

  assert.equal(recommendations.some((recommendation) => recommendation.program.id === "shape-burn-alicia-4j"), false);
});
