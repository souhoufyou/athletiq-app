import test from "node:test";
import assert from "node:assert/strict";
import { getNextSession, getTodaySession } from "@/lib/session";
import type { PlannedSession } from "@/types/training";

const program: PlannedSession[] = [
  {
    id: "tuesday-session",
    weekday: "tuesday",
    title: "Tuesday",
    focus: "Test",
    duration: "45 min",
    intensity: "Modérée",
    exercises: []
  },
  {
    id: "friday-session",
    weekday: "friday",
    title: "Friday",
    focus: "Test",
    duration: "45 min",
    intensity: "Modérée",
    exercises: []
  }
];

test("today session falls back to first session on rest days", () => {
  const monday = new Date("2026-04-27T12:00:00");

  assert.equal(getTodaySession(program, monday).id, "tuesday-session");
});

test("next session skips rest days and returns the next programmed weekday", () => {
  const wednesday = new Date("2026-04-29T12:00:00");

  const next = getNextSession(program, wednesday);

  assert.equal(next.session.id, "friday-session");
  assert.equal(next.date.getDay(), 5);
});

test("next session wraps to the following week when needed", () => {
  const saturday = new Date("2026-05-02T12:00:00");

  const next = getNextSession(program, saturday);

  assert.equal(next.session.id, "tuesday-session");
  assert.equal(next.date.getDay(), 2);
});
