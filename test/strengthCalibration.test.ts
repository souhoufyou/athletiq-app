import test from "node:test";
import assert from "node:assert/strict";
import { buildStrengthReferenceFromSet, estimateOneRepMaxFromSet } from "@/lib/strengthCalibration";

test("estimates one rep max from a real working set", () => {
  assert.equal(estimateOneRepMaxFromSet(100, 5, "kg"), 116.7);
  assert.equal(estimateOneRepMaxFromSet(100, 1, "kg"), 100);
});

test("stores strength references as load plus reps, not forced one rep max", () => {
  const reference = buildStrengthReferenceFromSet("Developpe couche", 100, 5, "kg");

  assert.equal(reference?.value, "100 kg x 5");
  assert.equal(reference?.loadKg, 100);
  assert.equal(reference?.reps, 5);
  assert.equal(reference?.estimatedOneRepMaxKg, 116.7);
  assert.equal(reference?.confidence, "estimated");
});

test("clamps extreme reps for conservative calibration", () => {
  const reference = buildStrengthReferenceFromSet("Developpe couche", 100, 30, "kg");

  assert.equal(reference?.value, "100 kg x 12");
  assert.equal(reference?.estimatedOneRepMaxKg, 140);
});
