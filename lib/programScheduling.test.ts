/**
 * Test cases for flexible program scheduling
 * These verify the core rotation logic works correctly across different program types
 */

import { scheduleSessionsFlexibly } from "@/lib/programScheduling";
import type { ProgramSessionTemplate, Weekday } from "@/types/training";

describe("scheduleSessionsFlexibly", () => {
  // Mock session templates
  const createMockSession = (id: string, title: string): ProgramSessionTemplate => ({
    id,
    title,
    focus: `Focus for ${title}`,
    duration: "60 min",
    intensity: "Modérée",
    exercises: []
  });

  describe("PPL 6-day program", () => {
    const pplSessions: ProgramSessionTemplate[] = [
      createMockSession("push-a", "Push A"),
      createMockSession("pull-a", "Pull A"),
      createMockSession("legs-a", "Legs A"),
      createMockSession("push-b", "Push B"),
      createMockSession("pull-b", "Pull B"),
      createMockSession("legs-b", "Legs B")
    ];

    it("should schedule PPL in normal order (starting with Push)", () => {
      const result = scheduleSessionsFlexibly(
        pplSessions,
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        0
      );

      expect(result[0].title).toBe("Push A");
      expect(result[0].weekday).toBe("monday");
      expect(result[1].weekday).toBe("tuesday");
      expect(result[2].weekday).toBe("wednesday");
      expect(result[5].title).toBe("Legs B");
      expect(result[5].weekday).toBe("saturday");
    });

    it("should rotate PPL to start with Legs (index 2)", () => {
      const result = scheduleSessionsFlexibly(
        pplSessions,
        ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
        2
      );

      // After rotation: [Legs A, Push B, Pull B, Legs B, Push A, Pull A]
      expect(result[0].title).toBe("Legs A");
      expect(result[0].weekday).toBe("monday");
      expect(result[1].title).toBe("Push B");
      expect(result[1].weekday).toBe("tuesday");
      expect(result[2].title).toBe("Pull B");
      expect(result[2].weekday).toBe("wednesday");
      expect(result[3].title).toBe("Legs B");
      expect(result[3].weekday).toBe("thursday");
      expect(result[4].title).toBe("Push A");
      expect(result[4].weekday).toBe("friday");
      expect(result[5].title).toBe("Pull A");
      expect(result[5].weekday).toBe("saturday");
    });

    it("should handle rest day in middle (Thursday blocked)", () => {
      const availableDays: Weekday[] = ["monday", "tuesday", "wednesday", "friday", "saturday", "sunday"];
      const result = scheduleSessionsFlexibly(pplSessions, availableDays, 2);

      // Sessions rotate correctly despite missing Thursday
      expect(result[3].weekday).toBe("friday"); // Legs B skips Thursday
      expect(result[5].weekday).toBe("sunday"); // Pull A on Sunday
    });
  });

  describe("Upper/Lower 4-day program", () => {
    const ulSessions: ProgramSessionTemplate[] = [
      createMockSession("upper-force", "Upper Force"),
      createMockSession("lower-force", "Lower Force"),
      createMockSession("upper-volume", "Upper Volume"),
      createMockSession("lower-volume", "Lower Volume")
    ];

    it("should rotate to start with Lower (index 1)", () => {
      const result = scheduleSessionsFlexibly(
        ulSessions,
        ["monday", "tuesday", "thursday", "friday"],
        1
      );

      // After rotation: [Lower Force, Upper Volume, Lower Volume, Upper Force]
      expect(result[0].title).toBe("Lower Force");
      expect(result[1].title).toBe("Upper Volume");
      expect(result[2].title).toBe("Lower Volume");
      expect(result[3].title).toBe("Upper Force");

      // Verify alternation: Lower→Upper→Lower→Upper
      const titles = result.map((s) => s.title);
      expect(titles[0]).toContain("Lower");
      expect(titles[1]).toContain("Upper");
      expect(titles[2]).toContain("Lower");
      expect(titles[3]).toContain("Upper");
    });
  });

  describe("Full Body 3-day program", () => {
    const fbSessions: ProgramSessionTemplate[] = [
      createMockSession("fb-a", "Full Body A"),
      createMockSession("fb-b", "Full Body B"),
      createMockSession("fb-c", "Full Body C")
    ];

    it("should assign to 3 available days", () => {
      const result = scheduleSessionsFlexibly(
        fbSessions,
        ["monday", "wednesday", "friday"],
        0
      );

      expect(result).toHaveLength(3);
      expect(result[0].weekday).toBe("monday");
      expect(result[1].weekday).toBe("wednesday");
      expect(result[2].weekday).toBe("friday");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty sessions array", () => {
      const result = scheduleSessionsFlexibly([], ["monday"], 0);
      expect(result).toHaveLength(0);
    });

    it("should handle empty days array", () => {
      const sessions: ProgramSessionTemplate[] = [createMockSession("s1", "Session 1")];
      const result = scheduleSessionsFlexibly(sessions, [], 0);
      expect(result).toHaveLength(0);
    });

    it("should clamp starting index to valid range", () => {
      const sessions = [
        createMockSession("s1", "One"),
        createMockSession("s2", "Two")
      ];

      // startingSessionIndex = 5 should wrap to 5 % 2 = 1
      const result = scheduleSessionsFlexibly(
        sessions,
        ["monday", "tuesday"],
        5
      );

      // After clamping to 1: [Two, One]
      expect(result[0].title).toBe("Two");
      expect(result[1].title).toBe("One");
    });

    it("should handle more days than sessions", () => {
      const sessions = [
        createMockSession("s1", "Session 1"),
        createMockSession("s2", "Session 2")
      ];

      const result = scheduleSessionsFlexibly(
        sessions,
        ["monday", "tuesday", "wednesday", "thursday"],
        0
      );

      // Only 2 sessions mapped, rest days are free
      expect(result).toHaveLength(2);
      expect(result[0].weekday).toBe("monday");
      expect(result[1].weekday).toBe("tuesday");
    });

    it("should cycle sessions when more sessions than days", () => {
      const sessions = [
        createMockSession("s1", "One"),
        createMockSession("s2", "Two"),
        createMockSession("s3", "Three"),
        createMockSession("s4", "Four")
      ];

      // Only 3 days available, 4 sessions
      const result = scheduleSessionsFlexibly(
        sessions,
        ["monday", "tuesday", "wednesday"],
        0
      );

      expect(result).toHaveLength(4);
      expect(result[0].weekday).toBe("monday");
      expect(result[1].weekday).toBe("tuesday");
      expect(result[2].weekday).toBe("wednesday");
      expect(result[3].weekday).toBe("monday"); // Cycles back to Monday
    });
  });
});
