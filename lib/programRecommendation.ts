import { PROGRAM_CATALOG } from "@/data/programCatalog";
import type { ProgramRecommendation, ProgramTemplate, UserSettings } from "@/types/training";

export function recommendPrograms(
  settings: UserSettings,
  catalog: ProgramTemplate[] = PROGRAM_CATALOG,
  limit = 3
): ProgramRecommendation[] {
  return catalog
    .map((program) => scoreProgram(program, settings))
    .filter((recommendation) => recommendation.score > 0)
    .sort((a, b) => b.score - a.score || a.program.name.localeCompare(b.program.name))
    .slice(0, Math.max(1, limit))
    .map((recommendation, index) => ({ ...recommendation, rank: index + 1 }));
}

function scoreProgram(program: ProgramTemplate, settings: UserSettings): ProgramRecommendation {
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];
  const profileTokens = normalizeTokens([
    ...settings.avoid,
    ...settings.watchPoints,
    ...settings.preferences,
    settings.medicalNotes,
    settings.mainGoal
  ]);
  const hasPostpartumSignal = profileTokens.some((token) =>
    token.includes("post-partum") ||
    token.includes("postpartum") ||
    token.includes("diastasis") ||
    token.includes("perinee") ||
    token.includes("pelvien")
  );

  if (program.tags.includes("femme") && settings.sex === "male") {
    return blockedRecommendation(program, "Programme specifique femme, non pertinent pour ce profil.");
  }

  if (program.tags.includes("homme") && settings.sex === "female") {
    return blockedRecommendation(program, "Programme specifique homme, non pertinent pour ce profil.");
  }

  if (program.tags.includes("post-partum") && !hasPostpartumSignal) {
    return blockedRecommendation(program, "Programme post-partum sans signal correspondant dans le profil.");
  }

  if (settings.primaryGoal && program.primaryObjective === settings.primaryGoal) {
    score += 40;
    reasons.push("Objectif principal aligne.");
  }

  if (settings.primaryGoal && program.secondaryObjectives.includes(settings.primaryGoal)) {
    score += 18;
    reasons.push("Objectif present en objectif secondaire.");
  }

  if (settings.experienceLevel && program.level === settings.experienceLevel) {
    score += 18;
    reasons.push("Niveau sportif compatible.");
  }

  if (settings.weeklyFrequency && program.frequency === settings.weeklyFrequency) {
    score += 14;
    reasons.push("Frequence demandee respectee.");
  } else if (settings.weeklyFrequency && Math.abs(program.frequency - settings.weeklyFrequency) === 1) {
    score += 6;
    reasons.push("Frequence proche de la demande.");
  }

  const equipment = settings.equipment;
  if (equipment && program.requiredEquipment.includes(equipment)) {
    score += 12;
    reasons.push("Materiel disponible compatible.");
  }

  if (settings.judoDays.length > 0 || settings.externalSports.some((sport) => /judo|combat/i.test(sport.name))) {
    if (program.tags.includes("judo") || program.primaryObjective === "judo" || program.secondaryObjectives.includes("judo")) {
      score += 20;
      reasons.push("Sport de combat pris en compte.");
    }
  }

  if (settings.sex === "female" && program.tags.includes("femme")) {
    score += 8;
    reasons.push("Programme pense pour profil femme.");
  }

  const contraindicationHits = program.contraindications.filter((item) =>
    profileTokens.some((token) => token && normalize(item).includes(token))
  );

  if (contraindicationHits.length > 0) {
    score -= 35;
    warnings.push(`Contre-indications a verifier: ${contraindicationHits.join(", ")}.`);
  }

  if (
    settings.sex === "female" &&
    settings.experienceLevel === "debutant" &&
    program.level === "avance"
  ) {
    score -= 28;
    warnings.push("Programme avance peu adapte a un profil debutant.");
  }

  if (hasPostpartumSignal && program.tags.includes("post-partum")) {
    score += 20;
    reasons.push("Contraintes post-partum prises en compte.");
  }

  if (hasPostpartumSignal && !program.tags.includes("post-partum")) {
    score -= 12;
    warnings.push("Profil post-partum: garde-fous specifiques absents.");
  }

  if (reasons.length === 0) {
    score += 1;
    reasons.push("Option generale disponible.");
  }

  return {
    program,
    score: Math.max(0, score),
    rank: 0,
    reasons,
    warnings
  };
}

function blockedRecommendation(program: ProgramTemplate, warning: string): ProgramRecommendation {
  return {
    program,
    score: 0,
    rank: 0,
    reasons: [],
    warnings: [warning]
  };
}

function normalizeTokens(values: string[]): string[] {
  return values
    .flatMap((value) => normalize(value).split(/[,;\n]+/g))
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
