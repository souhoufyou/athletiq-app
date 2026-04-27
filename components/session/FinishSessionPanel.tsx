import { AdaptationExplanationSection } from "@/components/AdaptationExplanationSection";
import { formatDurationLong } from "@/lib/time";
import type { CompletedSession } from "@/types/training";

export function FinishSessionPanel({ session }: { session: CompletedSession }) {
  const logs = Object.values(session.logs);
  const validCount = logs.filter((log) => log.status === "ok" || log.status === "easy").length;
  const easyCount = logs.filter((log) => log.status === "easy").length;
  const hardCount = logs.filter((log) => log.status === "hard").length;
  const painCount = logs.filter((log) => log.status === "pain").length;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl bg-ink p-5 text-white shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Bilan seance</p>
        <h2 className="mt-2 text-3xl font-black leading-tight">{session.title}</h2>
        <p className="mt-2 text-sm font-semibold text-white/70">
          Seance terminee en {formatDurationLong(session.totalDurationMs)}
        </p>
        {session.calorieEstimate ? (
          <div className="mt-4 rounded-md bg-white/10 p-3">
            <p className="text-xs font-black uppercase text-white/60">{session.calorieEstimate.label}</p>
            <p className="mt-1 text-2xl font-black">~{session.calorieEstimate.calories} kcal</p>
            <p className="mt-1 text-xs font-semibold text-white/65">
              Type {session.calorieEstimate.activityType} - {session.calorieEstimate.durationMinutes} min - intensite{" "}
              {session.calorieEstimate.intensity}/10. Chiffre indicatif, non exact.
            </p>
          </div>
        ) : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <ReportMetric label="Valides" value={String(validCount)} tone="calm" />
          <ReportMetric label="Faciles" value={String(easyCount)} tone="calm" />
          <ReportMetric label="Trop durs" value={String(hardCount)} tone="warn" />
          <ReportMetric label="Douleurs" value={String(painCount)} tone="danger" />
        </div>
      </div>

      <AdaptationExplanationSection progressions={session.progressions ?? {}} />
    </section>
  );
}

function ReportMetric({
  label,
  tone,
  value
}: {
  label: string;
  tone: "calm" | "danger" | "warn";
  value: string;
}) {
  const toneClass = {
    calm: "bg-sea/15 text-white",
    danger: "bg-red-500/20 text-white",
    warn: "bg-coral/20 text-white"
  }[tone];

  return (
    <div className={`rounded-md p-3 ${toneClass}`}>
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-black uppercase text-white/70">{label}</p>
    </div>
  );
}
