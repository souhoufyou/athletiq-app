// Curated Unsplash photo URLs for session cards.
// Strategy:
//   1) If a category is passed (push / pull / legs / upper / lower / cardio / core / mobility),
//      we use the dedicated photo for that category.
//   2) Otherwise, we fall back to keyword matching on title/focus.

import type { SessionExerciseCategory } from "@/components/session/SessionExerciseIcon";

const CATEGORY_IMAGES: Record<SessionExerciseCategory, string> = {
  // Push : pectoraux / épaules / triceps — développé couché en gros plan
  push: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=1200&q=70",
  // Pull : dos / biceps — tractions / lat pull
  pull: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=70",
  // Legs : squat / hinge / fentes
  legs: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=70",
  // Upper body : haut du corps (mix push/pull)
  upper: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=70",
  // Lower body : bas du corps complet
  lower: "https://images.unsplash.com/photo-1517344884509-a0c97ec11bcc?auto=format&fit=crop&w=1200&q=70",
  // Cardio : tapis / course / vélo
  cardio: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=70",
  // Core / abdos : gainage / planches
  core: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?auto=format&fit=crop&w=1200&q=70",
  // Mobilité / étirements / yoga
  mobility: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=70",
  // Default : haltère générique
  default: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=70"
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

/**
 * Get an image URL for a session card.
 * Pass the session category if you have it (best match);
 * otherwise pass title/focus strings and we'll match by keywords.
 */
export function getSessionImage(...labels: Array<string | undefined>): string {
  // First: check if any label is a category key directly (push/pull/legs/etc.)
  for (const label of labels) {
    if (!label) continue;
    if (label in CATEGORY_IMAGES) {
      return CATEGORY_IMAGES[label as SessionExerciseCategory];
    }
  }

  // Second: keyword-based match on title/focus
  const haystack = labels.filter(Boolean).join(" ");
  if (haystack) {
    for (const entry of KEYWORDS) {
      if (entry.keywords.test(haystack)) {
        return CATEGORY_IMAGES[entry.category];
      }
    }
  }

  return CATEGORY_IMAGES.default;
}

export function getSessionImageByCategory(category: SessionExerciseCategory): string {
  return CATEGORY_IMAGES[category];
}
