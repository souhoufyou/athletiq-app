import { EXERCISE_LIBRARY } from "@/lib/exerciseLibrary";
import type {
  BodyArea,
  ConstraintSeverity,
  Equipment,
  Exercise,
  ExercisePrescription,
  ExerciseTaxonomy,
  LoadPrescription,
  MovementPattern,
  PlannedSession,
  TrainingPhase
} from "@/types/training";

export function normalizeProgramV2(program: PlannedSession[]): PlannedSession[] {
  return program.map((session) => ({
    ...session,
    deloadEvery: session.deloadEvery ?? 5,
    mesocycleLength: session.mesocycleLength ?? 6,
    phase: session.phase ?? inferSessionPhase(session),
    weekIndex: session.weekIndex ?? 1,
    exercises: session.exercises.map(normalizeExerciseV2)
  }));
}

export function normalizeExerciseV2(exercise: Exercise): Exercise {
  return {
    ...exercise,
    prescription: exercise.prescription ?? derivePrescription(exercise),
    taxonomy: {
      ...inferExerciseTaxonomy(exercise),
      ...exercise.taxonomy,
      jointStress: {
        ...inferExerciseTaxonomy(exercise).jointStress,
        ...exercise.taxonomy?.jointStress
      }
    }
  };
}

export function derivePrescription(exercise: Exercise): ExercisePrescription {
  const target = parseTarget(exercise.target);
  const rest = parseRest(exercise.rest);
  const load = parseLoad(exercise.plannedLoad);

  return {
    ...target,
    ...rest,
    load
  };
}

export function inferExerciseTaxonomy(exercise: Exercise): ExerciseTaxonomy {
  const fromLibrary = EXERCISE_LIBRARY.find((item) => item.id === exercise.id);

  if (fromLibrary) {
    return {
      equipment: fromLibrary.equipment,
      isCompound: fromLibrary.isCompound,
      jointStress: fromLibrary.jointStress,
      pattern: fromLibrary.pattern,
      tags: fromLibrary.tags
    };
  }

  const text = normalize(`${exercise.id} ${exercise.name} ${exercise.cue} ${exercise.target}`);
  const pattern = inferMovementPattern(text);
  const equipment = inferEquipment(text);

  return {
    equipment,
    isCompound: inferCompound(pattern),
    jointStress: inferJointStress(text, pattern),
    pattern,
    tags: buildTags(text)
  };
}

export function formatPrescriptionTarget(prescription: ExercisePrescription, fallback: string): string {
  if (prescription.work === "amrap" && prescription.sets) {
    return `${formatSetRange(prescription)} x AMRAP`;
  }

  if (prescription.work === "duration") {
    const duration = formatDurationRange(prescription);
    return prescription.sets ? `${formatSetRange(prescription)} x ${duration}` : duration;
  }

  if (prescription.work === "rounds" && prescription.sets) {
    return `${prescription.sets} rounds`;
  }

  if (prescription.sets && prescription.repsMin) {
    const reps = prescription.repsMax && prescription.repsMax !== prescription.repsMin
      ? `${prescription.repsMin}-${prescription.repsMax}`
      : String(prescription.repsMin);
    return `${formatSetRange(prescription)} x ${reps}`;
  }

  return fallback;
}

export function formatPrescriptionLoad(load: LoadPrescription | undefined, fallback?: string): string | undefined {
  if (!load) {
    return fallback;
  }

  if (load.kind === "bodyweight") {
    return load.display ?? "Poids du corps";
  }

  if (load.kind === "free") {
    return load.display ?? fallback;
  }

  if (load.kind === "percent-1rm" && load.percent1Rm) {
    return load.display ?? `${load.percent1Rm}% 1RM`;
  }

  if (load.kg !== undefined) {
    return `${formatNumber(load.kg)} ${load.unit ?? "kg"}`;
  }

  return load.display ?? fallback;
}

export function getExerciseTargetNumbers(exercise: Exercise) {
  const prescription = exercise.prescription ?? derivePrescription(exercise);

  return {
    maxReps: prescription.repsMax,
    minReps: prescription.repsMin,
    minutes: prescription.durationMinMax ?? prescription.durationMin,
    sets: prescription.sets
  };
}

export function getExerciseLoadKg(exercise: Exercise, actualLoad?: string): number | undefined {
  const actual = parseLoad(actualLoad);
  if (actual?.kg !== undefined) {
    return actual.kg;
  }

  const prescription = exercise.prescription ?? derivePrescription(exercise);
  return prescription.load?.kg;
}

export function getExerciseLoadDisplay(exercise: Exercise, actualLoad?: string): string | undefined {
  const actual = parseLoad(actualLoad);
  if (actual && (actual.kg !== undefined || actual.display)) {
    return formatPrescriptionLoad(actual, actualLoad);
  }

  return formatPrescriptionLoad(exercise.prescription?.load, exercise.plannedLoad);
}

function parseTarget(value: string): ExercisePrescription {
  const normalized = normalize(value);
  const setMatch = normalized.match(/^(\d+)(?:\s*-\s*(\d+))?\s*x\s*(.+)$/);

  if (setMatch) {
    const setValues = {
      sets: Number(setMatch[1]),
      setsMax: setMatch[2] ? Number(setMatch[2]) : undefined
    };
    const work = setMatch[3].trim();

    if (work.includes("amrap")) {
      return { ...setValues, work: "amrap" };
    }

    const duration = parseDuration(work);
    if (duration.durationSec || duration.durationMin) {
      return { ...setValues, ...duration, work: "duration" };
    }

    const reps = parseRepRange(work);
    if (reps.repsMin) {
      return { ...setValues, ...reps, work: "reps" };
    }

    return { ...setValues, work: "rounds" };
  }

  const roundsMatch = normalized.match(/(\d+)\s*rounds?/);
  if (roundsMatch) {
    const duration = parseDuration(normalized);
    return { sets: Number(roundsMatch[1]), ...duration, work: "rounds" };
  }

  const duration = parseDuration(normalized);
  if (duration.durationSec || duration.durationMin) {
    return { ...duration, work: "duration" };
  }

  const reps = parseRepRange(normalized);
  return reps.repsMin ? { ...reps, work: "reps" } : {};
}

function parseRepRange(value: string): Pick<ExercisePrescription, "repsMax" | "repsMin"> {
  const match = value.match(/(\d+)(?:\s*[-a]\s*(\d+))?/);

  if (!match) {
    return {};
  }

  return {
    repsMin: Number(match[1]),
    repsMax: Number(match[2] ?? match[1])
  };
}

function parseDuration(value: string): Pick<ExercisePrescription, "durationMin" | "durationMinMax" | "durationSec" | "durationSecMax"> {
  const secMatch = value.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:s|sec|secondes?)/);
  if (secMatch) {
    return {
      durationSec: Number(secMatch[1]),
      durationSecMax: secMatch[2] ? Number(secMatch[2]) : undefined
    };
  }

  const minMatch = value.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/);
  if (minMatch) {
    return {
      durationMin: Number(minMatch[1]),
      durationMinMax: minMatch[2] ? Number(minMatch[2]) : undefined
    };
  }

  return {};
}

function parseRest(value: string): Pick<ExercisePrescription, "restSec" | "restSecMax"> {
  const normalized = normalize(value);
  if (!normalized || normalized.includes("libre") || normalized.includes("inclus")) {
    return {};
  }

  const minRange = normalized.match(/(\d+)\s*min\s*(\d+)?(?:\s*-\s*(\d+)\s*min)?/);
  if (minRange) {
    const first = Number(minRange[1]) * 60 + Number(minRange[2] ?? 0);
    const second = minRange[3] ? Number(minRange[3]) * 60 : undefined;
    return { restSec: first, restSecMax: second };
  }

  const secRange = normalized.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:s|sec)/);
  if (secRange) {
    return {
      restSec: Number(secRange[1]),
      restSecMax: secRange[2] ? Number(secRange[2]) : undefined
    };
  }

  return {};
}

function parseLoad(value?: string): LoadPrescription | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = normalize(value);
  if (includesAny(normalized, ["poids du corps", "bodyweight"])) {
    return { display: value, kind: "bodyweight", source: "parsed" };
  }

  const kgMatch = normalized.match(/(\d+(?:[,.]\d+)?)\s*kg/);
  if (kgMatch) {
    return {
      display: value,
      kg: Number(kgMatch[1].replace(",", ".")),
      kind: "fixed",
      source: "parsed",
      unit: "kg"
    };
  }

  const percentMatch = normalized.match(/(\d+(?:[,.]\d+)?)\s*%/);
  if (percentMatch) {
    return {
      display: value,
      kind: "percent-1rm",
      percent1Rm: Number(percentMatch[1].replace(",", ".")),
      source: "parsed"
    };
  }

  return { display: value, kind: "free", source: "parsed" };
}

function inferSessionPhase(session: PlannedSession): TrainingPhase {
  if (/cardio|conditionnement|conditioning/i.test(`${session.title} ${session.focus}`)) {
    return "conditioning";
  }

  if (session.intensity === "Légère") {
    return "maintenance";
  }

  if (session.intensity === "Soutenue") {
    return "intensification";
  }

  return "accumulation";
}

function inferMovementPattern(text: string): MovementPattern | undefined {
  if (includesAny(text, ["intervalles", "hiit", "sprint", "30s/30s"])) return "cardio-hiit";
  if (includesAny(text, ["cardio", "tapis", "marche", "rameur", "zone 2", "stairmaster"])) return "cardio-steady";
  if (includesAny(text, ["mobilite", "etirement", "stretch", "respiration"])) return "mobility";
  if (includesAny(text, ["gainage", "plank", "dead bug", "pallof", "abdos", "core"])) return "core";
  if (includesAny(text, ["triceps"])) return "arms-triceps";
  if (includesAny(text, ["curl", "biceps"])) return "arms-biceps";
  if (includesAny(text, ["face pull", "reverse", "arriere", "rear delt"])) return "shoulders-rear";
  if (includesAny(text, ["elevation laterale", "laterales"])) return "shoulders-lateral";
  if (includesAny(text, ["developpe epaules", "shoulder press", "militaire"])) return "shoulders-compound";
  if (includesAny(text, ["mollet", "calf"])) return "legs-calf";
  if (includesAny(text, ["souleve", "rdl", "roumain", "hip thrust", "leg curl", "ischio"])) return "legs-hinge";
  if (includesAny(text, ["presse", "squat", "leg extension", "quad"])) return "legs-quad";
  if (includesAny(text, ["tirage vertical", "traction", "lat pulldown"])) return "back-vertical";
  if (includesAny(text, ["rowing", "pullover", "tirage horizontal"])) return "back-horizontal";
  if (includesAny(text, ["pec deck", "ecarte", "fly"])) return "chest-isolation";
  if (includesAny(text, ["developpe couche", "bench", "chest press", "pompes"])) return "chest-compound";
  if (includesAny(text, ["full body", "thruster", "kettlebell"])) return "fullbody";
  return undefined;
}

function inferEquipment(text: string): Equipment[] {
  const equipment = new Set<Equipment>();

  if (includesAny(text, ["halter", "dumbbell", "kettlebell"])) equipment.add("halteres-maison");
  if (includesAny(text, ["poids du corps", "pompes", "gainage", "marche", "mobilite", "etirement"])) equipment.add("poids-corps");
  if (includesAny(text, ["machine", "poulie", "barre", "tapis", "rameur", "stairmaster", "presse", "pec deck"])) equipment.add("salle-complete");

  if (equipment.size === 0) {
    equipment.add("salle-complete");
  }

  return Array.from(equipment);
}

function inferJointStress(
  text: string,
  pattern?: MovementPattern
): Partial<Record<BodyArea, ConstraintSeverity>> {
  const stress: Partial<Record<BodyArea, ConstraintSeverity>> = {};
  const set = (area: BodyArea, severity: ConstraintSeverity) => {
    stress[area] = severityRank(severity) > severityRank(stress[area]) ? severity : stress[area];
  };

  if (includesAny(text, ["poignet", "grip", "curl", "barre", "bench"])) set("wrist", "caution");
  if (includesAny(text, ["epaule", "shoulder", "developpe", "overhead", "dips"])) set("shoulder", "caution");
  if (includesAny(text, ["dos", "lombaire", "souleve", "rdl", "rowing"])) set("back", "caution");
  if (includesAny(text, ["genou", "squat", "presse", "leg extension", "fente"])) set("knee", "caution");
  if (pattern === "cardio-hiit") set("cardio", "caution");

  return stress;
}

function severityRank(severity?: ConstraintSeverity): number {
  if (severity === "avoid") return 3;
  if (severity === "caution") return 2;
  if (severity === "info") return 1;
  return 0;
}

function inferCompound(pattern?: MovementPattern): boolean | undefined {
  return pattern
    ? [
        "back-horizontal",
        "back-vertical",
        "chest-compound",
        "fullbody",
        "legs-hinge",
        "legs-quad",
        "shoulders-compound"
      ].includes(pattern)
    : undefined;
}

function buildTags(text: string): string[] {
  return [
    includesAny(text, ["machine", "poulie"]) ? "stable" : "",
    includesAny(text, ["unilateral", "un bras", "par cote"]) ? "unilateral" : "",
    includesAny(text, ["technique", "controle", "strict"]) ? "controle" : ""
  ].filter(Boolean);
}

function formatSetRange(prescription: ExercisePrescription): string {
  return prescription.setsMax && prescription.setsMax !== prescription.sets
    ? `${prescription.sets}-${prescription.setsMax}`
    : String(prescription.sets);
}

function formatDurationRange(prescription: ExercisePrescription): string {
  if (prescription.durationMin) {
    return prescription.durationMinMax
      ? `${prescription.durationMin}-${prescription.durationMinMax} min`
      : `${prescription.durationMin} min`;
  }

  if (prescription.durationSec) {
    return prescription.durationSecMax
      ? `${prescription.durationSec}-${prescription.durationSecMax} sec`
      : `${prescription.durationSec} sec`;
  }

  return "duree libre";
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(normalize(needle)));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/×/g, "x")
    .replace(/'/g, " ")
    .trim();
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}
