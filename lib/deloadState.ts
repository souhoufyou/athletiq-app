import { GLOBAL_DELOAD_GUIDE_NOTE, GLOBAL_DELOAD_NOTE } from "@/lib/programAdaptation";
import type { CompletedSession, PlannedSession } from "@/types/training";

export type ProgramDeloadState = {
  active: boolean;
  completedSessions: number;
  guideNote?: string;
  nextSessionTitle?: string;
  remainingSessions: number;
  totalSessions: number;
};

export function getProgramDeloadState(
  program: PlannedSession[],
  history: CompletedSession[]
): ProgramDeloadState {
  const deloadSessions = program.filter((session) => session.notes?.includes(GLOBAL_DELOAD_NOTE));

  if (deloadSessions.length === 0) {
    return {
      active: false,
      completedSessions: 0,
      remainingSessions: 0,
      totalSessions: 0
    };
  }

  const completedThisWeekIds = new Set(getSessionsThisWeek(history).map((session) => session.sessionId));
  const completedSessions = deloadSessions.filter((session) => completedThisWeekIds.has(session.id)).length;
  const remaining = deloadSessions.filter((session) => !completedThisWeekIds.has(session.id));
  const firstGuideNote = deloadSessions
    .flatMap((session) => session.notes ?? [])
    .find((note) => note === GLOBAL_DELOAD_GUIDE_NOTE);

  return {
    active: true,
    completedSessions,
    guideNote: firstGuideNote,
    nextSessionTitle: remaining[0]?.title,
    remainingSessions: remaining.length,
    totalSessions: deloadSessions.length
  };
}

function getSessionsThisWeek(history: CompletedSession[]) {
  const start = new Date();
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);

  return history.filter((session) => new Date(session.completedAt) >= start);
}
