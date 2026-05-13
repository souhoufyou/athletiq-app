import { getProgramTemplateById } from "@/data/programCatalog";
import type { PlannedSession, ProgramTemplate } from "@/types/training";

export function getActiveProgramTemplateId(program: PlannedSession[]): string | undefined {
  const firstSessionId = program[0]?.id;
  if (!firstSessionId || !firstSessionId.includes(":")) {
    return undefined;
  }

  const templateId = firstSessionId.split(":")[0];
  return getProgramTemplateById(templateId) ? templateId : undefined;
}

export function getActiveProgramTemplate(program: PlannedSession[]): ProgramTemplate | undefined {
  const templateId = getActiveProgramTemplateId(program);
  return templateId ? getProgramTemplateById(templateId) : undefined;
}

export function getActiveProgramName(program: PlannedSession[]): string {
  return getActiveProgramTemplate(program)?.name ?? "Programme personnalise";
}
