import type { EffortStatus, Equipment, Exercise } from "@/types/training";
import { EXERCISE_LIBRARY } from "@/lib/exerciseLibrary";
import { normalizeExerciseV2 } from "@/lib/programSchema";

type AlternativeTemplate = Omit<Exercise, "id" | "muscleGroups" | "classification">;

export type AlternativeContext = {
  avoid?: string[];
  comment?: string;
  equipment?: Equipment;
  status?: EffortStatus;
  watchPoints?: string[];
};

const ALTERNATIVES: Record<string, AlternativeTemplate[]> = {
  // ── Monday / Saturday – bench / chest press ──
  "bench-press-5x5": [
    { name: "Chest press machine", target: "5 × 5", plannedLoad: undefined, rest: "2min30-3min", cue: "Même intention que le couché, charge maîtrisée, poignet neutre." },
    { name: "Développé couché haltères", target: "5 × 5", rest: "2min30-3min", cue: "Prise neutre possible si poignet sensible, descente contrôlée." },
    { name: "Développé incliné machine", target: "5 × 6-8", rest: "2 min", cue: "Alternative plus douce pour les épaules, amplitude propre." }
  ],
  "speed-bench-or-chest-press": [
    { name: "Chest press machine (explosif)", target: "4 × 6-8", rest: "90 s", cue: "Même vitesse d'exécution, charge maîtrisée." },
    { name: "Développé couché haltères vitesse", target: "4 × 6-8", rest: "90 s", cue: "Prise neutre, explosif mais propre." }
  ],
  "light-moderate-chest-press": [
    { name: "Chest press à poids réduit", target: "3 × 10-12", rest: "75 s", cue: "Charge légère, RPE modéré pour garder la fraîcheur." },
    { name: "Développé incliné haltères léger", target: "3 × 10-12", rest: "75 s", cue: "Amplitude propre, poignet neutre." }
  ],

  // ── Rowing dos ──
  "heavy-chest-supported-row": [
    { name: "Rowing poulie basse (prise neutre)", target: "4 × 8-10", rest: "2 min", cue: "Tire les coudes vers les côtes, garde le dos droit." },
    { name: "Rowing haltère unilatéral", target: "4 × 8-10 par côté", rest: "2 min", cue: "Appui stable sur banc, tire le coude vers le plafond." },
    { name: "Rowing machine convergente", target: "4 × 8-10", rest: "2 min", cue: "Même schéma de tirage, coudes vers les côtes." }
  ],
  "seated-cable-row": [
    { name: "Rowing machine convergente", target: "4 × 10-12", rest: "90 s", cue: "Coudes vers les côtes, amplitude complète." },
    { name: "Rowing haltère unilatéral", target: "4 × 10-12 par côté", rest: "90 s", cue: "Appui stable, contraction forte en fin de tirage." }
  ],
  "chest-supported-row-volume": [
    { name: "Rowing haltère sur banc incliné", target: "3 × 10-12 par côté", rest: "90 s", cue: "Poitrine sur le banc, même intention que le rowing appuyé." },
    { name: "Rowing poulie basse prise neutre", target: "3 × 10-12", rest: "90 s", cue: "Dos droit, tire les coudes vers les hanches." }
  ],
  "light-moderate-machine-row": [
    { name: "Rowing poulie basse léger", target: "3 × 12", rest: "75 s", cue: "Grip détendu, tirage propre sans momentum." },
    { name: "Rowing haltère unilatéral modéré", target: "3 × 12 par côté", rest: "75 s", cue: "Pas de grip serré, poignet neutre." }
  ],

  // ── Tirage vertical / lat pulldown ──
  "neutral-lat-pulldown": [
    { name: "Tirage vertical prise large", target: "3 × 8-10", rest: "90 s", cue: "Barre classique, tire vers le menton, épaules basses." },
    { name: "Tirage horizontal poulie haute", target: "3 × 10-12", rest: "90 s", cue: "Face à la tour, tire vers le visage, coudes hauts." },
    { name: "Tirage unilatéral poulie", target: "3 × 8-10 par côté", rest: "90 s", cue: "Rotation légère, amplitude complète." }
  ],
  "lat-pulldown-volume": [
    { name: "Tractions assistées machine", target: "4 × 8-10", rest: "90 s", cue: "Machine d'assistance si disponible, amplitude complète." },
    { name: "Tirage horizontal poulie haute", target: "4 × 10-12", rest: "90 s", cue: "Face à la tour, tire vers le visage." }
  ],
  "lat-pulldown-or-assisted-pullup": [
    { name: "Tirage vertical prise large", target: "4 × 8-10", rest: "90 s", cue: "Amplitude complète, pas d'élan." },
    { name: "Tirage unilatéral poulie", target: "4 × 8-10 par côté", rest: "90 s", cue: "Rotation légère, contraction dorsaux." }
  ],

  // ── Incliné / pec accessories ──
  "incline-press-machine-db": [
    { name: "Chest press verticale (machine)", target: "3 × 8-10", rest: "90 s", cue: "Machine disponible, charge identique ou légèrement réduite." },
    { name: "Développé incliné haltères", target: "3 × 8-10", rest: "90 s", cue: "Prise neutre, poignet droit surveillé." }
  ],
  "incline-machine-or-chest-press": [
    { name: "Développé incliné haltères", target: "4 × 10-12", rest: "90 s", cue: "Contrôle la descente, prise neutre si poignet douloureux." },
    { name: "Chest press flat machine", target: "4 × 10-12", rest: "90 s", cue: "Même pattern, amplitude propre." }
  ],
  "pec-deck-or-cable-fly": [
    { name: "Écarté poulie croisée", target: "2 × 12-15", rest: "60 s", cue: "Convergence des mains en bas, étirement contrôlé." },
    { name: "Écarté haltères couché", target: "2 × 12-15", rest: "60 s", cue: "Charge légère, arc confortable, épaules basses." }
  ],
  "cable-fly-or-pec-deck-volume": [
    { name: "Pec deck machine", target: "3 × 12-15", rest: "60 s", cue: "Mouvement fluide, épaules basses." },
    { name: "Écarté haltères couché", target: "3 × 12-15", rest: "60 s", cue: "Charge légère, amplitude confortable." }
  ],

  // ── Épaules ──
  "machine-shoulder-press": [
    { name: "Développé épaules haltères assis", target: "4 × 8-10", rest: "90 s", cue: "Coudes légèrement devant, pas derrière l'oreille." },
    { name: "Développé épaules poulie basse (unilatéral)", target: "4 × 10 par côté", rest: "90 s", cue: "Tension constante, épaule stable." }
  ],
  "db-lateral-raises": [
    { name: "Élévations latérales câble (unilatéral)", target: "4 × 12-20 par côté", rest: "60 s", cue: "Tension constante, poignet détendu." },
    { name: "Élévations latérales avec bouteilles", target: "4 × 15-20", rest: "60 s", cue: "Léger et strict si aucun haltère disponible." }
  ],
  "rear-delt-machine": [
    { name: "Reverse pec deck", target: "3 × 15-20", rest: "60 s", cue: "Ouvre sans tirer avec les trapèzes, nuque longue." },
    { name: "Face pull à la poulie", target: "3 × 15-20", rest: "60 s", cue: "Coudes hauts, rotation externe." }
  ],
  "face-pull": [
    { name: "Reverse pec deck", target: "3 × 15-20", rest: "45-60 s", cue: "Ouvre sans tirer avec les trapèzes." },
    { name: "Élévations latérales face au mur (oiseau)", target: "3 × 15", rest: "45 s", cue: "Buste incliné, coudes semi-fléchis." }
  ],
  "light-face-pull": [
    { name: "Reverse pec deck léger", target: "2 × 20", rest: "45 s", cue: "Activation propre, nuque longue." },
    { name: "Face pull élastique", target: "2 × 20", rest: "45 s", cue: "Coudes hauts, ouverture complète." }
  ],

  // ── Jambes ──
  "leg-press-5x10": [
    { name: "Hack squat machine", target: "5 × 10", rest: "2 min", cue: "Même intention que la presse, genoux dans l'axe." },
    { name: "Goblet squat haltère", target: "4 × 12", rest: "90 s", cue: "Talon sous la hanche, descente propre." }
  ],
  "hack-press-goblet": [
    { name: "Presse à cuisses pieds centrés", target: "4 × 8-10", rest: "2 min", cue: "Amplitude solide, bas du dos collé au dossier." },
    { name: "Presse pieds hauts (accent fessiers)", target: "4 × 10", rest: "2 min", cue: "Pieds hauts sur la plateforme, activation fessiers renforcée." }
  ],
  "rdl-or-hip-thrust": [
    { name: "Hip thrust sur banc haltère", target: "4 × 8-10", rest: "2 min", cue: "Poussée des hanches, fessiers contractés en haut." },
    { name: "Bonne matin (good morning) machine", target: "4 × 10-12", rest: "90 s", cue: "Charge légère, dos plat tout au long." }
  ],
  "light-deadlift-technique-or-hip-thrust": [
    { name: "Hip thrust machine/banc (léger)", target: "3 × 8", rest: "2 min", cue: "Technique nette, pas de recherche de max." },
    { name: "Romanian deadlift haltères", target: "3 × 8", rest: "2 min", cue: "Dos plat, descente sur le tibia." }
  ],
  "leg-curl": [
    { name: "Leg curl debout unilatéral", target: "4 × 12-15 par côté", rest: "75 s", cue: "Contrôle la montée et la descente." },
    { name: "Hip thrust pied relevé (ischio)", target: "4 × 12", rest: "75 s", cue: "Pied sur banc, accent ischio." }
  ],
  "leg-curl-saturday": [
    { name: "Leg curl debout unilatéral", target: "3 × 12-15 par côté", rest: "75 s", cue: "Ischios sous tension, tempo contrôlé." },
    { name: "Nordic curl (assisté)", target: "3 × 6-8", rest: "75 s", cue: "Descente très contrôlée, genoux au sol." }
  ],
  "leg-extension": [
    { name: "Leg press amplitude réduite (accent quad)", target: "3 × 15", rest: "75 s", cue: "Extension finale verrouillée, pieds centrés." },
    { name: "Sissy squat assisté (colonne)", target: "3 × 12", rest: "75 s", cue: "Tiens une colonne, incline vers l'arrière lentement." }
  ],

  // ── Bras ──
  "preacher-or-incline-curl": [
    { name: "Curl poulie basse (unilatéral)", target: "3 × 10-12 par côté", rest: "60 s", cue: "Tension constante, poignet neutre." },
    { name: "Curl haltère concentré", target: "3 × 10-12 par côté", rest: "60 s", cue: "Coude fixe sur la cuisse, amplitude complète." }
  ],
  "cable-curl": [
    { name: "Curl haltères assis", target: "3 × 12-15", rest: "60 s", cue: "Poignet droit neutre, amplitude confortable." },
    { name: "Curl poulie basse barre EZ", target: "3 × 12-15", rest: "60 s", cue: "Prise en supination, coudes fixes." }
  ],
  "rope-triceps": [
    { name: "Triceps poulie barre droite", target: "3 × 12-15", rest: "60 s", cue: "Coudes fixes au corps, extension complète." },
    { name: "Triceps poulie unilatéral", target: "3 × 12-15 par côté", rest: "60 s", cue: "Même pattern, contrôle amplifié." }
  ],
  "cable-triceps": [
    { name: "Triceps corde poulie haute", target: "3 × 12-15", rest: "60 s", cue: "Coudes fixes, écartement en fin de mouvement." },
    { name: "French press haltère (unilatéral)", target: "3 × 12-15 par côté", rest: "60 s", cue: "Coude pointé vers le plafond, extension propre." }
  ],

  // ── Tirage arrière / épaule arrière ──
  "straight-arm-pulldown": [
    { name: "Pullover haltère allongé", target: "3 × 12-15", rest: "60 s", cue: "Coudes légèrement fléchis, sens les dorsaux." },
    { name: "Tirage poulie haute bras tendus", target: "3 × 12-15", rest: "60 s", cue: "Même pattern, maintiens les bras quasi-fixes." }
  ],
  "reverse-pec-deck": [
    { name: "Oiseau haltères penché (rear delt)", target: "3 × 15-20", rest: "60 s", cue: "Buste incliné, coudes semi-fléchis, nuque longue." },
    { name: "Face pull poulie haute", target: "3 × 15-20", rest: "60 s", cue: "Coudes hauts, rotation externe finalisée." }
  ],
  "farmer-walk-or-hang": [
    { name: "Dead hang à la barre fixe", target: "4 × 20-30 sec", rest: "75-90 s", cue: "Relâche les épaules, grip propre, stop si poignet droit tire." },
    { name: "Pinch grip haltères", target: "4 × 20-30 sec", rest: "75 s", cue: "Prise en pince, charge légère, stop si inconfort." }
  ],

  // ── Cardio ──
  "incline-treadmill-zone-2": [
    { name: "Vélo elliptique zone 2", target: "20 min", rest: "Libre", cue: "Souffle présent mais conversation possible." },
    { name: "Rameur zone 2", target: "20 min", rest: "Libre", cue: "Cadence basse, dos droit, souffle maîtrisé." }
  ],
  "incline-walk-zone-2": [
    { name: "Vélo elliptique zone 2", target: "35-45 min", rest: "Libre", cue: "Rythme durable, cadence régulière." },
    { name: "Rameur rythme modéré", target: "35-45 min", rest: "Libre", cue: "Pace constant, souffle régulier." }
  ],
  "controlled-interval-cardio": [
    { name: "Rameur intervalles", target: "6 rounds 30 sec fort / 90 sec facile", rest: "Inclus", cue: "Fort mais propre, récupère vraiment entre les rounds." },
    { name: "Vélo spinning intervalles", target: "6 rounds 30 sec fort / 90 sec facile", rest: "Inclus", cue: "Résistance haute fort, relâche pour récupérer." }
  ],

  // ── Gainage / abdos ──
  "plank": [
    { name: "Hollow body hold", target: "3 × 20-30 sec", rest: "45 s", cue: "Bas du dos plaqué au sol, respiration maîtrisée." },
    { name: "Bear crawl statique", target: "3 × 30 sec", rest: "45 s", cue: "Genoux à 5 cm du sol, bassin stable." }
  ],
  "dead-bug": [
    { name: "Crunch de bas avec jambe tendue", target: "3 × 10 par côté", rest: "45 s", cue: "Bas du dos stable, mouvement lent." },
    { name: "Bird dog", target: "3 × 10 par côté", rest: "45 s", cue: "4 appuis, extension simultanée bras/jambe opposés." }
  ],
  "pallof-press": [
    { name: "Rotation résistée élastique", target: "3 × 12 par côté", rest: "45 s", cue: "Résiste à la rotation, épaules basses." },
    { name: "Gainage avec extension bras (planche surélevée)", target: "3 × 10 par côté", rest: "45 s", cue: "Core serré, pas de rotation." }
  ],
  "side-plank": [
    { name: "Gainage latéral genoux au sol", target: "3 × 30 sec par côté", rest: "45 s", cue: "Version allégée, hanches hautes." },
    { name: "Clamshell élastique", target: "3 × 15 par côté", rest: "45 s", cue: "Hanches empilées, rotation de la hanche externe." }
  ]
};

export function getAlternatives(exerciseId: string, original: Exercise): Exercise[] {
  const templates = ALTERNATIVES[exerciseId] ?? [];
  return templates.map((t) =>
    normalizeExerciseV2({
      id: exerciseId,
      muscleGroups: original.muscleGroups,
      classification: original.classification,
      plannedLoad: original.plannedLoad,
      taxonomy: original.taxonomy,
      ...t
    })
  );
}

export function getContextualAlternatives(
  exerciseId: string,
  original: Exercise,
  context: AlternativeContext = {}
): Exercise[] {
  const specificAlternatives = getAlternatives(exerciseId, original);
  const signals = getContextSignals(context);
  const avoidTokens = (context.avoid ?? []).map(normalize).filter(Boolean);
  const hasContext = signals.size > 0 || avoidTokens.length > 0 || Boolean(context.comment?.trim()) || Boolean(context.equipment);

  if (!hasContext && specificAlternatives.length > 0) {
    return specificAlternatives;
  }

  const alternatives = dedupeAlternatives([
    ...specificAlternatives,
    ...getLibraryAlternatives(original, context)
  ]);

  if (alternatives.length < 2) {
    return alternatives;
  }

  if (!hasContext) {
    return alternatives;
  }

  return alternatives
    .map((exercise, index) => ({
      exercise,
      index,
      score: scoreAlternative(exercise, signals, avoidTokens, context.status)
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.exercise);
}

function getLibraryAlternatives(original: Exercise, context: AlternativeContext): Exercise[] {
  const normalizedOriginal = normalizeExerciseV2(original);
  const pattern = normalizedOriginal.taxonomy?.pattern;

  if (!pattern) {
    return [];
  }

  const availableEquipment = context.equipment;
  const candidates = EXERCISE_LIBRARY.filter((exercise) => {
    if (exercise.pattern !== pattern || exercise.id === original.id) {
      return false;
    }

    if (availableEquipment && !exercise.equipment.includes(availableEquipment)) {
      return false;
    }

    return true;
  });

  const fallbackCandidates = candidates.length > 0
    ? candidates
    : EXERCISE_LIBRARY.filter((exercise) => exercise.pattern === pattern && exercise.id !== original.id);

  return fallbackCandidates.slice(0, 5).map((exercise) =>
    normalizeExerciseV2({
      ...exercise,
      plannedLoad: original.plannedLoad,
      taxonomy: {
        equipment: exercise.equipment,
        isCompound: exercise.isCompound,
        jointStress: exercise.jointStress,
        pattern: exercise.pattern,
        tags: exercise.tags
      }
    })
  );
}

function dedupeAlternatives(alternatives: Exercise[]): Exercise[] {
  const seen = new Set<string>();
  const result: Exercise[] = [];

  for (const alternative of alternatives) {
    const key = normalize(alternative.name);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(alternative);
  }

  return result;
}

function getContextSignals(context: AlternativeContext): Set<string> {
  const source = normalize(
    [context.comment, ...(context.watchPoints ?? []), ...(context.avoid ?? [])]
      .filter(Boolean)
      .join(" ")
  );
  const signals = new Set<string>();

  if (includesAny(source, ["poignet", "wrist", "main", "grip"])) {
    signals.add("wrist");
  }

  if (includesAny(source, ["epaule", "shoulder"])) {
    signals.add("shoulder");
  }

  if (includesAny(source, ["dos", "lombaire", "back"])) {
    signals.add("back");
  }

  if (includesAny(source, ["genou", "knee"])) {
    signals.add("knee");
  }

  if (includesAny(source, ["souffle", "oppression", "vertige", "cardio"])) {
    signals.add("cardio");
  }

  return signals;
}

function scoreAlternative(
  exercise: Exercise,
  signals: Set<string>,
  avoidTokens: string[],
  status?: EffortStatus
): number {
  const text = normalize(`${exercise.name} ${exercise.target} ${exercise.cue}`);
  let score = 0;

  if (status === "pain") {
    score += includesAny(text, ["sans douleur", "controle", "controlee", "amplitude", "machine", "poulie"]) ? 4 : 0;
    score -= includesAny(text, ["fort", "explosif", "sprint", "intervalles"]) ? 5 : 0;
  }

  if (signals.has("wrist")) {
    score += includesAny(text, ["prise neutre", "corde", "poulie", "machine", "marteau"]) ? 8 : 0;
    score -= includesAny(text, ["barre droite", "supination", "dead hang", "pinch grip"]) ? 5 : 0;
  }

  if (signals.has("shoulder")) {
    score += includesAny(text, ["machine", "poulie", "prise neutre", "amplitude", "controle"]) ? 8 : 0;
    score -= includesAny(text, ["derriere", "oiseau halteres", "fort"]) ? 4 : 0;
  }

  if (signals.has("back")) {
    score += includesAny(text, ["appui", "banc", "machine", "hip thrust", "leg curl"]) ? 8 : 0;
    score -= includesAny(text, ["souleve", "deadlift", "rdl", "good morning", "dos plat"]) ? 6 : 0;
  }

  if (signals.has("knee")) {
    score += includesAny(text, ["hip thrust", "leg curl", "marche", "amplitude controlee", "pieds hauts"]) ? 8 : 0;
    score -= includesAny(text, ["squat", "fente", "sissy"]) ? 6 : 0;
  }

  if (signals.has("cardio")) {
    score += includesAny(text, ["zone 2", "facile", "marche", "elliptique", "rythme regulier"]) ? 8 : 0;
    score -= includesAny(text, ["intervalles", "sprint", "fort"]) ? 8 : 0;
  }

  for (const token of avoidTokens) {
    if (token && text.includes(token)) {
      score -= 10;
    }
  }

  return score;
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(normalize(needle)));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, " ")
    .trim();
}
