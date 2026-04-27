import type { EffortStatus } from "@/types/training";

export type RestTimerState = {
  done: boolean;
  exerciseId?: string;
  initialSeconds: number;
  running: boolean;
  secondsLeft: number;
};

export type StatusOption = {
  value: EffortStatus;
  label: string;
  idle: string;
  active: string;
};

export const statusOptions: StatusOption[] = [
  {
    value: "ok",
    label: "OK",
    idle: "border-sea/25 bg-sea/10 text-sea",
    active: "border-sea bg-sea text-white"
  },
  {
    value: "easy",
    label: "Facile",
    idle: "border-sea/25 bg-sea/10 text-sea",
    active: "border-sea bg-sea text-white"
  },
  {
    value: "hard",
    label: "Trop dur",
    idle: "border-coral/30 bg-coral/10 text-coral",
    active: "border-coral bg-coral text-white"
  },
  {
    value: "pain",
    label: "Douleur",
    idle: "border-red-500/30 bg-red-500/10 text-red-600",
    active: "border-red-600 bg-red-600 text-white"
  },
  {
    value: "skipped",
    label: "Pas fait",
    idle: "border-black/10 bg-mist text-ink/70",
    active: "border-zinc-500 bg-zinc-600 text-white"
  }
];

export const quickReasonOptions = [
  "douleur poignet",
  "douleur epaule",
  "douleur dos",
  "douleur genou",
  "souffle",
  "trop lourd",
  "manque d'energie"
];

export function statusLabel(status: EffortStatus) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}
