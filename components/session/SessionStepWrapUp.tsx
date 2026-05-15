"use client";

import { useState } from "react";

export type SessionWrapUp = {
  difficulty: number;  // 1-10 (mapped from one of the 4 options)
  globalPain: number;  // 0-10 (mapped from yes/no)
};

type Props = {
  exerciseCount: number;
  completedCount: number;
  onValidate: (data: SessionWrapUp) => void;
};

type DifficultyOption = { key: "easy" | "ok" | "hard" | "very-hard"; label: string; difficulty: number };

const difficultyOptions: DifficultyOption[] = [
  { key: "easy", label: "Facile", difficulty: 3 },
  { key: "ok", label: "Correct", difficulty: 5 },
  { key: "hard", label: "Dure", difficulty: 7 },
  { key: "very-hard", label: "Trop dure", difficulty: 9 }
];

export function SessionStepWrapUp({ exerciseCount, completedCount, onValidate }: Props) {
  const [difficultyKey, setDifficultyKey] = useState<DifficultyOption["key"] | null>(null);
  const [hasPain, setHasPain] = useState<boolean | null>(null);

  const canSubmit = difficultyKey !== null && hasPain !== null;

  const handleValidate = () => {
    if (!canSubmit) return;
    const difficulty = difficultyOptions.find((o) => o.key === difficultyKey)?.difficulty ?? 5;
    onValidate({
      difficulty,
      globalPain: hasPain ? 6 : 0
    });
  };

  return (
    <section className="session-step-card session-step-enter p-5">
      <div className="session-step-accent" style={{ background: "linear-gradient(90deg, #24c07a, #ff7a18)" }} />

      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sea">Bilan</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-white">Comment était la séance&nbsp;?</h2>
      <p className="mt-1 text-sm font-semibold text-white/55">
        {completedCount} / {exerciseCount} exercices · ton ressenti général aide à ajuster la suite.
      </p>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-wide text-white/55">Effort global</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {difficultyOptions.map((option) => {
            const isSelected = option.key === difficultyKey;
            return (
              <button
                className={`min-h-14 rounded-2xl border px-3 text-base font-black transition ${
                  isSelected
                    ? "border-coral bg-coral text-white"
                    : "border-white/10 bg-white/6 text-white/80 hover:bg-white/10"
                }`}
                key={option.key}
                onClick={() => setDifficultyKey(option.key)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase tracking-wide text-white/55">Une douleur particulière&nbsp;?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            className={`min-h-14 rounded-2xl border px-3 text-base font-black transition ${
              hasPain === false
                ? "border-sea bg-sea text-white"
                : "border-white/10 bg-white/6 text-white/80 hover:bg-white/10"
            }`}
            onClick={() => setHasPain(false)}
            type="button"
          >
            Non
          </button>
          <button
            className={`min-h-14 rounded-2xl border px-3 text-base font-black transition ${
              hasPain === true
                ? "border-coral bg-coral text-white"
                : "border-white/10 bg-white/6 text-white/80 hover:bg-white/10"
            }`}
            onClick={() => setHasPain(true)}
            type="button"
          >
            Oui
          </button>
        </div>
      </div>

      <button className="session-cta-primary mt-6" disabled={!canSubmit} onClick={handleValidate} type="button">
        Valider et terminer
      </button>
    </section>
  );
}
