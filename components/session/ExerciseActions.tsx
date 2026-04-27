export function ExerciseActions({
  canGoNext,
  canGoPrevious,
  onFinish,
  onNext,
  onPrevious
}: {
  canGoNext: boolean;
  canGoPrevious: boolean;
  onFinish: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  return (
    <nav className="sticky bottom-[calc(5.05rem+env(safe-area-inset-bottom))] z-10 -mx-2 rounded-2xl border border-black/10 bg-white/95 p-2 shadow-soft backdrop-blur">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="h-14 rounded-md border border-black/10 bg-mist px-3 text-sm font-black text-ink disabled:opacity-40"
          disabled={!canGoPrevious}
          onClick={onPrevious}
          type="button"
        >
          Precedent
        </button>
        <button
          className="h-14 rounded-md border border-sky/20 bg-sky/10 px-3 text-sm font-black text-sky disabled:opacity-40"
          disabled={!canGoNext}
          onClick={onNext}
          type="button"
        >
          Suivant
        </button>
        <button
          className="col-span-2 h-16 rounded-md premium-action px-4 text-base font-black text-white shadow-soft"
          onClick={onFinish}
          type="button"
        >
          Terminer
        </button>
      </div>
    </nav>
  );
}
