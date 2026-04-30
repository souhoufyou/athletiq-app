import type { BodyArea, ConstraintSeverity, Equipment, Exercise, MovementPattern } from "@/types/training";

export type LibraryExercise = Exercise & {
  pattern: MovementPattern;
  equipment: Equipment[];
  isCompound: boolean;
  jointStress?: Partial<Record<BodyArea, ConstraintSeverity>>;
  tags?: string[];
};

/**
 * Pool of exercises grouped by movement pattern.
 * The program builder picks one per slot based on the user's available equipment.
 */
export const EXERCISE_LIBRARY: LibraryExercise[] = [
  // ─── Chest compound ───
  {
    id: "ex-bench-barbell",
    name: "Développé couché barre",
    pattern: "chest-compound",
    equipment: ["salle-complete"],
    isCompound: true,
    target: "4 x 6-8",
    rest: "2-3 min",
    cue: "Trajectoire stable, omoplates serrées, contrôle de la descente.",
    muscleGroups: ["pectoraux", "triceps", "epaules"],
    classification: "force"
  },
  {
    id: "ex-bench-dumbbell",
    name: "Développé couché haltères",
    pattern: "chest-compound",
    equipment: ["salle-complete", "halteres-maison"],
    isCompound: true,
    target: "4 x 8-10",
    rest: "2 min",
    cue: "Amplitude complète, poignets neutres, descente contrôlée.",
    muscleGroups: ["pectoraux", "triceps", "epaules"],
    classification: "hypertrophie"
  },
  {
    id: "ex-bench-incline-machine",
    name: "Développé incliné machine",
    pattern: "chest-compound",
    equipment: ["salle-complete"],
    isCompound: true,
    target: "4 x 8-10",
    rest: "90 s",
    cue: "Poitrine haute, ne crispe pas les épaules.",
    muscleGroups: ["pectoraux", "epaules", "triceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-pushup",
    name: "Pompes",
    pattern: "chest-compound",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: true,
    target: "3-4 x AMRAP",
    rest: "75 s",
    cue: "Corps gainé en planche, descente complète.",
    muscleGroups: ["pectoraux", "triceps", "epaules", "abdos"],
    classification: "hypertrophie"
  },

  // ─── Chest isolation ───
  {
    id: "ex-cable-fly",
    name: "Écarté poulie",
    pattern: "chest-isolation",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "60 s",
    cue: "Bras légèrement fléchis, étirement contrôlé.",
    muscleGroups: ["pectoraux"],
    classification: "hypertrophie"
  },
  {
    id: "ex-pec-deck",
    name: "Pec deck",
    pattern: "chest-isolation",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "60 s",
    cue: "Contraction complète, pas de rebond.",
    muscleGroups: ["pectoraux"],
    classification: "hypertrophie"
  },
  {
    id: "ex-dumbbell-fly",
    name: "Écarté haltères",
    pattern: "chest-isolation",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "60 s",
    cue: "Coudes légèrement fléchis, ouverture lente.",
    muscleGroups: ["pectoraux"],
    classification: "hypertrophie"
  },

  // ─── Back vertical ───
  {
    id: "ex-pulldown",
    name: "Tirage vertical",
    pattern: "back-vertical",
    equipment: ["salle-complete"],
    isCompound: true,
    target: "4 x 8-10",
    rest: "90 s",
    cue: "Tire les coudes vers les côtes, poitrine haute.",
    muscleGroups: ["dos", "biceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-pullup",
    name: "Tractions (assistées si besoin)",
    pattern: "back-vertical",
    equipment: ["salle-complete", "poids-corps"],
    isCompound: true,
    target: "4 x 5-8",
    rest: "2 min",
    cue: "Tire avec le dos, mente au-dessus de la barre.",
    muscleGroups: ["dos", "biceps"],
    classification: "force"
  },
  {
    id: "ex-band-pulldown",
    name: "Tirage élastique haut",
    pattern: "back-vertical",
    equipment: ["halteres-maison", "poids-corps"],
    isCompound: true,
    target: "4 x 12-15",
    rest: "60 s",
    cue: "Élastique tendu, contraction des dorsaux.",
    muscleGroups: ["dos", "biceps"],
    classification: "hypertrophie"
  },

  // ─── Back horizontal ───
  {
    id: "ex-row-cable",
    name: "Rowing poulie basse",
    pattern: "back-horizontal",
    equipment: ["salle-complete"],
    isCompound: true,
    target: "4 x 10-12",
    rest: "90 s",
    cue: "Tire avec le dos, ne hausse pas les épaules.",
    muscleGroups: ["dos", "biceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-row-dumbbell",
    name: "Rowing haltère un bras",
    pattern: "back-horizontal",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: true,
    target: "3 x 10-12 par bras",
    rest: "75 s",
    cue: "Coude proche du corps, étirement complet.",
    muscleGroups: ["dos", "biceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-inverted-row",
    name: "Rowing inversé",
    pattern: "back-horizontal",
    equipment: ["poids-corps", "salle-complete"],
    isCompound: true,
    target: "3 x AMRAP",
    rest: "75 s",
    cue: "Corps gainé, poitrine vers la barre.",
    muscleGroups: ["dos", "biceps"],
    classification: "hypertrophie"
  },

  // ─── Legs quad ───
  {
    id: "ex-leg-press",
    name: "Presse à cuisses",
    pattern: "legs-quad",
    equipment: ["salle-complete"],
    isCompound: true,
    target: "4 x 10",
    rest: "2 min",
    cue: "Bas du dos collé, amplitude solide.",
    muscleGroups: ["jambes"],
    classification: "force"
  },
  {
    id: "ex-goblet-squat",
    name: "Goblet squat",
    pattern: "legs-quad",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: true,
    target: "4 x 10-12",
    rest: "90 s",
    cue: "Talons au sol, descente contrôlée, dos droit.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },
  {
    id: "ex-bw-squat",
    name: "Squat poids du corps",
    pattern: "legs-quad",
    equipment: ["poids-corps"],
    isCompound: true,
    target: "4 x 15-20",
    rest: "60 s",
    cue: "Cuisses parallèles, genoux alignés sur les pieds.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },
  {
    id: "ex-leg-extension",
    name: "Leg extension",
    pattern: "legs-quad",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "60 s",
    cue: "Verrouille sans claquer, contraction en haut.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },

  // ─── Legs hinge ───
  {
    id: "ex-rdl",
    name: "Soulevé de terre roumain",
    pattern: "legs-hinge",
    equipment: ["salle-complete", "halteres-maison"],
    isCompound: true,
    target: "4 x 8-10",
    rest: "2 min",
    cue: "Hanches en arrière, dos neutre, étirement ischios.",
    muscleGroups: ["jambes", "dos"],
    classification: "force"
  },
  {
    id: "ex-hip-thrust",
    name: "Hip thrust",
    pattern: "legs-hinge",
    equipment: ["salle-complete", "halteres-maison"],
    isCompound: true,
    target: "4 x 10-12",
    rest: "90 s",
    cue: "Pause en haut, contraction fessiers.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },
  {
    id: "ex-leg-curl",
    name: "Leg curl",
    pattern: "legs-hinge",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "60 s",
    cue: "Contrôle la descente, garde les hanches calées.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },
  {
    id: "ex-glute-bridge",
    name: "Pont fessier",
    pattern: "legs-hinge",
    equipment: ["poids-corps", "halteres-maison"],
    isCompound: true,
    target: "3 x 15-20",
    rest: "60 s",
    cue: "Pause haute, contraction fessiers 2 secondes.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },

  // ─── Legs calf ───
  {
    id: "ex-calf-machine",
    name: "Mollets debout",
    pattern: "legs-calf",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "4 x 12-15",
    rest: "60 s",
    cue: "Étirement bas, pause haute.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },
  {
    id: "ex-calf-bw",
    name: "Mollets sur marche",
    pattern: "legs-calf",
    equipment: ["poids-corps", "halteres-maison"],
    isCompound: false,
    target: "4 x 15-20",
    rest: "45 s",
    cue: "Amplitude maximale.",
    muscleGroups: ["jambes"],
    classification: "hypertrophie"
  },

  // ─── Shoulders compound ───
  {
    id: "ex-overhead-press",
    name: "Développé militaire",
    pattern: "shoulders-compound",
    equipment: ["salle-complete", "halteres-maison"],
    isCompound: true,
    target: "4 x 6-8",
    rest: "2 min",
    cue: "Gainé, ne cambre pas, pousse vertical.",
    muscleGroups: ["epaules", "triceps"],
    classification: "force"
  },
  {
    id: "ex-machine-shoulder-press",
    name: "Développé épaules machine",
    pattern: "shoulders-compound",
    equipment: ["salle-complete"],
    isCompound: true,
    target: "4 x 8-10",
    rest: "90 s",
    cue: "Pousse complet, sans bloquer les coudes.",
    muscleGroups: ["epaules", "triceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-pike-pushup",
    name: "Pompes piquées",
    pattern: "shoulders-compound",
    equipment: ["poids-corps"],
    isCompound: true,
    target: "3-4 x AMRAP",
    rest: "75 s",
    cue: "Bassin haut, descente vers le sol.",
    muscleGroups: ["epaules", "triceps"],
    classification: "hypertrophie"
  },

  // ─── Shoulders lateral ───
  {
    id: "ex-lateral-raise",
    name: "Élévations latérales haltères",
    pattern: "shoulders-lateral",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "45 s",
    cue: "Coudes hauts, contrôle la descente.",
    muscleGroups: ["epaules"],
    classification: "hypertrophie"
  },
  {
    id: "ex-cable-lateral",
    name: "Élévation latérale poulie",
    pattern: "shoulders-lateral",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "45 s",
    cue: "Lent, pas d'élan.",
    muscleGroups: ["epaules"],
    classification: "hypertrophie"
  },

  // ─── Shoulders rear ───
  {
    id: "ex-face-pull",
    name: "Face pull",
    pattern: "shoulders-rear",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 15-20",
    rest: "45 s",
    cue: "Coudes hauts, omoplates vers l'arrière.",
    muscleGroups: ["epaules", "dos"],
    classification: "hypertrophie"
  },
  {
    id: "ex-reverse-fly",
    name: "Reverse pec deck",
    pattern: "shoulders-rear",
    equipment: ["salle-complete", "halteres-maison"],
    isCompound: false,
    target: "3 x 15-20",
    rest: "45 s",
    cue: "Contrôle l'ouverture, nuque longue.",
    muscleGroups: ["epaules", "dos"],
    classification: "hypertrophie"
  },

  // ─── Arms biceps ───
  {
    id: "ex-curl-dumbbell",
    name: "Curl haltères",
    pattern: "arms-biceps",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: false,
    target: "3 x 10-12",
    rest: "60 s",
    cue: "Coudes fixes, contraction complète.",
    muscleGroups: ["biceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-curl-cable",
    name: "Curl poulie",
    pattern: "arms-biceps",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "60 s",
    cue: "Tension constante, descente lente.",
    muscleGroups: ["biceps"],
    classification: "hypertrophie"
  },

  // ─── Arms triceps ───
  {
    id: "ex-rope-pushdown",
    name: "Triceps corde poulie",
    pattern: "arms-triceps",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "60 s",
    cue: "Coudes fixes, extension complète.",
    muscleGroups: ["triceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-overhead-extension",
    name: "Extension triceps haltère",
    pattern: "arms-triceps",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: false,
    target: "3 x 10-12",
    rest: "60 s",
    cue: "Coudes hauts, étirement profond.",
    muscleGroups: ["triceps"],
    classification: "hypertrophie"
  },
  {
    id: "ex-bench-dips",
    name: "Dips sur banc",
    pattern: "arms-triceps",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: false,
    target: "3 x 10-15",
    rest: "60 s",
    cue: "Coudes vers l'arrière, amplitude propre.",
    muscleGroups: ["triceps", "pectoraux"],
    classification: "hypertrophie"
  },

  // ─── Core ───
  {
    id: "ex-plank",
    name: "Gainage planche",
    pattern: "core",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: false,
    target: "3 x 30-45 sec",
    rest: "45 s",
    cue: "Bassin neutre, respiration maîtrisée.",
    muscleGroups: ["abdos"],
    classification: "hypertrophie"
  },
  {
    id: "ex-deadbug",
    name: "Dead bug",
    pattern: "core",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: false,
    target: "3 x 10 par côté",
    rest: "45 s",
    cue: "Bas du dos stable, mouvement lent.",
    muscleGroups: ["abdos"],
    classification: "hypertrophie"
  },
  {
    id: "ex-cable-crunch",
    name: "Crunch poulie",
    pattern: "core",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "3 x 12-15",
    rest: "45 s",
    cue: "Enroule, ne tire pas avec les bras.",
    muscleGroups: ["abdos"],
    classification: "hypertrophie"
  },

  // ─── Cardio steady ───
  {
    id: "ex-treadmill-z2",
    name: "Tapis incliné zone 2",
    pattern: "cardio-steady",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "25-35 min",
    rest: "Libre",
    cue: "Souffle présent mais conversation possible.",
    muscleGroups: ["cardio"],
    classification: "cardio"
  },
  {
    id: "ex-rower-z2",
    name: "Rameur zone 2",
    pattern: "cardio-steady",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "20-30 min",
    rest: "Libre",
    cue: "Cadence régulière, technique propre.",
    muscleGroups: ["cardio", "dos", "jambes"],
    classification: "cardio"
  },
  {
    id: "ex-walking",
    name: "Marche soutenue",
    pattern: "cardio-steady",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: false,
    target: "30-45 min",
    rest: "Libre",
    cue: "Rythme durable, posture droite.",
    muscleGroups: ["cardio"],
    classification: "cardio"
  },

  // ─── Cardio HIIT ───
  {
    id: "ex-bike-intervals",
    name: "Vélo intervalles",
    pattern: "cardio-hiit",
    equipment: ["salle-complete"],
    isCompound: false,
    target: "8 x 30s/30s",
    rest: "Inclus",
    cue: "Sprint puissant, repos actif.",
    muscleGroups: ["cardio", "jambes"],
    classification: "cardio"
  },
  {
    id: "ex-jumprope",
    name: "Corde à sauter intervalles",
    pattern: "cardio-hiit",
    equipment: ["poids-corps", "halteres-maison"],
    isCompound: false,
    target: "10 x 1 min",
    rest: "30 s entre",
    cue: "Saut léger, rythme régulier.",
    muscleGroups: ["cardio"],
    classification: "cardio"
  },

  // ─── Mobility ───
  {
    id: "ex-pec-stretch",
    name: "Étirement pectoraux mur",
    pattern: "mobility",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: false,
    target: "1 min par côté",
    rest: "Libre",
    cue: "Étirement doux, pas de fourmillement.",
    muscleGroups: ["pectoraux"],
    classification: "mobilite"
  },
  {
    id: "ex-hip-mobility",
    name: "Mobilité hanches",
    pattern: "mobility",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: false,
    target: "5-8 min flow",
    rest: "Libre",
    cue: "Mouvements fluides, respiration calme.",
    muscleGroups: ["jambes"],
    classification: "mobilite"
  },
  {
    id: "ex-thoracic-rotation",
    name: "Rotations thoraciques",
    pattern: "mobility",
    equipment: ["poids-corps", "halteres-maison", "salle-complete"],
    isCompound: false,
    target: "2 x 10 par côté",
    rest: "30 s",
    cue: "Hanches stables, ouverture douce.",
    muscleGroups: ["dos"],
    classification: "mobilite"
  },

  // ─── Fullbody compound ───
  {
    id: "ex-kettlebell-swing",
    name: "Kettlebell swing",
    pattern: "fullbody",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: true,
    target: "4 x 15-20",
    rest: "60 s",
    cue: "Hanche puissante, gainage actif.",
    muscleGroups: ["jambes", "dos", "abdos"],
    classification: "hypertrophie"
  },
  {
    id: "ex-thruster",
    name: "Thruster haltères",
    pattern: "fullbody",
    equipment: ["halteres-maison", "salle-complete"],
    isCompound: true,
    target: "3 x 10-12",
    rest: "90 s",
    cue: "Squat propre puis pousse au-dessus de la tête.",
    muscleGroups: ["jambes", "epaules"],
    classification: "hypertrophie"
  }
];

export function pickExerciseForPattern(
  pattern: MovementPattern,
  equipment: Equipment,
  excludeIds: Set<string>
): LibraryExercise | undefined {
  const candidates = EXERCISE_LIBRARY.filter(
    (ex) => ex.pattern === pattern && ex.equipment.includes(equipment) && !excludeIds.has(ex.id)
  );
  if (candidates.length === 0) {
    // Fallback to any equipment for this pattern
    return EXERCISE_LIBRARY.find((ex) => ex.pattern === pattern && !excludeIds.has(ex.id));
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}
