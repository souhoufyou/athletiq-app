/**
 * Lightweight complementary programs that the user can layer on top of the
 * main program. They are NOT instantiated into the weekly currentProgram —
 * they exist as standalone, optional add-ons displayed on the Programme and
 * Settings pages. The progression engine does not read them.
 */

import type { SessionExerciseCategory } from "@/components/session/SessionExerciseIcon";

export type ComplementaryProgram = {
  id: string;
  name: string;
  category: SessionExerciseCategory;
  shortDescription: string;
  weeklyTarget: string;
  defaultDurationMin: number;
};

export const COMPLEMENTARY_PROGRAMS: ComplementaryProgram[] = [
  {
    id: "marche-inclinee",
    name: "Marche inclinée / Tapis",
    category: "cardio",
    shortDescription: "Marche en pente sur tapis, 20–30 min, RPE modéré.",
    weeklyTarget: "2 à 4 séances",
    defaultDurationMin: 25
  },
  {
    id: "gainage",
    name: "Gainage",
    category: "core",
    shortDescription: "Planche, side-plank, dead-bug. Maintien sécurisé.",
    weeklyTarget: "2 à 3 séances",
    defaultDurationMin: 10
  },
  {
    id: "abdos-securise",
    name: "Abdos sécurisé",
    category: "core",
    shortDescription: "Crunch contrôlé, hollow body, sans à-coup lombaire.",
    weeklyTarget: "2 à 3 séances",
    defaultDurationMin: 12
  },
  {
    id: "mobilite",
    name: "Mobilité",
    category: "mobility",
    shortDescription: "Hanches, épaules, dos. Routine courte de récupération.",
    weeklyTarget: "Quotidien si possible",
    defaultDurationMin: 8
  },
  {
    id: "cardio-sante",
    name: "Cardio santé",
    category: "cardio",
    shortDescription: "Vélo, rameur, elliptique. Zone 2, souffle confortable.",
    weeklyTarget: "1 à 2 séances",
    defaultDurationMin: 30
  }
];

export function getComplementaryProgram(id: string): ComplementaryProgram | undefined {
  return COMPLEMENTARY_PROGRAMS.find((p) => p.id === id);
}

export function getActiveComplements(ids: string[] | undefined): ComplementaryProgram[] {
  if (!ids || ids.length === 0) return [];
  return ids
    .map((id) => getComplementaryProgram(id))
    .filter((p): p is ComplementaryProgram => p !== undefined);
}
