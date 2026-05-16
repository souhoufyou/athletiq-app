// Per-exercise image mapping (real exercise photos from Free Exercise DB).
//
// Source: https://github.com/yuhonas/free-exercise-db (CC0 / open-source, ~870 exercices)
// Served via jsDelivr CDN. Each exercise typically has 2 photos (start & end of the
// movement) — we mix variants to give 3-4 angles per pattern.
//
// Matching strategy: each entry's regex is tested against the lowercased
// exercise name. The first match wins. If nothing matches, the caller falls
// back to category-level Unsplash images (see lib/session-images).

export type ExerciseImageEntry = {
  pattern: RegExp;
  photos: string[];
};

// Free Exercise DB image URL (via jsDelivr CDN).
// Note: the real path is `{slug}/{0|1}.jpg` (no `/images/` segment).
const fdb = (slug: string, index: 0 | 1 = 0) =>
  `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${slug}/${index}.jpg`;

// Unsplash backup (only used inside this file when we want a stock gym shot)
const u = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

export const EXERCISE_IMAGE_MAP: ExerciseImageEntry[] = [
  // ── Pectoraux / DC ─────────────────────────────────────────
  {
    pattern: /d[ée]velopp[ée] couch[ée]|bench press|couch[ée] barre|couch[ée] halt/i,
    photos: [
      fdb("Barbell_Bench_Press_-_Medium_Grip", 0),
      fdb("Barbell_Bench_Press_-_Medium_Grip", 1),
      fdb("Dumbbell_Bench_Press", 0),
      fdb("Dumbbell_Bench_Press", 1)
    ]
  },
  {
    pattern: /chest press|d[ée]velopp[ée] machine|press machine/i,
    photos: [
      fdb("Leverage_Chest_Press", 0),
      fdb("Leverage_Chest_Press", 1),
      fdb("Cable_Chest_Press", 0),
      fdb("Dumbbell_Bench_Press", 0)
    ]
  },
  {
    pattern: /d[ée]velopp[ée] inclin|incline bench|incline press/i,
    photos: [
      fdb("Incline_Dumbbell_Press", 0),
      fdb("Incline_Dumbbell_Press", 1),
      fdb("Barbell_Incline_Bench_Press_-_Medium_Grip", 0),
      fdb("Barbell_Incline_Bench_Press_-_Medium_Grip", 1)
    ]
  },
  {
    pattern: /d[ée]velopp[ée] d[ée]clin|decline bench|decline press/i,
    photos: [
      fdb("Decline_Dumbbell_Bench_Press", 0),
      fdb("Decline_Dumbbell_Bench_Press", 1),
      fdb("Decline_Barbell_Bench_Press", 0)
    ]
  },

  // ── Épaules ────────────────────────────────────────────────
  {
    pattern: /d[ée]velopp[ée] [ée]paules|shoulder press|overhead press|d[ée]velopp[ée] militaire/i,
    photos: [
      fdb("Dumbbell_Shoulder_Press", 0),
      fdb("Dumbbell_Shoulder_Press", 1),
      fdb("Standing_Military_Press", 0),
      fdb("Standing_Military_Press", 1)
    ]
  },
  {
    pattern: /[ée]l[ée]vations? lat[ée]rales?|lateral raise|side raise/i,
    photos: [
      fdb("Side_Lateral_Raise", 0),
      fdb("Side_Lateral_Raise", 1),
      fdb("Dumbbell_Lying_Rear_Lateral_Raise", 0)
    ]
  },
  {
    pattern: /arri[ée]re d.?[ée]paule|rear delt|reverse fly|oiseau/i,
    photos: [
      fdb("Reverse_Flyes", 0),
      fdb("Reverse_Flyes", 1),
      fdb("Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench", 0)
    ]
  },
  {
    pattern: /[ée]l[ée]vations? frontales?|front raise/i,
    photos: [
      fdb("Front_Dumbbell_Raise", 0),
      fdb("Front_Dumbbell_Raise", 1),
      fdb("Front_Plate_Raise", 0)
    ]
  },

  // ── Triceps ────────────────────────────────────────────────
  {
    pattern: /pushdown|tirage triceps|extension triceps poulie/i,
    photos: [
      fdb("Triceps_Pushdown", 0),
      fdb("Triceps_Pushdown", 1),
      fdb("Triceps_Pushdown_-_Rope_Attachment", 0)
    ]
  },
  {
    pattern: /dips/i,
    photos: [
      fdb("Dips_-_Triceps_Version", 0),
      fdb("Dips_-_Triceps_Version", 1),
      fdb("Bench_Dips", 0)
    ]
  },
  {
    pattern: /barre au front|skull crusher|extension triceps barre/i,
    photos: [
      fdb("Cable_Lying_Triceps_Extension", 0),
      fdb("Cable_Lying_Triceps_Extension", 1),
      fdb("Decline_Close-Grip_Bench_To_Skull_Crusher", 0)
    ]
  },

  // ── Dos / Pull ─────────────────────────────────────────────
  {
    pattern: /tractions?|pull.?up|chin.?up/i,
    photos: [
      fdb("Pullups", 0),
      fdb("Pullups", 1),
      fdb("Chin-Up", 0),
      fdb("Chin-Up", 1)
    ]
  },
  {
    pattern: /tirage vertical|lat pulldown|tirage poulie haute/i,
    photos: [
      fdb("Wide-Grip_Lat_Pulldown", 0),
      fdb("Wide-Grip_Lat_Pulldown", 1),
      fdb("Underhand_Cable_Pulldowns", 0)
    ]
  },
  {
    pattern: /rowing (assis|poulie|c[aâ]ble)|seated cable row|tirage horizontal/i,
    photos: [
      fdb("Seated_Cable_Rows", 0),
      fdb("Seated_Cable_Rows", 1),
      fdb("Elevated_Cable_Rows", 0)
    ]
  },
  {
    pattern: /rowing (barre|inclin[ée])|bent.?over.*row|rowing buste/i,
    photos: [
      fdb("Bent_Over_Barbell_Row", 0),
      fdb("Bent_Over_Barbell_Row", 1),
      fdb("T-Bar_Row_with_Handle", 0)
    ]
  },
  {
    pattern: /rowing (halt[ée]re|unilateral|un bras)|one.?arm.*row/i,
    photos: [
      fdb("One-Arm_Dumbbell_Row", 0),
      fdb("One-Arm_Dumbbell_Row", 1),
      fdb("T-Bar_Row_with_Handle", 0)
    ]
  },
  {
    pattern: /rowing/i, // fallback rowing
    photos: [
      fdb("Seated_Cable_Rows", 0),
      fdb("Bent_Over_Barbell_Row", 0),
      fdb("One-Arm_Dumbbell_Row", 0)
    ]
  },

  // ── Biceps ─────────────────────────────────────────────────
  {
    pattern: /curl (barre|biceps barre)|barbell curl/i,
    photos: [
      fdb("Barbell_Curl", 0),
      fdb("Barbell_Curl", 1),
      fdb("EZ-Bar_Curl", 0)
    ]
  },
  {
    pattern: /curl (halt[ée]res?|alterné)|dumbbell curl/i,
    photos: [
      fdb("Dumbbell_Bicep_Curl", 0),
      fdb("Dumbbell_Bicep_Curl", 1),
      fdb("Hammer_Curls", 0),
      fdb("Hammer_Curls", 1)
    ]
  },
  {
    pattern: /curl (c[aâ]ble|poulie)|cable curl/i,
    photos: [
      fdb("Cable_Preacher_Curl", 0),
      fdb("Cable_Preacher_Curl", 1),
      fdb("Cable_Hammer_Curls_-_Rope_Attachment", 0)
    ]
  },
  {
    pattern: /curl|biceps/i,
    photos: [
      fdb("Dumbbell_Bicep_Curl", 0),
      fdb("Barbell_Curl", 0),
      fdb("Hammer_Curls", 0)
    ]
  },

  // ── Jambes : Squat ────────────────────────────────────────
  {
    pattern: /squat barre|back squat|barbell squat/i,
    photos: [
      fdb("Barbell_Squat", 0),
      fdb("Barbell_Squat", 1),
      fdb("Front_Barbell_Squat", 0),
      fdb("Front_Barbell_Squat", 1)
    ]
  },
  {
    pattern: /squat goblet|goblet squat/i,
    photos: [
      fdb("Goblet_Squat", 0),
      fdb("Goblet_Squat", 1)
    ]
  },
  {
    pattern: /squat (poids du corps|bodyweight)|bodyweight squat/i,
    photos: [
      fdb("Bodyweight_Squat", 0),
      fdb("Bodyweight_Squat", 1),
      fdb("Box_Squat", 0)
    ]
  },
  {
    pattern: /\bsquat\b/i,
    photos: [
      fdb("Barbell_Squat", 0),
      fdb("Barbell_Squat", 1),
      fdb("Bodyweight_Squat", 0)
    ]
  },
  {
    pattern: /presse [aà] cuisses|leg press/i,
    photos: [
      fdb("Leg_Press", 0),
      fdb("Leg_Press", 1)
    ]
  },

  // ── Hinge / Soulevé ────────────────────────────────────────
  {
    pattern: /soulev[ée] de terre (roumain|jambes tendues)|romanian deadlift|rdl/i,
    photos: [
      fdb("Romanian_Deadlift", 0),
      fdb("Romanian_Deadlift", 1),
      fdb("Stiff-Legged_Dumbbell_Deadlift", 0)
    ]
  },
  {
    pattern: /soulev[ée] de terre|deadlift/i,
    photos: [
      fdb("Barbell_Deadlift", 0),
      fdb("Barbell_Deadlift", 1),
      fdb("Sumo_Deadlift", 0),
      fdb("Sumo_Deadlift", 1)
    ]
  },
  {
    pattern: /hip thrust|fessiers|glute bridge/i,
    photos: [
      fdb("Barbell_Hip_Thrust", 0),
      fdb("Barbell_Hip_Thrust", 1),
      fdb("Barbell_Glute_Bridge", 0),
      fdb("Hip_Lift_with_Band", 0)
    ]
  },

  // ── Jambes isolation ──────────────────────────────────────
  {
    pattern: /leg curl|ischio.?jambier/i,
    photos: [
      fdb("Lying_Leg_Curls", 0),
      fdb("Lying_Leg_Curls", 1),
      fdb("Seated_Leg_Curl", 0)
    ]
  },
  {
    pattern: /leg extension|quadriceps|extension cuisses?/i,
    photos: [
      fdb("Leg_Extensions", 0),
      fdb("Leg_Extensions", 1)
    ]
  },
  {
    pattern: /fentes|lunges?/i,
    photos: [
      fdb("Dumbbell_Lunges", 0),
      fdb("Dumbbell_Lunges", 1),
      fdb("Bodyweight_Walking_Lunge", 0),
      fdb("Barbell_Lunge", 0)
    ]
  },
  {
    pattern: /mollets?|calf raise/i,
    photos: [
      fdb("Standing_Calf_Raises", 0),
      fdb("Standing_Calf_Raises", 1),
      fdb("Seated_Calf_Raise", 0)
    ]
  },

  // ── Pompes / Push-up ──────────────────────────────────────
  {
    pattern: /pompes?|push.?up/i,
    photos: [
      fdb("Pushups", 0),
      fdb("Pushups", 1),
      fdb("Decline_Push-Up", 0)
    ]
  },

  // ── Core / Abdos ───────────────────────────────────────────
  {
    pattern: /gainage|plank|planche/i,
    photos: [
      fdb("Plank", 0),
      fdb("Side_Bridge", 0),
      fdb("Side_Bridge", 1)
    ]
  },
  {
    pattern: /crunch|abs|abdos|hollow|sit.?up/i,
    photos: [
      fdb("Crunches", 0),
      fdb("Crunches", 1),
      fdb("Air_Bike", 0),
      fdb("Ab_Crunch_Machine", 0)
    ]
  },
  {
    pattern: /relev[ée]s? (de )?jambes|leg raise|hanging leg/i,
    photos: [
      fdb("Hanging_Leg_Raise", 0),
      fdb("Hanging_Leg_Raise", 1),
      fdb("Flat_Bench_Lying_Leg_Raise", 0)
    ]
  },

  // ── Cardio (Free-Exercise-DB en a moins, on garde Unsplash) ────────────
  {
    pattern: /tapis|treadmill|marche inclin|incline walk/i,
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
    pattern: /course|running|hiit|intervalles|zone 2|cardio sant/i,
    photos: [
      u("1591741535018-d042766c62eb"),
      u("1538805060514-97d9cc17730c"),
      u("1534258936925-c58bed479fcb")
    ]
  },

  // ── Mobilité / étirements ─────────────────────────────────
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
 * Returns 2-4 photos for an exercise if its name matches a curated pattern,
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
