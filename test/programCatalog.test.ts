import test from "node:test";
import assert from "node:assert/strict";
import { PROGRAM_CATALOG, getProgramTemplateById } from "@/data/programCatalog";

test("program catalog contains the six initial programs", () => {
  assert.equal(PROGRAM_CATALOG.length, 6);
  assert.deepEqual(
    PROGRAM_CATALOG.map((program) => program.id),
    [
      "full-body-progression-3j",
      "upper-lower-recomposition-4j",
      "ppl-upper-lower-5j",
      "push-pull-legs-classique-6j",
      "shape-burn-alicia-4j",
      "cardio-sante-renforcement-3-5j"
    ]
  );
  assert.equal(getProgramTemplateById("ppl-upper-lower-5j")?.name, "Push Pull Legs Upper Lower");
});

test("each catalog program is structurally complete", () => {
  for (const program of PROGRAM_CATALOG) {
    assert.ok(program.id);
    assert.ok(program.name);
    assert.ok(program.description.length > 20);
    assert.ok(program.averageDuration);
    assert.ok(program.requiredEquipment.length > 0);
    assert.ok(program.tags.length > 0);
    assert.ok(program.weeklyStructure.length >= program.frequency);
    assert.ok(program.sessions.length >= program.frequency);
    assert.ok(program.progressionRules.method);
    assert.ok(program.guardrails.contraindications.length > 0);

    for (const session of program.sessions) {
      assert.ok(session.id);
      assert.ok(session.title);
      assert.ok(session.focus);
      assert.ok(session.duration);
      assert.ok(session.exercises.length >= 2);

      for (const exercise of session.exercises) {
        assert.ok(exercise.id);
        assert.ok(exercise.name);
        assert.ok(exercise.target);
        assert.ok(exercise.rest);
        assert.ok(exercise.cue);
      }
    }
  }
});

test("Sofiane priority program includes bench press and cardio", () => {
  const program = getProgramTemplateById("ppl-upper-lower-5j");
  assert.ok(program);

  const exerciseText = normalize(
    program.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.name)).join(" ")
  );

  assert.match(exerciseText, /developpe couche/);
  assert.match(exerciseText, /tapis incline|rameur|stairmaster/);
  assert.equal(program.frequency, 5);
  assert.equal(program.primaryObjective, "recomposition");
});

test("Alicia program includes glutes thighs soft cardio and safe core", () => {
  const program = getProgramTemplateById("shape-burn-alicia-4j");
  assert.ok(program);

  const fullText = normalize(JSON.stringify(program));

  assert.match(fullText, /hip thrust|pont fessier|abducteurs/);
  assert.match(fullText, /presse a cuisses|leg extension|leg curl/);
  assert.match(fullText, /marche|elliptique|velo/);
  assert.match(fullText, /transverse|pallof|respiration/);
  assert.ok(program.contraindications.some((item) => normalize(item).includes("crunch")));
  assert.ok(program.guardrails.contraindications.some((item) => normalize(item).includes("blocage respiratoire")));

  const exerciseText = normalize(program.sessions.flatMap((session) => session.exercises.map((exercise) => exercise.name)).join(" "));
  assert.doesNotMatch(exerciseText, /crunch|sit-up|burpee|saut/);
});

test("no catalog program depends on judo", () => {
  for (const program of PROGRAM_CATALOG) {
    const fullText = normalize(JSON.stringify(program));
    assert.doesNotMatch(fullText, /judo/);
    assert.equal(program.tags.includes("judo"), false);
    assert.notEqual(program.primaryObjective, "judo");
    assert.equal(program.secondaryObjectives.includes("judo"), false);
  }
});

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
