// Curated Unsplash photo URLs for session cards.
// Selection key = lowercased focus / title; fallback = generic strength.

const IMAGES: Array<{ keywords: RegExp; url: string }> = [
  {
    // Chest / push / bench
    keywords: /(pectoraux|chest|bench|couche|push|pousser|developpe couche|développé couché)/i,
    url: "https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?auto=format&fit=crop&w=1200&q=70"
  },
  {
    // Back / pull / rowing / lats
    keywords: /(dos|back|tirage|rowing|tractions?|pull|lats)/i,
    url: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=1200&q=70"
  },
  {
    // Legs / squat / hinge
    keywords: /(jambes|legs|squat|presse|fentes|hinge|deadlift|soulev|hip thrust)/i,
    url: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=70"
  },
  {
    // Shoulders / arms
    keywords: /(épaules|epaules|shoulders|arms|biceps|triceps|bras)/i,
    url: "https://images.unsplash.com/photo-1581122584612-713f89daa8eb?auto=format&fit=crop&w=1200&q=70"
  },
  {
    // Cardio / running / treadmill
    keywords: /(cardio|tapis|running|course|hiit|intervalles|zone 2|stairmaster|rameur|marche)/i,
    url: "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=1200&q=70"
  },
  {
    // Mobility / core / abs
    keywords: /(mobilité|mobilite|core|abdos|abs|gainage|stretching|étirement|etirement)/i,
    url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=70"
  },
  {
    // Judo / martial arts
    keywords: /(judo|combat|martial|grappling|bjj)/i,
    url: "https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=1200&q=70"
  }
];

const FALLBACK = "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1200&q=70";

export function getSessionImage(...labels: Array<string | undefined>): string {
  const haystack = labels.filter(Boolean).join(" ");
  if (!haystack) return FALLBACK;

  for (const entry of IMAGES) {
    if (entry.keywords.test(haystack)) return entry.url;
  }

  return FALLBACK;
}
