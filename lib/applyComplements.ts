import type { Exercise, PlannedSession, PrimaryGoal } from "@/types/training";
import { getSessionCategory } from "@/lib/sessionMeta";

type ComplementBlock = {
  appliesTo: (session: PlannedSession) => boolean;
  build: (session: PlannedSession) => Exercise;
};

function isLowerBodySession(session: PlannedSession): boolean {
  const cat = getSessionCategory(session);
  if (cat === "legs" || cat === "lower") return true;
  return /legs|jambes|lower|bas du corps|cuisses|fessiers/i.test(
    `${session.title} ${session.focus}`
  );
}

const blocks: Record<string, ComplementBlock> = {
  "abdos-securise": {
    appliesTo: isLowerBodySession,
    build: (session) => ({
      id: `complement-abdos-securise-${session.id}`,
      name: "+ Abdos sécurisé",
      target: "3 × 12-15 reps",
      plannedLoad: "Poids du corps",
      rest: "45 s",
      cue: "Crunch contrôlé + hollow body. Sans à-coup lombaire.",
      muscleGroups: ["abdos"],
      classification: "hypertrophie"
    })
  },
  gainage: {
    appliesTo: isLowerBodySession,
    build: (session) => ({
      id: `complement-gainage-${session.id}`,
      name: "+ Gainage",
      target: "3 × 30-45 s",
      plannedLoad: "Poids du corps",
      rest: "45 s",
      cue: "Planche + side plank. Bassin neutre, gainer abdos et fessiers.",
      muscleGroups: ["abdos"],
      classification: "hypertrophie"
    })
  },
  mobilite: {
    appliesTo: () => true,
    build: (session) => ({
      id: `complement-mobilite-${session.id}`,
      name: "+ Mobilité 3 min",
      target: "3 min",
      rest: "—",
      cue: "Hanches + épaules + dos. Mobilité douce en fin de séance.",
      muscleGroups: ["autre"],
      classification: "mobilite"
    })
  },
  "cardio-sante": {
    appliesTo: () => true,
    build: (session) => ({
      id: `complement-cardio-sante-${session.id}`,
      name: "+ Cardio santé",
      target: "15-20 min",
      rest: "—",
      cue: "Vélo, rameur ou elliptique en zone 2. Souffle confortable.",
      muscleGroups: ["cardio"],
      classification: "cardio"
    })
  },
  "marche-inclinee": {
    appliesTo: () => true,
    build: (session) => ({
      id: `complement-marche-inclinee-${session.id}`,
      name: "+ Marche inclinée",
      target: "20-25 min",
      rest: "—",
      cue: "Tapis incliné, pas de course. RPE modéré, respiration nasale si possible.",
      muscleGroups: ["cardio"],
      classification: "cardio"
    })
  }
};

/**
 * Apply the activated complements to a program by injecting extra exercises
 * at the END of each matching session.
 *
 *  - "abdos-securise" / "gainage"  → injected only on lower-body sessions
 *  - "mobilite"                    → injected on every session
 *  - "cardio-sante" / "marche-inclinee" → injected on every session
 *
 * The original `program` is never mutated. Exercise IDs are deterministic
 * (based on session id + complement id) so the progression engine can keep
 * a stable history per complement-exercise across sessions.
 */
export function applyComplementsToProgram(
  program: PlannedSession[],
  complementIds: string[] | undefined,
  // primaryGoal kept for future heuristics (e.g. force marche-inclinee on perte-gras only)
  _primaryGoal?: PrimaryGoal
): PlannedSession[] {
  if (!complementIds || complementIds.length === 0) return program;

  const activeBlocks = complementIds
    .map((id) => blocks[id])
    .filter((block): block is ComplementBlock => Boolean(block));

  if (activeBlocks.length === 0) return program;

  return program.map((session) => {
    const additions: Exercise[] = [];
    for (const block of activeBlocks) {
      if (block.appliesTo(session)) {
        additions.push(block.build(session));
      }
    }
    if (additions.length === 0) return session;
    return { ...session, exercises: [...session.exercises, ...additions] };
  });
}
