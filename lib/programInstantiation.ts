import { normalizeProgramV2 } from "@/lib/programSchema";
import type { PlannedSession, ProgramTemplate, UserSettings, Weekday } from "@/types/training";

const DEFAULT_WEEKDAYS: Weekday[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function instantiateProgramTemplate(
  template: ProgramTemplate,
  settings?: Pick<UserSettings, "availableDays">
): PlannedSession[] {
  const availableDays = normalizeWeekdays(settings?.availableDays);

  return normalizeProgramV2(
    template.sessions.map((session, index) => {
      const weekday = session.weekday ?? availableDays[index % availableDays.length] ?? DEFAULT_WEEKDAYS[index % DEFAULT_WEEKDAYS.length];

      return {
        id: `${template.id}:${session.id}`,
        weekday,
        scheduleLabel: session.scheduleLabel,
        title: session.title,
        focus: session.focus,
        duration: session.duration,
        intensity: session.intensity,
        phase: session.phase,
        notes: session.notes,
        exercises: session.exercises
      };
    })
  );
}

export function createActiveProgramMeta(
  template: ProgramTemplate,
  source: "manual" | "onboarding" | "preset" | "recommended",
  profileId?: string
) {
  return {
    programId: template.id,
    programName: template.name,
    selectedAt: new Date().toISOString(),
    source,
    profileId,
    templateVersion: 1
  };
}

function normalizeWeekdays(days: Weekday[] | undefined): Weekday[] {
  return days && days.length > 0 ? days : DEFAULT_WEEKDAYS;
}
