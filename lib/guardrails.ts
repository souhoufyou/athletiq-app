export { validateAIRecommendation } from "@/lib/progressionCore";

export type {
  AIProgressionRecommendation,
  AIRecommendationValidationInput
} from "@/lib/progressionCore";

export const antiDriftGuardrails = {
  stabilityPrinciple:
    "Conserver la structure quand progression, douleur, fatigue, sommeil et disponibilite restent stables.",
  protectedExercises: [
    "developpe couche",
    "presse a cuisses",
    "tirage vertical",
    "rowing",
    "hip thrust",
    "souleve roumain",
    "developpe epaules"
  ],
  weeklyVolumeTargets: {
    pecs: "10-16 series/semaine",
    back: "14-22 series/semaine",
    legs: "10-18 series/semaine",
    shoulders: "8-16 series/semaine",
    arms: "6-14 series/semaine",
    core: "4-8 series/semaine",
    cardio: "3-5 expositions/semaine, judo inclus"
  }
} as const;
