import type { Exercise, MovementPattern, UserSettings } from "@/types/training";

export type LoadInsight = {
  badge: string;
  detail: string;
  tone: "calm" | "info" | "muted" | "warn";
};

export function getExerciseLoadInsight(exercise: Exercise, settings: UserSettings): LoadInsight | undefined {
  const plannedLoad = exercise.plannedLoad?.trim();
  if (!plannedLoad) {
    return {
      badge: "Libre",
      detail: "Charge a definir sur place. Garde 1 a 3 repetitions en reserve pour ajuster proprement.",
      tone: "muted"
    };
  }

  const normalizedLoad = normalize(plannedLoad);
  if (normalizedLoad.includes("poids du corps") || normalizedLoad.includes("bodyweight")) {
    return {
      badge: "PDC",
      detail: "Charge au poids du corps. Monte la difficulte avec l'amplitude, le tempo ou les repetitions.",
      tone: "calm"
    };
  }

  const pattern = exercise.taxonomy?.pattern ?? inferPattern(exercise);
  const isEstimate = normalizedLoad.startsWith("env");

  if (!isEstimate) {
    if (pattern === "chest-compound" && settings.benchOneRepMaxKg > 0) {
      return {
        badge: "Calibree",
        detail: "Charge construite depuis ton repere au developpe couche. Elle sert de base de travail, pas de test max.",
        tone: "info"
      };
    }

    if (hasMatchingReference(pattern, settings)) {
      return {
        badge: "Calibree",
        detail: `Charge basee sur ton repere ${getReferenceLabel(pattern)}. Ajuste-la seulement si l'effort reel ne colle pas.`,
        tone: "info"
      };
    }

    return {
      badge: "Cible",
      detail: "Charge cible du programme. Ajuste-la selon ta forme du jour et la qualite d'execution.",
      tone: "calm"
    };
  }

  if (pattern === "shoulders-compound" && hasChestReference(settings)) {
    return {
      badge: "Derivee",
      detail: "Estimation derivee de ton repere au developpe couche pour garder une progression logique sur les epaules.",
      tone: "warn"
    };
  }

  return {
    badge: "Estimee",
    detail: "Point de depart estime depuis ton profil, ton niveau et ta recuperation. L'app l'affinera avec tes retours.",
    tone: "warn"
  };
}

function hasMatchingReference(pattern: MovementPattern | undefined, settings: UserSettings): boolean {
  if (!pattern) return false;
  const keywords = getPatternKeywords(pattern);
  if (keywords.length === 0) return false;

  return settings.strengthReferences.some((reference) => {
    const lift = normalize(reference.lift);
    return keywords.some((keyword) => lift.includes(keyword));
  });
}

function hasChestReference(settings: UserSettings): boolean {
  return settings.benchOneRepMaxKg > 0 || hasMatchingReference("chest-compound", settings);
}

function getReferenceLabel(pattern: MovementPattern | undefined): string {
  if (pattern === "legs-quad") return "jambes";
  if (pattern === "legs-hinge") return "hinge";
  if (pattern === "back-horizontal" || pattern === "back-vertical") return "tirage";
  if (pattern === "shoulders-compound") return "epaules";
  return "principal";
}

function getPatternKeywords(pattern: MovementPattern): string[] {
  if (pattern === "chest-compound") return ["developpe couche", "bench"];
  if (pattern === "legs-quad") return ["squat", "presse", "leg"];
  if (pattern === "back-horizontal" || pattern === "back-vertical") return ["tirage", "rowing", "traction", "pull"];
  if (pattern === "legs-hinge") return ["hip thrust", "souleve", "hinge", "rdl"];
  if (pattern === "shoulders-compound") return ["developpe militaire", "developpe epaules", "shoulder"];
  return [];
}

function inferPattern(exercise: Exercise): MovementPattern | undefined {
  const text = normalize(`${exercise.id} ${exercise.name} ${exercise.cue}`);
  if (includesAny(text, ["developpe couche", "bench"])) return "chest-compound";
  if (includesAny(text, ["developpe militaire", "developpe epaules", "shoulder press"])) return "shoulders-compound";
  if (includesAny(text, ["tirage", "traction", "pull"])) return "back-vertical";
  if (includesAny(text, ["rowing", "row"])) return "back-horizontal";
  if (includesAny(text, ["hip thrust", "souleve", "rdl"])) return "legs-hinge";
  if (includesAny(text, ["squat", "presse", "leg press"])) return "legs-quad";
  return undefined;
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}
