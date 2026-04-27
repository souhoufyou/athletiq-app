"use client";

import { useMemo } from "react";
import { useCoachStorage } from "@/lib/storage";
import { formatDurationLong } from "@/lib/time";
import type { CompletedSession, ExerciseProgressionLog, ProgressionDecision } from "@/types/training";

type LoadPoint = {
  date: string;
  label: string;
  load: number;
  raw: string;
  reps: string;
};

type LiftDefinition = {
  key: string;
  label: string;
  match: RegExp;
};

type PainItem = {
  date: string;
  exercise: string;
  note: string;
};

const trackedLifts: LiftDefinition[] = [
  { key: "bench", label: "Développé couché", match: /d[ée]velopp[ée] couch|developpe couche|bench/i },
  { key: "press", label: "Presse", match: /presse|hack squat|goblet squat/i },
  { key: "vertical-pull", label: "Tirage vertical", match: /tirage vertical|tractions? assist/i },
  { key: "rowing", label: "Rowing", match: /rowing/i },
  { key: "hinge", label: "Hip thrust / SDT roumain", match: /hip thrust|soulev[ée] de terre roumain|roumain|rdl/i }
];

export function ProgressionDashboard() {
  const { history, isReady } = useCoachStorage();
  const metrics = useMemo(() => buildProgressionMetrics(history), [history]);
  const insights = useMemo(() => buildProgressionInsights(metrics), [metrics]);

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  if (history.length === 0) {
    return (
      <section className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Progression</p>
        <h2 className="mt-1 text-2xl font-black">Aucune donnée pour l’instant</h2>
        <p className="mt-2 text-sm font-semibold text-ink/60">
          Valide une séance pour alimenter les charges, la durée, le cardio et les alertes.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-ink p-5 text-white shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Vue 10 secondes</p>
        <h2 className="mt-1 text-3xl font-black leading-tight">
          {metrics.isProgressing ? "Ça progresse" : "À consolider"}
        </h2>
        <p className="mt-2 text-sm font-semibold text-white/70">
          Dernier développé couché : {metrics.latestBench?.raw ?? "non renseigné"}
          {metrics.latestBench?.reps ? ` - ${metrics.latestBench.reps}` : ""}
        </p>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <HeroMetric label="Séances" value={String(metrics.week.sessions)} />
          <HeroMetric label="Temps" value={formatDurationLong(metrics.week.durationMs)} />
          <HeroMetric label="Cardio" value={metrics.week.cardioMinutes ? `${metrics.week.cardioMinutes} min` : "0 min"} />
        </div>
      </section>

      <section className="space-y-2">
        {insights.map((insight) => (
          <InsightCard
            detail={insight.detail}
            key={insight.label}
            label={insight.label}
            tone={insight.tone}
            value={insight.value}
          />
        ))}
      </section>

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase text-sky">Bench</p>
            <h3 className="mt-1 text-xl font-black">Progression du développé couché</h3>
          </div>
          {metrics.benchTrend ? (
            <span className={`rounded-md px-3 py-2 text-sm font-black ${metrics.benchTrend >= 0 ? "bg-sea/10 text-sea" : "bg-coral/10 text-coral"}`}>
              {metrics.benchTrend >= 0 ? "+" : ""}
              {formatKg(metrics.benchTrend)}
            </span>
          ) : null}
        </div>
        <div className="mt-4">
          <LineChart points={metrics.benchSeries} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <StatusCard label="Douleurs signalées" tone="danger" value={String(metrics.painItems.length)} />
        <StatusCard label="Exercices augmentés" tone="progress" value={String(metrics.increased.length)} />
        <StatusCard label="Exercices stagnants" tone="steady" value={String(metrics.stagnating.length)} />
        <StatusCard label="Charges suivies" tone="info" value={String(metrics.trackedWithData)} />
      </section>

      <ListSection
        empty="Aucune douleur récente signalée."
        items={metrics.painItems.map((item) => `${item.exercise} - ${item.note} (${item.date})`)}
        title="Exercices avec douleurs signalées"
        tone="danger"
      />

      <ListSection
        empty="Aucune hausse récente."
        items={metrics.increased.map((item) => `${item.exerciseName} - ${item.nextLoad} - ${item.nextTarget}`)}
        title="Exercices qui ont augmenté"
        tone="progress"
      />

      <ListSection
        empty="Aucune stagnation détectée."
        items={metrics.stagnating.map((item) => `${item.name} - ${item.count} maintien${item.count > 1 ? "s" : ""}`)}
        title="Exercices qui stagnent"
        tone="steady"
      />

      <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Charges principales</p>
        <h3 className="mt-1 text-xl font-black">Historique des charges</h3>
        <div className="mt-4 space-y-3">
          {trackedLifts.map((lift) => (
            <LiftHistoryCard key={lift.key} label={lift.label} points={metrics.liftSeries[lift.key] ?? []} />
          ))}
        </div>
      </section>
    </div>
  );
}

function InsightCard({
  detail,
  label,
  tone,
  value
}: {
  detail: string;
  label: string;
  tone: "danger" | "info" | "progress" | "steady";
  value: string;
}) {
  const toneClass = {
    danger: "border-coral/20 bg-coral/10 text-coral",
    info: "border-sky/20 bg-sky/10 text-sky",
    progress: "border-amber/20 bg-amber/10 text-amber",
    steady: "border-sea/20 bg-sea/10 text-sea"
  }[tone];

  return (
    <article className={`rounded-xl border p-4 shadow-soft ${toneClass}`}>
      <p className="text-xs font-black uppercase text-ink/60">{label}</p>
      <h3 className="mt-1 text-xl font-black leading-tight text-ink">{value}</h3>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/65">{detail}</p>
    </article>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3 text-center">
      <p className="text-xl font-black leading-tight">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-white/65">{label}</p>
    </div>
  );
}

function StatusCard({
  label,
  tone,
  value
}: {
  label: string;
  tone: "danger" | "info" | "progress" | "steady";
  value: string;
}) {
  const toneClass = {
    danger: "border-coral/20 bg-coral/10 text-coral",
    info: "border-sky/20 bg-sky/10 text-sky",
    progress: "border-amber/20 bg-amber/10 text-amber",
    steady: "border-sea/20 bg-sea/10 text-sea"
  }[tone];

  return (
    <div className={`min-h-24 rounded-lg border p-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase text-ink/60">{label}</p>
      <p className="mt-2 text-3xl font-black leading-tight">{value}</p>
    </div>
  );
}

function ListSection({
  empty,
  items,
  title,
  tone
}: {
  empty: string;
  items: string[];
  title: string;
  tone: "danger" | "progress" | "steady";
}) {
  const toneClass = {
    danger: "border-coral/20 bg-coral/10",
    progress: "border-amber/20 bg-amber/10",
    steady: "border-sea/20 bg-sea/10"
  }[tone];

  return (
    <section className={`rounded-xl border p-4 shadow-soft ${toneClass}`}>
      <h3 className="text-lg font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.slice(0, 6).map((item) => (
            <p className="rounded-md bg-white/80 p-3 text-sm font-bold leading-relaxed text-ink" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-md bg-white/80 p-3 text-sm font-semibold text-ink/60">{empty}</p>
        )}
      </div>
    </section>
  );
}

function LiftHistoryCard({ label, points }: { label: string; points: LoadPoint[] }) {
  const latest = points.at(-1);

  return (
    <div className="rounded-lg border border-black/10 bg-mist p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-black">{label}</p>
          <p className="mt-1 text-sm font-semibold text-ink/60">
            {latest ? `${latest.raw}${latest.reps ? ` - ${latest.reps}` : ""}` : "Aucune charge renseignée"}
          </p>
        </div>
        {points.length >= 2 ? (
          <span className="rounded-md bg-white px-2 py-1 text-xs font-black text-sky">
            {points.length} pts
          </span>
        ) : null}
      </div>
      <MiniBars points={points} />
    </div>
  );
}

function LineChart({ points }: { points: LoadPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="rounded-lg bg-mist p-4 text-sm font-semibold text-ink/60">
        Il faut au moins deux séances avec une charge renseignée pour tracer une courbe.
      </div>
    );
  }

  const width = 320;
  const height = 150;
  const padding = 18;
  const loads = points.map((point) => point.load);
  const min = Math.min(...loads);
  const max = Math.max(...loads);
  const range = Math.max(1, max - min);
  const coordinates = points.map((point, index) => {
    const x = padding + (index / Math.max(1, points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((point.load - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-lg bg-mist p-3">
      <svg aria-label="Courbe développé couché" className="h-40 w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
        <line stroke="rgba(23,23,23,0.12)" strokeWidth="1" x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} />
        <line stroke="rgba(23,23,23,0.12)" strokeWidth="1" x1={padding} x2={padding} y1={padding} y2={height - padding} />
        <path d={path} fill="none" stroke="#2f6fed" strokeLinecap="round" strokeWidth="4" />
        {coordinates.map((point) => (
          <g key={`${point.date}-${point.load}`}>
            <circle cx={point.x} cy={point.y} fill="#171717" r="4" />
            <text fill="#171717" fontSize="10" fontWeight="700" textAnchor="middle" x={point.x} y={Math.max(12, point.y - 8)}>
              {formatKg(point.load)}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-xs font-bold text-ink/60">
        <span>{points[0]?.label}</span>
        <span>{points.at(-1)?.label}</span>
      </div>
    </div>
  );
}

function MiniBars({ points }: { points: LoadPoint[] }) {
  if (!points.length) {
    return null;
  }

  const max = Math.max(...points.map((point) => point.load), 1);

  return (
    <div className="mt-3 flex h-16 items-end gap-1">
      {points.slice(-8).map((point) => (
        <div className="flex flex-1 flex-col items-center justify-end gap-1" key={`${point.date}-${point.load}-${point.reps}`}>
          <div
            className="w-full rounded-t bg-sky"
            style={{ height: `${Math.max(12, (point.load / max) * 56)}px` }}
            title={`${point.label} - ${point.raw}`}
          />
        </div>
      ))}
    </div>
  );
}

function buildProgressionMetrics(history: CompletedSession[]) {
  const chronological = [...history].reverse();
  const weekSessions = history.filter((session) => isThisWeek(session.completedAt));
  const liftSeries = Object.fromEntries(
    trackedLifts.map((lift) => [lift.key, collectLiftSeries(chronological, lift.match)])
  ) as Record<string, LoadPoint[]>;
  const benchSeries = liftSeries.bench ?? [];
  const latestBench = benchSeries.at(-1);
  const benchTrend = benchSeries.length >= 2 ? benchSeries.at(-1)!.load - benchSeries[0].load : 0;
  const increased = collectRecentProgressions(history, "augmenter");

  return {
    benchSeries,
    benchTrend,
    increased,
    isProgressing: Boolean(benchTrend > 0 || increased.length >= 2),
    latestBench,
    liftSeries,
    painItems: collectPainItems(history),
    stagnating: collectStagnatingExercises(history),
    trackedWithData: Object.values(liftSeries).filter((points) => points.length > 0).length,
    week: {
      cardioMinutes: sumCardioMinutes(weekSessions),
      durationMs: weekSessions.reduce((total, session) => total + (session.totalDurationMs ?? 0), 0),
      sessions: weekSessions.length
    }
  };
}

function buildProgressionInsights(metrics: ReturnType<typeof buildProgressionMetrics>) {
  const painInsight =
    metrics.painItems.length > 0
      ? {
          detail: `Dernier signal: ${metrics.painItems[0].exercise}. Priorité au mouvement sans douleur avant la charge.`,
          label: "À surveiller",
          tone: "danger" as const,
          value: `${metrics.painItems.length} signal${metrics.painItems.length > 1 ? "s" : ""} douleur`
        }
      : {
          detail: "Aucun retour douleur récent dans l'historique. Continuer à noter les signaux faibles.",
          label: "À surveiller",
          tone: "steady" as const,
          value: "Rien d'urgent"
        };

  const benchInsight =
    metrics.benchTrend > 0
      ? {
          detail: `Tendance depuis le premier point: +${formatKg(metrics.benchTrend)}. La progression reste mesurée.`,
          label: "Force",
          tone: "progress" as const,
          value: "Bench en hausse"
        }
      : metrics.benchSeries.length >= 2
        ? {
            detail: "La charge de développé couché ne monte pas encore. Consolider les reps propres avant de forcer.",
            label: "Force",
            tone: "info" as const,
            value: "Bench stable"
          }
        : {
            detail: "Deux séances avec charge renseignée donneront une tendance exploitable.",
            label: "Force",
            tone: "info" as const,
            value: "Tendance à créer"
          };

  const nextAction =
    metrics.stagnating.length > 0
      ? {
          detail: `${metrics.stagnating[0].name} revient souvent en maintien. Viser une exécution propre ou une petite hausse de reps.`,
          label: "Action utile",
          tone: "info" as const,
          value: "Débloquer une stagnation"
        }
      : metrics.increased.length > 0
        ? {
            detail: "Plusieurs exercices montent. Garder le même rythme et surveiller sommeil, souffle et poignet.",
            label: "Action utile",
            tone: "steady" as const,
            value: "Consolider"
          }
        : {
            detail: "Valider quelques séances complètes donnera au moteur assez de matière pour ajuster finement.",
            label: "Action utile",
            tone: "info" as const,
            value: "Créer des données"
          };

  return [painInsight, benchInsight, nextAction];
}

function collectLiftSeries(history: CompletedSession[], match: RegExp): LoadPoint[] {
  return history.flatMap((session) => {
    const entry = findProgression(session, match);

    if (!entry) {
      return [];
    }

    const log = session.logs[entry.exerciseId];
    const load = parseKg(log?.usedLoad);

    if (load === undefined) {
      return [];
    }

    return [
      {
        date: session.completedAt,
        label: formatShortDate(session.completedAt),
        load,
        raw: log.usedLoad,
        reps: log.completedReps
      }
    ];
  });
}

function collectRecentProgressions(history: CompletedSession[], decision: ProgressionDecision) {
  return history
    .flatMap((session) => Object.values(session.progressions ?? {}))
    .filter((progression) => progression.decision === decision)
    .slice(0, 8);
}

function collectPainItems(history: CompletedSession[]): PainItem[] {
  return history
    .flatMap((session) =>
      Object.values(session.logs).flatMap((log) => {
        const progression = session.progressions?.[log.exerciseId];
        const note = log.comment || progression?.warning || progression?.reason || "";
        const hasPain =
          log.status === "pain" ||
          progression?.decision === "alerte" ||
          progression?.decision === "remplacer" ||
          /douleur|poignet|épaule|epaule|dos|genou|vertige|oppression|souffle/i.test(note);

        if (!hasPain) {
          return [];
        }

        return [
          {
            date: formatShortDate(session.completedAt),
            exercise: progression?.exerciseName ?? log.exerciseId,
            note: note || "Douleur signalée"
          }
        ];
      })
    )
    .slice(0, 8);
}

function collectStagnatingExercises(history: CompletedSession[]) {
  const counts = new Map<string, { count: number; name: string }>();

  for (const progression of history.slice(0, 8).flatMap((session) => Object.values(session.progressions ?? {}))) {
    if (progression.decision !== "maintenir") {
      continue;
    }

    const current = counts.get(progression.exerciseName) ?? { count: 0, name: progression.exerciseName };
    counts.set(progression.exerciseName, { ...current, count: current.count + 1 });
  }

  return [...counts.values()]
    .filter((item) => item.count >= 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

function sumCardioMinutes(sessions: CompletedSession[]) {
  return sessions.reduce((total, session) => {
    const cardioMinutes = Object.values(session.progressions ?? {}).reduce((sessionTotal, progression) => {
      if (!isCardioName(progression.exerciseName)) {
        return sessionTotal;
      }

      const log = session.logs[progression.exerciseId];

      if (!log?.status || log.status === "skipped") {
        return sessionTotal;
      }

      return sessionTotal + (parseMinutes(log.completedReps) ?? parseMinutes(log.comment) ?? parseMinutes(progression.nextTarget) ?? 0);
    }, 0);

    return total + cardioMinutes;
  }, 0);
}

function findProgression(session: CompletedSession, match: RegExp): ExerciseProgressionLog | undefined {
  return Object.values(session.progressions ?? {}).find((progression) =>
    match.test(`${progression.exerciseId} ${progression.exerciseName}`)
  );
}

function isCardioName(name: string) {
  return /cardio|tapis|marche|rameur|stairmaster|intervalles|zone 2/i.test(name);
}

function parseKg(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/(\d+(?:[,.]\d+)?)\s*kg/i) ?? value.match(/(\d+(?:[,.]\d+)?)/);
  return match ? Number(match[1].replace(",", ".")) : undefined;
}

function parseMinutes(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/(\d+)(?:\s*-\s*(\d+))?\s*min/i);
  return match ? Number(match[2] ?? match[1]) : undefined;
}

function formatKg(value: number) {
  return `${Number.isInteger(value) ? value : value.toFixed(1).replace(".", ",")} kg`;
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function isThisWeek(value: string) {
  const date = new Date(value);
  const start = new Date();
  const day = start.getDay() === 0 ? 6 : start.getDay() - 1;
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - day);

  return date >= start;
}
