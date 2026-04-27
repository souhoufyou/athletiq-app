import { coachSeed } from "./data/seed";
import { estimateCalories } from "./lib/analytics";
import { buildCoachAiPayload } from "./lib/coachAiPayload";
import type { CompletedSession } from "./types/training";

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const plannedSession = coachSeed.weeklyProgram[0];
const calorieEstimate = estimateCalories({
  durationMs: 55 * 60 * 1000,
  feedback: {
    breath: "correct",
    difficulty: 7,
    energy: 6,
    globalPain: 1
  },
  session: plannedSession,
  weightKg: 93.5
});

assert(calorieEstimate.calories > 0, "Calories estimate must be positive.");
assert(calorieEstimate.label === "Estimation approximative", "Calories must be clearly marked approximate.");
assert(calorieEstimate.note.includes("pas une mesure exacte"), "Calories note must not present exact precision.");

const completedSession: CompletedSession = {
  dateKey: "2026-04-27",
  sessionId: plannedSession.id,
  startedAt: "2026-04-27T10:00:00.000Z",
  logs: {
    "bench-press-5x5": {
      exerciseId: "bench-press-5x5",
      status: "hard",
      usedLoad: "90 kg",
      completedReps: "5/5/4",
      comment: "poignet sensible sur la derniere serie"
    },
    "neutral-lat-pulldown": {
      exerciseId: "neutral-lat-pulldown",
      status: "ok",
      usedLoad: "60 kg",
      completedReps: "10/10/10",
      comment: ""
    }
  },
  feedback: {
    breath: "correct",
    difficulty: 7,
    energy: 6,
    globalPain: 1
  },
  timer: {
    isPaused: false,
    pausedTotalMs: 0,
    startedAt: "2026-04-27T10:00:00.000Z"
  },
  timing: {
    elapsedByExerciseMs: {}
  },
  id: "qa-session",
  completedAt: "2026-04-27T10:55:00.000Z",
  title: plannedSession.title,
  focus: plannedSession.focus,
  mainExercises: plannedSession.exercises.slice(0, 2).map((exercise) => exercise.name),
  progressions: {},
  nextSessionTitle: "Bas du corps + cardio",
  nextSessionDateKey: "2026-04-28",
  calorieEstimate,
  totalDurationMs: 55 * 60 * 1000,
  exerciseDurationsMs: {}
};

const aiPayload = buildCoachAiPayload(completedSession, [completedSession]);
assert(aiPayload.session.freeComments.length === 1, "AI payload must transmit free comments.");
assert(
  aiPayload.session.freeComments[0].comment.includes("poignet sensible"),
  "AI payload must include the actual exercise comment."
);
assert(aiPayload.weeklySummary.length === 1, "AI payload must support weekly summary context.");

console.log(
  JSON.stringify(
    {
      calorieEstimate,
      aiPayload: {
        comments: aiPayload.session.freeComments,
        weeklySummaryCount: aiPayload.weeklySummary.length
      },
      localEnginePriority: "AI payload includes local decisions; local rules remain authoritative."
    },
    null,
    2
  )
);
