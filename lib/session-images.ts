// Curated Unsplash photo URLs for session cards and exercise demos.
// Strategy:
//   1) If a category is passed (push / pull / legs / upper / lower / cardio / core / mobility),
//      we use a dedicated set of photos for that category.
//   2) Otherwise, we fall back to keyword matching on title/focus.

import type { SessionExerciseCategory } from "@/components/session/SessionExerciseIcon";
import { getExerciseImages } from "@/data/exerciseImageMap";

const CATEGORY_PHOTOS: Record<SessionExerciseCategory, string[]> = {
  // Push : pectoraux / épaules / triceps
  push: [
    "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=1200&q=70", // bench press
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=70", // dumbbell press
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=70"  // shoulder
  ],
  // Pull : dos / biceps
  pull: [
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=70", // pull-up
    "https://images.unsplash.com/photo-1581122584612-713f89daa8eb?auto=format&fit=crop&w=1200&q=70", // back
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=70"  // row
  ],
  // Legs : squat / hinge / fentes
  legs: [
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=70", // squat
    "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=1200&q=70", // leg press
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=70"  // legs gym
  ],
  // Upper body : haut du corps (mix push/pull)
  upper: [
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=70"
  ],
  // Lower body
  lower: [
    "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=70"
  ],
  // Cardio : tapis / course / vélo
  cardio: [
    "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=70", // treadmill
    "https://images.unsplash.com/photo-1591741535018-d042766c62eb?auto=format&fit=crop&w=1200&q=70", // running
    "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=1200&q=70"  // bike
  ],
  // Core / abdos
  core: [
    "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=70", // plank
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=1200&q=70", // abs
    "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1200&q=70"
  ],
  // Mobility / étirements / yoga
  mobility: [
    "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=70", // stretch
    "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=70",   // yoga
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1200&q=70"  // mobility
  ],
  default: [
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=70",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=70"
  ]
};

// Secondary keyword-based mapping (fallback when no category given)
const KEYWORDS: Array<{ keywords: RegExp; category: SessionExerciseCategory }> = [
  { keywords: /(pectoraux|chest|bench|couche|push|pousser|developpe couche|développé couché|épaules|epaules|shoulders|triceps)/i, category: "push" },
  { keywords: /(dos|back|tirage|rowing|tractions?|pull|lats|biceps)/i, category: "pull" },
  { keywords: /(jambes|legs|squat|presse|fentes|hinge|deadlift|soulev|hip thrust|cuisses|fessiers)/i, category: "legs" },
  { keywords: /(upper|haut du corps)/i, category: "upper" },
  { keywords: /(lower|bas du corps)/i, category: "lower" },
  { keywords: /(cardio|tapis|running|course|hiit|intervalles|zone 2|stairmaster|rameur|marche|velo)/i, category: "cardio" },
  { keywords: /(core|abdos|abs|gainage)/i, category: "core" },
  { keywords: /(mobilité|mobilite|stretching|étirement|etirement|yoga)/i, category: "mobility" }
];

function findCategory(labels: Array<string | undefined>): SessionExerciseCategory {
  for (const label of labels) {
    if (!label) continue;
    if (label in CATEGORY_PHOTOS) return label as SessionExerciseCategory;
  }
  const haystack = labels.filter(Boolean).join(" ");
  if (haystack) {
    for (const entry of KEYWORDS) {
      if (entry.keywords.test(haystack)) return entry.category;
    }
  }
  return "default";
}

/**
 * Returns the primary image (1st of the category). Used for hero cards.
 */
export function getSessionImage(...labels: Array<string | undefined>): string {
  const category = findCategory(labels);
  return CATEGORY_PHOTOS[category][0];
}

/**
 * Returns the array of 2-3 photos for the matched exercise/category.
 * Tries the per-exercise curated map first, then falls back to category.
 * Used for the exercise demo sheet (carousel).
 */
export function getSessionImages(...labels: Array<string | undefined>): string[] {
  // Try exercise-specific match first (uses the longer labels)
  for (const label of labels) {
    if (!label) continue;
    const specific = getExerciseImages(label);
    if (specific) return specific;
  }
  // Fallback: category-level
  const category = findCategory(labels);
  return CATEGORY_PHOTOS[category];
}

export function getSessionImageByCategory(category: SessionExerciseCategory): string {
  return CATEGORY_PHOTOS[category][0];
}

export function getSessionImagesByCategory(category: SessionExerciseCategory): string[] {
  return CATEGORY_PHOTOS[category];
}
