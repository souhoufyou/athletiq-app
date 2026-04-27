export function SessionProgress({
  completedCount,
  progressPercent,
  total
}: {
  completedCount: number;
  progressPercent: number;
  total: number;
}) {
  return (
    <>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-mist shadow-inner">
        <div className="h-full rounded-full bg-sky transition-all" style={{ width: `${progressPercent}%` }} />
      </div>
      <p className="mt-2 text-xs font-bold text-ink/60">
        {completedCount}/{total} exercices renseignes
      </p>
    </>
  );
}
