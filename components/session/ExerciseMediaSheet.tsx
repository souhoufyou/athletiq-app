"use client";

import { useState } from "react";
import type { Exercise } from "@/types/training";
import { getSessionImages } from "@/lib/session-images";
import { getSessionExerciseCategory } from "@/components/session/SessionExerciseIcon";
import { getYouTubeSearchUrl } from "@/lib/exerciseMedia";

type Props = {
  exercise: Exercise;
  onClose: () => void;
};

export function ExerciseMediaSheet({ exercise, onClose }: Props) {
  const category = getSessionExerciseCategory(exercise);
  const photos = getSessionImages(category, exercise.name);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="flex h-[92vh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-ink text-white shadow-soft sm:h-auto sm:max-h-[88vh] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Sticky header (always visible, never scrolled away) */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-white/8 p-5">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-coral">Démo</p>
            <h2 className="mt-1 text-xl font-black leading-tight">{exercise.name}</h2>
          </div>
          <button
            aria-label="Fermer"
            className="flex size-10 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-black text-white/70"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Photo carousel */}
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-black/30">
            <div className="relative aspect-video w-full">
              {photos.map((url, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`${exercise.name} – vue ${index + 1}`}
                  className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
                    index === activeIndex ? "opacity-100" : "opacity-0"
                  }`}
                  key={url}
                  src={url}
                />
              ))}
              {/* Counter overlay */}
              <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white/85 backdrop-blur">
                {activeIndex + 1} / {photos.length}
              </span>
            </div>

            {/* Pagination dots */}
            {photos.length > 1 ? (
              <div className="flex items-center justify-center gap-2 py-3">
                {photos.map((url, index) => (
                  <button
                    aria-label={`Voir la photo ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      index === activeIndex ? "w-6 bg-coral" : "w-2 bg-white/25"
                    }`}
                    key={url}
                    onClick={() => setActiveIndex(index)}
                    type="button"
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Cue */}
          {exercise.cue ? (
            <div className="mt-4 rounded-xl border border-white/8 bg-white/4 p-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-white/55">
                Technique
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-white/80">
                {exercise.cue}
              </p>
            </div>
          ) : null}

          {/* Stats compactes */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Mini label="Cible" value={exercise.target} />
            <Mini label="Repos" value={exercise.rest || "—"} />
            {exercise.plannedLoad ? (
              <Mini label="Charge prévue" value={exercise.plannedLoad} />
            ) : null}
          </div>

          <p className="mt-5 text-center text-[11px] font-semibold text-white/45">
            Les photos sont génériques. Pour la technique exacte, regarde une démo vidéo&nbsp;:
          </p>

          <a
            className="session-cta-primary mt-3 inline-flex w-full items-center justify-center gap-2"
            href={getYouTubeSearchUrl(exercise.name)}
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
            </svg>
            <span>Voir une démo sur YouTube</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/4 p-3">
      <p className="text-[10px] font-black uppercase tracking-wide text-white/55">{label}</p>
      <p className="mt-0.5 text-sm font-black leading-tight text-white">{value}</p>
    </div>
  );
}
