"use client";

import { useMemo } from "react";
import { MainGoalsSection } from "@/components/performance/MainGoalsSection";
import { PerformanceCard as PerformanceCardView } from "@/components/performance/PerformanceCard";
import {
  NextTargetsSection,
  TopProgressionsSection,
  WatchListSection
} from "@/components/performance/SignalSections";
import { useCoachStorage } from "@/lib/storage";
import type { CompletedSession, Exercise, ExerciseLog, PlannedSession } from "@/types/training";

type PerformanceKind = "cardio" | "strength";

type PerformanceDefinition = {
  key: string;
  label: string;
  kind: PerformanceKind;
  match: RegExp;
  referenceBest?: string;
};

type PerformanceEntry = {
  date: string;
  exerciseName: string;
  log: ExerciseLog;
  session: CompletedSession;
  loadKg?: number;
  repsTotal?: number;
  volume?: number;
  cardio: CardioMetrics;
};

export type CardioMetrics = {
  distanceKm?: number;
  durationMin?: number;
  incline?: number;
  rounds?: number;
  speedKmh?: number;
};

export type ExercisePerformance = {
  best: string;
  bestBadge?: string;
  cardioBest?: CardioMetrics;
  definition: PerformanceDefinition;
  latest: string;
  nextTarget: string;
  progression: string;
  recentDelta: number;
  trend: "douleur" | "pas assez de donnÃ©es" | "progresse" | "rÃ©gresse" | "stable";
  volume?: number;
};

const performanceDefinitions: PerformanceDefinition[] = [
  {
    key: "bench",
    label: "DÃ©veloppÃ© couchÃ©",
    kind: "strength",
    match: /d[Ã©e]velopp[Ã©e] couch|developpe couche|bench/i,
    referenceBest: "127 kg x 1"
  },
  { key: "leg-press", label: "Presse Ã  cuisses", kind: "strength", match: /presse|leg press/i },
  { key: "lat-pulldown", label: "Tirage vertical", kind: "strength", match: /tirage vertical|tractions? assist/i },
  { key: "rowing", label: "Rowing", kind: "strength", match: /rowing/i },
  { key: "shoulder-press", label: "DÃ©veloppÃ© Ã©paules", kind: "strength", match: /d[Ã©e]velopp[Ã©e] [Ã©e]paules|shoulder press/i },
  {
    key: "hinge",
    label: "Hip thrust / soulevÃ© roumain",
    kind: "strength",
    match: /hip thrust|soulev[Ã©e] de terre roumain|roumain|rdl|deadlift/i,
    referenceBest: "170 kg"
  },
  { key: "leg-extension", label: "Leg extension", kind: "strength", match: /leg extension/i },
  { key: "leg-curl", label: "Leg curl", kind: "strength", match: /leg curl/i },
  { key: "incline-treadmill", label: "Tapis inclinÃ©", kind: "cardio", match: /tapis|marche|zone 2/i },
  { key: "interval-cardio", label: "Rameur / intervalles", kind: "cardio", match: /rameur|intervalles|stairmaster|rounds?/i },
  { key: "grip", label: "Grip / suspension", kind: "strength", match: /farmer|suspension|grip|hang/i }
];

export function PerformanceDashboard() {
  const { currentProgram, history, isReady, settings } = useCoachStorage();
  const dashboard = useMemo(
    () => buildPerformanceDashboard(history, currentProgram),
    [currentProgram, history]
  );

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  if (history.length === 0) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Mes performances</p>
        <h2 className="mt-1 text-2xl font-black">Fais ta premiÃ¨re sÃ©ance pour gÃ©nÃ©rer tes performances.</h2>
        <p className="mt-2 text-sm font-semibold text-ink/60">
          Les records, volumes, tendances et prochaines cibles seront calculÃ©s depuis ton historique local.
        </p>
      </section>
    );
  }

  const bench = dashboard.performances.find((item) => item.definition.key === "bench");

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-ink p-5 text-white shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Vue athlÃ¨te</p>
        <h2 className="mt-1 text-3xl font-black leading-tight">
          {bench?.trend === "progresse" ? "Tu avances" : "RepÃ¨res principaux"}
        </h2>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <HeroMetric label="Bench" value={bench?.latest ?? "-"} />
          <HeroMetric label="Record" value={bench?.best ?? "127 kg x 1"} />
          <HeroMetric label="Cible" value={bench?.nextTarget ?? "-"} />
        </div>
      </section>

      <MainGoalsSection targetWeight={settings.targetWeightKg} />

      <WatchListSection items={dashboard.watchItems} />
      <TopProgressionsSection items={dashboard.topProgressions} />
      <NextTargetsSection items={dashboard.nextTargets} />

      <section className="space-y-3">
        <div>
          <p className="text-sm font-black uppercase text-moss">Exercices suivis</p>
          <h2 className="mt-1 text-2xl font-black">Cartes performances</h2>
        </div>
        {dashboard.performances.map((performance) => (
          <PerformanceCardView
            formatCardioMetrics={formatCardioMetrics}
            formatVolume={formatVolume}
            key={performance.definition.key}
            performance={performance}
          />
        ))}
      </section>
    </div>
  );
}


function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3 text-center">
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-white/60">{label}</p>
    </div>
  );
}


function buildPerformanceDashboard(history: CompletedSession[], program: PlannedSession[]) {
  const performances = performanceDefinitions.map((definition) => buildExercisePerformance(definition, history, program));
  const watchItems = buildWatchItems(history, performances);
  const topProgressions = performances
    .filter((performance) => performance.recentDelta > 0)
    .sort((a, b) => b.recentDelta - a.recentDelta)
    .slice(0, 3)
    .map((performance) => `${performance.definition.label} : ${performance.progression}`);

  return {
    nextTargets: performances
      .filter((performance) => performance.nextTarget !== "Ã€ dÃ©finir")
      .slice(0, 5)
      .map((performance) => `${performance.definition.label} : ${performance.nextTarget}`),
    performances,
    topProgressions,
    watchItems
  };
}

function buildExercisePerformance(
  definition: PerformanceDefinition,
  history: CompletedSession[],
  program: PlannedSession[]
): ExercisePerformance {
  const entries = collectEntries(definition, history);
  const latest = entries.at(-1);
  const previous = entries.at(-2);
  const planned = findPlannedExercise(program, definition.match);
  const trend = getTrend(entries);
  const recentDelta = getRecentDelta(latest, previous, definition.kind);
  const progression = formatRecentProgression(recentDelta, definition.kind);
  const bestCardio = definition.kind === "cardio" ? getBestCardio(entries) : undefined;
  const bestStrength = definition.kind === "strength" ? getBestStrength(entries, definition.referenceBest) : undefined;
  const bestLabel = bestCardio?.label ?? bestStrength?.label ?? "Aucune donnÃ©e";

  return {
    best: bestLabel,
    bestBadge: bestStrength?.isReference || entries.length ? "record" : undefined,
    cardioBest: bestCardio?.cardio,
    definition,
    latest: latest ? formatEntry(latest, definition.kind) : "Aucune donnÃ©e",
    nextTarget: planned ? formatPlannedTarget(planned) : "Ã€ dÃ©finir",
    progression,
    recentDelta,
    trend,
    volume: latest?.volume
  };
}

function collectEntries(definition: PerformanceDefinition, history: CompletedSession[]): PerformanceEntry[] {
  return [...history]
    .reverse()
    .flatMap((session) =>
      Object.values(session.logs).flatMap((log) => {
        const progression = session.progressions?.[log.exerciseId];
        const exerciseName = progression?.exerciseName ?? log.exerciseId;

        if (!definition.match.test(`${log.exerciseId} ${exerciseName}`)) {
          return [];
        }

        const loadKg = parseKg(log.usedLoad);
        const reps = parseReps(log.completedReps);
        const volume = loadKg !== undefined && reps.total > 0 ? loadKg * reps.total : undefined;

        return [
          {
            cardio: parseCardioMetrics(`${log.usedLoad} ${log.completedReps} ${log.comment} ${progression?.nextTarget ?? ""}`),
            date: session.completedAt,
            exerciseName,
            loadKg,
            log,
            repsTotal: reps.total || undefined,
            session,
            volume
          }
        ];
      })
    );
}

function findPlannedExercise(program: PlannedSession[], match: RegExp): Exercise | undefined {
  return program.flatMap((session) => session.exercises).find((exercise) => match.test(`${exercise.id} ${exercise.name}`));
}

function getTrend(entries: PerformanceEntry[]): ExercisePerformance["trend"] {
  const recent = entries.slice(-4);
  const hasPain = recent.some((entry) => {
    const text = `${entry.log.comment} ${entry.log.status}`;
    return entry.log.status === "pain" || /douleur|poignet|Ã©paule|epaule|dos|genou|oppression|vertige/i.test(text);
  });

  if (hasPain) {
    return "douleur";
  }

  if (entries.length < 2) {
    return "pas assez de donnÃ©es";
  }

  const latest = entries.at(-1);
  const previous = entries.at(-2);
  const delta = getRecentDelta(latest, previous, latest?.loadKg !== undefined ? "strength" : "cardio");

  if (delta > 0.5) {
    return "progresse";
  }

  if (delta < -0.5) {
    return "rÃ©gresse";
  }

  return "stable";
}

function getRecentDelta(latest: PerformanceEntry | undefined, previous: PerformanceEntry | undefined, kind: PerformanceKind) {
  if (!latest || !previous) {
    return 0;
  }

  if (kind === "cardio") {
    return cardioScore(latest.cardio) - cardioScore(previous.cardio);
  }

  if (latest.loadKg !== undefined && previous.loadKg !== undefined && latest.loadKg !== previous.loadKg) {
    return latest.loadKg - previous.loadKg;
  }

  return (latest.volume ?? 0) - (previous.volume ?? 0);
}

function getBestStrength(entries: PerformanceEntry[], referenceBest?: string) {
  const bestEntry = entries
    .filter((entry) => entry.loadKg !== undefined)
    .sort((a, b) => (b.loadKg ?? 0) - (a.loadKg ?? 0) || (b.volume ?? 0) - (a.volume ?? 0))[0];
  const referenceLoad = parseKg(referenceBest);

  if (referenceBest && (bestEntry?.loadKg === undefined || (referenceLoad ?? 0) >= bestEntry.loadKg)) {
    return { isReference: true, label: referenceBest };
  }

  return { isReference: false, label: bestEntry ? formatEntry(bestEntry, "strength") : referenceBest ?? "Aucune donnÃ©e" };
}

function getBestCardio(entries: PerformanceEntry[]) {
  const bestEntry = entries.sort((a, b) => cardioScore(b.cardio) - cardioScore(a.cardio))[0];

  return {
    cardio: bestEntry?.cardio,
    isReference: false,
    label: bestEntry ? formatCardioMetrics(bestEntry.cardio) : "Aucune donnÃ©e"
  };
}

function buildWatchItems(history: CompletedSession[], performances: ExercisePerformance[]) {
  const items = new Set<string>();

  for (const session of history.slice(0, 8)) {
    for (const log of Object.values(session.logs)) {
      const progression = session.progressions?.[log.exerciseId];
      const name = progression?.exerciseName ?? log.exerciseId;
      const text = `${name} ${log.comment} ${progression?.warning ?? ""} ${session.feedback?.breath ?? ""}`;

      if (log.status === "pain" || /douleur|poignet|Ã©paule|epaule|dos|genou/i.test(text)) {
        items.add(`${name} : douleur ou gÃªne signalÃ©e`);
      }

      if (log.status === "hard") {
        items.add(`${name} : souvent trop dur, surveiller charge ou volume`);
      }

      if (/cardio|tapis|rameur|intervalles|stairmaster/i.test(name) && (log.status === "hard" || /tres-mauvais|vertige|oppression|souffle/i.test(text))) {
        items.add(`${name} : souffle/cardio Ã  surveiller`);
      }
    }
  }

  for (const performance of performances) {
    if (performance.trend === "stable") {
      items.add(`${performance.definition.label} : tendance stable, viser reps propres ou petit ajustement`);
    }
  }

  if ([...items].some((item) => /poignet/i.test(item))) {
    items.add("Poignet droit : garder prises neutres et Ã©viter les hausses agressives");
  }

  return [...items].slice(0, 8);
}

function formatEntry(entry: PerformanceEntry, kind: PerformanceKind) {
  if (kind === "cardio") {
    return formatCardioMetrics(entry.cardio);
  }

  return `${entry.log.usedLoad || "-"} â€” ${entry.log.completedReps || "-"}`;
}

function formatPlannedTarget(exercise: Exercise) {
  const load = exercise.plannedLoad ? `${exercise.plannedLoad} â€” ` : "";
  return `${load}${exercise.target}`;
}

function formatRecentProgression(delta: number, kind: PerformanceKind) {
  if (!delta) {
    return "pas assez de donnÃ©es";
  }

  if (kind === "cardio") {
    return `${delta > 0 ? "+" : ""}${formatNumber(delta)} pts cardio`;
  }

  if (Math.abs(delta) < 50) {
    return `${delta > 0 ? "+" : ""}${formatKg(delta)}`;
  }

  return `${delta > 0 ? "+" : ""}${Math.round(delta)} kg de volume`;
}

function formatCardioMetrics(metrics?: CardioMetrics) {
  if (!metrics || !Object.values(metrics).some((value) => value !== undefined)) {
    return "Aucune donnÃ©e";
  }

  return [
    metrics.durationMin ? `${metrics.durationMin} min` : undefined,
    metrics.speedKmh ? `${formatNumber(metrics.speedKmh)} km/h` : undefined,
    metrics.incline ? `${formatNumber(metrics.incline)} %` : undefined,
    metrics.distanceKm ? `${formatNumber(metrics.distanceKm)} km` : undefined,
    metrics.rounds ? `${metrics.rounds} rounds` : undefined
  ]
    .filter(Boolean)
    .join(" â€” ");
}

function formatVolume(value?: number) {
  return value ? `${Math.round(value)} kg` : "Non calculable";
}

function parseReps(value: string) {
  const normalized = value.toLowerCase().replace(/,/g, ".");
  const setRep = normalized.match(/(\d+)\s*x\s*(\d+)/);

  if (setRep) {
    return { total: Number(setRep[1]) * Number(setRep[2]) };
  }

  const numbers = normalized.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  return { total: numbers.reduce((sum, number) => sum + number, 0) };
}

function parseKg(value?: string) {
  if (!value) {
    return undefined;
  }

  const match = value.match(/(\d+(?:[,.]\d+)?)\s*kg/i) ?? value.match(/(\d+(?:[,.]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : undefined;
}

function parseCardioMetrics(value: string): CardioMetrics {
  const duration = value.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/i);
  const speed = value.match(/(\d+(?:[,.]\d+)?)\s*km\/h/i);
  const incline = value.match(/(\d+(?:[,.]\d+)?)\s*%/i);
  const distance = value.match(/(\d+(?:[,.]\d+)?)\s*km(?!\/h)/i);
  const rounds = value.match(/(\d+)\s*round/i);

  return {
    distanceKm: distance ? Number(distance[1].replace(",", ".")) : undefined,
    durationMin: duration ? Number(duration[2] ?? duration[1]) : undefined,
    incline: incline ? Number(incline[1].replace(",", ".")) : undefined,
    rounds: rounds ? Number(rounds[1]) : undefined,
    speedKmh: speed ? Number(speed[1].replace(",", ".")) : undefined
  };
}

function cardioScore(metrics: CardioMetrics) {
  return (
    (metrics.durationMin ?? 0) +
    (metrics.speedKmh ?? 0) * 2 +
    (metrics.incline ?? 0) * 1.5 +
    (metrics.distanceKm ?? 0) * 5 +
    (metrics.rounds ?? 0) * 2
  );
}

function formatKg(value: number) {
  return `${formatNumber(value)} kg`;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");
}
