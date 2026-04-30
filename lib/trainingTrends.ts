import type {
  CompletedSession,
  ExerciseProgressionLog,
  PlannedSession,
  UserSettings
} from "@/types/training";

export type TrainingTrendKind =
  | "easy-run"
  | "goal-drift"
  | "hard-run"
  | "pain-repeat"
  | "recovery-limit"
  | "stagnation";

export type TrainingTrendSeverity = "critical" | "positive" | "watch";

export type TrainingTrendAction =
  | "adjust_goal"
  | "deload_next_week"
  | "increase_progression"
  | "keep_learning"
  | "protect_recovery"
  | "replace_exercise"
  | "vary_stimulus";

export type TrainingTrend = {
  action: TrainingTrendAction;
  detail: string;
  evidence: string[];
  kind: TrainingTrendKind;
  label: string;
  severity: TrainingTrendSeverity;
  title: string;
};

export type TrainingTrendReport = {
  confidence: "basse" | "moyenne" | "haute";
  items: TrainingTrend[];
  summary: string;
};

export function getTrainingTrendReport(
  history: CompletedSession[],
  program: PlannedSession[],
  settings: UserSettings
): TrainingTrendReport {
  const recent = history.slice(0, 6);

  if (recent.length < 2) {
    return {
      confidence: "basse",
      items: [],
      summary: "Le moteur attend encore plusieurs seances validees avant de conclure sur une vraie tendance."
    };
  }

  const items = [
    getRepeatedPainTrend(recent),
    getHardRunTrend(recent),
    getEasyRunTrend(recent, settings),
    getStagnationTrend(recent),
    getRecoveryTrend(recent, settings),
    getGoalDriftTrend(settings)
  ].filter((item): item is TrainingTrend => Boolean(item));

  const confidence = getConfidence(recent.length, items.length);

  return {
    confidence,
    items,
    summary: getSummary(items, recent.length, program.length)
  };
}

function getRepeatedPainTrend(history: CompletedSession[]): TrainingTrend | undefined {
  const painByKey = new Map<string, { count: number; exercise: string; notes: string[] }>();

  for (const session of history) {
    for (const log of Object.values(session.logs)) {
      const progression = session.progressions?.[log.exerciseId];
      const note = normalize(`${log.comment} ${progression?.warning ?? ""} ${progression?.reason ?? ""}`);
      const hasPain =
        log.status === "pain" ||
        progression?.decision === "alerte" ||
        progression?.decision === "remplacer" ||
        includesAny(note, ["douleur", "gene", "poignet", "epaule", "dos", "genou", "vertige", "oppression"]);

      if (!hasPain) {
        continue;
      }

      const key = inferPainKey(`${progression?.exerciseName ?? log.exerciseId} ${note}`);
      const current = painByKey.get(key) ?? {
        count: 0,
        exercise: progression?.exerciseName ?? log.exerciseId,
        notes: []
      };
      painByKey.set(key, {
        count: current.count + 1,
        exercise: current.exercise,
        notes: [...current.notes, log.comment || progression?.warning || progression?.reason || "douleur signalee"]
      });
    }
  }

  const repeated = [...painByKey.entries()]
    .map(([area, value]) => ({ area, ...value }))
    .filter((item) => item.count >= 2)
    .sort((a, b) => b.count - a.count)[0];

  if (!repeated) {
    return undefined;
  }

  return {
    action: "replace_exercise",
    detail: `Signal ${repeated.area} repete ${repeated.count} fois. Le prochain bloc doit privilegier une variante stable et sans douleur.`,
    evidence: repeated.notes.slice(0, 3),
    kind: "pain-repeat",
    label: "Douleur repetee",
    severity: "critical",
    title: `Changer ou proteger ${repeated.exercise}`
  };
}

function getHardRunTrend(history: CompletedSession[]): TrainingTrend | undefined {
  const hardSessions = history.filter(isHardSession);

  if (hardSessions.length < 2) {
    return undefined;
  }

  return {
    action: "deload_next_week",
    detail: "Plusieurs seances recentes sortent trop hautes en difficulte ou trop basses en energie. Le volume doit descendre avant de recharger.",
    evidence: hardSessions.slice(0, 3).map((session) =>
      `${session.title}: difficulte ${session.feedback.difficulty}/10, energie ${session.feedback.energy}/10`
    ),
    kind: "hard-run",
    label: "Charge trop haute",
    severity: "watch",
    title: "Prevoir une semaine plus legere"
  };
}

function getEasyRunTrend(history: CompletedSession[], settings: UserSettings): TrainingTrend | undefined {
  const easySessions = history.filter(isEasySession);
  const hasRecentPain = history.some((session) =>
    session.feedback.globalPain >= 4 ||
    Object.values(session.logs).some((log) => log.status === "pain")
  );

  if (easySessions.length < 2 || hasRecentPain || settings.cautionLevel === "prudent") {
    return undefined;
  }

  return {
    action: "increase_progression",
    detail: "Les retours sont faciles plusieurs fois de suite. Le moteur peut accepter une progression prudente de charge, reps ou densite.",
    evidence: easySessions.slice(0, 3).map((session) =>
      `${session.title}: difficulte ${session.feedback.difficulty}/10, energie ${session.feedback.energy}/10`
    ),
    kind: "easy-run",
    label: "Marge disponible",
    severity: "positive",
    title: "Progression possible"
  };
}

function getStagnationTrend(history: CompletedSession[]): TrainingTrend | undefined {
  const counts = new Map<string, { count: number; progression: ExerciseProgressionLog }>();

  for (const progression of history.flatMap((session) => Object.values(session.progressions ?? {}))) {
    if (progression.decision !== "maintenir") {
      continue;
    }

    const current = counts.get(progression.exerciseId) ?? { count: 0, progression };
    counts.set(progression.exerciseId, { count: current.count + 1, progression: current.progression });
  }

  const stagnant = [...counts.values()]
    .filter((item) => item.count >= 3)
    .sort((a, b) => b.count - a.count)[0];

  if (!stagnant) {
    return undefined;
  }

  return {
    action: "vary_stimulus",
    detail: `${stagnant.progression.exerciseName} reste en maintien depuis ${stagnant.count} passages. Il faut chercher un levier: reps, tempo, amplitude, repos ou variante.`,
    evidence: [stagnant.progression.reason],
    kind: "stagnation",
    label: "Stagnation",
    severity: "watch",
    title: "Changer le stimulus"
  };
}

function getRecoveryTrend(history: CompletedSession[], settings: UserSettings): TrainingTrend | undefined {
  const stressfulSessions = history.filter((session) => isHardSession(session) || isPainSession(session));

  if ((settings.recoveryProfile !== "poor" && settings.recoveryProfile !== "irregular") || stressfulSessions.length < 2) {
    return undefined;
  }

  return {
    action: "protect_recovery",
    detail: "La recuperation limite l'adaptation. Le moteur doit eviter les hausses automatiques tant que fatigue, douleur ou sommeil restent instables.",
    evidence: stressfulSessions.slice(0, 3).map((session) =>
      `${session.title}: difficulte ${session.feedback.difficulty}/10, douleur ${session.feedback.globalPain}/10`
    ),
    kind: "recovery-limit",
    label: "Recuperation",
    severity: "watch",
    title: "Proteger la recuperation"
  };
}

function getGoalDriftTrend(settings: UserSettings): TrainingTrend | undefined {
  const weightLog = settings.weightLog ?? [];

  if (weightLog.length < 4 || !settings.primaryGoal) {
    return undefined;
  }

  const newest = weightLog[0].kg;
  const oldest = weightLog[weightLog.length - 1].kg;
  const delta = newest - oldest;

  if (settings.primaryGoal === "perte-gras" && delta >= -0.2) {
    return {
      action: "adjust_goal",
      detail: `Objectif perte de gras, mais le poids est stable ou en hausse sur ${weightLog.length} mesures. Il faut verifier calories, cardio ou frequence.`,
      evidence: [`${oldest} kg -> ${newest} kg`],
      kind: "goal-drift",
      label: "Objectif",
      severity: "watch",
      title: "Objectif poids pas encore aligne"
    };
  }

  if (settings.primaryGoal === "prise-masse" && delta <= 0.2) {
    return {
      action: "adjust_goal",
      detail: `Objectif prise de masse, mais le poids ne monte pas vraiment sur ${weightLog.length} mesures. Il faut verifier apport, volume ou recuperation.`,
      evidence: [`${oldest} kg -> ${newest} kg`],
      kind: "goal-drift",
      label: "Objectif",
      severity: "watch",
      title: "Prise de masse trop plate"
    };
  }

  return undefined;
}

function isPainSession(session: CompletedSession): boolean {
  return session.feedback.globalPain >= 4 ||
    session.feedback.breath === "oppression" ||
    session.feedback.breath === "vertige" ||
    Object.values(session.logs).some((log) => log.status === "pain");
}

function isHardSession(session: CompletedSession): boolean {
  const hardLogs = Object.values(session.logs).filter((log) => log.status === "hard").length;

  return hardLogs >= 2 || session.feedback.difficulty >= 8 || session.feedback.energy <= 3;
}

function isEasySession(session: CompletedSession): boolean {
  const doneLogs = Object.values(session.logs).filter((log) => log.status && log.status !== "skipped");
  const easyLogs = doneLogs.filter((log) => log.status === "easy");

  return doneLogs.length > 0 &&
    easyLogs.length >= Math.ceil(doneLogs.length * 0.6) &&
    session.feedback.difficulty <= 4 &&
    session.feedback.globalPain <= 1 &&
    session.feedback.energy >= 7;
}

function inferPainKey(value: string): string {
  const text = normalize(value);

  if (includesAny(text, ["poignet", "wrist", "main", "grip"])) return "poignet/grip";
  if (includesAny(text, ["epaule", "shoulder"])) return "epaule";
  if (includesAny(text, ["dos", "lombaire", "back"])) return "dos";
  if (includesAny(text, ["genou", "knee"])) return "genou";
  if (includesAny(text, ["souffle", "vertige", "oppression"])) return "souffle";
  return "douleur";
}

function getConfidence(historyCount: number, itemCount: number): TrainingTrendReport["confidence"] {
  if (historyCount >= 5 && itemCount >= 2) return "haute";
  if (historyCount >= 3 || itemCount > 0) return "moyenne";
  return "basse";
}

function getSummary(items: TrainingTrend[], historyCount: number, programSize: number): string {
  if (items.length === 0) {
    return `Aucune tendance forte sur les ${historyCount} dernieres seances. Le programme actuel (${programSize} seances) peut continuer.`;
  }

  if (items.some((item) => item.severity === "critical")) {
    return "Tendance prioritaire: securite et remplacement avant progression.";
  }

  if (items.some((item) => item.kind === "hard-run" || item.kind === "recovery-limit")) {
    return "Tendance prioritaire: recuperer et reduire la charge avant de pousser.";
  }

  if (items.some((item) => item.kind === "easy-run")) {
    return "Tendance prioritaire: progression prudente possible.";
  }

  return "Le moteur a detecte des ajustements utiles sans urgence.";
}

function includesAny(value: string, needles: string[]): boolean {
  return needles.some((needle) => value.includes(normalize(needle)));
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
