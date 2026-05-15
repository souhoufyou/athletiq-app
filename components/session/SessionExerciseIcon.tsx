import type { ReactElement } from "react";
import type { Exercise } from "@/types/training";

type Category =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "core"
  | "cardio"
  | "mobility"
  | "default";

function categoryFor(exercise: Exercise): Category {
  if (exercise.classification === "mobilite") return "mobility";
  if (exercise.classification === "cardio") return "cardio";

  const groups = exercise.muscleGroups ?? [];
  if (groups.includes("cardio")) return "cardio";
  if (groups.includes("abdos")) return "core";
  if (groups.includes("jambes")) return "legs";

  const pattern = exercise.taxonomy?.pattern;
  if (pattern) {
    if (pattern.startsWith("chest") || pattern.includes("shoulders") || pattern.includes("triceps")) return "push";
    if (pattern.startsWith("back") || pattern.includes("biceps")) return "pull";
    if (pattern.startsWith("legs")) return "legs";
    if (pattern === "core") return "core";
    if (pattern.startsWith("cardio")) return "cardio";
    if (pattern === "mobility") return "mobility";
  }

  if (groups.includes("pectoraux") || groups.includes("epaules") || groups.includes("triceps")) return "push";
  if (groups.includes("dos") || groups.includes("biceps")) return "pull";

  return "default";
}

type Props = {
  exercise?: Exercise;
  category?: Category;
  className?: string;
};

export function SessionExerciseIcon({ exercise, category: categoryProp, className }: Props) {
  const category = categoryProp ?? (exercise ? categoryFor(exercise) : "default");
  const Icon = ICON_MAP[category];
  const tone = TONE_MAP[category];

  return (
    <span
      className={`inline-flex items-center justify-center rounded-2xl border ${tone.border} ${tone.bg} ${className ?? "size-16"}`}
      aria-hidden="true"
    >
      <Icon className={`size-9 ${tone.text}`} />
    </span>
  );
}

const TONE_MAP: Record<Category, { bg: string; border: string; text: string }> = {
  push:     { bg: "bg-coral/10",   border: "border-coral/30",   text: "text-coral" },
  pull:     { bg: "bg-sky/10",     border: "border-sky/30",     text: "text-sky" },
  legs:     { bg: "bg-amber/10",   border: "border-amber/30",   text: "text-amber" },
  upper:    { bg: "bg-coral/10",   border: "border-coral/30",   text: "text-coral" },
  lower:    { bg: "bg-amber/10",   border: "border-amber/30",   text: "text-amber" },
  core:     { bg: "bg-lemon/10",   border: "border-lemon/30",   text: "text-lemon" },
  cardio:   { bg: "bg-coral/10",   border: "border-coral/30",   text: "text-coral" },
  mobility: { bg: "bg-sea/10",     border: "border-sea/30",     text: "text-sea" },
  default:  { bg: "bg-white/8",    border: "border-white/15",   text: "text-white/80" }
};

type IconProps = { className?: string };

function PushIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Barbell + push direction */}
      <rect x="3" y="14" width="3" height="4" />
      <rect x="6" y="12" width="3" height="8" />
      <line x1="9" y1="16" x2="23" y2="16" />
      <rect x="23" y="12" width="3" height="8" />
      <rect x="26" y="14" width="3" height="4" />
    </svg>
  );
}

function PullIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Pull-up bar */}
      <line x1="4" y1="7" x2="28" y2="7" />
      <line x1="6" y1="7" x2="6" y2="4" />
      <line x1="26" y1="7" x2="26" y2="4" />
      <line x1="12" y1="7" x2="12" y2="14" />
      <line x1="20" y1="7" x2="20" y2="14" />
      <path d="M11 14h10" />
      <path d="M14 14v9" />
      <path d="M18 14v9" />
    </svg>
  );
}

function LegsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Squat silhouette */}
      <circle cx="16" cy="6" r="2.4" />
      <path d="M16 9v6" />
      <path d="M16 15l-5 6 2 6" />
      <path d="M16 15l5 6-2 6" />
      <path d="M9 21h14" />
    </svg>
  );
}

function CoreIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* 6-pack grid */}
      <rect x="9" y="7" width="14" height="18" rx="3" />
      <line x1="16" y1="9" x2="16" y2="23" />
      <line x1="9" y1="13" x2="23" y2="13" />
      <line x1="9" y1="19" x2="23" y2="19" />
    </svg>
  );
}

function CardioIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Heart with pulse */}
      <path d="M16 26c-5-3.4-9-7-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5-4 8.6-9 12z" />
      <path d="M7 16h3l2-3 3 6 2-4h7" />
    </svg>
  );
}

function MobilityIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Stretch / yoga */}
      <circle cx="16" cy="6" r="2.4" />
      <path d="M16 9c3 2 5 5 5 9" />
      <path d="M16 9c-3 2-5 5-5 9" />
      <path d="M9 24c2-2 5-3 7-3s5 1 7 3" />
    </svg>
  );
}

function DefaultIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="13" width="3" height="6" />
      <rect x="6" y="10" width="3" height="12" />
      <line x1="9" y1="16" x2="23" y2="16" />
      <rect x="23" y="10" width="3" height="12" />
      <rect x="26" y="13" width="3" height="6" />
    </svg>
  );
}

const ICON_MAP: Record<Category, (props: IconProps) => ReactElement> = {
  push: PushIcon,
  pull: PullIcon,
  legs: LegsIcon,
  upper: PushIcon,
  lower: LegsIcon,
  core: CoreIcon,
  cardio: CardioIcon,
  mobility: MobilityIcon,
  default: DefaultIcon
};

// Re-exported for tests / future use
export type SessionExerciseCategory = Category;
export function getSessionExerciseCategory(exercise: Exercise): Category {
  return categoryFor(exercise);
}

