"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { recommendPrograms } from "@/lib/programRecommendation";
import { useCoachStorage } from "@/lib/storage";
import type {
  BodyArea,
  Equipment,
  ExperienceLevel,
  PrimaryGoal,
  SessionDurationPreference,
  TrainingConstraint,
  UserSex,
  UserSettings,
  Weekday
} from "@/types/training";

const TOTAL_STEPS = 6;

const goalOptions: Array<{ value: PrimaryGoal; label: string; desc: string }> = [
  { value: "prise-masse", label: "Prise de muscle", desc: "Prioriser le gain musculaire" },
  { value: "perte-gras", label: "Perte de gras", desc: "Déficit contrôlé, sécher proprement" },
  { value: "recomposition", label: "Recomposition", desc: "Perdre du gras, garder le muscle" },
  { value: "performance", label: "Force / Performance", desc: "Devenir plus fort, plus endurant" },
  { value: "sante", label: "Santé / Cardio", desc: "Bien-être, mobilité, souffle, récupération" }
];

const equipmentOptions: Array<{ value: Equipment; label: string; desc: string }> = [
  { value: "salle-complete", label: "Salle complète", desc: "Machines, barres, haltères, poulies" },
  { value: "halteres-maison", label: "Maison équipée", desc: "Haltères, élastiques, banc" },
  { value: "poids-corps", label: "Poids du corps", desc: "Sans matériel ou très peu" }
];

const experienceOptions: Array<{ value: ExperienceLevel; label: string; desc: string }> = [
  { value: "debutant", label: "Débutant", desc: "Moins d'1 an de muscu régulière" },
  { value: "intermediaire", label: "Intermédiaire", desc: "1 à 3 ans, technique solide" },
  { value: "avance", label: "Avancé", desc: "3+ ans, charges et volume importants" }
];

const durationOptions: Array<{ value: SessionDurationPreference; label: string }> = [
  { value: "short", label: "35-45 min" },
  { value: "standard", label: "50-65 min" },
  { value: "long", label: "70-90 min" }
];

const cardioOptions: Array<{ value: string; label: string }> = [
  { value: "marche inclinée", label: "Marche / Tapis incliné" },
  { value: "vélo", label: "Vélo" },
  { value: "rameur", label: "Rameur" },
  { value: "elliptique", label: "Elliptique" },
  { value: "course", label: "Course" }
];

const painZoneOptions: Array<{ value: BodyArea; label: string }> = [
  { value: "shoulder", label: "Épaule" },
  { value: "wrist", label: "Poignet" },
  { value: "elbow", label: "Coude" },
  { value: "back", label: "Dos / Lombaires" },
  { value: "knee", label: "Genou" },
  { value: "hip", label: "Hanche" },
  { value: "ankle", label: "Cheville" },
  { value: "other", label: "Autre" }
];

type OnboardingData = {
  athleteName: string;
  sex: UserSex;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  primaryGoal: PrimaryGoal;
  secondaryGoal: PrimaryGoal | undefined;
  experienceLevel: ExperienceLevel;
  weeklyFrequency: number;
  sessionDurationPreference: SessionDurationPreference;
  equipment: Equipment;
  cardioPreferences: string[];
  hasPain: boolean;
  painZones: BodyArea[];
  postpartumConcern: boolean;
};

const initialData: OnboardingData = {
  athleteName: "",
  sex: "male",
  age: 30,
  heightCm: 175,
  currentWeightKg: 75,
  targetWeightKg: 72,
  primaryGoal: "recomposition",
  secondaryGoal: undefined,
  experienceLevel: "intermediaire",
  weeklyFrequency: 4,
  sessionDurationPreference: "standard",
  equipment: "salle-complete",
  cardioPreferences: [],
  hasPain: false,
  painZones: [],
  postpartumConcern: false
};

const ALL_WEEKDAYS: Weekday[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday"
];

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [showEngagement, setShowEngagement] = useState(false);
  const [data, setData] = useState<OnboardingData>(initialData);
  const { completeOnboarding, settings } = useCoachStorage();
  const router = useRouter();

  const patch = (partial: Partial<OnboardingData>) =>
    setData((current) => ({ ...current, ...partial }));

  const canAdvance = () => {
    if (step === 1) {
      return (
        data.athleteName.trim().length > 0 &&
        data.age > 0 &&
        data.heightCm > 0 &&
        data.currentWeightKg > 0 &&
        data.targetWeightKg > 0
      );
    }
    if (step === 5 && data.hasPain) {
      return data.painZones.length > 0;
    }
    return true;
  };

  const next = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  // Build a "preview" settings object used by the recommendation step
  const previewSettings: UserSettings = useMemo(
    () => buildSettings(data, settings),
    [data, settings]
  );

  const recommendations = useMemo(
    () => recommendPrograms(previewSettings),
    [previewSettings]
  );

  const finish = () => {
    completeOnboarding(previewSettings);
    router.replace("/");
  };

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  // Engagement screen comes AFTER step 6
  if (showEngagement) {
    return (
      <EngagementScreen
        athleteName={data.athleteName.trim() || "Athlète"}
        onCommit={finish}
        onCancel={() => setShowEngagement(false)}
      />
    );
  }

  return (
    <div className="app-shell mx-auto min-h-screen w-full max-w-xl px-4 pb-10 pt-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <BrandLogo className="h-10" priority variant="wordmark" />
        <p className="text-[12px] font-black text-white/60">Configuration initiale</p>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-wide text-white/45">
            Étape {step} / {TOTAL_STEPS}
          </p>
          <p className="text-[11px] font-bold text-white/45">{progress}%</p>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-coral transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-[28px] border border-white/10 bg-[#11131a]/90 p-5 shadow-soft">
        {step === 1 && <Step1Profile data={data} patch={patch} />}
        {step === 2 && <Step2Goals data={data} patch={patch} />}
        {step === 3 && <Step3Level data={data} patch={patch} />}
        {step === 4 && <Step4Equipment data={data} patch={patch} />}
        {step === 5 && <Step5Avoid data={data} patch={patch} />}
        {step === 6 && <Step6Result data={data} recommendations={recommendations} />}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          className="h-12 rounded-md border border-white/10 bg-white/8 font-black text-white disabled:opacity-30"
          disabled={step === 1}
          onClick={back}
          type="button"
        >
          Retour
        </button>
        {step < TOTAL_STEPS ? (
          <button
            className="h-12 rounded-md bg-coral px-4 font-black text-white shadow-soft transition disabled:opacity-40"
            disabled={!canAdvance()}
            onClick={next}
            type="button"
          >
            Continuer
          </button>
        ) : (
          <button
            className="h-12 rounded-md bg-coral px-4 font-black text-white shadow-soft transition"
            onClick={() => setShowEngagement(true)}
            type="button"
          >
            Continuer
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 1 — PROFIL
// ─────────────────────────────────────────────────────────────────────────

function Step1Profile({
  data,
  patch
}: {
  data: OnboardingData;
  patch: (partial: Partial<OnboardingData>) => void;
}) {
  return (
    <StepWrapper subtitle="Tes infos personnelles essentielles." title="Bienvenue 👋">
      <TextField
        label="Ton prénom"
        onChange={(value) => patch({ athleteName: value })}
        placeholder="ex. Alex"
        value={data.athleteName}
      />

      <div>
        <p className="mb-2 text-sm font-bold text-white/60">Sexe</p>
        <div className="grid grid-cols-2 gap-2">
          <PillButton
            onClick={() => patch({ sex: "male" })}
            selected={data.sex === "male"}
          >
            Homme
          </PillButton>
          <PillButton
            onClick={() => patch({ sex: "female" })}
            selected={data.sex === "female"}
          >
            Femme
          </PillButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Âge"
          max={80}
          min={14}
          onChange={(value) => patch({ age: value })}
          value={data.age}
        />
        <NumberField
          label="Taille (cm)"
          max={230}
          min={140}
          onChange={(value) => patch({ heightCm: value })}
          value={data.heightCm}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label="Poids actuel (kg)"
          max={250}
          min={30}
          onChange={(value) => patch({ currentWeightKg: value })}
          step={0.5}
          value={data.currentWeightKg}
        />
        <NumberField
          label="Objectif (kg)"
          max={250}
          min={30}
          onChange={(value) => patch({ targetWeightKg: value })}
          step={0.5}
          value={data.targetWeightKg}
        />
      </div>
    </StepWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 2 — OBJECTIFS
// ─────────────────────────────────────────────────────────────────────────

function Step2Goals({
  data,
  patch
}: {
  data: OnboardingData;
  patch: (partial: Partial<OnboardingData>) => void;
}) {
  return (
    <StepWrapper
      subtitle="Ce que tu veux atteindre — utilisé pour recommander ton programme."
      title="Ton objectif"
    >
      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/55">
          Objectif principal
        </p>
        <div className="space-y-2">
          {goalOptions.map((opt) => (
            <GoalRow
              desc={opt.desc}
              key={opt.value}
              label={opt.label}
              onClick={() => patch({ primaryGoal: opt.value })}
              selected={data.primaryGoal === opt.value}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-wide text-white/55">
          Objectif secondaire <span className="text-white/35">(optionnel)</span>
        </p>
        <div className="space-y-2">
          <GoalRow
            desc="Reste concentré sur l'objectif principal."
            label="Aucun"
            onClick={() => patch({ secondaryGoal: undefined })}
            selected={!data.secondaryGoal}
          />
          {goalOptions
            .filter((opt) => opt.value !== data.primaryGoal)
            .map((opt) => (
              <GoalRow
                desc={opt.desc}
                key={opt.value}
                label={opt.label}
                onClick={() => patch({ secondaryGoal: opt.value })}
                selected={data.secondaryGoal === opt.value}
              />
            ))}
        </div>
      </div>
    </StepWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 3 — NIVEAU
// ─────────────────────────────────────────────────────────────────────────

function Step3Level({
  data,
  patch
}: {
  data: OnboardingData;
  patch: (partial: Partial<OnboardingData>) => void;
}) {
  return (
    <StepWrapper
      subtitle="Niveau, fréquence et durée — pour caler le bon volume."
      title="Ton entraînement"
    >
      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/55">Niveau</p>
        <div className="space-y-2">
          {experienceOptions.map((opt) => (
            <GoalRow
              desc={opt.desc}
              key={opt.value}
              label={opt.label}
              onClick={() => patch({ experienceLevel: opt.value })}
              selected={data.experienceLevel === opt.value}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-wide text-white/55">
          Séances par semaine
        </p>
        <div className="grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((freq) => (
            <PillButton
              key={freq}
              onClick={() => patch({ weeklyFrequency: freq })}
              selected={data.weeklyFrequency === freq}
            >
              {String(freq)}
            </PillButton>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-wide text-white/55">
          Durée par séance
        </p>
        <div className="grid grid-cols-3 gap-2">
          {durationOptions.map((opt) => (
            <PillButton
              key={opt.value}
              onClick={() => patch({ sessionDurationPreference: opt.value })}
              selected={data.sessionDurationPreference === opt.value}
            >
              {opt.label}
            </PillButton>
          ))}
        </div>
      </div>
    </StepWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 4 — MATÉRIEL
// ─────────────────────────────────────────────────────────────────────────

function Step4Equipment({
  data,
  patch
}: {
  data: OnboardingData;
  patch: (partial: Partial<OnboardingData>) => void;
}) {
  const toggleCardio = (value: string) => {
    const current = data.cardioPreferences;
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    patch({ cardioPreferences: next });
  };

  return (
    <StepWrapper
      subtitle="Ce que tu as accès et ce que tu préfères."
      title="Matériel & cardio"
    >
      <div>
        <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/55">
          Matériel disponible
        </p>
        <div className="space-y-2">
          {equipmentOptions.map((opt) => (
            <GoalRow
              desc={opt.desc}
              key={opt.value}
              label={opt.label}
              onClick={() => patch({ equipment: opt.value })}
              selected={data.equipment === opt.value}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-wide text-white/55">
          Cardio préféré <span className="text-white/35">(optionnel)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {cardioOptions.map((opt) => (
            <PillButton
              key={opt.value}
              onClick={() => toggleCardio(opt.value)}
              selected={data.cardioPreferences.includes(opt.value)}
            >
              {opt.label}
            </PillButton>
          ))}
        </div>
      </div>
    </StepWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 5 — À ÉVITER
// ─────────────────────────────────────────────────────────────────────────

function Step5Avoid({
  data,
  patch
}: {
  data: OnboardingData;
  patch: (partial: Partial<OnboardingData>) => void;
}) {
  const togglePainZone = (value: BodyArea) => {
    const current = data.painZones;
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    patch({ painZones: next });
  };

  return (
    <StepWrapper
      subtitle="On adapte ton programme pour éviter ce qui peut te gêner."
      title="À éviter pour adapter ton programme"
    >
      <div>
        <p className="mb-2 text-sm font-bold text-white/60">
          Une douleur ou blessure actuelle ?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <PillButton
            onClick={() => patch({ hasPain: false, painZones: [] })}
            selected={!data.hasPain}
          >
            Non
          </PillButton>
          <PillButton
            onClick={() => patch({ hasPain: true })}
            selected={data.hasPain}
          >
            Oui
          </PillButton>
        </div>
      </div>

      {data.hasPain ? (
        <div>
          <p className="mb-2 mt-4 text-[11px] font-black uppercase tracking-wide text-white/55">
            Zone(s) concernée(s)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {painZoneOptions.map((opt) => (
              <PillButton
                key={opt.value}
                onClick={() => togglePainZone(opt.value)}
                selected={data.painZones.includes(opt.value)}
              >
                {opt.label}
              </PillButton>
            ))}
          </div>
        </div>
      ) : null}

      {data.sex === "female" ? (
        <div>
          <p className="mb-2 mt-4 text-sm font-bold text-white/60">
            Post-partum ou diastasis à prendre en compte ?
          </p>
          <div className="grid grid-cols-2 gap-2">
            <PillButton
              onClick={() => patch({ postpartumConcern: false })}
              selected={!data.postpartumConcern}
            >
              Non
            </PillButton>
            <PillButton
              onClick={() => patch({ postpartumConcern: true })}
              selected={data.postpartumConcern}
            >
              Oui
            </PillButton>
          </div>
        </div>
      ) : null}
    </StepWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// STEP 6 — RÉSULTAT
// ─────────────────────────────────────────────────────────────────────────

function Step6Result({
  data,
  recommendations
}: {
  data: OnboardingData;
  recommendations: ReturnType<typeof recommendPrograms>;
}) {
  const top = recommendations[0];
  const alternatives = recommendations.slice(1, 3);
  const reason = buildReason(top, data);

  if (!top) {
    return (
      <StepWrapper subtitle="On finalise ton plan." title="Ton programme">
        <p className="text-sm font-semibold text-white/55">
          Aucun programme correspondant trouvé — un programme par défaut sera généré depuis tes réglages.
        </p>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper subtitle="Voici le plan qui correspond le mieux." title="Ton programme">
      <article className="rounded-2xl border border-coral/30 bg-coral/10 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-coral">
          Recommandé pour toi
        </p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-white">
          {top.program.name}
        </h2>
        <p className="mt-2 text-xs font-semibold text-white/65">
          {capitalize(top.program.level)} · {top.program.frequency} j/sem. ·{" "}
          {top.program.averageDuration}
        </p>
        <p className="mt-3 rounded-md bg-white/8 p-3 text-sm font-semibold leading-relaxed text-white/80">
          {reason}
        </p>
      </article>

      {alternatives.length > 0 ? (
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-white/55">
            Alternatives
          </p>
          <div className="space-y-2">
            {alternatives.map((rec) => (
              <div
                className="rounded-xl border border-white/10 bg-white/5 p-3"
                key={rec.program.id}
              >
                <p className="text-sm font-black text-white">{rec.program.name}</p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/55">
                  {capitalize(rec.program.level)} · {rec.program.frequency} j/sem. ·{" "}
                  {rec.program.averageDuration}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </StepWrapper>
  );
}

function buildReason(
  recommendation: ReturnType<typeof recommendPrograms>[number] | undefined,
  data: OnboardingData
): string {
  if (recommendation?.reasons?.[0]) {
    return recommendation.reasons[0];
  }
  const goalLabel =
    goalOptions.find((opt) => opt.value === data.primaryGoal)?.label.toLowerCase() ??
    "ton objectif";
  return `Plan adapté à ${goalLabel}, ${data.weeklyFrequency} séances/semaine, niveau ${
    experienceOptions.find((opt) => opt.value === data.experienceLevel)?.label.toLowerCase() ??
    "personnalisé"
  }.`;
}

// ─────────────────────────────────────────────────────────────────────────
// ENGAGEMENT SCREEN
// ─────────────────────────────────────────────────────────────────────────

const HOLD_DURATION_MS = 2500;

function EngagementScreen({
  athleteName,
  onCommit,
  onCancel
}: {
  athleteName: string;
  onCommit: () => void;
  onCancel: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [committed, setCommitted] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopHold = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startedAtRef.current = null;
    if (!committed) {
      setProgress(0);
    }
  };

  useEffect(() => stopHold, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startHold = () => {
    if (committed) return;
    startedAtRef.current = performance.now();
    const tick = () => {
      if (startedAtRef.current === null) return;
      const elapsed = performance.now() - startedAtRef.current;
      const ratio = Math.min(1, elapsed / HOLD_DURATION_MS);
      setProgress(ratio);
      if (ratio >= 1) {
        setCommitted(true);
        rafRef.current = null;
        // Small delay so the user sees the bar full before nav
        window.setTimeout(onCommit, 200);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  return (
    <div className="app-shell mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center px-4 pb-10 pt-8 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <BrandLogo className="h-10" priority variant="wordmark" />
      </div>

      <div className="w-full rounded-[28px] border border-coral/25 bg-[#11131a]/90 p-6 text-center shadow-soft">
        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-coral">
          Engagement
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-white">
          {athleteName}, tu es prêt(e) ?
        </h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
          Le programme est calé. Le reste, c&apos;est toi qui le construis, séance après séance.
          Maintiens le bouton pour confirmer ton engagement.
        </p>

        <div className="mt-8">
          <button
            aria-label="Maintenir pour s'engager"
            className={`relative h-20 w-full overflow-hidden rounded-2xl border-2 px-4 text-lg font-black text-white transition select-none ${
              committed
                ? "border-sea bg-sea"
                : progress > 0
                  ? "border-coral bg-coral/90"
                  : "border-coral bg-coral"
            }`}
            onPointerDown={startHold}
            onPointerUp={stopHold}
            onPointerCancel={stopHold}
            onPointerLeave={stopHold}
            onTouchStart={(event) => {
              event.preventDefault();
              startHold();
            }}
            onTouchEnd={stopHold}
            type="button"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-100"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
            <span className="relative z-10">
              {committed ? "✓ Engagé" : "Maintenir pour m'engager"}
            </span>
          </button>
          <p className="mt-2 text-[11px] font-semibold text-white/45">
            {committed
              ? "Top. On y va."
              : progress > 0
                ? "Continue d'appuyer…"
                : "Pose ton doigt et garde 2-3 secondes."}
          </p>
        </div>

        <button
          className="mt-6 text-xs font-bold text-white/45 underline-offset-2 hover:underline"
          onClick={onCancel}
          type="button"
        >
          Revenir au questionnaire
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SETTINGS BUILDER
// ─────────────────────────────────────────────────────────────────────────

function buildSettings(data: OnboardingData, base: UserSettings): UserSettings {
  const mainGoal =
    goalOptions.find((g) => g.value === data.primaryGoal)?.label ?? "Programme personnalisé";
  const preferences = Array.from(
    new Set([...(base.preferences ?? []), ...data.cardioPreferences])
  );
  const avoid = base.avoid ?? [];
  const constraints = buildConstraints(data);
  const watchPoints = buildWatchPoints(data);

  return {
    ...base,
    athleteName: data.athleteName.trim() || base.athleteName,
    sex: data.sex,
    age: data.age,
    heightCm: data.heightCm,
    currentWeightKg: data.currentWeightKg,
    targetWeightKg: data.targetWeightKg,
    mainGoal,
    primaryGoal: data.primaryGoal,
    secondaryGoal: data.secondaryGoal,
    experienceLevel: data.experienceLevel,
    equipment: data.equipment,
    weeklyFrequency: data.weeklyFrequency,
    sessionDurationPreference: data.sessionDurationPreference,
    availableDays: base.availableDays?.length ? base.availableDays : ALL_WEEKDAYS,
    preferences,
    avoid,
    watchPoints,
    constraints,
    judoDays: [],
    externalSports: base.externalSports ?? [],
    strengthReferences: base.strengthReferences ?? [],
    cardioLevel: base.cardioLevel || "Modere",
    sleepQuality: base.sleepQuality || "Regulier",
    recoveryProfile: base.recoveryProfile ?? "regular",
    medicalNotes: base.medicalNotes ?? "",
    cautionLevel: data.hasPain ? "prudent" : base.cautionLevel ?? "normal",
    aiEnabled: base.aiEnabled ?? false,
    darkMode: base.darkMode ?? true
  };
}

function buildConstraints(data: OnboardingData): TrainingConstraint[] {
  const constraints: TrainingConstraint[] = [];

  data.painZones.forEach((zone, index) => {
    constraints.push({
      id: `onboarding-pain-${zone}-${index}`,
      area: zone,
      label: `Douleur ${painZoneOptions.find((p) => p.value === zone)?.label.toLowerCase() ?? zone}`,
      severity: "caution"
    });
  });

  if (data.sex === "female" && data.postpartumConcern) {
    constraints.push({
      id: "onboarding-postpartum",
      area: "other",
      label: "Post-partum / diastasis à protéger",
      severity: "avoid"
    });
    constraints.push({
      id: "onboarding-pelvic-floor",
      area: "hip",
      label: "Plancher pelvien à respecter",
      severity: "caution"
    });
  }

  return constraints;
}

function buildWatchPoints(data: OnboardingData): string[] {
  const points: string[] = [];
  data.painZones.forEach((zone) => {
    const label = painZoneOptions.find((p) => p.value === zone)?.label;
    if (label) points.push(`douleur ${label.toLowerCase()}`);
  });
  if (data.sex === "female" && data.postpartumConcern) {
    points.push("post-partum", "diastasis");
  }
  return points;
}

// ─────────────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────────────

function StepWrapper({
  children,
  subtitle,
  title
}: {
  children: React.ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black leading-tight text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm font-semibold text-white/55">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function PillButton({
  children,
  onClick,
  selected
}: {
  children: React.ReactNode;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      className={`min-h-12 rounded-xl border px-3 text-sm font-black transition ${
        selected
          ? "border-coral bg-coral/15 text-coral"
          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/8"
      }`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function GoalRow({
  desc,
  label,
  onClick,
  selected
}: {
  desc: string;
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? "border-coral/50 bg-coral/10"
          : "border-white/10 bg-white/5 hover:bg-white/8"
      }`}
      onClick={onClick}
      type="button"
    >
      <p className={`font-black ${selected ? "text-coral" : "text-white"}`}>{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-white/55">{desc}</p>
    </button>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
    </label>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  step = 1,
  value
}: {
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        inputMode="decimal"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
