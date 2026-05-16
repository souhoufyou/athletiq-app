"use client";

import { useEffect, useMemo, useState } from "react";

const MESSAGES = [
  "Séance terminée. Bien joué.",
  "Une de plus dans la poche.",
  "Tu progresses. Garde le cap.",
  "Petite victoire, mais victoire.",
  "Tu deviens plus fort. Littéralement.",
  "Ce que tu fais aujourd'hui paie demain.",
  "La constance bat la perfection.",
  "Bel effort. Hydrate-toi.",
  "Tu as fait ce que la plupart ne font pas.",
  "Encore une, encore plus solide."
];

type Props = {
  durationLabel?: string;
  exerciseCount: number;
  onContinue: () => void;
};

export function SessionCelebration({ durationLabel, exerciseCount, onContinue }: Props) {
  const message = useMemo(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)], []);
  const [phase, setPhase] = useState<"intro" | "ready">("intro");

  useEffect(() => {
    const t = window.setTimeout(() => setPhase("ready"), 900);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <section className="session-step-card session-step-enter relative flex min-h-[28rem] flex-col items-center justify-center overflow-hidden p-6 text-center">
      <div className="session-step-accent" style={{ background: "linear-gradient(90deg, #24c07a, #ff7a18)" }} />

      {/* Background pulse */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="size-72 rounded-full bg-sea/15 blur-3xl celebration-pulse-1" />
        <div className="absolute size-56 rounded-full bg-coral/20 blur-2xl celebration-pulse-2" />
      </div>

      {/* Animated checkmark */}
      <svg className="celebration-check size-28" fill="none" viewBox="0 0 100 100" aria-hidden="true">
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="rgba(36, 192, 122, 0.30)"
          strokeWidth="6"
          fill="none"
          className="celebration-check-ring"
        />
        <circle
          cx="50"
          cy="50"
          r="44"
          stroke="#24c07a"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="276"
          strokeDashoffset="276"
          className="celebration-check-progress"
        />
        <path
          d="M30 52 L45 67 L72 38"
          stroke="#24c07a"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="80"
          strokeDashoffset="80"
          className="celebration-check-tick"
        />
      </svg>

      <p className="celebration-title mt-6 text-2xl font-black leading-tight text-white sm:text-3xl">
        Séance bouclée
      </p>
      <p className="celebration-message mt-3 max-w-xs text-base font-semibold leading-relaxed text-white/80">
        {message}
      </p>

      <div className="celebration-stats mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-center">
          <p className="text-2xl font-black text-white">{exerciseCount}</p>
          <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-white/55">Exercices</p>
        </div>
        {durationLabel ? (
          <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-center">
            <p className="text-2xl font-black text-white">{durationLabel}</p>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-white/55">Durée</p>
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-3 text-center">
            <p className="text-2xl font-black text-white">✓</p>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-white/55">Terminée</p>
          </div>
        )}
      </div>

      <button
        className={`session-cta-primary mt-7 transition-opacity duration-300 ${
          phase === "ready" ? "opacity-100" : "opacity-0"
        }`}
        disabled={phase !== "ready"}
        onClick={onContinue}
        type="button"
      >
        Voir le bilan
      </button>
    </section>
  );
}
