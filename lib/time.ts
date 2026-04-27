export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatDurationLong(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h${String(minutes).padStart(2, "0")}`;
  }

  if (minutes === 0) {
    return totalSeconds > 0 ? "<1 min" : "0 min";
  }

  return `${minutes} min`;
}

export function parseRestSeconds(rest: string): number {
  const normalized = rest.toLowerCase().replace(",", ".");

  if (normalized.includes("libre")) {
    return 0;
  }

  const minSec = normalized.match(/(\d+)\s*min\s*(\d+)?/);

  if (minSec) {
    return Number(minSec[1]) * 60 + Number(minSec[2] ?? 0);
  }

  const seconds = normalized.match(/(\d+)\s*s/);

  if (seconds) {
    return Number(seconds[1]);
  }

  const minutes = normalized.match(/(\d+)\s*-\s*(\d+)\s*min/);

  if (minutes) {
    return Number(minutes[1]) * 60;
  }

  return 90;
}
