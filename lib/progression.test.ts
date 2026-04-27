import { describe, expect, it } from "vitest";
import {
  calculateProgression,
  validateAIRecommendation,
  type ProgressionInput
} from "@/lib/progression";
import type { Exercise, PlannedSession } from "@/types/training";

function exercise(overrides: Partial<Exercise>): Exercise {
  return {
    id: "exercise",
    name: "Exercise",
    target: "3 x 10",
    plannedLoad: "50 kg",
    rest: "90 s",
    cue: "Controle.",
    ...overrides
  };
}

function session(overrides: Partial<PlannedSession> = {}): PlannedSession {
  return {
    id: "session",
    weekday: "tuesday",
    title: "Session",
    focus: "Test",
    duration: "60 min",
    intensity: "Moderee",
    exercises: [],
    ...overrides
  };
}

function input(overrides: Partial<ProgressionInput>): ProgressionInput {
  return {
    plannedExercise: exercise({}),
    performance: {
      usedLoad: "50 kg",
      completedReps: "3 x 10",
      comment: ""
    },
    feedback: "ok",
    sessionDifficulty: 5,
    globalPain: 0,
    energy: 7,
    breath: "correct",
    progressionStyle: "dynamic",
    programGoal: "recomposition",
    ...overrides
  };
}

const bench = exercise({
  id: "bench-press-5x5",
  name: "Developpe couche",
  target: "5 x 5",
  plannedLoad: "90 kg",
  rest: "3 min",
  cue: "Poignets neutres, trajectoire stable."
});

describe("calculateProgression", () => {
  it("augmente le developpe couche 90 kg 5x5 valide OK vers 92,5 kg", () => {
    const result = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "" },
        feedback: "ok"
      })
    );

    expect(result.nextLoad).toBe("92,5 kg");
    expect(result.decision).toBe("augmenter");
    expect(result.decisionCode).toBe("increase");
    expect(result.evidenceTag).toBe("progression_rule");
    expect(result.confidence).toBe("high");
    expect(result.nextSets).toBe("5");
    expect(result.nextReps).toBe("5");
    expect(result.adaptationExplanation?.decisionLabel).toBe("Charge augmentee");
    expect(result.adaptationExplanation?.ruleApplied).toMatch(/Surcharge progressive/);
    expect(result.adaptationExplanation?.nextSessionImpact).toMatch(/Developpe couche/);
    expect(result.reason.length).toBeGreaterThan(10);
  });

  it("garde +2,5 kg sur developpe couche facile, et reserve +5 kg aux conditions tres favorables", () => {
    const easy = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "facile" },
        feedback: "easy"
      })
    );

    const veryEasyControlled = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "tres facile, large" },
        feedback: "easy",
        progressionStyle: "controlled_aggressive",
        globalPain: 0,
        energy: 9,
        sleepHours: 8
      })
    );

    const veryEasyWithPain = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "tres facile mais gene poignet" },
        feedback: "easy",
        progressionStyle: "controlled_aggressive",
        globalPain: 1,
        energy: 9,
        sleepHours: 8
      })
    );

    expect(easy.nextLoad).toBe("92,5 kg");
    expect(easy.adaptationExplanation?.ruleApplied).toMatch(/Surcharge progressive/);
    expect(easy.confidence).toBe("high");
    expect(veryEasyControlled.nextLoad).toBe("95 kg");
    expect(veryEasyControlled.warning).toMatch(/Garde-fou progression/i);
    expect(veryEasyWithPain.nextLoad).not.toBe("95 kg");
  });

  it("bloque l'augmentation du developpe couche si douleur poignet", () => {
    const result = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "douleur poignet droit" },
        feedback: "easy"
      })
    );

    expect(result.nextLoad).not.toBe("92,5 kg");
    expect(["alerte", "maintenir", "remplacer"]).toContain(result.decision);
    expect(`${result.reason} ${result.warning}`).toMatch(/douleur|poignet/i);
    expect(result.adaptationExplanation?.ruleApplied).toBe("Douleur prioritaire");
  });

  it("maintient le leg extension 12/12/11 sur objectif 12-15 avec explication double progression", () => {
    const result = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "leg-extension",
          name: "Leg extension",
          target: "3 x 12-15",
          plannedLoad: "45 kg"
        }),
        performance: { usedLoad: "45 kg", completedReps: "12/12/11", comment: "" },
        feedback: "ok"
      })
    );

    expect(result.nextLoad).toBe("45 kg");
    expect(result.decision).toBe("maintenir");
    expect(result.reason).toMatch(/double progression|fourchette/i);
    expect(result.adaptationExplanation?.ruleApplied).toBe("Double progression");
  });

  it("augmente legerement le leg extension facile quand 15/15/15 est atteint", () => {
    const result = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "leg-extension",
          name: "Leg extension",
          target: "3 x 12-15",
          plannedLoad: "45 kg"
        }),
        performance: { usedLoad: "45 kg", completedReps: "15/15/15", comment: "facile" },
        feedback: "easy"
      })
    );

    expect(result.nextLoad).toBe("46 kg");
    expect(result.decision).toBe("augmenter");
    expect(result.reason).toMatch(/haut de fourchette|legere hausse/i);
    expect(result.adaptationExplanation?.simpleReason).toBeTruthy();
  });

  it("permet +5 a +10 kg sur presse a cuisses tres facile selon les regles", () => {
    const result = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "leg-press",
          name: "Presse a cuisses",
          target: "5 x 10",
          plannedLoad: "180 kg"
        }),
        performance: { usedLoad: "180 kg", completedReps: "10/10/10/10/10", comment: "tres facile" },
        feedback: "easy"
      })
    );

    expect(["185 kg", "190 kg"]).toContain(result.nextLoad);
    expect(result.decision).toBe("augmenter");
  });

  it("augmente le cardio facile avec +5 min ou +1% inclinaison, jamais les deux", () => {
    const result = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "incline-treadmill-zone-2",
          name: "Cardio zone 2 tapis incline",
          target: "20 min",
          plannedLoad: "8 %"
        }),
        performance: { usedLoad: "8 %", completedReps: "20 min", comment: "facile" },
        feedback: "easy"
      })
    );

    const addsMinutes = /\b25 min\b/.test(result.nextTarget);
    const addsIncline = /\+1 %|9 %/.test(result.nextLoad);

    expect(result.decision).toBe("augmenter");
    expect(addsMinutes || addsIncline).toBe(true);
    expect(addsMinutes && addsIncline).toBe(false);
  });

  it("limite les hausses agressives et le HIIT dur quand sommeil sous 5h", () => {
    const strength = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "tres facile large" },
        feedback: "easy",
        progressionStyle: "controlled_aggressive",
        energy: 9,
        sleepHours: 4
      })
    );
    const hiit = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "controlled-interval-cardio",
          name: "Cardio intervalles controles",
          target: "6 rounds de 30 sec fort / 90 sec facile",
          plannedLoad: "Rameur fort"
        }),
        performance: { usedLoad: "Rameur fort", completedReps: "6 rounds", comment: "facile" },
        feedback: "easy",
        sleepHours: 4
      })
    );

    expect(strength.nextLoad).toBe("92,5 kg");
    expect(strength.nextLoad).not.toBe("95 kg");
    expect(hiit.decision).toBe("maintenir");
    expect(`${hiit.reason} ${hiit.warning}`).toMatch(/sommeil|HIIT|zone facile/i);
  });

  it("protege le vendredi avec judo: pas de grip lourd ni cardio violent", () => {
    const friday = session({ weekday: "friday" });
    const grip = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "farmer-walk",
          name: "Farmer walk lourd",
          target: "4 passages",
          plannedLoad: "40 kg"
        }),
        performance: { usedLoad: "40 kg", completedReps: "4 passages", comment: "facile" },
        feedback: "easy",
        session: friday
      })
    );
    const intervals = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "rower-intervals",
          name: "Rameur intervalles forts",
          target: "6 rounds",
          plannedLoad: "Rameur fort"
        }),
        performance: { usedLoad: "Rameur fort", completedReps: "6 rounds", comment: "facile" },
        feedback: "easy",
        session: friday
      })
    );

    expect(grip.decision).toBe("maintenir");
    expect(`${grip.reason} ${grip.warning}`).toMatch(/grip|judo/i);
    expect(intervals.decision).toBe("maintenir");
    expect(`${intervals.reason} ${intervals.warning}`).toMatch(/judo|violent|facile/i);
  });

  it("propose un remplacement si douleur repetee sur le meme exercice", () => {
    const result = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "douleur poignet encore" },
        feedback: "pain",
        recentPainCount: 2
      })
    );

    expect(result.decision).toBe("remplacer");
    expect(result.replacementSuggestion).toBeTruthy();
    expect(`${result.reason} ${result.warning}`).toMatch(/douleur repetee|remplacement/i);
  });

  it("gere une machine occupee comme report ou remplacement sans echec", () => {
    const result = calculateProgression(
      input({
        plannedExercise: exercise({
          id: "chest-press-machine",
          name: "Chest press machine",
          target: "3 x 10-12",
          plannedLoad: "70 kg"
        }),
        performance: { usedLoad: "", completedReps: "", comment: "machine occupee" },
        feedback: "skipped"
      })
    );

    expect(result.decision).toBe("maintenir");
    expect(result.reason).toMatch(/report|remplacement|sans compter comme un echec/i);
    expect(result.replacementSuggestion).toBeTruthy();
    expect(`${result.reason} ${result.warning}`).toMatch(/temporaire|ponctuelle|report/i);
  });

  it("propose un ajustement prudent apres trois seances stagnantes", () => {
    const result = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "facile" },
        feedback: "easy",
        recentStagnationCount: 3
      })
    );

    expect(result.decision).toBe("maintenir");
    expect(result.evidenceTag).toBe("stagnation_rule");
    expect(result.adaptationExplanation?.ruleApplied).toBe("Stagnation");
    expect(`${result.reason} ${result.warning}`).toMatch(/Trois expositions|Stagnation/i);
  });

  it("choisit une option prudente quand les donnees sont insuffisantes", () => {
    const result = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "", completedReps: "", comment: "" },
        feedback: "ok"
      })
    );

    expect(result.decision).toBe("maintenir");
    expect(result.confidence).toBe("low");
    expect(result.nextLoad).toBe("90 kg");
    expect(`${result.reason} ${result.warning}`).toMatch(/Donnees insuffisantes|prudente/i);
  });
});

describe("validateAIRecommendation", () => {
  it("bloque ou modere une progression IA trop agressive", () => {
    const localResult = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "douleur poignet" },
        feedback: "pain",
        globalPain: 2
      })
    );

    const validated = validateAIRecommendation({
      localResult,
      aiRecommendation: {
        decision: "increase",
        nextLoad: "100 kg",
        reason: "Pousser fort"
      },
      plannedExercise: bench,
      performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "douleur poignet" },
      globalPain: 2,
      recentPainCount: 1
    });

    expect(validated.nextLoad).not.toBe("100 kg");
    expect(["alerte", "maintenir", "remplacer"]).toContain(validated.decision);
    expect(`${validated.reason} ${validated.warning}`).toMatch(/IA|bloqu|mod.r.e|garde-fous/i);
  });

  it("modere une suggestion IA de +10 kg au developpe couche", () => {
    const localResult = calculateProgression(
      input({
        plannedExercise: bench,
        performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "facile" },
        feedback: "easy"
      })
    );

    const validated = validateAIRecommendation({
      localResult,
      aiRecommendation: {
        decision: "increase",
        nextLoad: "100 kg",
        reason: "Gros jump"
      },
      plannedExercise: bench,
      performance: { usedLoad: "90 kg", completedReps: "5/5/5/5/5", comment: "facile" }
    });

    expect(validated.nextLoad).toBe("92,5 kg");
    expect(validated.warning).toContain("Suggestion IA modérée par les garde-fous du programme.");
    expect(validated.adaptationExplanation?.ruleApplied).toMatch(/Surcharge progressive|Garde-fou/);
  });

  it("bloque une suggestion IA de grip lourd le vendredi avant judo", () => {
    const friday = session({ weekday: "friday" });
    const farmer = exercise({
      id: "farmer-walk",
      name: "Farmer walk lourd",
      target: "4 passages",
      plannedLoad: "40 kg"
    });
    const localResult = calculateProgression(
      input({
        plannedExercise: farmer,
        performance: { usedLoad: "40 kg", completedReps: "4 passages", comment: "ok" },
        feedback: "easy",
        session: friday
      })
    );

    const validated = validateAIRecommendation({
      localResult,
      aiRecommendation: {
        decision: "increase",
        nextLoad: "50 kg",
        reason: "Ajouter du grip lourd"
      },
      plannedExercise: farmer,
      performance: { usedLoad: "40 kg", completedReps: "4 passages", comment: "ok" },
      session: friday
    });

    expect(validated.decision).toBe("maintenir");
    expect(validated.warning).toContain("Suggestion IA modérée par les garde-fous du programme.");
    expect(`${validated.reason} ${validated.adaptationExplanation?.ruleApplied}`).toMatch(/judo|grip/i);
  });

  it("bloque une suggestion IA qui augmente plusieurs parametres cardio", () => {
    const cardio = exercise({
      id: "incline-treadmill-zone-2",
      name: "Cardio zone 2 tapis incline",
      target: "20 min",
      plannedLoad: "8 %"
    });
    const localResult = calculateProgression(
      input({
        plannedExercise: cardio,
        performance: { usedLoad: "8 %", completedReps: "20 min", comment: "facile" },
        feedback: "easy"
      })
    );

    const validated = validateAIRecommendation({
      localResult,
      aiRecommendation: {
        decision: "increase",
        nextLoad: "9 %",
        nextTarget: "25 min",
        reason: "Augmenter duree et inclinaison"
      },
      plannedExercise: cardio,
      performance: { usedLoad: "8 %", completedReps: "20 min", comment: "facile" }
    });

    expect(validated.warning).toContain("Suggestion IA modérée par les garde-fous du programme.");
    expect(validated.nextTarget).toBe(localResult.nextTarget);
  });
});
