"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { buildStrengthReferenceFromSet, estimateOneRepMaxFromSet, formatEstimatedOneRepMax } from "@/lib/strengthCalibration";
import { useCoachStorage } from "@/lib/storage";
import type {
  CautionLevel,
  Equipment,
  ExperienceLevel,
  ExternalSportIntensity,
  LoadUnit,
  PrimaryGoal,
  SessionDurationPreference,
  StrengthReference,
  TrainingConstraint,
  UserSex,
  UserSettings,
  Weekday
} from "@/types/training";

const TOTAL_STEPS = 10;

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
  { value: "recomposition", mainGoalText: "Recomposition physique : perdre du gras, garder et prendre du muscle.", label: "Recomposition", desc: "Perdre du gras + préserver le muscle" },
  { value: "prise-masse", mainGoalText: "Prise de masse : gagner du muscle en priorité.", label: "Prise de masse", desc: "Prioriser le gain musculaire" },
  { value: "perte-gras", mainGoalText: "Perte de gras : déficit contrôlé.", label: "Perte de gras", desc: "Brûler les graisses en douceur" },
  { value: "performance", mainGoalText: "Performance : force et endurance.", label: "Performance", desc: "Devenir plus fort et endurant" },
  { value: "sante", mainGoalText: "Santé générale : bouger mieux, récupérer.", label: "Santé", desc: "Bien-être et récupération" }
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

const frequencyOptions: number[] = [2, 3, 4, 5, 6];

const sexOptions: Array<{ value: UserSex; label: string; desc: string }> = [
  { value: "female", label: "Femme", desc: "Repere utile pour adapter les charges de depart" },
  { value: "male", label: "Homme", desc: "Repere utile pour adapter les charges de depart" },
  { value: "other", label: "Autre", desc: "Profil personnalise sans categorie stricte" },
  { value: "prefer-not-to-say", label: "Ne pas dire", desc: "On utilisera surtout tes retours terrain" }
];

const durationOptions: Array<{ value: SessionDurationPreference; label: string; desc: string }> = [
  { value: "short", label: "35-45 min", desc: "Seances courtes, priorite aux essentiels" },
  { value: "standard", label: "50-65 min", desc: "Equilibre volume / recuperation" },
  { value: "long", label: "70-90 min", desc: "Plus de volume si tu recuperes bien" }
];

const sportIntensityOptions: Array<{ value: ExternalSportIntensity; label: string; desc: string }> = [
  { value: "low", label: "Leger", desc: "Marche, mobilite, activite douce" },
  { value: "moderate", label: "Modere", desc: "Cardio, sport technique, intensite moyenne" },
  { value: "high", label: "Intense", desc: "Judo, foot, combat, fractionne ou competition" }
];

const cardioOptions = ["Faible", "Modere", "Bon", "Excellent"];
const sleepOptions = ["Regulier", "Irregulier", "Mauvais"];
const cautionOptions: Array<{ value: CautionLevel; label: string; desc: string }> = [
  { value: "prudent", label: "Prudent", desc: "Progressions lentes, priorité à la sécurité" },
  { value: "normal", label: "Normal", desc: "Équilibre progression / récupération" },
  { value: "agressif", label: "Agressif", desc: "Progressions rapides, haut volume" }
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
  sessionDurationPreference: SessionDurationPreference;
  hasEveningSport: boolean;
  externalSportName: string;
  externalSportIntensity: ExternalSportIntensity;
  judoDays: Weekday[];
  benchOneRepMaxKg: number;
  benchReferenceReps: number;
  legReferenceKg: number;
  legReferenceReps: number;
  pullReferenceKg: number;
  pullReferenceReps: number;
  hingeReferenceKg: number;
  hingeReferenceReps: number;
  loadUnit: LoadUnit;
  cardioLevel: string;
  sleepQuality: string;
  medicalNotes: string;
  watchPointsText: string;
  preferencesText: string;
  avoidText: string;
  gym: string;
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
  hasEveningSport: false,
  externalSportName: "",
  externalSportIntensity: "high",
  judoDays: [],
  benchOneRepMaxKg: 0,
  benchReferenceReps: 5,
  legReferenceKg: 0,
  legReferenceReps: 8,
  pullReferenceKg: 0,
  pullReferenceReps: 8,
  hingeReferenceKg: 0,
  hingeReferenceReps: 8,
  loadUnit: "kg",
  cardioLevel: "Modere",
  sleepQuality: "Regulier",
  medicalNotes: "",
  watchPointsText: "",
  preferencesText: "",
  avoidText: "",
  gym: "",
  cautionLevel: "normal",
  aiEnabled: false
};

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const { completeOnboarding, settings } = useCoachStorage();
  const router = useRouter();

  const patch = (partial: Partial<OnboardingData>) => setData((d) => ({ ...d, ...partial }));

  const canAdvance = () => {
    if (step === 1) return data.athleteName.trim().length > 0 && data.age > 0 && data.heightCm > 0;
    if (step === 2) return data.currentWeightKg > 0 && data.targetWeightKg > 0;
    if (step === 4) return data.availableDays.length > 0;
    if (step === 6) return !data.hasEveningSport || data.judoDays.length > 0;
    return true;
  };

  const next = () => {
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const back = () => {
    if (step > 1) setStep(step - 1);
  };

  const finish = () => {
    const goalText = goalOptions.find((g) => g.value === data.primaryGoal)?.mainGoalText
      ?? "Programme personnalisé";
    const medicalNotes = data.medicalNotes.trim();
    const watchPoints = parseTextList(data.watchPointsText);
    const preferences = parseTextList(data.preferencesText);
    const avoid = parseTextList(data.avoidText);
    const externalSports = buildExternalSports(data);
    const strengthReferences = buildStrengthReferences(data);
    const benchEstimatedOneRepMaxKg = estimateOneRepMaxFromSet(
      data.benchOneRepMaxKg,
      data.benchReferenceReps,
      data.loadUnit
    );
    const constraints = buildConstraints(medicalNotes, watchPoints, avoid);
    const nextSettings: UserSettings = {
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
      judoDays: data.judoDays,
      benchOneRepMaxKg: benchEstimatedOneRepMaxKg ?? 0,
      loadUnit: data.loadUnit,
      gym: data.gym,
      cautionLevel: data.cautionLevel,
      aiEnabled: data.aiEnabled,
      cardioLevel: data.cardioLevel,
      sleepQuality: data.sleepQuality,
      recoveryProfile: mapSleepToRecovery(data.sleepQuality),
      medicalNotes,
      watchPoints,
      preferences,
      avoid,
      externalSports,
      constraints,
      strengthReferences,
      darkMode: false
    };
    completeOnboarding(nextSettings);
    router.replace("/");
  };

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="app-shell mx-auto min-h-screen w-full max-w-xl px-4 pt-8 pb-10 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <BrandLogo className="h-10" priority variant="wordmark" />
        <div>
          <p className="text-[13px] font-black text-white/70">Configuration initiale</p>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-black uppercase text-white/40">Étape {step} / {TOTAL_STEPS}</p>
          <p className="text-xs font-bold text-white/40">{progress}%</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-sky transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <OnboardingCoachPreview data={data} progress={progress} step={step} />

      {/* Steps */}
      <div className="mt-5 space-y-4 rounded-[28px] border border-white/10 bg-[#11131a]/90 p-4 shadow-soft">
        {step === 1 && (
          <StepWrapper subtitle="Quelques infos pour personnaliser ton programme." title="Bienvenue 👋">
            <TextField
              label="Ton prénom"
              onChange={(v) => patch({ athleteName: v })}
              placeholder="ex. Alex"
              value={data.athleteName}
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Âge" max={80} min={14} onChange={(v) => patch({ age: v })} value={data.age} />
              <NumberField label="Taille (cm)" max={230} min={140} onChange={(v) => patch({ heightCm: v })} value={data.heightCm} />
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Profil biologique <span className="text-white/35">(optionnel)</span></p>
              <div className="grid grid-cols-2 gap-2">
                {sexOptions.map((opt) => (
                  <button
                    className={`rounded-md border p-3 text-left transition ${
                      data.sex === opt.value ? "border-sky/50 bg-sky/10" : "border-white/10 bg-white/5"
                    }`}
                    key={opt.value}
                    onClick={() => patch({ sex: opt.value })}
                    type="button"
                  >
                    <p className={`text-sm font-black ${data.sex === opt.value ? "text-sky" : "text-white"}`}>
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold leading-snug text-white/45">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 2 && (
          <StepWrapper subtitle="On calibre les objectifs corporels." title="Ton poids">
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Poids actuel (kg)"
                max={250}
                min={30}
                onChange={(v) => patch({ currentWeightKg: v })}
                step={0.5}
                value={data.currentWeightKg}
              />
              <NumberField
                label="Objectif poids (kg)"
                max={250}
                min={30}
                onChange={(v) => patch({ targetWeightKg: v })}
                step={0.5}
                value={data.targetWeightKg}
              />
            </div>
          </StepWrapper>
        )}

        {step === 3 && (
          <StepWrapper subtitle="Ça oriente les priorités de ton programme." title="Ton objectif">
            <div className="space-y-2">
              {goalOptions.map((goal) => (
                <button
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    data.primaryGoal === goal.value
                      ? "border-sky/50 bg-sky/10"
                      : "border-white/10 bg-white/5"
                  }`}
                  key={goal.value}
                  onClick={() => patch({ primaryGoal: goal.value })}
                  type="button"
                >
                  <p className={`font-black ${data.primaryGoal === goal.value ? "text-sky" : "text-white"}`}>
                    {goal.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white/50">{goal.desc}</p>
                </button>
              ))}
            </div>
          </StepWrapper>
        )}

        {step === 4 && (
          <StepWrapper subtitle="On place les seances la ou elles ont une chance de tenir." title="Disponibilites">
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Combien de seances par semaine ?</p>
              <div className="grid grid-cols-5 gap-2">
                {frequencyOptions.map((freq) => (
                  <button
                    className={`h-12 rounded-md border font-black transition ${
                      data.weeklyFrequency === freq
                        ? "border-sky/50 bg-sky/10 text-sky"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                    key={freq}
                    onClick={() => patch({ weeklyFrequency: freq })}
                    type="button"
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Jours possibles pour la muscu</p>
              <div className="grid grid-cols-2 gap-2">
                {weekdayOptions.map((day) => {
                  const checked = data.availableDays.includes(day.value);
                  return (
                    <button
                      className={`flex min-h-11 items-center gap-2 rounded-md border px-3 font-bold transition ${
                        checked ? "border-sky/40 bg-sky/10 text-sky" : "border-white/8 bg-white/5 text-white/60"
                      }`}
                      key={day.value}
                      onClick={() => {
                        const next = checked
                          ? data.availableDays.filter((d) => d !== day.value)
                          : [...data.availableDays, day.value];
                        patch({ availableDays: next });
                      }}
                      type="button"
                    >
                      {checked ? "Oui" : "Non"} {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-semibold text-white/40">
                {data.availableDays.length} jour{data.availableDays.length > 1 ? "s" : ""} disponible{data.availableDays.length > 1 ? "s" : ""}.
              </p>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Duree preferee</p>
              <div className="space-y-2">
                {durationOptions.map((opt) => (
                  <button
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      data.sessionDurationPreference === opt.value
                        ? "border-sky/50 bg-sky/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    key={opt.value}
                    onClick={() => patch({ sessionDurationPreference: opt.value })}
                    type="button"
                  >
                    <p className={`font-black ${data.sessionDurationPreference === opt.value ? "text-sky" : "text-white"}`}>
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-white/50">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 5 && (
          <StepWrapper subtitle="On adapte les exercices au materiel et a ton experience." title="Materiel & niveau">
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Equipement disponible</p>
              <div className="space-y-2">
                {equipmentOptions.map((opt) => (
                  <button
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      data.equipment === opt.value
                        ? "border-sky/50 bg-sky/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    key={opt.value}
                    onClick={() => patch({ equipment: opt.value })}
                    type="button"
                  >
                    <p className={`font-black ${data.equipment === opt.value ? "text-sky" : "text-white"}`}>
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-white/50">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Niveau d&apos;experience</p>
              <div className="space-y-2">
                {experienceOptions.map((opt) => (
                  <button
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      data.experienceLevel === opt.value
                        ? "border-sky/50 bg-sky/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    key={opt.value}
                    onClick={() => patch({ experienceLevel: opt.value })}
                    type="button"
                  >
                    <p className={`font-black ${data.experienceLevel === opt.value ? "text-sky" : "text-white"}`}>
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-white/50">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 6 && (
          <StepWrapper subtitle="Un sport externe change la fatigue, donc il doit compter." title="Sport externe">
            <div className="space-y-3">
              <ToggleCard
                checked={data.hasEveningSport}
                desc="Judo, foot, course, sport de combat, cours collectifs..."
                label="Tu pratiques un autre sport ?"
                onChange={(v) => patch({ hasEveningSport: v, judoDays: v ? data.judoDays : [] })}
              />
              {data.hasEveningSport && (
                <>
                  <TextField
                    label="Nom du sport"
                    onChange={(v) => patch({ externalSportName: v })}
                    placeholder="ex. Judo, football, course..."
                    value={data.externalSportName}
                  />
                  <div>
                    <p className="mb-2 text-sm font-bold text-white/60">Intensite moyenne</p>
                    <div className="space-y-2">
                      {sportIntensityOptions.map((opt) => (
                        <button
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            data.externalSportIntensity === opt.value
                              ? "border-sky/50 bg-sky/10"
                              : "border-white/10 bg-white/5"
                          }`}
                          key={opt.value}
                          onClick={() => patch({ externalSportIntensity: opt.value })}
                          type="button"
                        >
                          <p className={`font-black ${data.externalSportIntensity === opt.value ? "text-sky" : "text-white"}`}>
                            {opt.label}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-white/50">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-bold text-white/60">Quels jours ?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {weekdayOptions.map((day) => {
                        const checked = data.judoDays.includes(day.value);
                        return (
                          <button
                            className={`flex min-h-11 items-center gap-2 rounded-md border px-3 font-bold transition ${
                              checked ? "border-sky/40 bg-sky/10 text-sky" : "border-white/8 bg-white/5 text-white/60"
                            }`}
                            key={day.value}
                            onClick={() => {
                              const next = checked
                                ? data.judoDays.filter((d) => d !== day.value)
                                : [...data.judoDays, day.value];
                              patch({ judoDays: next });
                            }}
                            type="button"
                          >
                            {checked ? "Oui" : "Non"} {day.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </StepWrapper>
        )}

        {step === 7 && (
          <StepWrapper
            subtitle="Mets une vraie serie propre, pas forcement ton max. Exemple: 100 kg x 5 au DC."
            title="Reperes de force"
          >
            <div className="space-y-3">
              <StrengthReferenceField
                estimatedOneRepMaxKg={estimateOneRepMaxFromSet(data.benchOneRepMaxKg, data.benchReferenceReps, data.loadUnit)}
                label="Developpe couche"
                load={data.benchOneRepMaxKg}
                maxLoad={350}
                onLoadChange={(v) => patch({ benchOneRepMaxKg: v })}
                onRepsChange={(v) => patch({ benchReferenceReps: v })}
                reps={data.benchReferenceReps}
                unit={data.loadUnit}
              />
              <StrengthReferenceField
                estimatedOneRepMaxKg={estimateOneRepMaxFromSet(data.legReferenceKg, data.legReferenceReps, data.loadUnit)}
                label="Squat / presse"
                load={data.legReferenceKg}
                maxLoad={600}
                onLoadChange={(v) => patch({ legReferenceKg: v })}
                onRepsChange={(v) => patch({ legReferenceReps: v })}
                reps={data.legReferenceReps}
                unit={data.loadUnit}
              />
              <StrengthReferenceField
                estimatedOneRepMaxKg={estimateOneRepMaxFromSet(data.pullReferenceKg, data.pullReferenceReps, data.loadUnit)}
                label="Tirage / rowing"
                load={data.pullReferenceKg}
                maxLoad={350}
                onLoadChange={(v) => patch({ pullReferenceKg: v })}
                onRepsChange={(v) => patch({ pullReferenceReps: v })}
                reps={data.pullReferenceReps}
                unit={data.loadUnit}
              />
              <StrengthReferenceField
                estimatedOneRepMaxKg={estimateOneRepMaxFromSet(data.hingeReferenceKg, data.hingeReferenceReps, data.loadUnit)}
                label="Hip thrust / hinge"
                load={data.hingeReferenceKg}
                maxLoad={600}
                onLoadChange={(v) => patch({ hingeReferenceKg: v })}
                onRepsChange={(v) => patch({ hingeReferenceReps: v })}
                reps={data.hingeReferenceReps}
                unit={data.loadUnit}
              />
            </div>
            <p className="rounded-md bg-white/5 p-3 text-xs font-semibold leading-relaxed text-white/45">
              Si tu mets 100 kg x 5, l&apos;app calcule un max estime avant de proposer une charge de travail.
              Si c&apos;est vraiment ton max sur 1 rep, mets simplement 1 repetition.
            </p>
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Unite de charge</p>
              <div className="grid grid-cols-2 gap-2">
                {(["kg", "lb"] as LoadUnit[]).map((unit) => (
                  <button
                    className={`h-12 rounded-md border font-black transition ${
                      data.loadUnit === unit
                        ? "border-sky/50 bg-sky/10 text-sky"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                    key={unit}
                    onClick={() => patch({ loadUnit: unit })}
                    type="button"
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 8 && (
          <StepWrapper subtitle="C'est ce qui permet d'ajuster sans casser la recuperation." title="Recuperation">
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Niveau cardio</p>
              <div className="grid grid-cols-2 gap-2">
                {cardioOptions.map((opt) => (
                  <button
                    className={`h-12 rounded-md border font-black transition ${
                      data.cardioLevel === opt
                        ? "border-sky/50 bg-sky/10 text-sky"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                    key={opt}
                    onClick={() => patch({ cardioLevel: opt })}
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Qualite du sommeil</p>
              <div className="grid grid-cols-3 gap-2">
                {sleepOptions.map((opt) => (
                  <button
                    className={`h-12 rounded-md border text-sm font-black transition ${
                      data.sleepQuality === opt
                        ? "border-sky/50 bg-sky/10 text-sky"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                    key={opt}
                    onClick={() => patch({ sleepQuality: opt })}
                    type="button"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
            <TextAreaField
              label="Blessures ou infos medicales"
              onChange={(v) => patch({ medicalNotes: v })}
              placeholder="ex. tendinite poignet droit, genou gauche fragile..."
              value={data.medicalNotes}
            />
            <TextAreaField
              label="Points de vigilance"
              onChange={(v) => patch({ watchPointsText: v })}
              placeholder="ex. eviter les dips lourds, attention lombaires..."
              value={data.watchPointsText}
            />
          </StepWrapper>
        )}

        {step === 9 && (
          <StepWrapper subtitle="On tient compte de ce que tu aimes et de ce qui ne te convient pas." title="Preferences">
            <TextField
              label={`Nom de ta salle ${String.fromCharCode(40)}optionnel${String.fromCharCode(41)}`}
              onChange={(v) => patch({ gym: v })}
              placeholder="ex. One Air, Basic Fit..."
              value={data.gym}
            />
            <TextAreaField
              label="Exercices ou styles que tu preferes"
              onChange={(v) => patch({ preferencesText: v })}
              placeholder="ex. machines, haltères, full body, supersets..."
              value={data.preferencesText}
            />
            <TextAreaField
              label="Exercices a eviter"
              onChange={(v) => patch({ avoidText: v })}
              placeholder="ex. dips, squat barre, course..."
              value={data.avoidText}
            />
            <div>
              <p className="mb-2 text-sm font-bold text-white/60">Niveau de prudence</p>
              <div className="space-y-2">
                {cautionOptions.map((opt) => (
                  <button
                    className={`w-full rounded-xl border p-3 text-left transition ${
                      data.cautionLevel === opt.value
                        ? "border-sky/50 bg-sky/10"
                        : "border-white/10 bg-white/5"
                    }`}
                    key={opt.value}
                    onClick={() => patch({ cautionLevel: opt.value })}
                    type="button"
                  >
                    <p className={`font-black ${data.cautionLevel === opt.value ? "text-sky" : "text-white"}`}>
                      {opt.label}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-white/50">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </StepWrapper>
        )}

        {step === 10 && (
          <StepWrapper subtitle="Tu pourras tout modifier dans les parametres." title="Presque pret !">
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-4">
              <SummaryRow label="Nom" value={data.athleteName} />
              <SummaryRow label="Profil" value={`${sexOptions.find((s) => s.value === data.sex)?.label ?? "-"} · ${data.age} ans · ${data.heightCm} cm`} />
              <SummaryRow label="Poids" value={`${data.currentWeightKg} kg -> ${data.targetWeightKg} kg`} />
              <SummaryRow label="Objectif" value={goalOptions.find((g) => g.value === data.primaryGoal)?.label ?? "-"} />
              <SummaryRow label="Frequence" value={`${data.weeklyFrequency} seances/semaine`} />
              <SummaryRow label="Jours muscu" value={`${data.availableDays.length} jour${data.availableDays.length > 1 ? "s" : ""} possible${data.availableDays.length > 1 ? "s" : ""}`} />
              <SummaryRow label="Duree" value={durationOptions.find((d) => d.value === data.sessionDurationPreference)?.label ?? "-"} />
              <SummaryRow label="Equipement" value={equipmentOptions.find((e) => e.value === data.equipment)?.label ?? "-"} />
              <SummaryRow label="Niveau" value={experienceOptions.find((e) => e.value === data.experienceLevel)?.label ?? "-"} />
              <SummaryRow label="Sport externe" value={data.judoDays.length > 0 ? `${data.externalSportName.trim() || "Sport"} · ${data.judoDays.length} jour${data.judoDays.length > 1 ? "s" : ""}/sem.` : "Non"} />
              <SummaryRow label="Contraintes" value={`${parseTextList(data.watchPointsText).length + parseTextList(data.avoidText).length + (data.medicalNotes.trim() ? 1 : 0)}`} />
              <SummaryRow label="Prudence" value={data.cautionLevel} />
            </div>

            <ToggleCard
              checked={data.aiEnabled}
              desc="Analyse tes seances et genere des conseils personnalises."
              label="Activer l'analyse IA"
              onChange={(v) => patch({ aiEnabled: v })}
            />

            <button
              className="h-14 w-full rounded-md bg-coral px-4 text-base font-black text-white shadow-soft transition hover:bg-coral/90"
              onClick={finish}
              type="button"
            >
              Commencer avec AthletIQ
            </button>
          </StepWrapper>
        )}
      </div>

      {/* Navigation */}
      {step < TOTAL_STEPS && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="h-12 rounded-md border border-white/10 bg-white/8 font-black text-white disabled:opacity-30"
            disabled={step === 1}
            onClick={back}
            type="button"
          >
            Retour
          </button>
          <button
            className="h-12 rounded-md bg-sky px-4 font-black text-white disabled:opacity-40"
            disabled={!canAdvance()}
            onClick={next}
            type="button"
          >
            Continuer
          </button>
        </div>
      )}
      {step === TOTAL_STEPS && (
        <button
          className="mt-4 h-11 w-full rounded-md border border-white/10 bg-white/8 font-black text-white/60"
          onClick={back}
          type="button"
        >
          Retour
        </button>
      )}
    </div>
  );
}

function OnboardingCoachPreview({ data, progress, step }: { data: OnboardingData; progress: number; step: number }) {
  const goal = goalOptions.find((option) => option.value === data.primaryGoal)?.label ?? "Objectif";
  const level = experienceOptions.find((option) => option.value === data.experienceLevel)?.label ?? "Niveau";
  const equipment = equipmentOptions.find((option) => option.value === data.equipment)?.label ?? "Materiel";
  const constraintsCount =
    parseTextList(data.watchPointsText).length +
    parseTextList(data.avoidText).length +
    (data.medicalNotes.trim() ? 1 : 0);

  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#11131a] p-4 text-white shadow-soft">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(255,91,0,0.30),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-coral">Coach setup</p>
            <h2 className="mt-1 text-2xl font-black leading-tight">
              {data.athleteName.trim() ? `Plan pour ${data.athleteName.trim()}` : "On construit ton plan"}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-3xl font-black leading-none text-coral">{progress}%</p>
            <p className="text-[10px] font-black uppercase text-white/45">etape {step}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <PreviewPill label="Objectif" value={goal} />
          <PreviewPill label="Frequence" value={`${data.weeklyFrequency}x/sem.`} />
          <PreviewPill label="Niveau" value={level} />
          <PreviewPill label="Materiel" value={equipment} />
        </div>
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/8 p-3 text-xs font-semibold text-white/60">
          Contraintes prises en compte : {constraintsCount}. Sport externe : {data.hasEveningSport ? data.externalSportName || "oui" : "non"}.
        </p>
      </div>
    </section>
  );
}

function PreviewPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase text-white/45">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function mapSleepToRecovery(sleepQuality: string): UserSettings["recoveryProfile"] {
  if (/mauvais/i.test(sleepQuality)) return "poor";
  if (/irr/i.test(sleepQuality)) return "irregular";
  if (/excellent|bon/i.test(sleepQuality)) return "good";
  return "regular";
}

function parseTextList(value: string): string[] {
  const parts = value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return Array.from(new Set(parts));
}

function buildExternalSports(data: OnboardingData): UserSettings["externalSports"] {
  if (!data.hasEveningSport || data.judoDays.length === 0) {
    return [];
  }

  const name = data.externalSportName.trim() || "Sport externe";

  return [
    {
      id: slugify(name) || "sport-externe",
      name,
      days: data.judoDays,
      intensity: data.externalSportIntensity,
      notes: "Activite externe a prendre en compte dans la fatigue et la recuperation."
    }
  ];
}

function buildStrengthReferences(data: OnboardingData): StrengthReference[] {
  const references = [
    buildStrengthReferenceFromSet("Developpe couche", data.benchOneRepMaxKg, data.benchReferenceReps, data.loadUnit),
    buildStrengthReferenceFromSet("Squat ou presse", data.legReferenceKg, data.legReferenceReps, data.loadUnit),
    buildStrengthReferenceFromSet("Tirage ou rowing", data.pullReferenceKg, data.pullReferenceReps, data.loadUnit),
    buildStrengthReferenceFromSet("Hip thrust ou souleve roumain", data.hingeReferenceKg, data.hingeReferenceReps, data.loadUnit)
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

function StepWrapper({ children, subtitle, title }: { children: React.ReactNode; subtitle?: string; title: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black leading-tight text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm font-semibold text-white/55">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  onChange,
  placeholder,
  value
}: {
  label: string;
  onChange: (v: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type="text"
        value={value}
      />
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
  onChange: (v: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label} <span className="text-white/35">(optionnel)</span></span>
      <textarea
        className="mt-1 min-h-20 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
  onChange: (v: number) => void;
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
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

function StrengthReferenceField({
  estimatedOneRepMaxKg,
  label,
  load,
  maxLoad,
  onLoadChange,
  onRepsChange,
  reps,
  unit
}: {
  estimatedOneRepMaxKg?: number;
  label: string;
  load: number;
  maxLoad: number;
  onLoadChange: (v: number) => void;
  onRepsChange: (v: number) => void;
  reps: number;
  unit: LoadUnit;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="shrink-0 text-xs font-black text-sky">{formatEstimatedOneRepMax(estimatedOneRepMaxKg)}</p>
      </div>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-2">
        <NumberField
          label={`Charge ${unit}`}
          max={maxLoad}
          min={0}
          onChange={onLoadChange}
          step={2.5}
          value={load}
        />
        <NumberField
          label="Reps"
          max={12}
          min={1}
          onChange={onRepsChange}
          step={1}
          value={reps}
        />
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
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className={`w-full rounded-xl border p-4 text-left transition ${
        checked ? "border-sky/50 bg-sky/10" : "border-white/10 bg-white/5"
      }`}
      onClick={() => onChange(!checked)}
      type="button"
    >
      <div className="flex items-center justify-between gap-3">
        <p className={`font-black ${checked ? "text-sky" : "text-white"}`}>{label}</p>
        <span className={`h-6 w-10 rounded-full transition ${checked ? "bg-sky" : "bg-white/20"}`} />
      </div>
      <p className="mt-0.5 text-sm font-semibold text-white/50">{desc}</p>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/8 py-1.5 last:border-b-0">
      <p className="text-sm font-bold text-white/50">{label}</p>
      <p className="max-w-[65%] text-right text-sm font-black text-white">{value}</p>
    </div>
  );
}
