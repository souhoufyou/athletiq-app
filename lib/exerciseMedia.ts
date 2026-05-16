/**
 * Per-exercise demo media (image / GIF / short video) uploaded by the user.
 *
 * Storage strategy:
 *   - Keyed by a normalised exercise name (so the same exercise across profiles
 *     shares the same demo).
 *   - One global localStorage entry, NOT profile-scoped.
 *   - Max 3 MB per entry (validated at upload time, see lib/imageUpload).
 */

const MEDIA_KEY = "coach-adaptatif:exercise-media";

export type ExerciseMediaType = "image" | "gif" | "video";

export type ExerciseMediaEntry = {
  dataUrl: string;
  type: ExerciseMediaType;
  uploadedAt: string;
};

const ACCENT_REGEX = /[̀-ͯ]/g;

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(ACCENT_REGEX, "")    // strip accents
    .replace(/^\s*\+\s*/, "")     // strip "+" prefix used by complement exercises
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readMap(): Record<string, ExerciseMediaEntry> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(MEDIA_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, ExerciseMediaEntry>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MEDIA_KEY, JSON.stringify(map));
  } catch {
    // localStorage quota exceeded — silent (the upload will fail upstream)
  }
}

export function getUserMedia(exerciseName: string): ExerciseMediaEntry | undefined {
  return readMap()[normalize(exerciseName)];
}

export function setUserMedia(exerciseName: string, entry: ExerciseMediaEntry | undefined): void {
  const map = readMap();
  const key = normalize(exerciseName);
  if (entry) map[key] = entry;
  else delete map[key];
  writeMap(map);
}

export function getYouTubeSearchUrl(exerciseName: string): string {
  const cleaned = exerciseName.replace(/^\s*\+\s*/, "").trim();
  const q = encodeURIComponent(`${cleaned} musculation technique`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
