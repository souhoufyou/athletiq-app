import { getSessionCategory } from "@/lib/sessionMeta";
import type { PlannedSession, ProgramSessionTemplate, Weekday } from "@/types/training";

/**
 * Intelligently schedule program sessions across available weekdays.
 *
 * This function:
 * 1. Rotates the session array so the starting session is first
 * 2. Cyclically assigns sessions to available weekdays
 * 3. Respects session rotation order (Push→Pull→Legs→Push, even with rest days)
 *
 * @example
 * // PPL starting with Legs, 6 days available
 * scheduleSessionsFlexibly(
 *   [Push A, Pull A, Legs A, Push B, Pull B, Legs B],
 *   [Mon, Tue, Wed, Thu, Fri, Sat],
 *   2  // Start with Legs (index 2)
 * )
 * // Result: Legs A→Mon, Push B→Tue, Pull B→Wed, Legs B→Thu, Push A→Fri, Pull A→Sat
 */
export function scheduleSessionsFlexibly(
  sessions: ProgramSessionTemplate[],
  availableWeekdays: Weekday[],
  startingSessionIndex: number = 0
): PlannedSession[] {
  if (sessions.length === 0 || availableWeekdays.length === 0) {
    return [];
  }

  // Clamp starting index to valid range
  const validStartIndex = startingSessionIndex % sessions.length;

  // Rotate sessions so starting session is first
  const rotatedSessions = rotateArray(sessions, validStartIndex);

  // Assign sessions to weekdays cyclically
  const assignedWeekdays = assignWeekdaysCyclically(rotatedSessions, availableWeekdays);

  // Convert to PlannedSession format
  return rotatedSessions.map((session, index) => ({
    id: session.id,
    weekday: assignedWeekdays[index],
    scheduleLabel: session.scheduleLabel,
    title: session.title,
    focus: session.focus,
    duration: session.duration,
    intensity: session.intensity,
    phase: session.phase,
    notes: session.notes,
    exercises: session.exercises
  }));
}

/**
 * Assign sessions to available weekdays in a cyclic manner.
 * If there are more sessions than available weekdays, the pattern repeats.
 * If there are fewer sessions than available weekdays, some days will have no session (rest).
 */
function assignWeekdaysCyclically(
  sessions: ProgramSessionTemplate[],
  weekdays: Weekday[]
): Weekday[] {
  return sessions.map((_, index) => weekdays[index % weekdays.length]);
}

/**
 * Rotate array so element at startIndex becomes the first element.
 * Non-mutating.
 *
 * @example
 * rotateArray(['a', 'b', 'c', 'd'], 2) → ['c', 'd', 'a', 'b']
 */
function rotateArray<T>(arr: T[], startIndex: number): T[] {
  if (arr.length === 0) return [];
  const validIndex = startIndex % arr.length;
  return [...arr.slice(validIndex), ...arr.slice(0, validIndex)];
}

/**
 * Get the sequence type of a session (Push, Pull, Legs, Upper, Lower, etc.)
 * Uses existing getSessionCategory() logic.
 *
 * Useful for detecting repeating session types (e.g., "Push A" and "Push B"
 * are both "push" type and should maintain rotation order).
 */
export function getSessionSequenceType(session: ProgramSessionTemplate): string {
  return getSessionCategory({
    ...session,
    weekday: "monday" // Dummy weekday for category detection
  } as any);
}
