"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { PROFILE_PRESETS, type ProfilePreset } from "@/data/profilePresets";
import { instantiateProgramTemplate } from "@/lib/programInstantiation";
import { recommendPrograms } from "@/lib/programRecommendation";
import { buildStrengthReferenceFromSet, estimateOneRepMaxFromSet, formatEstimatedOneRepMax } from "@/lib/strengthCalibration";
import { useCoachStorage } from "@/lib/storage";
import type {
  CautionLevel,
  Equipment,
  ExperienceLevel,
  ExternalSportIntensity,
  LoadUnit,
  PrimaryGoal,
  ProgramRecommendation,
  StrengthReference,
  TrainingConstraint,
  UserSex,
  UserSettings,
  Weekday
} from "@/types/training";

const TOTAL_STEPS = 5;

const weekdayOptions: Array<{ value: Weekday; label: string }> = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" }
];

const goalOptions: Array<{ value: PrimaryGoal; mainGoalText: string; label: string; desc: string }> = [
  { value: "perte-gras", mainGoalText: "Perte de gras : perdre du poids sans sacrifier le muscle.", label: "Perdre du poids", desc: "Plus de marche/cardio doux, muscu maintenue" },
  { value: "recomposition", mainGoalText: "Recomposition : perdre du gras, garder et construire du muscle.", label: "Recomposition", desc: "Equilibre force, volume et cardio" },
  { value: "prise-masse", mainGoalText: "Prise de muscle : construire du volume proprement.", label: "Prendre du muscle", desc: "Plus de volume, progression double" },
  { value: "performance", mainGoalText: "Force : progresser sur les mouvements principaux.", label: "Force", desc: "Charges prioritaires, repos plus longs" },
  { value: "sante", mainGoalText: "Remise en forme : bouger mieux, progresser sans se cramer.", label: "Cardio / sante", desc: "Simple, progressif, durable" }
];

const equipmentOptions: Array<{ value: Equipment; label: string; desc: string }> = [
  { value: "salle-complete", label: "Salle equipee", desc: "Machines, barres, halteres, poulies" },
  { value: "halteres-maison", label: "Maison equipee", desc: "Halteres, elastiques, banc" },
  { value: "poids-corps", label: "Peu de materiel", desc: "Poids du corps ou tres simple" }
];

const experienceOptions: Array<{ value: ExperienceLevel; label: string; desc: string }> = [
  { value: "debutant", label: "Debutant", desc: "Reprise ou moins d'1 an regulier" },
  { value: "intermediaire", label: "Intermediaire", desc: "Technique correcte, routine deja installee" },
  { value: "avance", label: "Avance", desc: "Charges lourdes, volume plus haut" }
];

const sexOptions: Array<{ value: UserSex; label: string }> = [
  { value: "female", label: "Femme" },
  { value: "male", label: "Homme" },
  { value: "other", label: "Autre" },
  { value: "prefer-not-to-say", label: "Ne pas dire" }
];

const durationOptions: Array<{ value: UserSettings["sessionDurationPreference"]; label: string }> = [
  { value: "short", label: "35-45 min" },
  { value: "standard", label: "50-65 min" },
  { value: "long", label: "70-90 min" }
];

const sportIntensityOptions: Array<{ value: ExternalSportIntensity; label: string }> = [
  { value: "low", label: "Leger" },
  { value: "moderate", label: "Modere" },
  { value: "high", label: "Intense" }
];

const cautionOptions: Array<{ value: CautionLevel; label: string }> = [
  { value: "prudent", label: "Prudent" },
  { value: "normal", label: "Normal" },
  { value: "agressif", label: "Agressif controle" }
];

type OnboardingData = {
  athleteName: string;
  sex: UserSex;
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  primaryGoal: PrimaryGoal;
  experienceLevel: ExperienceLevel;
  equipment: Equipment;
  weeklyFrequency: number;
  availableDays: Weekday[];
  sessionDurationPreference: UserSettings["sessionDurationPreference"];
  hasExternalSport: boolean;
  externalSportName: string;
  externalSportIntensity: ExternalSportIntensity;
  externalSportDays: Weekday[];
  benchLoadKg: number;
  benchReps: number;
  loadUnit: LoadUnit;
  cardioLevel: string;
  sleepQuality: string;
  medicalNotes: string;
  watchPointsText: string;
  preferencesText: string;
  avoidText: string;
  cautionLevel: CautionLevel;
  aiEnabled: boolean;
};

const initialData: OnboardingData = {
  athleteName: "",
  sex: "prefer-not-to-say",
  age: 30,
  heightCm: 175,
  currentWeightKg: 80,
  targetWeightKg: 75,
  primaryGoal: "recomposition",
  experienceLevel: "intermediaire",
  equipment: "salle-complete",
  weeklyFrequency: 4,
  availableDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
  sessionDurationPreference: "standard",
  hasExternalSport: false,
  externalSportName: "",
  externalSportIntensity: "high",
  externalSportDays: [],
  benchLoadKg: 0,
  benchReps: 5,
  loadUnit: "kg",
  cardioLevel: "Modere",
  sleepQuality: "Regulier",
  medicalNotes: "",
  watchPointsText: "",
  preferencesText: "",
  avoidText: "",
  cautionLevel: "normal",
  aiEnabled: false
};

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [selectedPresetId, setSelectedPresetId] = useState<ProfilePreset["id"] | undefined>();
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>();
  const [hasManualProgramSelection, setHasManualProgramSelection] = useState(false);
  const { applyProfilePreset, completeOnboarding, setCurrentProgram, settings } = useCoachStorage();
  const router = useRouter();

  const patch = (partial: Partial<OnboardingData>) => {
    setSelectedPresetId(undefined);
    setData((current) => ({ ...current, ...partial }));
  };
  const draftSettings = useMemo(() => buildSettings(settings, data), [data, settings]);
  const recommendations = useMemo(() => recommendPrograms(draftSettings), [draftSettings]);
  const selectedRecommendation =
    recommendations.find((recommendation) => recommendation.program.id === selectedProgramId) ?? recommendations[0];

  useEffect(() => {
    const topProgramId = recommendations[0]?.program.id;
    if (!topProgramId) return;

    const selectedProgramStillRecommended = recommendations.some(
      (recommendation) => recommendation.program.id === selectedProgramId
    );

    if ((!hasManualProgramSelection || !selectedProgramStillRecommended) && selectedProgramId !== topProgramId) {
      setSelectedProgramId(topProgramId);
    }
  }, [hasManualProgramSelection, recommendations, selectedProgramId]);

  const selectProgram = (programId: string) => {
    setHasManualProgramSelection(true);
    setSelectedProgramId(programId);
  };

  const applyPreset = (preset: ProfilePreset) => {
    setSelectedPresetId(preset.id);
    setData(presetToOnboardingData(preset));
    setHasManualProgramSelection(false);
    setSelectedProgramId(undefined);
    setStep(TOTAL_STEPS);
  };

  const canAdvance = () => {
    if (step === 1) {
      return data.athleteName.trim().length > 0 && data.age > 0 && data.heightCm > 0 && data.currentWeightKg > 0;
    }
    if (step === 3) {
      return data.availableDays.length > 0;
    }
    if (step === 4) {
      return !data.hasExternalSport || data.externalSportDays.length > 0;
    }
    return true;
  };

  const finish = () => {
    const selectedProgram = selectedRecommendation
      ? instantiateProgramTemplate(selectedRecommendation.program, draftSettings)
      : undefined;

    if (selectedPresetId) {
      applyProfilePreset(selectedPresetId);
      if (selectedProgram) {
        setCurrentProgram(selectedProgram);
      }
      router.replace("/");
      return;
    }

    completeOnboarding(draftSettings, selectedProgram);

    router.replace("/");
  };

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="app-shell mx-auto min-h-screen w-full max-w-[44rem] px-4 pb-10 pt-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <BrandLogo className="h-10" priority variant="wordmark" />
        <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">
          {step}/{TOTAL_STEPS}
        </span>
      </div>

      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-black uppercase text-white/40">Questionnaire utile</p>
          <p className="text-xs font-bold text-white/40">{progress}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-coral transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <section className="mb-4 rounded-[24px] border border-coral/20 bg-coral/10 p-4 shadow-soft">
        <p className="text-xs font-black uppercase text-coral">Creer mon profil</p>
        <h2 className="mt-1 text-xl font-black text-white">Chaque reponse doit servir au programme.</h2>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-white/60">
          Objectif, niveau, temps, materiel et contraintes alimentent la recommandation puis le programme actif.
        </p>
      </section>

      {step === 1 ? (
        <details className="mb-4 rounded-[20px] border border-white/10 bg-white/[0.04] p-3 shadow-soft">
          <summary className="cursor-pointer list-none text-sm font-black text-white">
            Profils rapides Sofiane / Alicia <span className="font-semibold text-white/45">(optionnel)</span>
          </summary>
          <p className="mt-2 text-xs font-semibold leading-relaxed text-white/50">
            Utile pour tester l&apos;app avec des profils separes. Ton profil perso reste le parcours principal.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PROFILE_PRESETS.map((preset) => (
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition active:scale-[0.99]"
                key={preset.id}
                onClick={() => applyPreset(preset)}
                type="button"
              >
                <span className="flex size-9 items-center justify-center rounded-xl bg-coral/15 text-base font-black text-coral">
                  {preset.profile.avatar}
                </span>
                <p className="mt-2 font-black text-white">{preset.profile.name}</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-white/50">
                  {preset.settings.primaryGoal === "perte-gras" ? "Perte de poids + fessiers" : "Force + recomposition"}
                </p>
              </button>
            ))}
          </div>
        </details>
      ) : null}

      <section className="rounded-[28px] border border-white/10 bg-[#11131a]/92 p-4 shadow-soft">
        {step === 1 ? <ProfileStep data={data} patch={patch} /> : null}
        {step === 2 ? <GoalStep data={data} patch={patch} /> : null}
        {step === 3 ? <TrainingStep data={data} patch={patch} /> : null}
        {step === 4 ? <ConstraintsStep data={data} patch={patch} /> : null}
        {step === 5 ? (
          <RecommendationStep
            data={data}
            onFinish={finish}
            onSelect={selectProgram}
            recommendations={recommendations}
            selectedProgramId={selectedRecommendation?.program.id}
          />
        ) : null}
      </section>

      <div className={`mt-4 grid gap-3 ${step < TOTAL_STEPS ? "grid-cols-2" : "grid-cols-1"}`}>
        <button
          className="h-12 rounded-xl border border-white/10 bg-white/8 font-black text-white disabled:opacity-30"
          disabled={step === 1}
          onClick={() => setStep((current) => Math.max(1, current - 1))}
          type="button"
        >
          {step === TOTAL_STEPS ? "Modifier mes reponses" : "Retour"}
        </button>
        {step < TOTAL_STEPS ? (
          <button
            className="h-12 rounded-xl bg-coral px-4 font-black text-white disabled:opacity-40"
            disabled={!canAdvance()}
            onClick={() => setStep((current) => Math.min(TOTAL_STEPS, current + 1))}
            type="button"
          >
            Continuer
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProfileStep({ data, patch }: { data: OnboardingData; patch: (partial: Partial<OnboardingData>) => void }) {
  return (
    <StepShell subtitle="On garde seulement les infos qui servent au programme." title="Profil rapide">
      <TextField label="Prenom" onChange={(value) => patch({ athleteName: value })} placeholder="ex. Sofiane" value={data.athleteName} />
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Age" max={80} min={14} onChange={(value) => patch({ age: value })} value={data.age} />
        <NumberField label="Taille" max={230} min={140} onChange={(value) => patch({ heightCm: value })} suffix="cm" value={data.heightCm} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <NumberField label="Poids actuel" max={250} min={30} onChange={(value) => patch({ currentWeightKg: value })} step={0.5} suffix="kg" value={data.currentWeightKg} />
        <NumberField label="Poids vise" max={250} min={30} onChange={(value) => patch({ targetWeightKg: value })} step={0.5} suffix="kg" value={data.targetWeightKg} />
      </div>
      <OptionGrid
        label="Profil"
        options={sexOptions}
        selected={data.sex}
        onSelect={(sex) => patch({ sex })}
      />
    </StepShell>
  );
}

function GoalStep({ data, patch }: { data: OnboardingData; patch: (partial: Partial<OnboardingData>) => void }) {
  return (
    <StepShell subtitle="Cette réponse choisit la famille de programme et le dosage cardio/muscu." title="Objectif">
      <div className="space-y-2">
        {goalOptions.map((goal) => (
          <OptionCard
            desc={goal.desc}
            key={goal.value}
            label={goal.label}
            selected={data.primaryGoal === goal.value}
            onClick={() => patch({ primaryGoal: goal.value })}
          />
        ))}
      </div>
    </StepShell>
  );
}

function TrainingStep({ data, patch }: { data: OnboardingData; patch: (partial: Partial<OnboardingData>) => void }) {
  return (
    <StepShell subtitle="Ces réponses déterminent la fréquence, la durée et les exercices possibles." title="Niveau & disponibilite">
      <div>
        <p className="mb-2 text-sm font-bold text-white/60">Nombre de seances par semaine</p>
        <div className="grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((frequency) => (
            <button
              className={`h-12 rounded-xl border font-black transition ${
                data.weeklyFrequency === frequency ? "border-coral/50 bg-coral/15 text-coral" : "border-white/10 bg-white/5 text-white/60"
              }`}
              key={frequency}
              onClick={() => patch({ weeklyFrequency: frequency })}
              type="button"
            >
              {frequency}
            </button>
          ))}
        </div>
      </div>

      <OptionGrid
        label="Duree par seance"
        options={durationOptions}
        selected={data.sessionDurationPreference}
        onSelect={(sessionDurationPreference) => patch({ sessionDurationPreference })}
      />

      <div>
        <p className="mb-2 text-sm font-bold text-white/60">Jours possibles</p>
        <div className="grid grid-cols-2 gap-2">
          {weekdayOptions.map((day) => {
            const checked = data.availableDays.includes(day.value);
            return (
              <button
                className={`min-h-11 rounded-xl border px-3 text-left text-sm font-black transition ${
                  checked ? "border-coral/45 bg-coral/12 text-coral" : "border-white/8 bg-white/5 text-white/55"
                }`}
                key={day.value}
                onClick={() => {
                  const next = checked
                    ? data.availableDays.filter((value) => value !== day.value)
                    : [...data.availableDays, day.value];
                  patch({ availableDays: next });
                }}
                type="button"
              >
                {checked ? "Oui" : "Non"} - {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-white/60">Niveau</p>
        <div className="space-y-2">
          {experienceOptions.map((option) => (
            <OptionCard
              desc={option.desc}
              key={option.value}
              label={option.label}
              selected={data.experienceLevel === option.value}
              onClick={() => patch({ experienceLevel: option.value })}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-bold text-white/60">Materiel</p>
        <div className="space-y-2">
          {equipmentOptions.map((option) => (
            <OptionCard
              desc={option.desc}
              key={option.value}
              label={option.label}
              selected={data.equipment === option.value}
              onClick={() => patch({ equipment: option.value })}
            />
          ))}
        </div>
      </div>
    </StepShell>
  );
}

function ConstraintsStep({ data, patch }: { data: OnboardingData; patch: (partial: Partial<OnboardingData>) => void }) {
  const estimatedBench = estimateOneRepMaxFromSet(data.benchLoadKg, data.benchReps, data.loadUnit);

  return (
    <StepShell subtitle="Ce bloc sert aux garde-fous, aux remplacements et aux charges de depart." title="Contraintes">
      <ToggleCard
        checked={data.hasExternalSport}
        desc="Judo, foot, sport de combat, cardio intense..."
        label="Autre sport dans la semaine"
        onChange={(hasExternalSport) => patch({ hasExternalSport, externalSportDays: hasExternalSport ? data.externalSportDays : [] })}
      />

      {data.hasExternalSport ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3">
          <TextField label="Sport pratique" onChange={(value) => patch({ externalSportName: value })} placeholder="ex. Judo" value={data.externalSportName} />
          <OptionGrid
            label="Intensite"
            options={sportIntensityOptions}
            selected={data.externalSportIntensity}
            onSelect={(externalSportIntensity) => patch({ externalSportIntensity })}
          />
          <div>
            <p className="mb-2 text-sm font-bold text-white/60">Jours du sport</p>
            <div className="grid grid-cols-2 gap-2">
              {weekdayOptions.map((day) => {
                const checked = data.externalSportDays.includes(day.value);
                return (
                  <button
                    className={`min-h-11 rounded-xl border px-3 text-left text-sm font-black transition ${
                      checked ? "border-coral/45 bg-coral/12 text-coral" : "border-white/8 bg-white/5 text-white/55"
                    }`}
                    key={day.value}
                    onClick={() => {
                      const next = checked
                        ? data.externalSportDays.filter((value) => value !== day.value)
                        : [...data.externalSportDays, day.value];
                      patch({ externalSportDays: next });
                    }}
                    type="button"
                  >
                    {checked ? "Oui" : "Non"} - {day.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black text-white">Repere developpe couche</p>
            <p className="mt-1 text-xs font-semibold text-white/45">Optionnel. Exemple : 100 kg x 5, pas forcement un max.</p>
          </div>
          <p className="shrink-0 text-xs font-black text-sky">{formatEstimatedOneRepMax(estimatedBench)}</p>
        </div>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
          <NumberField label="Charge" max={350} min={0} onChange={(value) => patch({ benchLoadKg: value })} step={2.5} suffix={data.loadUnit} value={data.benchLoadKg} />
          <NumberField label="Reps" max={12} min={1} onChange={(value) => patch({ benchReps: value })} value={data.benchReps} />
        </div>
      </div>

      <TextAreaField label="Douleurs / blessures" onChange={(value) => patch({ medicalNotes: value })} placeholder="ex. poignet droit, diastasis, dos fragile..." value={data.medicalNotes} />
      <TextAreaField label="Exercices refuses" onChange={(value) => patch({ avoidText: value })} placeholder="ex. course, burpees, pompes, squat barre..." value={data.avoidText} />
      <TextAreaField label="Preferences" onChange={(value) => patch({ preferencesText: value })} placeholder="ex. machines, poulies, tapis incline..." value={data.preferencesText} />

      <div className="grid grid-cols-2 gap-3">
        <OptionGrid
          label="Cardio"
          options={["Faible", "Modere", "Bon", "Excellent"].map((value) => ({ value, label: value }))}
          selected={data.cardioLevel}
          onSelect={(cardioLevel) => patch({ cardioLevel })}
        />
        <OptionGrid
          label="Prudence"
          options={cautionOptions}
          selected={data.cautionLevel}
          onSelect={(cautionLevel) => patch({ cautionLevel })}
        />
      </div>
    </StepShell>
  );
}

function RecommendationStep({
  data,
  onFinish,
  onSelect,
  recommendations,
  selectedProgramId
}: {
  data: OnboardingData;
  onFinish: () => void;
  onSelect: (programId: string) => void;
  recommendations: ProgramRecommendation[];
  selectedProgramId?: string;
}) {
  const selected = recommendations.find((recommendation) => recommendation.program.id === selectedProgramId) ?? recommendations[0];
  const adaptationBullets = buildAdaptationBullets(data);

  return (
    <StepShell subtitle="Ton programme actif part de tes reponses. Tu peux garder le choix recommande ou prendre une alternative." title="Programme recommande">
      {selected ? (
        <div className="rounded-[24px] border border-coral/30 bg-coral/10 p-4">
          <p className="text-xs font-black uppercase text-coral">Recommande pour {data.athleteName || "toi"}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-white">{selected.program.name}</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-white/65">{selected.program.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <SummaryTile label="Niveau" value={selected.program.level} />
            <SummaryTile label="Frequence" value={`${selected.program.frequency}j/sem.`} />
            <SummaryTile label="Duree" value={selected.program.averageDuration} />
          </div>
          <div className="mt-3 space-y-2">
            {selected.reasons.slice(0, 3).map((reason) => (
              <p className="rounded-xl border border-white/8 bg-white/8 px-3 py-2 text-xs font-semibold text-white/70" key={reason}>
                {reason}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <p className="text-sm font-black text-white">Ce qui a ete adapte</p>
        <div className="mt-2 space-y-2">
          {adaptationBullets.map((item) => (
            <p className="rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-xs font-semibold leading-relaxed text-white/65" key={item}>
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {recommendations.slice(0, 3).map((recommendation) => {
          const checked = selectedProgramId === recommendation.program.id;
          return (
            <button
              className={`w-full rounded-2xl border p-3 text-left transition ${
                checked ? "border-coral/45 bg-coral/12" : "border-white/10 bg-white/5"
              }`}
              key={recommendation.program.id}
              onClick={() => onSelect(recommendation.program.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`font-black ${checked ? "text-coral" : "text-white"}`}>
                    {recommendation.rank === 1 ? "Recommande" : `Alternative ${recommendation.rank - 1}`} - {recommendation.program.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-white/50">
                    {formatGoalForUi(String(recommendation.program.primaryObjective))} - {recommendation.program.frequency} j/sem.
                  </p>
                  <p className="mt-2 text-xs font-semibold leading-relaxed text-white/60">
                    {recommendation.reasons[0] ?? "Option disponible pour ton profil."}
                  </p>
                </div>
                <span className={`shrink-0 rounded-lg px-2 py-1 text-xs font-black ${
                  checked ? "bg-coral/15 text-coral" : "bg-white/8 text-white/55"
                }`}>
                  {checked ? "Choisi" : "Voir"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <button className="h-14 w-full rounded-xl bg-coral px-4 text-base font-black text-white shadow-soft" onClick={onFinish} type="button">
        Commencer avec ce programme
      </button>
    </StepShell>
  );
}

function buildAdaptationBullets(data: OnboardingData): string[] {
  const bullets = [
    `Objectif: ${formatGoalForUi(data.primaryGoal)}.`,
    `Frequence: ${data.weeklyFrequency} seances placees sur tes jours disponibles.`,
    `Duree: format ${formatDurationPreference(data.sessionDurationPreference)}.`,
    `Niveau: programme calibre pour un profil ${formatExperienceForUi(data.experienceLevel)}.`,
    `Materiel: exercices compatibles avec ${formatEquipmentForUi(data.equipment)}.`
  ];

  if (data.hasExternalSport) {
    bullets.push(`${data.externalSportName || "Sport externe"} pris en compte dans le placement des seances.`);
  }

  if (data.medicalNotes.trim() || data.avoidText.trim()) {
    bullets.push("Douleurs, blessures et exercices refuses servent aux garde-fous et remplacements.");
  }

  if (data.benchLoadKg > 0) {
    bullets.push("Repere developpe couche utilise pour calibrer les charges de depart.");
  }

  return bullets;
}

function formatGoalForUi(goal: string): string {
  const labels: Record<string, string> = {
    "cardio-sante": "cardio / sante",
    fessiers: "fessiers",
    force: "force",
    performance: "force",
    "perte-gras": "perte de poids",
    "prise-masse": "prise de muscle",
    recomposition: "recomposition",
    sante: "cardio / sante"
  };

  return labels[goal] ?? goal;
}

function formatDurationPreference(value: UserSettings["sessionDurationPreference"]): string {
  const labels: Record<UserSettings["sessionDurationPreference"], string> = {
    long: "70-90 min",
    short: "35-45 min",
    standard: "50-65 min"
  };

  return labels[value];
}

function formatExperienceForUi(value: ExperienceLevel): string {
  const labels: Record<ExperienceLevel, string> = {
    avance: "avance",
    debutant: "debutant",
    intermediaire: "intermediaire"
  };

  return labels[value];
}

function formatEquipmentForUi(value: Equipment): string {
  const labels: Record<Equipment, string> = {
    "halteres-maison": "maison equipee",
    "poids-corps": "peu de materiel",
    "salle-complete": "salle equipee"
  };

  return labels[value];
}

function StepShell({ children, subtitle, title }: { children: React.ReactNode; subtitle: string; title: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black leading-tight text-white">{title}</h1>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-white/55">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function OptionCard({
  desc,
  label,
  onClick,
  selected
}: {
  desc?: string;
  label: string;
  onClick: () => void;
  selected: boolean;
}) {
  return (
    <button
      className={`w-full rounded-2xl border p-3 text-left transition ${
        selected ? "border-coral/45 bg-coral/12" : "border-white/10 bg-white/5"
      }`}
      onClick={onClick}
      type="button"
    >
      <p className={`font-black ${selected ? "text-coral" : "text-white"}`}>{label}</p>
      {desc ? <p className="mt-1 text-xs font-semibold leading-relaxed text-white/50">{desc}</p> : null}
    </button>
  );
}

function OptionGrid<T extends string>({
  label,
  onSelect,
  options,
  selected
}: {
  label: string;
  onSelect: (value: T) => void;
  options: Array<{ value: T; label: string }>;
  selected: T;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-white/60">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            className={`min-h-11 rounded-xl border px-3 text-sm font-black transition ${
              selected === option.value ? "border-coral/45 bg-coral/12 text-coral" : "border-white/10 bg-white/5 text-white/60"
            }`}
            key={option.value}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleCard({
  checked,
  desc,
  label,
  onChange
}: {
  checked: boolean;
  desc: string;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      className={`w-full rounded-2xl border p-3 text-left transition ${
        checked ? "border-coral/45 bg-coral/12" : "border-white/10 bg-white/5"
      }`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`font-black ${checked ? "text-coral" : "text-white"}`}>{label}</p>
        <span className={`h-6 w-10 rounded-full transition ${checked ? "bg-coral" : "bg-white/20"}`} />
      </div>
      <p className="mt-1 text-xs font-semibold leading-relaxed text-white/50">{desc}</p>
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
        className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
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
  suffix,
  value
}: {
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  suffix?: string;
  value: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <div className="mt-1 flex h-12 overflow-hidden rounded-xl border border-white/10 bg-white/5 focus-within:border-coral focus-within:ring-2 focus-within:ring-coral/20">
        <input
          className="min-w-0 flex-1 bg-transparent px-3 font-semibold text-white outline-none"
          inputMode="decimal"
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value))}
          step={step}
          type="number"
          value={value}
        />
        {suffix ? <span className="flex items-center px-3 text-xs font-black text-white/40">{suffix}</span> : null}
      </div>
    </label>
  );
}

function TextAreaField({
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
      <span className="text-sm font-bold text-white/60">{label} <span className="text-white/35">(optionnel)</span></span>
      <textarea
        className="mt-1 min-h-20 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-coral focus:ring-2 focus:ring-coral/20"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/8 bg-white/8 p-3 text-center">
      <p className="truncate text-sm font-black text-white">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase text-white/45">{label}</p>
    </div>
  );
}

function buildSettings(settings: UserSettings, data: OnboardingData): UserSettings {
  const goalText = goalOptions.find((goal) => goal.value === data.primaryGoal)?.mainGoalText ?? "Programme personnalise";
  const medicalNotes = data.medicalNotes.trim();
  const watchPoints = parseTextList(data.watchPointsText);
  const preferences = parseTextList(data.preferencesText);
  const avoid = parseTextList(data.avoidText);
  const strengthReferences = buildStrengthReferences(data);
  const benchEstimatedOneRepMaxKg = estimateOneRepMaxFromSet(data.benchLoadKg, data.benchReps, data.loadUnit);
  const externalSports = buildExternalSports(data);

  return {
    ...settings,
    athleteName: data.athleteName,
    sex: data.sex,
    age: data.age,
    heightCm: data.heightCm,
    currentWeightKg: data.currentWeightKg,
    targetWeightKg: data.targetWeightKg,
    mainGoal: goalText,
    primaryGoal: data.primaryGoal,
    experienceLevel: data.experienceLevel,
    equipment: data.equipment,
    weeklyFrequency: data.weeklyFrequency,
    availableDays: data.availableDays,
    sessionDurationPreference: data.sessionDurationPreference,
    judoDays: data.externalSportName.toLowerCase().includes("judo") ? data.externalSportDays : [],
    benchOneRepMaxKg: benchEstimatedOneRepMaxKg ?? 0,
    loadUnit: data.loadUnit,
    cardioLevel: data.cardioLevel,
    sleepQuality: data.sleepQuality,
    recoveryProfile: mapSleepToRecovery(data.sleepQuality),
    medicalNotes,
    watchPoints,
    preferences,
    avoid,
    externalSports,
    constraints: buildConstraints(medicalNotes, watchPoints, avoid),
    strengthReferences,
    cautionLevel: data.cautionLevel,
    aiEnabled: data.aiEnabled,
    darkMode: false
  };
}

function presetToOnboardingData(preset: ProfilePreset): OnboardingData {
  const settings = preset.settings;
  const primarySport = settings.externalSports[0];
  const benchReference = settings.strengthReferences.find((reference) =>
    normalizeForMatch(reference.lift).includes("developpe") && normalizeForMatch(reference.lift).includes("couche")
  );

  return {
    ...initialData,
    athleteName: settings.athleteName,
    sex: settings.sex,
    age: settings.age,
    heightCm: settings.heightCm,
    currentWeightKg: settings.currentWeightKg,
    targetWeightKg: settings.targetWeightKg,
    primaryGoal: settings.primaryGoal ?? "recomposition",
    experienceLevel: settings.experienceLevel ?? "intermediaire",
    equipment: settings.equipment ?? "salle-complete",
    weeklyFrequency: settings.weeklyFrequency ?? 4,
    availableDays: settings.availableDays,
    sessionDurationPreference: settings.sessionDurationPreference,
    hasExternalSport: Boolean(primarySport),
    externalSportName: primarySport?.name ?? "",
    externalSportIntensity: primarySport?.intensity ?? "moderate",
    externalSportDays: primarySport?.days ?? [],
    benchLoadKg: benchReference?.loadKg ?? settings.benchOneRepMaxKg ?? 0,
    benchReps: benchReference?.reps ?? (settings.benchOneRepMaxKg ? 1 : 5),
    loadUnit: settings.loadUnit,
    cardioLevel: settings.cardioLevel,
    sleepQuality: settings.sleepQuality,
    medicalNotes: settings.medicalNotes,
    watchPointsText: settings.watchPoints.join("\n"),
    preferencesText: settings.preferences.join("\n"),
    avoidText: settings.avoid.join("\n"),
    cautionLevel: settings.cautionLevel,
    aiEnabled: settings.aiEnabled
  };
}

function parseTextList(value: string): string[] {
  const parts = value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(parts));
}

function buildExternalSports(data: OnboardingData): UserSettings["externalSports"] {
  if (!data.hasExternalSport || data.externalSportDays.length === 0) {
    return [];
  }

  const name = data.externalSportName.trim() || "Sport externe";

  return [
    {
      id: slugify(name) || "sport-externe",
      name,
      days: data.externalSportDays,
      intensity: data.externalSportIntensity,
      notes: "Activite externe prise en compte dans la fatigue et la recuperation."
    }
  ];
}

function buildStrengthReferences(data: OnboardingData): StrengthReference[] {
  const references = [
    buildStrengthReferenceFromSet("Developpe couche", data.benchLoadKg, data.benchReps, data.loadUnit)
  ];

  return references
    .filter((reference): reference is StrengthReference => Boolean(reference))
    .map((reference) => ({ ...reference, origin: "onboarding" as const, locked: false }));
}

function buildConstraints(medicalNotes: string, watchPoints: string[], avoid: string[]): TrainingConstraint[] {
  const constraints: TrainingConstraint[] = [];

  if (medicalNotes) {
    constraints.push({
      id: "onboarding-medical-notes",
      area: inferConstraintArea(medicalNotes),
      label: medicalNotes,
      severity: "info"
    });
  }

  watchPoints.forEach((point, index) => {
    constraints.push({
      id: `onboarding-watch-${index}`,
      area: inferConstraintArea(point),
      label: point,
      severity: "caution"
    });
  });

  avoid.forEach((item, index) => {
    constraints.push({
      id: `onboarding-avoid-${index}`,
      area: inferConstraintArea(item),
      label: `Eviter: ${item}`,
      severity: "avoid"
    });
  });

  return constraints;
}

function inferConstraintArea(value: string): TrainingConstraint["area"] {
  const normalized = normalizeForMatch(value);
  if (normalized.includes("poignet") || normalized.includes("wrist")) return "wrist";
  if (normalized.includes("epaule") || normalized.includes("shoulder")) return "shoulder";
  if (normalized.includes("coude") || normalized.includes("elbow")) return "elbow";
  if (normalized.includes("dos") || normalized.includes("lombaire") || normalized.includes("back")) return "back";
  if (normalized.includes("genou") || normalized.includes("knee")) return "knee";
  if (normalized.includes("hanche") || normalized.includes("hip")) return "hip";
  if (normalized.includes("cheville") || normalized.includes("ankle")) return "ankle";
  if (normalized.includes("nuque") || normalized.includes("cou") || normalized.includes("neck")) return "neck";
  if (normalized.includes("souffle") || normalized.includes("cardio")) return "cardio";
  return "other";
}

function mapSleepToRecovery(sleepQuality: string): UserSettings["recoveryProfile"] {
  if (/mauvais/i.test(sleepQuality)) return "poor";
  if (/irr/i.test(sleepQuality)) return "irregular";
  return "regular";
}

function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value: string): string {
  return normalizeForMatch(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
