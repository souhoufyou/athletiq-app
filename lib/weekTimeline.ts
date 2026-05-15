import type { CompletedSession, PlannedSession, Weekday } from "@/types/training";

export type DayState = "done" | "in-progress" | "to-do" | "rest" | "missed";

export type DayInfo = {
  weekday: Weekday;
  short: string;
  label: string;
  isToday: boolean;
  state: DayState;
  planned?: PlannedSession;
  completedSession?: CompletedSession;
};

const WEEKDAYS_ORDER: ReadonlyArray<{ key: Weekday; short: string; label: string }> = [
  { key: "monday",    short: "L", label: "Lundi" },
  { key: "tuesday",   short: "M", label: "Mardi" },
  { key: "wednesday", short: "M", label: "Mercredi" },
  { key: "thursday",  short: "J", label: "Jeudi" },
  { key: "friday",    short: "V", label: "Vendredi" },
  { key: "saturday",  short: "S", label: "Samedi" },
  { key: "sunday",    short: "D", label: "Dimanche" }
];

/**
 * Build a 7-entry timeline for Mon-Sun based on the active program,
 * the completed sessions of THIS week, the current weekday, and an
 * optional active session id (to flag the "in-progress" state).
 *
 * Used by both the Dashboard (compact) and the Programme page (detailed).
 */
export function buildWeekTimeline(input: {
  currentProgram: PlannedSession[];
  completedThisWeek: CompletedSession[];
  todayWeekday: Weekday;
  activeSessionId?: string;
}): DayInfo[] {
  const todayIndex = WEEKDAYS_ORDER.findIndex((d) => d.key === input.todayWeekday);
  const completedBySessionId = new Map<string, CompletedSession>();
  for (const session of input.completedThisWeek) {
    if (!completedBySessionId.has(session.sessionId)) {
      completedBySessionId.set(session.sessionId, session);
    }
  }

  return WEEKDAYS_ORDER.map(({ key, short, label }, index) => {
    const planned = input.currentProgram.find((s) => s.weekday === key);
    const isToday = key === input.todayWeekday;
    const completedSession = planned ? completedBySessionId.get(planned.id) : undefined;
    const isInProgress = isToday && planned && input.activeSessionId === planned.id;

    let state: DayState;
    if (!planned) state = "rest";
    else if (completedSession) state = "done";
    else if (isInProgress) state = "in-progress";
    else if (index < todayIndex) state = "missed";
    else state = "to-do";

    return { weekday: key, short, label, isToday, state, planned, completedSession };
  });
}

export function getCompletedThisWeek(history: CompletedSession[]): CompletedSession[] {
  const start = new Date();
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);
  return history.filter((session) => new Date(session.completedAt) >= start);
}

/** Short status label used in badges (FR). */
export function getDayStateLabel(state: DayState): string {
  switch (state) {
    case "done":         return "Faite";
    case "in-progress":  return "En cours";
    case "to-do":        return "À faire";
    case "missed":       return "Non faite";
    case "rest":         return "Repos";
  }
}

export type DayStateTone = {
  badge: string;     // border + bg + text classes for a small badge
  dotBg: string;     // bg of the compact 7-day dot
  rowAccent: string; // left accent border for the detailed row
};

export function getDayStateTone(state: DayState): DayStateTone {
  switch (state) {
    case "done":
      return {
        badge: "border-sea/30 bg-sea/15 text-sea",
        dotBg: "border-sea bg-sea text-white",
        rowAccent: "border-l-sea"
      };
    case "in-progress":
      return {
        badge: "border-amber/30 bg-amber/15 text-amber",
        dotBg: "border-amber bg-amber/25 text-amber",
        rowAccent: "border-l-amber"
      };
    case "to-do":
      return {
        badge: "border-coral/30 bg-coral/15 text-coral",
        dotBg: "border-coral/40 bg-coral/10 text-coral",
        rowAccent: "border-l-coral"
      };
    case "missed":
      return {
        badge: "border-white/15 bg-white/8 text-white/55",
        dotBg: "border-white/8 bg-white/4 text-white/30",
        rowAccent: "border-l-white/10"
      };
    case "rest":
      return {
        badge: "border-white/10 bg-white/4 text-white/55",
        dotBg: "border-white/8 bg-white/4 text-white/35",
        rowAccent: "border-l-white/8"
      };
  }
}
