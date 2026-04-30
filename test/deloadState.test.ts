import test from "node:test";
import assert from "node:assert/strict";
import { getProgramDeloadState } from "@/lib/deloadState";
import { GLOBAL_DELOAD_GUIDE_NOTE, GLOBAL_DELOAD_NOTE } from "@/lib/programAdaptation";
import type { CompletedSession, PlannedSession } from "@/types/training";

test("reports remaining deload sessions from the current week", () => {
  const program: PlannedSession[] = [
    {
      id: "session-a",
      weekday: "monday",
      title: "A",
      focus: "Push",
      duration: "60 min",
      intensity: "Modérée",
      notes: [GLOBAL_DELOAD_NOTE, GLOBAL_DELOAD_GUIDE_NOTE],
      exercises: []
    },
    {
      id: "session-b",
      weekday: "wednesday",
      title: "B",
      focus: "Pull",
      duration: "60 min",
      intensity: "Légère",
      notes: [GLOBAL_DELOAD_NOTE],
      exercises: []
    },
    {
      id: "session-c",
      weekday: "friday",
      title: "C",
      focus: "Legs",
      duration: "60 min",
      intensity: "Légère",
      exercises: []
    }
  ];

  const history: CompletedSession[] = [
    makeCompletedSession("session-a")
  ];

  const state = getProgramDeloadState(program, history);

  assert.equal(state.active, true);
  assert.equal(state.totalSessions, 2);
  assert.equal(state.completedSessions, 1);
  assert.equal(state.remainingSessions, 1);
  assert.equal(state.nextSessionTitle, "B");
  assert.equal(state.guideNote, GLOBAL_DELOAD_GUIDE_NOTE);
});

function makeCompletedSession(sessionId: string): CompletedSession {
  const now = new Date();
  const iso = now.toISOString();
  const dateKey = iso.slice(0, 10);

  return {
    dateKey,
    sessionId,
    startedAt: iso,
    logs: {},
    feedback: {
      difficulty: 5,
      globalPain: 0,
      energy: 6,
      breath: "correct"
    },
    timer: {
      startedAt: iso,
      isPaused: false,
      pausedTotalMs: 0
    },
    timing: {
      elapsedByExerciseMs: {}
    },
    id: `completed-${sessionId}`,
    completedAt: iso,
    title: sessionId,
    focus: "Test",
    mainExercises: [],
    progressions: {},
    nextSessionTitle: "next",
    nextSessionDateKey: dateKey,
    totalDurationMs: 1000,
    exerciseDurationsMs: {}
  };
}
