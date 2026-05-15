"use client";

import { useEffect, useState } from "react";
import type { EffortStatus, Exercise } from "@/types/training";
import { SessionExerciseIcon } from "@/components/session/SessionExerciseIcon";

type Props = {
  exercise: Exercise;
  exerciseIndex: number;
  exerciseTotal: number;
  isLastExercise: boolean;
  onValidate: (data: { status: EffortStatus; comment: string }) => void;
};

type Option = {
  value: EffortStatus;
  label: string;
  description: string;
  idle: string;
  active: string;
  requiresComment: boolean;
};

const options: Option[] = [
  {
    value: "easy",
    label: "Facile",
    description: "Tu en avais encore sous le pied",
    idle: "border-sea/25 bg-sea/10 text-sea",
    active: "border-sea bg-sea text-white",
    requiresComment: false
  },
  {
    value: "ok",
    label: "Correct",
    description: "Le bon niveau d'effort",
    idle: "border-sky/25 bg-sky/10 text-sky",
    active: "border-sky bg-sky text-white",
    requiresComment: false
  },
  {
    value: "hard",
    label: "Trop dur",
    description: "Au-delà de ce que tu pouvais soutenir",
    idle: "border-coral/30 bg-coral/10 text-coral",
    active: "border-coral bg-coral text-white",
    requiresComment: true
  },
  {
    value: "pain",
    label: "Douleur",
    description: "Tu as ressenti une gêne",
    idle: "border-red-500/30 bg-red-500/10 text-red-200",
    active: "border-red-600 bg-red-600 text-white",
    requiresComment: true
  },
  {
    value: "skipped",
    label: "Pas fait",
    description: "Tu n'as pas pu compléter",
    idle: "border-white/10 bg-white/8 text-white/60",
    active: "border-zinc-500 bg-zinc-600 text-white",
    requiresComment: true
  }
];

export function SessionStepFeedback({
  exercise,
  exerciseIndex,
  exerciseTotal,
  isLastExercise,
  onValidate
}: Props) {
  const [status, setStatus] = useState<EffortStatus | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    setStatus(null);
    setComment("");
  }, [exercise.id]);

  const selected = options.find((option) => option.value === status);
  const needsComment = Boolean(selected?.requiresComment);
  const canSubmit = status !== null && (!needsComment || comment.trim().length > 0);

  return (
    <section className="session-step-card session-step-enter p-5">
      <div className="session-step-accent" style={{ background: "linear-gradient(90deg, #ff7a18, #24c07a)" }} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-sea">
          Ressenti · {exerciseIndex + 1} / {exerciseTotal}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <SessionExerciseIcon exercise={exercise} className="size-12 shrink-0" />
        <div className="min-w-0">
          <h2 className="truncate text-xl font-black leading-tight text-white">{exercise.name}</h2>
          <p className="text-xs font-bold text-white/55">Comment s&apos;est passé cet exercice ?</p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2">
        {options.map((option) => {
          const isSelected = option.value === status;
          return (
            <button
              className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                isSelected ? option.active : option.idle
              }`}
              key={option.value}
              onClick={() => setStatus(option.value)}
              type="button"
            >
              <span className="min-w-0">
                <span className="block text-base font-black leading-tight">{option.label}</span>
                <span className="mt-0.5 block text-[11px] font-semibold opacity-80">{option.description}</span>
              </span>
              {isSelected ? <span className="text-lg font-black">✓</span> : null}
            </button>
          );
        })}
      </div>

      {needsComment ? (
        <label className="mt-4 block">
          <span className="text-xs font-black uppercase tracking-wide text-white/55">
            Précise rapidement <span className="text-coral">(obligatoire)</span>
          </span>
          <textarea
            className="mt-1 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-white/4 px-3 py-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => setComment(event.target.value)}
            placeholder="Ex. douleur épaule, machine occupée…"
            value={comment}
          />
        </label>
      ) : null}

      <button
        className="session-cta-primary mt-5"
        disabled={!canSubmit}
        onClick={() => {
          if (!canSubmit || status === null) return;
          onValidate({ status, comment: comment.trim() });
        }}
        type="button"
      >
        {isLastExercise ? "Terminer la séance" : "Exercice suivant"}
      </button>
    </section>
  );
}
