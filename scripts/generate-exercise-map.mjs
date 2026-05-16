#!/usr/bin/env node
// Generate exerciseImageMap.ts from data/seed.ts + data/programCatalog.ts +
// lib/exerciseLibrary.ts against the official Free Exercise DB dataset.
//
// Usage: node scripts/generate-exercise-map.mjs > data/exerciseImageMap.ts

import fs from "node:fs";

const DB = JSON.parse(fs.readFileSync("./exos.json", "utf8"));
const DB_BY_ID = Object.fromEntries(DB.map((e) => [e.id, e]));

/** Map French exercise names → Free Exercise DB slugs (ordered, multiple per name). */
const MAPPING = [
  // Format: [Pattern regex source, ...slugs]
  // The first regex match wins; we put more specific patterns first.

  // ── Pecs / Push ─────────────────────────────────────────────
  [/d[ée]velopp[ée] couch[ée] halt[ée]res/i, ["Dumbbell_Bench_Press", "Decline_Dumbbell_Bench_Press"]],
  [/d[ée]velopp[ée] couch[ée] barre/i, ["Barbell_Bench_Press_-_Medium_Grip", "Bench_Press_-_Powerlifting"]],
  [/d[ée]velopp[ée] couch[ée] vitesse|d[ée]velopp[ée] couch[ée]/i, ["Barbell_Bench_Press_-_Medium_Grip", "Dumbbell_Bench_Press"]],
  [/d[ée]velopp[ée] inclin[ée] machine|d[ée]velopp[ée] inclin[ée]/i, ["Incline_Dumbbell_Press", "Barbell_Incline_Bench_Press_-_Medium_Grip"]],
  [/d[ée]velopp[ée] d[ée]clin/i, ["Decline_Dumbbell_Bench_Press", "Decline_Barbell_Bench_Press"]],
  [/chest press|press machine/i, ["Leverage_Chest_Press", "Cable_Chest_Press"]],
  [/pec deck|reverse pec deck|butterfly/i, ["Butterfly", "Reverse_Flyes"]],
  [/[ée]cart[ée] poulie|cable cross|crossover/i, ["Cable_Crossover", "Flat_Bench_Cable_Flyes"]],
  [/[ée]cart[ée] halt[ée]res|dumbbell fly|fly halt[ée]res/i, ["Dumbbell_Flyes", "Incline_Dumbbell_Flyes"]],
  [/pompes? piqu[ée]es?|pike push/i, ["Handstand_Push-Ups", "Pushups"]],
  [/pompes?|push.?up/i, ["Pushups", "Decline_Push-Up"]],

  // ── Épaules ────────────────────────────────────────────────
  [/d[ée]velopp[ée] militaire|military press/i, ["Standing_Military_Press", "Seated_Barbell_Military_Press"]],
  [/d[ée]velopp[ée] [ée]paules machine/i, ["Smith_Machine_Overhead_Shoulder_Press", "Dumbbell_Shoulder_Press"]],
  [/d[ée]velopp[ée] [ée]paules|shoulder press|overhead press/i, ["Dumbbell_Shoulder_Press", "Standing_Military_Press"]],
  [/[ée]l[ée]vations? lat[ée]rales? (poulie|c[aâ]ble)|cable lateral/i, ["Cable_Seated_Lateral_Raise", "Side_Lateral_Raise"]],
  [/[ée]l[ée]vations? lat[ée]rales?|lateral raise|side raise/i, ["Side_Lateral_Raise", "Lateral_Raise_-_With_Bands"]],
  [/arri[èe]re d[''’]?[ée]paule|reverse pec|reverse fly|rear delt/i, ["Reverse_Flyes", "Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench"]],
  [/face pull/i, ["Face_Pull", "Face_Pull"]],
  [/[ée]l[ée]vations? frontales?|front raise/i, ["Front_Dumbbell_Raise", "Front_Plate_Raise"]],
  [/thruster/i, ["Kettlebell_Thruster", "Double_Kettlebell_Push_Press"]],

  // ── Triceps ────────────────────────────────────────────────
  [/triceps (corde|rope)|push.?down rope/i, ["Triceps_Pushdown_-_Rope_Attachment", "Cable_Hammer_Curls_-_Rope_Attachment"]],
  [/triceps poulie|pushdown|tirage triceps/i, ["Triceps_Pushdown", "Triceps_Pushdown_-_V-Bar_Attachment"]],
  [/extension triceps halt[ée]re|kickback/i, ["Tricep_Dumbbell_Kickback", "Bent_Over_One-Arm_Long_Bar_Row"]],
  [/dips sur banc|bench dips/i, ["Bench_Dips", "Dips_-_Triceps_Version"]],
  [/dips/i, ["Dips_-_Triceps_Version", "Dips_-_Chest_Version"]],
  [/barre au front|skull crusher|french press/i, ["Cable_Lying_Triceps_Extension", "Decline_Close-Grip_Bench_To_Skull_Crusher"]],

  // ── Dos / Pull ─────────────────────────────────────────────
  [/tractions? \(assist[ée]es?|tractions? assist|assisted pull/i, ["Band_Assisted_Pull-Up", "Pullups"]],
  [/tractions?|pull.?up|chin.?up/i, ["Pullups", "Chin-Up"]],
  [/tirage vertical prise neutre|underhand pulldown/i, ["Underhand_Cable_Pulldowns", "Wide-Grip_Lat_Pulldown"]],
  [/tirage vertical|lat pulldown|pulldown/i, ["Wide-Grip_Lat_Pulldown", "Underhand_Cable_Pulldowns"]],
  [/tirage [ée]lastique|band pull/i, ["Band_Pull_Apart", "Band_Assisted_Pull-Up"]],
  [/rowing halt[ée]re un bras|one.?arm.*row|rowing 1 bras/i, ["One-Arm_Dumbbell_Row", "T-Bar_Row_with_Handle"]],
  [/rowing poitrine appuy[ée]e?|chest.?supported row/i, ["Bent_Over_Two-Dumbbell_Row", "Bent_Over_Two-Arm_Long_Bar_Row"]],
  [/rowing poulie basse|cable row/i, ["Seated_Cable_Rows", "Elevated_Cable_Rows"]],
  [/rowing inversé|inverted row|tirage australien/i, ["Inverted_Row", "Inverted_Row_with_Straps"]],
  [/rowing machine|machine row|tirage horizontal/i, ["Seated_Cable_Rows", "Elevated_Cable_Rows"]],
  [/rowing barre|bent.?over.*row|rowing buste/i, ["Bent_Over_Barbell_Row", "T-Bar_Row_with_Handle"]],
  [/rowing/i, ["Seated_Cable_Rows", "Bent_Over_Barbell_Row", "One-Arm_Dumbbell_Row"]],
  [/pullover.*bras tendus|straight.?arm pull/i, ["Rope_Straight-Arm_Pulldown", "Decline_Dumbbell_Flyes"]],
  [/pullover/i, ["Rope_Straight-Arm_Pulldown", "Bent-Arm_Dumbbell_Pullover"]],

  // ── Biceps ─────────────────────────────────────────────────
  [/curl pupitre|curl inclin[ée]|preacher curl/i, ["Preacher_Curl", "Cable_Preacher_Curl"]],
  [/curl c[aâ]ble|cable curl|curl poulie/i, ["Cable_Preacher_Curl", "Cable_Hammer_Curls_-_Rope_Attachment"]],
  [/curl halt[ée]res?|dumbbell curl/i, ["Dumbbell_Bicep_Curl", "Hammer_Curls"]],
  [/curl barre|barbell curl|biceps barre/i, ["Barbell_Curl", "EZ-Bar_Curl"]],
  [/curl|biceps/i, ["Dumbbell_Bicep_Curl", "Barbell_Curl"]],

  // ── Jambes / Squat ────────────────────────────────────────
  [/squat barre|barbell squat|back squat/i, ["Barbell_Squat", "Front_Barbell_Squat"]],
  [/goblet squat/i, ["Goblet_Squat", "Bodyweight_Squat"]],
  [/squat poids du corps|bodyweight squat/i, ["Bodyweight_Squat", "Box_Squat"]],
  [/hack squat/i, ["Hack_Squat", "Smith_Machine_Squat"]],
  [/\bsquat\b/i, ["Barbell_Squat", "Bodyweight_Squat", "Goblet_Squat"]],
  [/presse [aà] cuisses|leg press/i, ["Leg_Press", "Wide_Stance_Stiff_Legs"]],

  // ── Hinge / Soulevé / Fessiers ────────────────────────────
  [/soulev[ée] (de terre )?roumain|romanian deadlift|rdl/i, ["Romanian_Deadlift", "Stiff-Legged_Dumbbell_Deadlift"]],
  [/soulev[ée] de terre|deadlift/i, ["Barbell_Deadlift", "Sumo_Deadlift"]],
  [/hip thrust/i, ["Barbell_Hip_Thrust", "Barbell_Glute_Bridge"]],
  [/pont fessier|glute bridge/i, ["Barbell_Glute_Bridge", "Hip_Lift_with_Band"]],
  [/kettlebell swing/i, ["One-Arm_Kettlebell_Swings", "Two-Arm_Kettlebell_Clean"]],

  // ── Jambes isolation ──────────────────────────────────────
  [/leg curl|ischio.?jambier/i, ["Lying_Leg_Curls", "Seated_Leg_Curl"]],
  [/leg extension|quadriceps|extension cuisses?/i, ["Leg_Extensions"]],
  [/fentes|lunges?/i, ["Dumbbell_Lunges", "Bodyweight_Walking_Lunge", "Barbell_Lunge"]],
  [/mollets? debout|standing calf/i, ["Standing_Calf_Raises", "Calf_Press"]],
  [/mollets?(sur marche)?|calf raise/i, ["Standing_Calf_Raises", "Seated_Calf_Raise"]],

  // ── Core / Abdos ───────────────────────────────────────────
  [/dead bug/i, ["Dead_Bug", "Flat_Bench_Lying_Leg_Raise"]],
  [/pallof press/i, ["Pallof_Press", "Reverse_Cable_Curl"]],
  [/gainage lat[ée]ral|side plank|side bridge/i, ["Side_Bridge", "Plank"]],
  [/gainage|plank|planche/i, ["Plank", "Side_Bridge"]],
  [/crunch poulie|cable crunch/i, ["Cable_Crunch", "Crunches"]],
  [/crunch|abs|abdos|hollow|sit.?up/i, ["Crunches", "Air_Bike", "Ab_Crunch_Machine"]],
  [/relev[ée]s? (de )?jambes|leg raise|hanging leg/i, ["Hanging_Leg_Raise", "Flat_Bench_Lying_Leg_Raise"]],
  [/farmer.?walk|farmer.?carry/i, ["Farmers_Walk", "Rickshaw_Carry"]],
  [/suspension|grip hang/i, ["Hanging_Leg_Raise"]],

  // ── Cardio (peu d'images dans Free Ex DB, on garde Unsplash) ────
  [/tapis inclin|incline walk/i, ["unsplash:1538805060514-97d9cc17730c", "unsplash:1591741535018-d042766c62eb", "unsplash:1571902943202-3935a0a3a47a"]],
  [/marche soutenue|marche optionnelle|marche/i, ["unsplash:1538805060514-97d9cc17730c", "unsplash:1591741535018-d042766c62eb"]],
  [/v[ée]lo|cycling|spin/i, ["unsplash:1534258936925-c58bed479fcb", "unsplash:1591741535018-d042766c62eb", "unsplash:1538805060514-97d9cc17730c"]],
  [/rameur/i, ["unsplash:1574680096145-d05b474e2155", "unsplash:1538805060514-97d9cc17730c", "unsplash:1591741535018-d042766c62eb"]],
  [/elliptique|stairmaster/i, ["unsplash:1538805060514-97d9cc17730c", "unsplash:1591741535018-d042766c62eb"]],
  [/corde [aà] sauter|jump rope/i, ["Rope_Jumping"]],
  [/cardio (intervalles|hiit|zone)|hiit|intervalles/i, ["unsplash:1591741535018-d042766c62eb", "unsplash:1538805060514-97d9cc17730c"]],
  [/cardio/i, ["unsplash:1591741535018-d042766c62eb", "unsplash:1538805060514-97d9cc17730c", "unsplash:1534258936925-c58bed479fcb"]],

  // ── Mobilité / étirements / respiration ─────────────────────
  [/mobilit[ée] hanches?/i, ["unsplash:1518611012118-696072aa579a", "unsplash:1545205597-3d9d02c29597"]],
  [/rotations? thoraciques?|t-spine/i, ["unsplash:1545205597-3d9d02c29597", "unsplash:1518611012118-696072aa579a"]],
  [/mobilit[ée]/i, ["unsplash:1518611012118-696072aa579a", "unsplash:1545205597-3d9d02c29597", "unsplash:1506629082955-511b1aa562c8"]],
  [/respiration/i, ["unsplash:1545205597-3d9d02c29597", "unsplash:1518611012118-696072aa579a"]],
  [/[ée]tirement pectoraux|[ée]tirement (pectoraux|mur)/i, ["unsplash:1518611012118-696072aa579a", "unsplash:1545205597-3d9d02c29597"]],
  [/[ée]tirement|stretch|yoga/i, ["unsplash:1518611012118-696072aa579a", "unsplash:1545205597-3d9d02c29597", "unsplash:1506629082955-511b1aa562c8"]]
];

// Verify each slug exists in the DB, log a warning if not.
const used = new Set();
const missing = [];
for (const [, slugs] of MAPPING) {
  for (const slug of slugs) {
    if (slug.startsWith("unsplash:")) continue;
    used.add(slug);
    if (!DB_BY_ID[slug]) missing.push(slug);
  }
}

if (missing.length > 0) {
  console.error("\n⚠ Slugs missing from Free Exercise DB:");
  for (const m of missing) console.error("  - " + m);
  console.error("");
}

// Output the TypeScript file
const header = `// AUTO-GENERATED by scripts/generate-exercise-map.mjs
// Source: Free Exercise DB (https://github.com/yuhonas/free-exercise-db, CC0)
// Each pattern matches an exercise name; the first match wins. Each pattern
// resolves to 2-4 photos (both images for each slug = start/end of the movement).

export type ExerciseImageEntry = {
  pattern: RegExp;
  photos: string[];
};

const fdb = (slug: string, index: 0 | 1) =>
  \`https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/\${slug}/\${index}.jpg\`;

const u = (id: string) =>
  \`https://images.unsplash.com/photo-\${id}?auto=format&fit=crop&w=1200&q=70\`;

export const EXERCISE_IMAGE_MAP: ExerciseImageEntry[] = [
`;

const entries = MAPPING.map(([regex, slugs]) => {
  const photos = slugs.flatMap((slug) => {
    if (slug.startsWith("unsplash:")) {
      const id = slug.slice("unsplash:".length);
      return [`u(${JSON.stringify(id)})`];
    }
    // Use both images (start + end) for each slug
    return [`fdb(${JSON.stringify(slug)}, 0)`, `fdb(${JSON.stringify(slug)}, 1)`];
  });
  // Limit to 4 max for snappy carousel
  const trimmed = photos.slice(0, 4);
  return `  { pattern: ${regex.toString()}, photos: [${trimmed.join(", ")}] }`;
}).join(",\n");

const footer = `
];

export function getExerciseImages(exerciseName: string): string[] | null {
  for (const entry of EXERCISE_IMAGE_MAP) {
    if (entry.pattern.test(exerciseName)) return entry.photos;
  }
  return null;
}
`;

process.stdout.write(header + entries + footer);
console.error(`\n✓ Generated ${MAPPING.length} patterns, ${used.size} unique slugs used.`);
