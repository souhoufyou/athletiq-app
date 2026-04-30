import type { CompletedSession, PlannedSession, UserSettings } from "@/types/training";

export type AdaptiveSnapshot = {
  constraintsLabel: string;
  externalSportsLabel: string;
  loadBasisLabel: string;
  notes: string[];
  recoveryLabel: string;
  scheduleLabel: string;
};

export function getAdaptiveSnapshot(
  settings: UserSettings,
  program: PlannedSession[],
  history: CompletedSession[]
): AdaptiveSnapshot {
  const externalSports = settings.externalSports.map((sport) => sport.name);
  const fallbackSport = settings.judoDays.length > 0 && externalSports.length === 0 ? ["Sport externe"] : [];
  const sportNames = externalSports.length > 0 ? externalSports : fallbackSport;
  const constraintsCount = settings.constraints.length + settings.avoid.length + settings.watchPoints.length;
  const notes = buildNotes(settings, program, history);

  return {
    constraintsLabel: constraintsCount > 0 ? `${constraintsCount} ${constraintsCount > 1 ? "signaux" : "signal"}` : "Aucun signal",
    externalSportsLabel: sportNames.length > 0 ? sportNames.join(" + ") : "Aucun",
    loadBasisLabel: getLoadBasisLabel(settings),
    notes,
    recoveryLabel: getRecoveryLabel(settings.recoveryProfile),
    scheduleLabel: `${program.length} seance${program.length > 1 ? "s" : ""} / ${settings.availableDays.length} jour${settings.availableDays.length > 1 ? "s" : ""}`
  };
}

function buildNotes(
  settings: UserSettings,
  program: PlannedSession[],
  history: CompletedSession[]
): string[] {
  const notes = new Set<string>();
  const latest = history[0];

  if (settings.recoveryProfile === "poor" || settings.recoveryProfile === "irregular") {
    notes.add("Recuperation surveillee: le moteur baisse le volume plus vite si fatigue ou douleur.");
  }

  if (settings.externalSports.length > 0 || settings.judoDays.length > 0) {
    notes.add("Sports externes pris en compte pour eviter les jours trop charges.");
  }

  if (settings.avoid.length > 0) {
    notes.add("Exercices a eviter exclus lors de la generation du programme.");
  }

  for (const session of program) {
    for (const note of session.notes ?? []) {
      if (/adaptation automatique|vigilance|recuperation|sport/i.test(note)) {
        notes.add(note);
      }
    }
  }

  if (latest?.progressions) {
    const watch = Object.values(latest.progressions).find((progression) =>
      progression.decision === "baisser" ||
      progression.decision === "remplacer" ||
      progression.decision === "alerte"
    );

    if (watch) {
      notes.add(`Dernier ajustement: ${watch.exerciseName} -> ${watch.decision}.`);
    }
  }

  return Array.from(notes).slice(0, 4);
}

function getLoadBasisLabel(settings: UserSettings): string {
  if (settings.strengthReferences.length > 0) {
    return `${settings.strengthReferences.length} repere${settings.strengthReferences.length > 1 ? "s" : ""} force`;
  }

  if (settings.benchOneRepMaxKg > 0) {
    return `Bench ${settings.benchOneRepMaxKg} ${settings.loadUnit}`;
  }

  return "Estimation profil";
}

function getRecoveryLabel(recoveryProfile: UserSettings["recoveryProfile"]): string {
  const labels: Record<UserSettings["recoveryProfile"], string> = {
    poor: "Fragile",
    irregular: "Irreguliere",
    regular: "Stable",
    good: "Bonne"
  };

  return labels[recoveryProfile];
}
