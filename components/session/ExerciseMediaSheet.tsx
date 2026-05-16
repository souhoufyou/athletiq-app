"use client";

import { useRef, useState } from "react";
import type { Exercise } from "@/types/training";
import {
  getUserMedia,
  getYouTubeSearchUrl,
  setUserMedia,
  type ExerciseMediaEntry
} from "@/lib/exerciseMedia";
import { fileToExerciseMedia } from "@/lib/imageUpload";

type Props = {
  exercise: Exercise;
  onClose: () => void;
};

export function ExerciseMediaSheet({ exercise, onClose }: Props) {
  const [media, setMedia] = useState<ExerciseMediaEntry | undefined>(() => getUserMedia(exercise.name));
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const result = await fileToExerciseMedia(file);
      const entry: ExerciseMediaEntry = {
        dataUrl: result.dataUrl,
        type: result.type,
        uploadedAt: new Date().toISOString()
      };
      setUserMedia(exercise.name, entry);
      setMedia(entry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'import");
    }
  };

  const handleRemove = () => {
    setUserMedia(exercise.name, undefined);
    setMedia(undefined);
  };

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/10 bg-ink p-5 text-white shadow-soft sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-coral">Démo</p>
            <h2 className="mt-1 text-xl font-black leading-tight">{exercise.name}</h2>
          </div>
          <button
            aria-label="Fermer"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-sm font-black text-white/70"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Media display */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-white/4">
          {media ? (
            media.type === "video" ? (
              <video
                autoPlay
                className="block w-full"
                controls
                loop
                muted
                playsInline
                preload="metadata"
                src={media.dataUrl}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={`Démo de ${exercise.name}`} className="block w-full" src={media.dataUrl} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
              <svg className="size-12 text-white/30" fill="none" viewBox="0 0 24 24">
                <rect height="14" rx="2" stroke="currentColor" strokeWidth="2" width="20" x="2" y="5" />
                <path d="m10 9 5 3-5 3z" fill="currentColor" />
              </svg>
              <p className="mt-3 text-sm font-semibold text-white/55">
                Aucune démo enregistrée pour cet exercice.
              </p>
              <p className="mt-1 text-xs font-semibold text-white/40">
                Upload une photo, un GIF ou une courte vidéo de moins de 3 Mo.
              </p>
            </div>
          )}
        </div>

        {exercise.cue ? (
          <p className="mt-3 rounded-xl border border-white/8 bg-white/4 p-3 text-sm font-semibold leading-relaxed text-white/70">
            {exercise.cue}
          </p>
        ) : null}

        {error ? (
          <p className="mt-3 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">
            {error}
          </p>
        ) : null}

        <input
          accept="image/*,video/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
          ref={fileInputRef}
          type="file"
        />

        <div className="mt-5 grid grid-cols-1 gap-2">
          <button
            className="session-cta-primary"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {media ? "Changer la démo" : "Uploader une démo"}
          </button>
          <a
            className="session-cta-secondary inline-flex items-center justify-center"
            href={getYouTubeSearchUrl(exercise.name)}
            rel="noopener noreferrer"
            target="_blank"
          >
            Chercher sur YouTube
          </a>
          {media ? (
            <button
              className="h-11 rounded-md border border-coral/25 bg-coral/10 px-4 text-sm font-black text-coral transition hover:bg-coral/20"
              onClick={handleRemove}
              type="button"
            >
              Supprimer la démo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
