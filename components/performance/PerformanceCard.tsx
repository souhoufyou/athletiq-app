import type { CardioMetrics, ExercisePerformance } from "@/components/PerformanceDashboard";

export function PerformanceCard({
  formatCardioMetrics,
  formatVolume,
  performance
}: {
  formatCardioMetrics: (metrics?: CardioMetrics) => string;
  formatVolume: (value?: number) => string;
  performance: ExercisePerformance;
}) {
  const isCardio = performance.definition.kind === "cardio";

  return (
    <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-2xl font-black leading-tight">{performance.definition.label}</h3>
          <p className="mt-1 text-sm font-semibold text-ink/60">Progression recente : {performance.progression}</p>
        </div>
        <TrendBadge trend={performance.trend} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <PerfTile label="Derniere perf" value={performance.latest} />
        <PerfTile label="Meilleure perf" value={performance.best} badge={performance.bestBadge} />
        <PerfTile label="Prochaine cible" value={performance.nextTarget} badge="prochaine cible" />
        <PerfTile
          label={isCardio ? "Meilleure duree/intensite" : "Volume derniere seance"}
          value={isCardio ? formatCardioMetrics(performance.cardioBest) : formatVolume(performance.volume)}
        />
      </div>
    </article>
  );
}

function PerfTile({ badge, label, value }: { badge?: string; label: string; value: string }) {
  return (
    <div className="min-h-24 rounded-lg bg-mist p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-black uppercase text-ink/50">{label}</p>
        {badge ? <span className="rounded bg-amber/10 px-2 py-1 text-[10px] font-black uppercase text-amber">{badge}</span> : null}
      </div>
      <p className="mt-2 text-xl font-black leading-tight">{value}</p>
    </div>
  );
}

function TrendBadge({ trend }: { trend: ExercisePerformance["trend"] }) {
  const classesByTrend: Record<string, string> = {
    douleur: "bg-red-500/10 text-red-600",
    "pas assez de donnees": "bg-mist text-ink/60",
    "pas assez de donnÃ©es": "bg-mist text-ink/60",
    progresse: "bg-sea/10 text-sea",
    regresse: "bg-coral/10 text-coral",
    "rÃ©gresse": "bg-coral/10 text-coral",
    stable: "bg-sky/10 text-sky"
  };
  const classes = classesByTrend[trend] ?? "bg-mist text-ink/60";

  return <span className={`shrink-0 rounded-md px-3 py-2 text-xs font-black uppercase ${classes}`}>{trend}</span>;
}
