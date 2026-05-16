// Per-exercise image mapping (3 Unsplash photos per exercise pattern).
//
// Matching strategy: each entry's regex is tested against the lowercased
// exercise name. The first match wins. If nothing matches, the caller falls
// back to category-level images (see lib/session-images).

export type ExerciseImageEntry = {
  pattern: RegExp;
  photos: string[];
};

const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

export const EXERCISE_IMAGE_MAP: ExerciseImageEntry[] = [
  // ── Push: pectoraux ────────────────────────────────────────
  {
    pattern: /d[ée]velopp[ée] couch[ée]|bench press|couch[ée]/i,
    photos: [
      u("1532029837206-abbe2b7620e3"),
      u("1583454110551-21f2fa2afe61"),
      u("1571019614242-c5c5dee9f50b")
    ]
  },
  {
    pattern: /chest press|d[ée]velopp[ée] machine|d[ée]velopp[ée] inclin/i,
    photos: [
      u("1571019613454-1cb2f99b2d8b"),
      u("1599058917212-d750089bc07e"),
      u("1581009146145-b5ef050c2e1e")
    ]
  },
  {
    pattern: /d[ée]velopp[ée] [ée]paules|shoulder press|overhead press/i,
    photos: [
      u("1581009146145-b5ef050c2e1e"),
      u("1581122584612-713f89daa8eb"),
      u("1599058917212-d750089bc07e")
    ]
  },
  {
    pattern: /[ée]l[ée]vations? lat[ée]rales|lateral raise/i,
    photos: [
      u("1581009146145-b5ef050c2e1e"),
      u("1581122584612-713f89daa8eb"),
      u("1571019614242-c5c5dee9f50b")
    ]
  },
  {
    pattern: /arri[ée]re d.?[ée]paule|rear delt|reverse fly/i,
    photos: [
      u("1581122584612-713f89daa8eb"),
      u("1581009146145-b5ef050c2e1e"),
      u("1571019613454-1cb2f99b2d8b")
    ]
  },
  {
    pattern: /triceps|dips|push.?down|kickback/i,
    photos: [
      u("1581009146145-b5ef050c2e1e"),
      u("1571019613454-1cb2f99b2d8b"),
      u("1532029837206-abbe2b7620e3")
    ]
  },
  {
    pattern: /pompes?|push.?up/i,
    photos: [
      u("1571902943202-3935a0a3a47a"),
      u("1599058917212-d750089bc07e"),
      u("1517836357463-d25dfeac3438")
    ]
  },

  // ── Pull: dos / biceps ─────────────────────────────────────
  {
    pattern: /tractions?|pull.?up|chin.?up/i,
    photos: [
      u("1517836357463-d25dfeac3438"),
      u("1581009146145-b5ef050c2e1e"),
      u("1581122584612-713f89daa8eb")
    ]
  },
  {
    pattern: /tirage vertical|lat pull|pulldown/i,
    photos: [
      u("1581122584612-713f89daa8eb"),
      u("1517836357463-d25dfeac3438"),
      u("1574680096145-d05b474e2155")
    ]
  },
  {
    pattern: /rowing|row\b|tirage horizontal/i,
    photos: [
      u("1574680096145-d05b474e2155"),
      u("1581122584612-713f89daa8eb"),
      u("1583454110551-21f2fa2afe61")
    ]
  },
  {
    pattern: /curl|biceps/i,
    photos: [
      u("1581122584612-713f89daa8eb"),
      u("1583454110551-21f2fa2afe61"),
      u("1581009146145-b5ef050c2e1e")
    ]
  },

  // ── Legs: jambes ───────────────────────────────────────────
  {
    pattern: /squat|presse [aà] cuisses|leg press/i,
    photos: [
      u("1574680096145-d05b474e2155"),
      u("1517344884509-a0c97ec11bcc"),
      u("1599058917212-d750089bc07e")
    ]
  },
  {
    pattern: /soulev[ée]|deadlift|rdl|roumain|hinge/i,
    photos: [
      u("1517344884509-a0c97ec11bcc"),
      u("1574680096145-d05b474e2155"),
      u("1532029837206-abbe2b7620e3")
    ]
  },
  {
    pattern: /hip thrust|fessiers/i,
    photos: [
      u("1517344884509-a0c97ec11bcc"),
      u("1574680096145-d05b474e2155"),
      u("1583454110551-21f2fa2afe61")
    ]
  },
  {
    pattern: /leg curl|ischio/i,
    photos: [
      u("1517344884509-a0c97ec11bcc"),
      u("1599058917212-d750089bc07e"),
      u("1574680096145-d05b474e2155")
    ]
  },
  {
    pattern: /leg extension|quadriceps/i,
    photos: [
      u("1517344884509-a0c97ec11bcc"),
      u("1574680096145-d05b474e2155"),
      u("1599058917212-d750089bc07e")
    ]
  },
  {
    pattern: /mollets?|calf raises?/i,
    photos: [
      u("1517344884509-a0c97ec11bcc"),
      u("1599058917212-d750089bc07e"),
      u("1574680096145-d05b474e2155")
    ]
  },
  {
    pattern: /fentes|lunges?/i,
    photos: [
      u("1574680096145-d05b474e2155"),
      u("1517344884509-a0c97ec11bcc"),
      u("1599058917212-d750089bc07e")
    ]
  },

  // ── Cardio ─────────────────────────────────────────────────
  {
    pattern: /tapis|treadmill|marche inclin/i,
    photos: [
      u("1538805060514-97d9cc17730c"),
      u("1591741535018-d042766c62eb"),
      u("1571902943202-3935a0a3a47a")
    ]
  },
  {
    pattern: /v[ée]lo|cycling|spin/i,
    photos: [
      u("1534258936925-c58bed479fcb"),
      u("1591741535018-d042766c62eb"),
      u("1538805060514-97d9cc17730c")
    ]
  },
  {
    pattern: /rameur|rowing machine/i,
    photos: [
      u("1574680096145-d05b474e2155"),
      u("1538805060514-97d9cc17730c"),
      u("1591741535018-d042766c62eb")
    ]
  },
  {
    pattern: /elliptique|elliptical|stairmaster/i,
    photos: [
      u("1538805060514-97d9cc17730c"),
      u("1591741535018-d042766c62eb"),
      u("1534258936925-c58bed479fcb")
    ]
  },
  {
    pattern: /course|running|hiit|intervalles|zone 2/i,
    photos: [
      u("1591741535018-d042766c62eb"),
      u("1538805060514-97d9cc17730c"),
      u("1534258936925-c58bed479fcb")
    ]
  },

  // ── Core / abdos ──────────────────────────────────────────
  {
    pattern: /gainage|plank|planche/i,
    photos: [
      u("1593079831268-3381b0db4a77"),
      u("1571902943202-3935a0a3a47a"),
      u("1518611012118-696072aa579a")
    ]
  },
  {
    pattern: /abdos?|crunch|abs|hollow/i,
    photos: [
      u("1571019614242-c5c5dee9f50b"),
      u("1593079831268-3381b0db4a77"),
      u("1571902943202-3935a0a3a47a")
    ]
  },

  // ── Mobilité ──────────────────────────────────────────────
  {
    pattern: /mobilit[ée]|stretch|[ée]tirement|yoga/i,
    photos: [
      u("1518611012118-696072aa579a"),
      u("1545205597-3d9d02c29597"),
      u("1506629082955-511b1aa562c8")
    ]
  }
];

/**
 * Returns 2-3 photos for an exercise if its name matches a curated pattern,
 * otherwise returns null and the caller falls back to category images.
 */
export function getExerciseImages(exerciseName: string): string[] | null {
  for (const entry of EXERCISE_IMAGE_MAP) {
    if (entry.pattern.test(exerciseName)) {
      return entry.photos;
    }
  }
  return null;
}
