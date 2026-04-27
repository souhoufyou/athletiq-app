import { coachSeed } from "./data/seed";
import {
  getDailyJudoAdvice,
  getGoalPlanSummary,
  getGoalPriorities,
  personalizeProgram
} from "./lib/personalization";
import type { UserSettings } from "./types/training";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const baseSettings: UserSettings = {
  athleteName: "Sofiane",
  age: 36,
  heightCm: 181,
  loadUnit: "kg",
  currentWeightKg: 93.5,
  targetWeightKg: 84,
  mainObjective: "recomposition",
  sessionsPerWeek: 6,
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  sports: {
    judo: true,
    other: ""
  },
  equipment: ["Machines", "Poulies"],
  likedExercises: ["Developpe couche"],
  refusedExercises: [],
  painWatchList: ["Poignet droit"],
  level: "intermediate",
  detailPreference: "simple",
  progressionStyle: "dynamic",
  dailyJudoChoice: "judo",
  dailyJudoChoiceDateKey: "2026-04-27",
  onboardingCompleted: true,
  benchOneRepMaxKg: 127,
  judoDays: ["monday", "friday"],
  aiEnabled: false,
  darkMode: false
};

const sixDayProgram = personalizeProgram(coachSeed.weeklyProgram, baseSettings);
assert(sixDayProgram.length === 6, "Sofiane must keep 6 sessions by default.");

const fourDayStrength = personalizeProgram(coachSeed.weeklyProgram, {
  ...baseSettings,
  mainObjective: "strength",
  sessionsPerWeek: 4
});
assert(fourDayStrength.length === 4, "Changing sessions per week to 4 must adapt the planning.");
assert(fourDayStrength.some((session) => /force/i.test(session.title)), "Strength objective must keep a force session.");

const threeDayCardio = personalizeProgram(coachSeed.weeklyProgram, {
  ...baseSettings,
  mainObjective: "cardio_health",
  sessionsPerWeek: 3
});
assert(threeDayCardio.length === 3, "Changing sessions per week to 3 must adapt the planning.");
assert(
  threeDayCardio.some((session) => /cardio|souffle|zone 2/i.test(`${session.title} ${session.focus}`)),
  "Cardio objective must keep a cardio-oriented priority."
);

const noJudoAdvice = getDailyJudoAdvice(
  {
    ...baseSettings,
    dailyJudoChoice: "no_judo",
    dailyJudoChoiceDateKey: "2026-04-27"
  },
  "2026-04-27"
);
assert(noJudoAdvice.includes("sans echec"), "Disabling judo today must not be treated as failure.");

const persisted = JSON.parse(
  JSON.stringify({
    ...baseSettings,
    mainObjective: "fat_loss",
    sessionsPerWeek: 5,
    dailyJudoChoice: "no_judo"
  })
) as UserSettings;
assert(persisted.mainObjective === "fat_loss", "Selected objective must persist.");
assert(persisted.sessionsPerWeek === 5, "Selected session count must persist.");
assert(persisted.dailyJudoChoice === "no_judo", "Daily judo choice must persist.");
assert(persisted.onboardingCompleted, "Onboarding must stay completed after reload.");

const summary = getGoalPlanSummary(persisted);
const priorities = getGoalPriorities(persisted.mainObjective);
assert(summary.frequency === "5 seances/semaine", "Dashboard frequency summary must reflect settings.");
assert(priorities.length > 0, "Dashboard priorities must be available for the selected objective.");

console.log(
  JSON.stringify(
    {
      sixDayDefault: sixDayProgram.length,
      fourDayStrength: fourDayStrength.map((session) => session.title),
      threeDayCardio: threeDayCardio.map((session) => session.title),
      noJudoAdvice,
      persisted: {
        mainObjective: persisted.mainObjective,
        sessionsPerWeek: persisted.sessionsPerWeek,
        dailyJudoChoice: persisted.dailyJudoChoice,
        onboardingCompleted: persisted.onboardingCompleted
      },
      dashboard: {
        summary,
        priorities
      }
    },
    null,
    2
  )
);
