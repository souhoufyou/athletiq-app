"use client";

import { useMemo } from "react";
import { formatDateTime } from "@/lib/date";
import { useCoachStorage } from "@/lib/storage";
import type { CalibrationEvent, CompletedSession, Exercise, ExerciseLog, PlannedSession } from "@/types/training";

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

type CardioMetrics = {
  distanceKm?: number;
  durationMin?: number;
  incline?: number;
  rounds?: number;
  speedKmh?: number;
};

type ExercisePerformance = {
  best: string;
  bestBadge?: string;
  cardioBest?: CardioMetrics;
  definition: PerformanceDefinition;
  latest: string;
  nextTarget: string;
  progression: string;
  recentDelta: number;
  sparkline: number[];
  trend: "douleur" | "pas assez de données" | "progresse" | "régresse" | "stable";
  volume?: number;
};

type PersonalRecord = {
  exerciseName: string;
  prLoad: number;
  prDate: string;
  prReps?: number;
  firstLoad: number;
  progressionKg: number;
  sessionsCount: number;
};

const performanceDefinitions: PerformanceDefinition[] = [
  { key: "bench", label: "1RM Développé couché", kind: "strength", match: /d[ée]velopp[ée] couch|developpe couche|bench/i },
  { key: "squat", label: "1RM Squat", kind: "strength", match: /squat/i },
  { key: "deadlift", label: "1RM Soulevé de terre", kind: "strength", match: /soulev[ée] de terre|deadlift/i },
  { key: "max-pushups", label: "Max pompes", kind: "strength", match: /pompes|push.?ups?/i },
  { key: "max-squats", label: "Max squats (poids du corps)", kind: "strength", match: /squats? poids|bodyweight squat/i },
  { key: "5km", label: "Meilleur 5 km", kind: "cardio", match: /5\s?km|course 5/i },
  { key: "10km", label: "Meilleur 10 km", kind: "cardio", match: /10\s?km|course 10/i }
];

export function PerformanceDashboard() {
  const { currentProgram, history, isReady, settings } = useCoachStorage();
  const dashboard = useMemo(
    () => buildPerformanceDashboard(history, currentProgram),
    [currentProgram, history]
  );
  const personalRecords = useMemo(() => buildPersonalRecords(history), [history]);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  if (history.length === 0) {
    return (
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#11131a] p-5 text-white shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(255,91,0,0.28),transparent_32%)]" />
        <div className="relative">
        <p className="text-sm font-black uppercase text-sky">Mes performances</p>
        <h2 className="mt-1 text-2xl font-black text-white">Fais ta première séance pour générer tes performances.</h2>
        <p className="mt-2 text-sm font-semibold text-white/55">
          Les records, volumes, tendances et prochaines cibles seront calculés depuis ton historique local.
        </p>
        </div>
      </section>
    );
  }

  const bench = dashboard.performances.find((item) => item.definition.key === "bench");
  const squat = dashboard.performances.find((item) => item.definition.key === "squat");
  const deadlift = dashboard.performances.find((item) => item.definition.key === "deadlift");

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#11131a] p-5 text-white shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(255,91,0,0.32),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_46%)]" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-coral">Mes performances</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black leading-tight">Repères clés</h2>
              <p className="mt-2 text-sm font-semibold text-white/55">
                {settings.athleteName} · {dashboard.summary.sessions} séances
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <HeroMetric label="DC" sparkline={bench?.sparkline} value={bench?.best ?? "-"} />
            <HeroMetric label="Squat" sparkline={squat?.sparkline} value={squat?.best ?? "-"} />
            <HeroMetric label="Soulevé" sparkline={deadlift?.sparkline} value={deadlift?.best ?? "-"} />
          </div>
        </div>
      </section>

      <GoalsSection
        mainGoal={settings.mainGoal}
        targetWeightKg={settings.targetWeightKg}
      />

      <SignalSection
        empty="Aucun signal critique récent."
        items={dashboard.watchItems}
        title="À surveiller"
        tone="danger"
      />

      <SignalSection
        empty="Pas encore assez de données positives."
        items={dashboard.topProgressions}
        title="Top progressions"
        tone="progress"
      />

      <SignalSection
        empty="Aucune cible prioritaire."
        items={dashboard.nextTargets}
        title="Prochaines cibles"
        tone="info"
      />

      <CalibrationJournalSection events={settings.calibrationEvents ?? []} />

      {personalRecords.length > 0 ? (
        <section className="space-y-3">
          <div>
            <p className="text-sm font-black uppercase text-sea">Records personnels</p>
            <h2 className="mt-1 text-2xl font-black text-white">Tes meilleures performances</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {personalRecords.map((pr) => (
              <PersonalRecordCard key={pr.exerciseName} pr={pr} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <p className="text-sm font-black uppercase text-white/40">Exercices suivis</p>
          <h2 className="mt-1 text-2xl font-black text-white">Cartes performances</h2>
        </div>
        {dashboard.performances.map((performance) => (
          <PerformanceCard key={performance.definition.key} performance={performance} />
        ))}
      </section>
    </div>
  );
}

function Sparkline({ data, color = "#ff5a00", height = 40, width = 120 }: { data: number[]; color?: string; height?: number; width?: number }) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * innerW,
    y: padding + innerH - ((v - min) / range) * innerH
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;
  const last = points[points.length - 1];
  const pathLength = points.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = points[i - 1];
    return acc + Math.sqrt((p.x - prev.x) ** 2 + (p.y - prev.y) ** 2);
  }, 0);

  return (
    <svg className="overflow-visible" height={height} viewBox={`0 0 ${width} ${height}`} width={width}>
      <defs>
        <linearGradient id={`spark-fill-${color.replace("#", "")}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#spark-fill-${color.replace("#", "")})`} />
      <path
        className="sparkline-path"
        d={pathD}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        style={{
          strokeDasharray: pathLength,
          "--sparkline-length": `${pathLength}`
        } as React.CSSProperties}
      />
      <circle className="sparkline-dot" cx={last.x} cy={last.y} fill={color} r="3" />
    </svg>
  );
}

function PerformanceCard({ performance }: { performance: ExercisePerformance }) {
  const isCardio = performance.definition.kind === "cardio";

  return (
    <article className="card-dark p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-2xl font-black leading-tight text-white">{performance.definition.label}</h3>
          <p className="mt-1 text-sm font-semibold text-white/55">Progression récente : {performance.progression}</p>
        </div>
        <TrendBadge trend={performance.trend} />
      </div>

      {performance.sparkline.length >= 2 ? (
        <div className="mt-3 rounded-xl border border-white/6 bg-white/4 px-3 py-2">
          <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-white/40">Tendance charges</p>
          <Sparkline
            color={performance.trend === "progresse" ? "#24c07a" : performance.trend === "régresse" ? "#ff5a00" : "#f59e0b"}
            data={performance.sparkline}
          />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PerfTile label="Dernière perf" value={performance.latest} />
        <PerfTile label="Meilleure perf" value={performance.best} badge={performance.bestBadge} />
        <PerfTile label="Prochaine cible" value={performance.nextTarget} badge="prochaine cible" />
        <PerfTile
          label={isCardio ? "Meilleure durée/intensité" : "Volume dernière séance"}
          value={isCardio ? formatCardioMetrics(performance.cardioBest) : formatVolume(performance.volume)}
        />
      </div>
    </article>
  );
}

function GoalsSection({
  mainGoal,
  targetWeightKg
}: {
  mainGoal: string;
  targetWeightKg: number;
}) {
  const goals = [
    mainGoal,
    `Objectif poids : ~${targetWeightKg} kg`,
    "Maintenir la mobilité et la santé articulaire"
  ];

  return (
    <section className="rounded-xl border border-sky/20 bg-sky/10 p-4 shadow-soft">
      <h2 className="text-lg font-black text-white">Objectifs principaux</h2>
      <div className="mt-3 space-y-2">
        {goals.map((goal) => (
          <p className="rounded-md bg-white/8 p-3 text-sm font-semibold leading-relaxed text-white/80" key={goal}>
            {goal}
          </p>
        ))}
      </div>
    </section>
  );
}

function SignalSection({
  empty,
  items,
  title,
  tone
}: {
  empty: string;
  items: string[];
  title: string;
  tone: "danger" | "info" | "progress";
}) {
  const toneClass = {
    danger: "border-coral/20 bg-coral/10",
    info: "border-sky/20 bg-sky/10",
    progress: "border-amber/20 bg-amber/10"
  }[tone];

  return (
    <section className={`rounded-xl border p-4 shadow-soft ${toneClass}`}>
      <h2 className="text-lg font-black text-white">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.slice(0, title === "Top progressions" ? 3 : 6).map((item) => (
            <p className="rounded-md bg-white/8 p-3 text-sm font-semibold leading-relaxed text-white/80" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-md bg-white/8 p-3 text-sm font-semibold text-white/50">{empty}</p>
        )}
      </div>
    </section>
  );
}

function CalibrationJournalSection({ events }: { events: CalibrationEvent[] }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase text-white/40">Adaptation</p>
          <h2 className="mt-1 text-2xl font-black text-white">Journal de recalibrage</h2>
        </div>
        <span className="rounded-md bg-white/8 px-2 py-1 text-xs font-black text-white/55">
          {events.length}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {events.length > 0 ? (
          events.slice(0, 8).map((event) => (
            <div className="rounded-lg border border-white/8 bg-white/5 p-3" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <JournalToneBadge tone={event.tone} />
                    <p className="text-sm font-black text-white">{event.title}</p>
                  </div>
                  <p className="mt-2 font-black text-white/85">{event.subject}</p>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-white/60">{event.detail}</p>
                </div>
                <p className="shrink-0 text-xs font-bold text-white/40">{formatJournalDate(event.createdAt)}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-md bg-white/8 p-3 text-sm font-semibold text-white/50">
            Les ajustements de charge, reperes appris et verrouillages apparaitront ici.
          </p>
        )}
      </div>
    </section>
  );
}

function HeroMetric({ label, sparkline, value }: { label: string; sparkline?: number[]; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3 text-center">
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-white/60">{label}</p>
      {sparkline && sparkline.length >= 2 ? (
        <div className="mt-1.5 flex justify-center">
          <Sparkline color="#ff9f1a" data={sparkline} height={24} width={80} />
        </div>
      ) : null}
    </div>
  );
}

function JournalToneBadge({ tone }: { tone: CalibrationEvent["tone"] }) {
  const toneClass = {
    info: "bg-sky/10 text-sky",
    progress: "bg-sea/10 text-sea",
    warn: "bg-amber/10 text-amber"
  }[tone];

  const label = {
    info: "valide",
    progress: "monte",
    warn: "ajuste"
  }[tone];

  return <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${toneClass}`}>{label}</span>;
}

function PerfTile({ badge, label, value }: { badge?: string; label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-lg border border-white/8 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-black uppercase text-white/45">{label}</p>
        {badge ? <span className="rounded bg-amber/10 px-2 py-1 text-[10px] font-black uppercase text-amber">{badge}</span> : null}
      </div>
      <p className="mt-2 text-xl font-black leading-tight text-white">{value}</p>
    </div>
  );
}

function TrendBadge({ trend }: { trend: ExercisePerformance["trend"] }) {
  const classes = {
    douleur: "bg-red-500/10 text-red-600",
    "pas assez de données": "bg-white/10 text-white/50",
    progresse: "bg-sea/10 text-sea",
    régresse: "bg-coral/10 text-coral",
    stable: "bg-sky/10 text-sky"
  }[trend];

  return <span className={`shrink-0 rounded-md px-3 py-2 text-xs font-black uppercase ${classes}`}>{trend}</span>;
}

function buildPerformanceDashboard(history: CompletedSession[], program: PlannedSession[]) {
  const performances = performanceDefinitions.map((definition) => buildExercisePerformance(definition, history, program));
  const summary = buildPerformanceSummary(history);
  const watchItems = buildWatchItems(history, performances);
  const topProgressions = performances
    .filter((performance) => performance.recentDelta > 0)
    .sort((a, b) => b.recentDelta - a.recentDelta)
    .slice(0, 3)
    .map((performance) => `${performance.definition.label} : ${performance.progression}`);

  return {
    nextTargets: performances
      .filter((performance) => performance.nextTarget !== "À définir")
      .slice(0, 5)
      .map((performance) => `${performance.definition.label} : ${performance.nextTarget}`),
    performances,
    summary,
    topProgressions,
    watchItems
  };
}

function buildPerformanceSummary(history: CompletedSession[]) {
  return history.reduce(
    (summary, session) => {
      summary.sessions += 1;
      if (Object.values(session.logs).some((log) => /tapis|cardio|rameur|stairmaster|velo|elliptique/i.test(`${log.exerciseId} ${log.comment}`))) {
        summary.cardioSessions += 1;
      }
      for (const log of Object.values(session.logs)) {
        const load = parseKg(log.usedLoad);
        const reps = parseReps(log.completedReps).total;
        if (load !== undefined && reps > 0) {
          summary.totalVolumeKg += load * reps;
        }
      }
      return summary;
    },
    { cardioSessions: 0, sessions: 0, totalVolumeKg: 0 }
  );
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
  const bestLabel = bestCardio?.label ?? bestStrength?.label ?? "Aucune donnée";

  const sparkline = entries
    .filter((e) => e.loadKg !== undefined && e.loadKg > 0)
    .slice(-8)
    .map((e) => e.loadKg as number);

  return {
    best: bestLabel,
    bestBadge: bestStrength?.isReference || entries.length ? "record" : undefined,
    cardioBest: bestCardio?.cardio,
    definition,
    latest: latest ? formatEntry(latest, definition.kind) : "Aucune donnée",
    nextTarget: planned ? formatPlannedTarget(planned) : "À définir",
    progression,
    recentDelta,
    sparkline,
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
    return entry.log.status === "pain" || /douleur|poignet|épaule|epaule|dos|genou|oppression|vertige/i.test(text);
  });

  if (hasPain) {
    return "douleur";
  }

  if (entries.length < 2) {
    return "pas assez de données";
  }

  const latest = entries.at(-1);
  const previous = entries.at(-2);
  const delta = getRecentDelta(latest, previous, latest?.loadKg !== undefined ? "strength" : "cardio");

  if (delta > 0.5) {
    return "progresse";
  }

  if (delta < -0.5) {
    return "régresse";
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

  return { isReference: false, label: bestEntry ? formatEntry(bestEntry, "strength") : referenceBest ?? "Aucune donnée" };
}

function getBestCardio(entries: PerformanceEntry[]) {
  const bestEntry = entries.sort((a, b) => cardioScore(b.cardio) - cardioScore(a.cardio))[0];

  return {
    cardio: bestEntry?.cardio,
    isReference: false,
    label: bestEntry ? formatCardioMetrics(bestEntry.cardio) : "Aucune donnée"
  };
}

function buildWatchItems(history: CompletedSession[], performances: ExercisePerformance[]) {
  const items = new Set<string>();

  for (const session of history.slice(0, 8)) {
    for (const log of Object.values(session.logs)) {
      const progression = session.progressions?.[log.exerciseId];
      const name = progression?.exerciseName ?? log.exerciseId;
      const text = `${name} ${log.comment} ${progression?.warning ?? ""} ${session.feedback?.breath ?? ""}`;

      if (log.status === "pain" || /douleur|poignet|épaule|epaule|dos|genou/i.test(text)) {
        items.add(`${name} : douleur ou gêne signalée`);
      }

      if (log.status === "hard") {
        items.add(`${name} : souvent trop dur, surveiller charge ou volume`);
      }

      if (/cardio|tapis|rameur|intervalles|stairmaster/i.test(name) && (log.status === "hard" || /tres-mauvais|vertige|oppression|souffle/i.test(text))) {
        items.add(`${name} : souffle/cardio à surveiller`);
      }
    }
  }

  for (const performance of performances) {
    if (performance.trend === "stable") {
      items.add(`${performance.definition.label} : tendance stable, viser reps propres ou petit ajustement`);
    }
  }

  if ([...items].some((item) => /poignet/i.test(item))) {
    items.add("Poignet droit : garder prises neutres et éviter les hausses agressives");
  }

  return [...items].slice(0, 8);
}

function formatEntry(entry: PerformanceEntry, kind: PerformanceKind) {
  if (kind === "cardio") {
    return formatCardioMetrics(entry.cardio);
  }

  return `${entry.log.usedLoad || "-"} — ${entry.log.completedReps || "-"}`;
}

function formatPlannedTarget(exercise: Exercise) {
  const load = exercise.plannedLoad ? `${exercise.plannedLoad} — ` : "";
  return `${load}${exercise.target}`;
}

function formatRecentProgression(delta: number, kind: PerformanceKind) {
  if (!delta) {
    return "pas assez de données";
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
    return "Aucune donnée";
  }

  return [
    metrics.durationMin ? `${metrics.durationMin} min` : undefined,
    metrics.speedKmh ? `${formatNumber(metrics.speedKmh)} km/h` : undefined,
    metrics.incline ? `${formatNumber(metrics.incline)} %` : undefined,
    metrics.distanceKm ? `${formatNumber(metrics.distanceKm)} km` : undefined,
    metrics.rounds ? `${metrics.rounds} rounds` : undefined
  ]
    .filter(Boolean)
    .join(" — ");
}

function formatVolume(value?: number) {
  return value ? `${Math.round(value)} kg` : "Non calculable";
}

function formatCompactNumber(value: number) {
  if (!value) {
    return "-";
  }

  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}k kg`;
  }

  return `${Math.round(value)} kg`;
}

function formatJournalDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "date inconnue";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
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

function PersonalRecordCard({ pr }: { pr: PersonalRecord }) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-sea/30 bg-sea/10 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-black text-white/60">{pr.exerciseName}</p>
          <p className="mt-2 text-2xl font-black text-white">
            {pr.prLoad} kg {pr.prReps ? `× ${pr.prReps}` : ""}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/55">
            PR du {formatDateTime(pr.prDate)}
          </p>
        </div>
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-sea/40 bg-sea/20">
          <svg className="size-8 text-sea" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-[10px] font-black uppercase text-white/50">Progression</p>
          <p className="mt-1 text-base font-black text-sea">+{pr.progressionKg} kg</p>
        </div>
        <div className="rounded-lg bg-white/5 p-2">
          <p className="text-[10px] font-black uppercase text-white/50">Première perf</p>
          <p className="mt-1 text-base font-black text-white">{pr.firstLoad} kg</p>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-white/50">
        {pr.sessionsCount} séance{pr.sessionsCount > 1 ? "s" : ""} enregistrée{pr.sessionsCount > 1 ? "s" : ""}
      </p>
    </article>
  );
}

function buildPersonalRecords(history: CompletedSession[]): PersonalRecord[] {
  const exerciseMap = new Map<string, Array<{ load: number; reps: number; date: string }>>();

  for (const session of history) {
    for (const [exerciseId, log] of Object.entries(session.logs)) {
      const progression = session.progressions?.[exerciseId];
      const exerciseName = progression?.exerciseName ?? exerciseId;
      const load = parseKg(log.usedLoad);

      if (load === undefined || load <= 0) continue;

      const reps = parseReps(log.completedReps).total || 0;
      if (!exerciseMap.has(exerciseName)) {
        exerciseMap.set(exerciseName, []);
      }
      exerciseMap.get(exerciseName)!.push({ load, reps, date: session.completedAt });
    }
  }

  const records: PersonalRecord[] = [];

  for (const [exerciseName, entries] of exerciseMap) {
    if (entries.length < 2) continue;

    const sorted = entries.sort((a, b) => b.load - a.load || b.reps - a.reps);
    const prEntry = sorted[0];
    const firstEntry = entries.reduce((min, curr) => (curr.load < min.load ? curr : min));

    records.push({
      exerciseName,
      prLoad: prEntry.load,
      prDate: prEntry.date,
      prReps: prEntry.reps > 0 ? prEntry.reps : undefined,
      firstLoad: firstEntry.load,
      progressionKg: Math.round((prEntry.load - firstEntry.load) * 10) / 10,
      sessionsCount: entries.length
    });
  }

  return records.sort((a, b) => b.progressionKg - a.progressionKg);
}
