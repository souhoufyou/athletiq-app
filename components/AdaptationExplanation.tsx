"use client";

import type { AdaptationExplanation, GuardrailSummary } from "@/types/training";

interface Props {
  explanation: AdaptationExplanation;
  confidence: GuardrailSummary["confidence"];
  violations: GuardrailSummary["violations"];
  exerciseName: string;
}

export function AdaptationExplanationCard({ confidence, explanation, exerciseName, violations }: Props) {
  const confidenceMeta = {
    "élevé": { label: "Confiance élevée", bg: "bg-sea/15", text: "text-sea", dot: "bg-sea" },
    "moyen": { label: "Confiance modérée", bg: "bg-amber/15", text: "text-amber", dot: "bg-amber" },
    "faible": { label: "Confiance faible", bg: "bg-coral/15", text: "text-coral", dot: "bg-coral" }
  }[confidence];

  const blockViolations = violations.filter((v) => v.severity === "block");
  const warnViolations = violations.filter((v) => v.severity === "warn");

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-soft">
      {/* Confidence bandeau */}
      <div className={`flex items-center gap-2 px-4 py-2 ${confidenceMeta.bg}`}>
        <span className={`size-2 rounded-full ${confidenceMeta.dot}`} />
        <p className={`text-xs font-black uppercase tracking-wide ${confidenceMeta.text}`}>
          {confidenceMeta.label}
        </p>
      </div>

      <div className="space-y-3 p-4">
        {/* Exercise name */}
        <p className="text-xs font-black uppercase text-white/50">{exerciseName}</p>

        {/* Decision */}
        <div>
          <p className="text-xs font-bold uppercase text-sky">Décision</p>
          <p className="mt-1 text-lg font-black leading-tight text-white">{explanation.decision}</p>
        </div>

        {/* Pourquoi */}
        <div>
          <p className="text-xs font-bold uppercase text-white/50">Pourquoi</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-white/85">{explanation.raison}</p>
        </div>

        {/* Règle */}
        <div>
          <span className="inline-flex items-center rounded-full border border-sky/20 bg-sky/10 px-3 py-1 text-xs font-black text-sky">
            {explanation.regleAppliquee}
          </span>
        </div>

        {/* Ce que ça veut dire */}
        <div className="rounded-md bg-white/8 p-3">
          <p className="text-xs font-bold uppercase text-white/50">Ce que ça veut dire</p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-white/80">
            {explanation.ceQueDevraisComprendre}
          </p>
        </div>

        {/* Impact */}
        {explanation.impact ? (
          <p className="text-sm italic text-white/55">{explanation.impact}</p>
        ) : null}

        {/* Block violations */}
        {blockViolations.length > 0 ? (
          <div className="rounded-md border border-coral/20 bg-coral/10 p-3">
            <p className="text-xs font-black uppercase text-coral">Règle de sécurité appliquée</p>
            <ul className="mt-2 space-y-1">
              {blockViolations.map((v) => (
                <li className="flex items-start gap-2 text-sm font-semibold text-white/80" key={v.rule}>
                  <span className="mt-0.5 shrink-0 text-coral">⛔</span>
                  {v.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Warn violations */}
        {warnViolations.length > 0 ? (
          <div className="rounded-md border border-amber/20 bg-amber/10 p-3">
            <p className="text-xs font-black uppercase text-amber">Attention</p>
            <ul className="mt-2 space-y-1">
              {warnViolations.map((v) => (
                <li className="flex items-start gap-2 text-sm font-semibold text-white/80" key={v.rule}>
                  <span className="mt-0.5 shrink-0 text-amber">⚠</span>
                  {v.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
