import { weeklyProgram } from "@/data/program";
import { getWeekday } from "@/lib/date";
import type { ExerciseLog, PlannedSession, SessionFeedback } from "@/types/training";

export const defaultSessionFeedback: SessionFeedback = {
  difficulty: 5,
  globalPain: 0,
  energy: 7,
  breath: "correct"
};

export function getTodaySession(program: PlannedSession[] = weeklyProgram, date = new Date()): PlannedSession {
  const weekday = getWeekday(date);
  const session = program.find((item) => item.weekday === weekday);

  if (!session) {
    return program[0] ?? weeklyProgram[0];
  }

  return session;
}

export function getNextSession(program: PlannedSession[] = weeklyProgram, date = new Date()) {
  const todayIndex = date.getDay();

  for (let offset = 1; offset <= 7; offset += 1) {
    const next = new Date(date);
    next.setDate(date.getDate() + offset);
    const session = getTodaySession(program, next);

    if (session || offset === 7) {
      return {
        session,
        date: next,
        offsetFromToday: (todayIndex + offset) % 7
      };
    }
  }

  return {
    session: program[0] ?? weeklyProgram[0],
    date,
    offsetFromToday: todayIndex
  };
}

export function createEmptyLogs(session: PlannedSession): Record<string, ExerciseLog> {
  return Object.fromEntries(
    session.exercises.map((exercise) => [
      exercise.id,
      {
        exerciseId: exercise.id,
        usedLoad: "",
        completedReps: "",
        comment: ""
      }
    ])
  );
}

export function getCompletedCount(logs: Record<string, ExerciseLog>): number {
  return Object.values(logs).filter((log) => Boolean(log.status)).length;
}
