import { PROGRAM_CATALOG } from "@/data/programCatalog";
import type { ProgramObjective, ProgramRecommendation, ProgramTemplate, UserSettings } from "@/types/training";

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
  const primaryGoal = settings.primaryGoal;

  if (program.tags.includes("femme") && settings.sex === "male") {
    return blockedRecommendation(program, "Programme specifique femme, non pertinent pour ce profil.");
  }

  if (program.tags.includes("homme") && settings.sex === "female") {
    return blockedRecommendation(program, "Programme specifique homme, non pertinent pour ce profil.");
  }

  if (program.tags.includes("post-partum") && !hasPostpartumSignal) {
    return blockedRecommendation(program, "Programme post-partum sans signal correspondant dans le profil.");
  }

  if (primaryGoal && isGoalMatch(program.primaryObjective, primaryGoal)) {
    score += 40;
    reasons.push(`Adapte a ton objectif ${formatObjective(primaryGoal)}.`);
  }

  if (primaryGoal && program.secondaryObjectives.some((objective) => isGoalMatch(objective, primaryGoal))) {
    score += 18;
    reasons.push(`Couvre aussi ton objectif ${formatObjective(primaryGoal)}.`);
  }

  if (settings.experienceLevel && program.level === settings.experienceLevel) {
    score += 18;
    reasons.push(`Compatible avec ton niveau ${formatLevel(settings.experienceLevel)}.`);
  }

  if (settings.weeklyFrequency && program.frequency === settings.weeklyFrequency) {
    score += 14;
    reasons.push(`Compatible avec ${settings.weeklyFrequency} seances par semaine.`);
  } else if (settings.weeklyFrequency && Math.abs(program.frequency - settings.weeklyFrequency) === 1) {
    score += 6;
    reasons.push(`Frequence proche de tes ${settings.weeklyFrequency} seances demandees.`);
  }

  const equipment = settings.equipment;
  if (equipment && program.requiredEquipment.includes(equipment)) {
    score += 12;
    reasons.push(`Compatible avec ton materiel: ${formatEquipment(equipment)}.`);
  }

  if (settings.judoDays.length > 0 || settings.externalSports.some((sport) => /judo|combat/i.test(sport.name))) {
    if (program.tags.includes("judo") || program.primaryObjective === "judo" || program.secondaryObjectives.includes("judo")) {
      score += 20;
      reasons.push("Tient compte d'un sport intense dans la semaine.");
    }
  }

  if (settings.sex === "female" && program.tags.includes("femme")) {
    score += 8;
    reasons.push("Adapte a un profil femme.");
  }

  if (settings.sex === "male" && program.tags.includes("homme")) {
    score += 8;
    reasons.push("Adapte a un profil homme avance.");
  }

  if (primaryGoal && program.tags.some((tag) => isGoalMatch(tag as ProgramObjective, primaryGoal))) {
    score += 6;
  }

  if (settings.preferences.some((preference) => program.tags.some((tag) => normalize(preference).includes(normalize(tag))))) {
    score += 4;
    reasons.push("Respecte une partie de tes preferences.");
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
    reasons.push("Prend en compte post-partum, perinee ou diastasis.");
  }

  if (hasPostpartumSignal && !program.tags.includes("post-partum")) {
    score -= 12;
    warnings.push("Profil post-partum: garde-fous specifiques absents.");
  }

  if (reasons.length === 0) {
    score += 1;
    reasons.push("Option simple disponible pour demarrer.");
  }

  if (settings.avoid.length > 0 && contraindicationHits.length === 0) {
    reasons.push("Tes exercices refuses seront filtres si le programme en contient.");
  }

  return {
    program,
    score: Math.max(0, score),
    rank: 0,
    reasons,
    warnings
  };
}

function isGoalMatch(programObjective: ProgramObjective | string, userGoal: ProgramObjective | string): boolean {
  if (programObjective === userGoal) return true;
  if (userGoal === "sante" && programObjective === "cardio-sante") return true;
  if (userGoal === "performance" && programObjective === "force") return true;
  if (userGoal === "prise-masse" && programObjective === "fessiers") return true;
  return false;
}

function formatObjective(objective: ProgramObjective | string): string {
  const labels: Record<string, string> = {
    "cardio-sante": "cardio / sante",
    fessiers: "fessiers",
    force: "force",
    judo: "judo",
    performance: "force",
    "perte-gras": "perte de gras",
    "prise-masse": "prise de muscle",
    recomposition: "recomposition",
    sante: "cardio / sante"
  };

  return labels[objective] ?? objective;
}

function formatLevel(level: string): string {
  const labels: Record<string, string> = {
    avance: "avance",
    debutant: "debutant",
    intermediaire: "intermediaire"
  };

  return labels[level] ?? level;
}

function formatEquipment(equipment: string): string {
  const labels: Record<string, string> = {
    "halteres-maison": "maison equipee",
    "poids-corps": "peu de materiel",
    "salle-complete": "salle equipee"
  };

  return labels[equipment] ?? equipment;
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
