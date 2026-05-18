"use client";

import { useEffect, useRef, useState } from "react";
import { safeVibrate } from "@/lib/haptics";

/** Badge discret "vs prévu / dernière séance". Calculé par le parent pour que
 *  le stepper reste purement présentationnel et réutilisable. */
export type StepperComparison = {
  tone: "up" | "down";
  label: string;
};

type Props = {
  label: string;
  hint?: string;
  value: string;
  placeholder: string;
  /** Indice de clavier mobile — "decimal" pour les charges, "numeric" pour les reps. */
  inputMode: "decimal" | "numeric";
  delta: number;
  deltaLabel: string;
  /** Sert uniquement aux aria-labels des boutons +/- (ex: "kg", "reps"). */
  unitLabel: string;
  adjustable: boolean;
  onChange: (value: string) => void;
  onAdjust: (delta: number) => void;
  comparison?: StepperComparison | null;
};

/** Nettoyage léger d'une saisie manuelle : trim + suppression d'un signe moins
 *  en tête (un stepper ne descend jamais sous 0). La valeur reste une string —
 *  aucune conversion Number, donc aucun NaN ne peut atteindre les données. */
function sanitizeManualInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.replace(/^-+/, "").trim();
}

/** Sépare "90 kg" → { num: "90", unit: "kg" } pour atténuer l'unité.
 *  Les valeurs non numériques (ex: "Poids du corps") renvoient num: null. */
function splitValue(value: string): { num: string | null; unit: string } {
  const match = value.match(/^\s*(-?\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return { num: null, unit: "" };
  return { num: match[1], unit: match[2].trim() };
}

export function NumberStepper({
  label,
  hint,
  value,
  placeholder,
  inputMode,
  delta,
  deltaLabel,
  unitLabel,
  adjustable,
  onChange,
  onAdjust,
  comparison
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pulsing, setPulsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);
  const isFirstRender = useRef(true);
  const pulseTimeoutRef = useRef<number | null>(null);

  // Pulse bref de la valeur à chaque changement (hors montage initial).
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setPulsing(true);
    if (pulseTimeoutRef.current !== null) {
      window.clearTimeout(pulseTimeoutRef.current);
    }
    pulseTimeoutRef.current = window.setTimeout(() => setPulsing(false), 200);
  }, [value]);

  useEffect(() => {
    return () => {
      if (pulseTimeoutRef.current !== null) {
        window.clearTimeout(pulseTimeoutRef.current);
      }
    };
  }, []);

  // Focus + sélection dès l'entrée en mode saisie manuelle.
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const handleBlur = () => {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      setDraft(value);
      setEditing(false);
      return;
    }
    const cleaned = sanitizeManualInput(draft);
    setEditing(false);
    if (cleaned !== value) onChange(cleaned);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      inputRef.current?.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelledRef.current = true;
      inputRef.current?.blur();
    }
  };

  const handleAdjust = (amount: number) => {
    safeVibrate(8);
    onAdjust(amount);
  };

  const { num, unit } = splitValue(value);

  return (
    <div className="number-stepper">
      <div className="number-stepper-head">
        <p className="number-stepper-label">{label}</p>
        {comparison ? (
          <span className={`number-stepper-compare number-stepper-compare-${comparison.tone}`}>
            <span aria-hidden="true">{comparison.tone === "up" ? "▲" : "▼"}</span>
            {comparison.label}
          </span>
        ) : hint ? (
          <p className="number-stepper-hint">{hint}</p>
        ) : null}
      </div>

      <div className="number-stepper-control">
        <button
          aria-label={`Retirer ${deltaLabel} ${unitLabel}`}
          className="number-stepper-btn tap-feedback"
          disabled={!adjustable}
          onClick={() => handleAdjust(-delta)}
          type="button"
        >
          −
        </button>

        {editing ? (
          <input
            aria-label={label}
            autoComplete="off"
            className="number-stepper-input"
            enterKeyHint="done"
            inputMode={inputMode}
            onBlur={handleBlur}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            ref={inputRef}
            type="text"
            value={draft}
          />
        ) : (
          <button
            aria-label={`${label} : ${value || "non renseigné"}. Toucher pour saisir une valeur.`}
            aria-live="polite"
            className="number-stepper-value tap-feedback"
            onClick={startEdit}
            type="button"
          >
            {num !== null ? (
              <>
                <span className={`number-stepper-value-num${pulsing ? " value-pulse" : ""}`}>{num}</span>
                {unit ? <span className="number-stepper-value-unit">{unit}</span> : null}
              </>
            ) : value ? (
              <span className={`number-stepper-value-num${pulsing ? " value-pulse" : ""}`}>{value}</span>
            ) : (
              <span className="number-stepper-value-num number-stepper-value-placeholder">{placeholder}</span>
            )}
          </button>
        )}

        <button
          aria-label={`Ajouter ${deltaLabel} ${unitLabel}`}
          className="number-stepper-btn tap-feedback"
          disabled={!adjustable}
          onClick={() => handleAdjust(delta)}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}
