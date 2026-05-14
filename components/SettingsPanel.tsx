"use client";

import Link from "next/link";
import { useState } from "react";
import { PROFILE_PRESETS } from "@/data/profilePresets";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { useCoachStorage } from "@/lib/storage";
import type {
  CautionLevel,
  Equipment,
  ExperienceLevel,
  ExternalSport,
  ExternalSportIntensity,
  PrimaryGoal,
  Profile,
  SessionDurationPreference,
  UserSex,
  UserSettings,
  Weekday,
  WeightEntry
} from "@/types/training";

const goalLabels: Record<PrimaryGoal, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de muscle",
  recomposition: "Recomposition",
  performance: "Force",
  sante: "Cardio / sante"
};

const equipmentLabels: Record<Equipment, string> = {
  "salle-complete": "Salle equipee",
  "halteres-maison": "Maison equipee",
  "poids-corps": "Peu de materiel"
};

const experienceLabels: Record<ExperienceLevel, string> = {
  debutant: "Debutant",
  intermediaire: "Intermediaire",
  avance: "Avance"
};

const sexLabels: Record<UserSex, string> = {
  female: "Femme",
  male: "Homme",
  other: "Autre",
  "prefer-not-to-say": "Non renseigne"
};

const durationLabels: Record<SessionDurationPreference, string> = {
  short: "35-45 min",
  standard: "50-65 min",
  long: "70-90 min"
};

const cautionLabels: Record<CautionLevel, string> = {
  prudent: "Prudent",
  normal: "Normal",
  agressif: "Agressif"
};

const externalSportIntensityLabels: Record<ExternalSportIntensity, string> = {
  low: "Leger",
  moderate: "Modere",
  high: "Intense"
};

const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" }
];

const avatarChoices = ["S", "A", "F", "P", "1", "2"];

function getPrimaryGoalLabel(settings: UserSettings): string {
  return settings.primaryGoal ? goalLabels[settings.primaryGoal] : settings.mainGoal;
}

export function SettingsPanel() {
  const [confirmReset, setConfirmReset] = useState(false);
  const {
    activeProfileId,
    applyProfilePreset,
    createProfile,
    currentProgram,
    deleteProfile,
    history,
    isReady,
    profiles,
    renameProfile,
    resetAll,
    setSettings,
    settings,
    switchProfile
  } = useCoachStorage();

  if (!isReady) {
    return <div className="rounded-2xl border border-white/10 bg-white/8 p-5 font-black text-white shadow-soft">Chargement...</div>;
  }

  const activeProgram = getActiveProgramTemplate(currentProgram);
  const goalLabel = getPrimaryGoalLabel(settings);
  const weeklyFrequency = settings.weeklyFrequency ?? Math.max(currentProgram.length, 3);
  const activeSessionCount = currentProgram.length || weeklyFrequency;
  const restrictionsCount = settings.watchPoints.length + settings.avoid.length + settings.preferences.length + (settings.medicalNotes.trim() ? 1 : 0);
  const profileSummary = `${settings.age} ans - ${settings.heightCm} cm - ${settings.currentWeightKg} kg`;

  const patchSettings = (patch: Partial<UserSettings>) => setSettings({ ...settings, ...patch });
  const setGoal = (primaryGoal: PrimaryGoal) => patchSettings({ primaryGoal, mainGoal: goalLabels[primaryGoal] });
  const toggleAvailableDay = (day: Weekday) => {
    const nextDays = settings.availableDays.includes(day)
      ? settings.availableDays.filter((item) => item !== day)
      : [...settings.availableDays, day];
    patchSettings({ availableDays: nextDays.length > 0 ? nextDays : settings.availableDays });
  };
  const toggleJudoDay = (day: Weekday) => {
    const nextDays = settings.judoDays.includes(day)
      ? settings.judoDays.filter((item) => item !== day)
      : [...settings.judoDays, day];
    patchSettings({ judoDays: nextDays });
  };

  return (
    <div className="space-y-4 pb-28">
      <section className="relative -mx-4 overflow-hidden border-b border-white/10 bg-[#050607] p-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.55)] sm:-mx-6 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_86%_0%,rgba(255,90,0,0.42),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.07),transparent_44%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_18px)] opacity-25" />

        <div className="relative">
          <p className="text-xs font-black uppercase text-coral">Reglages coach</p>
          <h1 className="mt-2 text-3xl font-black leading-[0.95] text-white">{settings.athleteName}</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
            {activeProgram?.name ?? "Programme personnalise"} - {goalLabel.toLowerCase()} - {activeSessionCount} seance{activeSessionCount > 1 ? "s" : ""}/semaine
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <ProfileTile label="Age" value={`${settings.age} ans`} />
            <ProfileTile label="Poids" value={`${settings.currentWeightKg} kg`} />
            <ProfileTile label="Contraintes" value={`${restrictionsCount}`} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              className="flex h-12 items-center justify-center rounded-2xl bg-coral px-4 text-sm font-black text-white shadow-[0_18px_46px_rgba(255,90,0,0.28)]"
              href="/programme"
            >
              Programme
            </Link>
            <Link
              className="flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-white/10 px-4 text-sm font-black text-white"
              href="/onboarding"
            >
              Refaire le choix
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-coral">Profils rapides</p>
            <h2 className="mt-1 text-2xl font-black text-white">Sofiane / Alicia</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-white/55">
              Chaque profil garde son historique, ses performances, ses restrictions et son programme actif.
            </p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">
            {profiles.length}
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {PROFILE_PRESETS.map((preset) => {
            const active =
              activeProfileId === preset.profile.id ||
              settings.athleteName.trim().toLowerCase() === preset.profile.name.trim().toLowerCase();

            return (
              <button
                className={`rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                  active ? "border-coral/45 bg-coral/12" : "border-white/10 bg-white/[0.04]"
                }`}
                key={preset.id}
                onClick={() => applyProfilePreset(preset.id)}
                type="button"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-coral/15 text-lg font-black text-coral">
                  {preset.profile.avatar}
                </span>
                <p className={`mt-3 font-black ${active ? "text-coral" : "text-white"}`}>{preset.profile.name}</p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-white/50">
                  {preset.id === "alicia" ? "Perte de poids + fessiers" : "Recomposition + force"}
                </p>
                <p className="mt-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2 text-center text-xs font-black text-white/60">
                  {active ? "Actif" : "Activer"}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <p className="text-xs font-black uppercase text-sky">Actions utiles</p>
        <h2 className="mt-1 text-2xl font-black text-white">Coach actif</h2>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <ProfileTile label="Objectif" value={goalLabel} />
          <ProfileTile label="Rythme" value={`${weeklyFrequency} j/sem.`} />
          <ProfileTile label="Niveau" value={experienceLabels[settings.experienceLevel ?? "intermediaire"]} />
          <ProfileTile label="Materiel" value={equipmentLabels[settings.equipment ?? "salle-complete"]} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            className="flex h-12 items-center justify-center rounded-2xl bg-coral px-4 text-sm font-black text-white"
            href="/programme"
          >
            Changer programme
          </Link>
          <Link
            className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8 px-4 text-sm font-black text-white/70"
            href="/onboarding"
          >
            Refaire profil
          </Link>
        </div>
      </section>

      <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/40">Reglages</p>
            <h2 className="mt-1 text-xl font-black text-white">Objectif & rythme</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-white/55">
              {goalLabel} - {weeklyFrequency} seance{weeklyFrequency > 1 ? "s" : ""}/semaine.
            </p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
        </summary>

        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-black text-white/65">Objectif principal</p>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {(Object.entries(goalLabels) as Array<[PrimaryGoal, string]>).map(([value, label]) => (
                <button
                  className={`min-h-12 rounded-2xl border px-3 text-left text-sm font-black transition ${
                    (settings.primaryGoal ?? "recomposition") === value
                      ? "border-coral/45 bg-coral/10 text-coral"
                      : "border-white/10 bg-white/[0.04] text-white/70"
                  }`}
                  key={value}
                  onClick={() => setGoal(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <ButtonChoiceGroup
            columns="grid-cols-5"
            label="Seances par semaine"
            options={[2, 3, 4, 5, 6].map((value) => ({ label: `${value}`, value }))}
            selected={weeklyFrequency}
            onSelect={(weeklyFrequency) => patchSettings({ weeklyFrequency })}
          />

          <ButtonChoiceGroup
            columns="grid-cols-3"
            label="Duree"
            options={(Object.entries(durationLabels) as Array<[SessionDurationPreference, string]>).map(([value, label]) => ({ label, value }))}
            selected={settings.sessionDurationPreference}
            onSelect={(sessionDurationPreference) => patchSettings({ sessionDurationPreference })}
          />

          <ButtonChoiceGroup
            columns="grid-cols-3"
            label="Prudence progression"
            options={(Object.entries(cautionLabels) as Array<[CautionLevel, string]>).map(([value, label]) => ({ label, value }))}
            selected={settings.cautionLevel}
            onSelect={(cautionLevel) => patchSettings({ cautionLevel })}
          />

          <div className="grid grid-cols-2 gap-2">
            <SelectField
              label="Materiel"
              value={settings.equipment ?? "salle-complete"}
              options={equipmentLabels}
              onChange={(equipment) => patchSettings({ equipment })}
            />
            <SelectField
              label="Niveau"
              value={settings.experienceLevel ?? "intermediaire"}
              options={experienceLabels}
              onChange={(experienceLevel) => patchSettings({ experienceLevel })}
            />
          </div>

          <Link
            className="flex h-12 items-center justify-center rounded-2xl border border-coral/35 bg-coral/10 px-4 text-sm font-black text-coral"
            href="/programme"
          >
            Voir ou changer le programme
          </Link>
        </div>
      </details>

      <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/40">Securite</p>
            <h2 className="mt-1 text-xl font-black text-white">Contraintes utiles</h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-white/55">
              {restrictionsCount} info{restrictionsCount > 1 ? "s" : ""} utilisee{restrictionsCount > 1 ? "s" : ""} par le coach.
            </p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
        </summary>
        <TextListField
          label="Points de vigilance"
          onChange={(values) => patchSettings({ watchPoints: values })}
          placeholder="ex. poignet droit, dos fragile, genou gauche"
          values={settings.watchPoints}
        />
        <TextListField
          label="Exercices a eviter"
          onChange={(values) => patchSettings({ avoid: values })}
          placeholder="ex. course, burpees, pompes, squat barre"
          values={settings.avoid}
        />
        <TextListField
          label="Preferences"
          onChange={(values) => patchSettings({ preferences: values })}
          placeholder="ex. machines, poulies, tapis incline"
          values={settings.preferences}
        />
        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Notes sante importantes</span>
          <textarea
            className="mt-1 min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => patchSettings({ medicalNotes: event.target.value })}
            placeholder="ex. post-partum, diastasis, spondylarthrite, apnee..."
            value={settings.medicalNotes}
          />
        </label>
      </details>

      <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/40">Profil</p>
            <h2 className="mt-1 text-xl font-black text-white">Identite & mesures</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">{profileSummary}</p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
        </summary>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Prenom</span>
          <input
            className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => patchSettings({ athleteName: event.target.value })}
            placeholder="Ton prenom"
            value={settings.athleteName}
          />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberField label="Age" onChange={(age) => patchSettings({ age })} value={settings.age} />
          <NumberField label="Taille" onChange={(heightCm) => patchSettings({ heightCm })} value={settings.heightCm} />
          <NumberField label="Poids actuel" onChange={(currentWeightKg) => patchSettings({ currentWeightKg })} value={settings.currentWeightKg} />
          <NumberField label="Objectif poids" onChange={(targetWeightKg) => patchSettings({ targetWeightKg })} value={settings.targetWeightKg} />
          <NumberField label="DC repere" onChange={(benchOneRepMaxKg) => patchSettings({ benchOneRepMaxKg })} value={settings.benchOneRepMaxKg} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SelectField label="Profil" value={settings.sex} options={sexLabels} onChange={(sex) => patchSettings({ sex })} />
          <SelectField
            label="Unite"
            value={settings.loadUnit}
            options={{ kg: "kg", lb: "lb" }}
            onChange={(loadUnit) => patchSettings({ loadUnit })}
          />
        </div>
      </details>

      <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-white/40">Semaine</p>
            <h2 className="mt-1 text-xl font-black text-white">Disponibilites</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">
              {settings.availableDays.length} jour{settings.availableDays.length > 1 ? "s" : ""} muscu - {settings.judoDays.length} jour{settings.judoDays.length > 1 ? "s" : ""} sport intense
            </p>
          </div>
          <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
        </summary>

        <DayPicker label="Jours possibles pour la muscu" selected={settings.availableDays} tone="sea" onToggle={toggleAvailableDay} />
        <DayPicker label="Jours sport intense / judo" selected={settings.judoDays} tone="sky" onToggle={toggleJudoDay} />
        <ToggleRow
          checked={settings.aiEnabled}
          label="Activer l'analyse IA"
          onChange={(aiEnabled) => patchSettings({ aiEnabled })}
        />
      </details>

      <WeightLogPanel
        currentWeightKg={settings.currentWeightKg}
        targetWeightKg={settings.targetWeightKg}
        weightLog={settings.weightLog ?? []}
        onLog={(entry) => {
          const existing = settings.weightLog ?? [];
          const sameDay = existing.find((item) => item.date === entry.date);
          const nextLog = sameDay
            ? existing.map((item) => (item.date === entry.date ? entry : item))
            : [entry, ...existing].slice(0, 30);
          patchSettings({ weightLog: nextLog, currentWeightKg: entry.kg });
        }}
      />

      <ExternalSportsEditor
        externalSports={settings.externalSports}
        onChange={(externalSports) => patchSettings({ externalSports })}
      />

      <ProfilesSection
        activeProfileId={activeProfileId}
        onCreate={createProfile}
        onDelete={deleteProfile}
        onRename={renameProfile}
        onSwitch={switchProfile}
        profiles={profiles}
      />

      <details className="rounded-[24px] border border-coral/20 bg-coral/10 p-4 shadow-soft">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-coral">Donnees</p>
            <h2 className="mt-1 text-xl font-black text-white">Reset local</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">
              {history.length} seance{history.length > 1 ? "s" : ""} enregistree{history.length > 1 ? "s" : ""}.
            </p>
          </div>
          <span className="rounded-xl border border-coral/25 bg-coral/10 px-3 py-2 text-xs font-black text-coral">Ouvrir</span>
        </summary>

        <button
          className="mt-4 h-12 w-full rounded-2xl border border-coral/30 bg-coral/10 px-4 font-black text-coral transition hover:bg-coral hover:text-white"
          onClick={() => setConfirmReset(true)}
          type="button"
        >
          Reinitialiser les donnees locales
        </button>
        {confirmReset ? (
          <div className="mt-3 rounded-2xl border border-coral/20 bg-coral/10 p-3">
            <p className="text-sm font-black text-coral">Cette action efface l&apos;historique et le programme ajuste.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-2xl border border-white/10 bg-white/8 px-3 font-black text-white"
                onClick={() => setConfirmReset(false)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="h-11 rounded-2xl bg-coral px-3 font-black text-white"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
                type="button"
              >
                Confirmer
              </button>
            </div>
          </div>
        ) : null}
      </details>
    </div>
  );
}

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 p-3">
      <p className="text-[10px] font-black uppercase text-white/45">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-white">{value}</p>
    </div>
  );
}

function NumberField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        inputMode="decimal"
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

function SelectField<T extends string>({
  label,
  onChange,
  options,
  value
}: {
  label: string;
  onChange: (value: T) => void;
  options: Record<T, string>;
  value: T;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <select
        className="mt-1 h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-black text-white outline-none focus:border-coral"
        onChange={(event) => onChange(event.target.value as T)}
        value={value}
      >
        {(Object.entries(options) as Array<[T, string]>).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function ButtonChoiceGroup<T extends string | number>({
  columns,
  label,
  onSelect,
  options,
  selected
}: {
  columns: string;
  label: string;
  onSelect: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  selected: T;
}) {
  return (
    <div>
      <p className="text-sm font-black text-white/65">{label}</p>
      <div className={`mt-2 grid ${columns} gap-2`}>
        {options.map((option) => (
          <button
            className={`min-h-12 rounded-2xl border px-2 text-xs font-black transition ${
              selected === option.value
                ? "border-coral/45 bg-coral/10 text-coral"
                : "border-white/10 bg-white/[0.04] text-white/60"
            }`}
            key={String(option.value)}
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

function DayPicker({
  label,
  onToggle,
  selected,
  tone
}: {
  label: string;
  onToggle: (day: Weekday) => void;
  selected: Weekday[];
  tone: "sea" | "sky";
}) {
  const activeClass = tone === "sea" ? "border-sea/45 bg-sea/10 text-sea" : "border-sky/45 bg-sky/10 text-sky";

  return (
    <div className="mt-4">
      <p className="text-sm font-black text-white/65">{label}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {weekdays.map((day) => {
          const checked = selected.includes(day.value);

          return (
            <button
              className={`min-h-12 rounded-2xl border px-3 text-left text-sm font-black transition ${
                checked ? activeClass : "border-white/10 bg-white/[0.04] text-white/55"
              }`}
              key={day.value}
              onClick={() => onToggle(day.value)}
              type="button"
            >
              {checked ? "Oui - " : "Non - "}{day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToggleRow({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="mt-4 flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 font-bold text-white">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function TextListField({
  label,
  onChange,
  placeholder,
  values
}: {
  label: string;
  onChange: (values: string[]) => void;
  placeholder?: string;
  values: string[];
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-bold text-white/60">{label}</span>
      <textarea
        className="mt-1 min-h-20 w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(parseListInput(event.target.value))}
        placeholder={placeholder}
        value={values.join("\n")}
      />
    </label>
  );
}

function parseListInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(/[\n,;]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
}

function WeightLogPanel({
  currentWeightKg,
  onLog,
  targetWeightKg,
  weightLog
}: {
  currentWeightKg: number;
  onLog: (entry: WeightEntry) => void;
  targetWeightKg: number;
  weightLog: WeightEntry[];
}) {
  const [draftKg, setDraftKg] = useState(currentWeightKg);
  const today = new Date().toISOString().slice(0, 10);
  const toGoKg = +(currentWeightKg - targetWeightKg).toFixed(1);

  return (
    <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-white/40">Poids</p>
          <h2 className="mt-1 text-xl font-black text-white">Suivi rapide</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">{currentWeightKg} kg actuel - objectif {targetWeightKg} kg</p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
      </summary>

      <div className="mt-4 flex gap-2">
        <input
          className="h-12 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 text-base font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
          inputMode="decimal"
          onChange={(event) => setDraftKg(Number(event.target.value))}
          step="0.1"
          type="number"
          value={draftKg}
        />
        <button className="h-12 rounded-2xl bg-sky px-4 font-black text-white" onClick={() => onLog({ date: today, kg: draftKg })} type="button">
          OK
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <ProfileTile label="Actuel" value={`${currentWeightKg} kg`} />
        <ProfileTile label="Ecart" value={`${toGoKg > 0 ? "-" : "+"}${Math.abs(toGoKg)} kg`} />
      </div>

      {weightLog.length > 0 ? (
        <div className="mt-4 space-y-1.5">
          {weightLog.slice(0, 5).map((entry) => (
            <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2" key={entry.date}>
              <span className="text-xs font-semibold text-white/55">{entry.date}</span>
              <span className="font-black text-white">{entry.kg} kg</span>
            </div>
          ))}
        </div>
      ) : null}
    </details>
  );
}

function ExternalSportsEditor({
  externalSports,
  onChange
}: {
  externalSports: ExternalSport[];
  onChange: (externalSports: ExternalSport[]) => void;
}) {
  const addSport = () => {
    onChange([
      ...externalSports,
      {
        id: `sport-${Date.now().toString(36)}`,
        name: "Sport externe",
        days: [],
        intensity: "moderate",
        notes: ""
      }
    ]);
  };

  const updateSport = (id: string, patch: Partial<ExternalSport>) => {
    onChange(externalSports.map((sport) => (sport.id === id ? { ...sport, ...patch } : sport)));
  };

  return (
    <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-white/40">Recuperation</p>
          <h2 className="mt-1 text-xl font-black text-white">Sports externes</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">
            {externalSports.length > 0 ? `${externalSports.length} sport(s) renseignes` : "Aucun sport externe"}
          </p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
      </summary>

      <button className="mt-4 h-11 rounded-2xl bg-sky px-4 text-sm font-black text-white" onClick={addSport} type="button">
        Ajouter un sport
      </button>

      <div className="mt-4 space-y-3">
        {externalSports.map((sport) => (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3" key={sport.id}>
            <div className="flex items-center gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky"
                onChange={(event) => updateSport(sport.id, { name: event.target.value })}
                value={sport.name}
              />
              <button
                className="h-11 rounded-2xl border border-coral/30 bg-coral/10 px-3 text-sm font-black text-coral"
                onClick={() => onChange(externalSports.filter((item) => item.id !== sport.id))}
                type="button"
              >
                Suppr.
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <SelectField
                label="Intensite"
                value={sport.intensity}
                options={externalSportIntensityLabels}
                onChange={(intensity) => updateSport(sport.id, { intensity })}
              />
            </div>
            <DayPicker
              label="Jours"
              selected={sport.days}
              tone="sky"
              onToggle={(day) => {
                const days = sport.days.includes(day)
                  ? sport.days.filter((item) => item !== day)
                  : [...sport.days, day];
                updateSport(sport.id, { days });
              }}
            />
          </div>
        ))}
      </div>
    </details>
  );
}

function ProfilesSection({
  activeProfileId,
  onCreate,
  onDelete,
  onRename,
  onSwitch,
  profiles
}: {
  activeProfileId: string;
  onCreate: (name: string, avatar?: string) => Profile;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string, avatar?: string) => void;
  onSwitch: (id: string) => void;
  profiles: Profile[];
}) {
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");

  return (
    <details className="rounded-[24px] border border-white/10 bg-[#10131d] p-4 shadow-soft">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-white/40">Multi-profils</p>
          <h2 className="mt-1 text-xl font-black text-white">Profils</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">{profiles.length} profil{profiles.length > 1 ? "s" : ""}</p>
        </div>
        <span className="rounded-xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-black text-white/55">Ouvrir</span>
      </summary>

      <div className="mt-4 space-y-2">
        {profiles.map((profile) => {
          const active = profile.id === activeProfileId;

          return (
            <div className={`rounded-2xl border p-3 ${active ? "border-coral/45 bg-coral/10" : "border-white/10 bg-white/[0.04]"}`} key={profile.id}>
              <div className="flex items-center gap-2">
                <input
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-black text-white outline-none focus:border-sky"
                  onChange={(event) => onRename(profile.id, event.target.value, profile.avatar)}
                  value={profile.name}
                />
                {!active ? (
                  <button className="h-11 rounded-2xl bg-sky px-3 text-xs font-black text-white" onClick={() => onSwitch(profile.id)} type="button">
                    Activer
                  </button>
                ) : (
                  <span className="rounded-2xl border border-coral/30 bg-coral/10 px-3 py-3 text-xs font-black text-coral">Actif</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {avatarChoices.map((avatar) => (
                  <button
                    className={`flex size-9 items-center justify-center rounded-xl border text-sm font-black ${
                      profile.avatar === avatar ? "border-sky bg-sky/20 text-sky" : "border-white/10 bg-white/5 text-white/60"
                    }`}
                    key={avatar}
                    onClick={() => onRename(profile.id, profile.name, avatar)}
                    type="button"
                  >
                    {avatar}
                  </button>
                ))}
              </div>
              {!active && profiles.length > 1 ? (
                <button
                  className="mt-2 h-10 w-full rounded-2xl border border-coral/30 bg-coral/10 text-sm font-black text-coral"
                  onClick={() => {
                    if (window.confirm(`Supprimer le profil ${profile.name} ?`)) {
                      onDelete(profile.id);
                    }
                  }}
                  type="button"
                >
                  Supprimer
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {creating ? (
        <div className="mt-3 rounded-2xl border border-sky/30 bg-sky/10 p-3">
          <input
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-black text-white outline-none focus:border-sky"
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="Prenom"
            value={draftName}
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button className="h-11 rounded-2xl border border-white/10 bg-white/8 font-black text-white" onClick={() => setCreating(false)} type="button">
              Annuler
            </button>
            <button
              className="h-11 rounded-2xl bg-sky font-black text-white disabled:opacity-40"
              disabled={!draftName.trim()}
              onClick={() => {
                onCreate(draftName.trim(), avatarChoices[0]);
                setDraftName("");
                setCreating(false);
              }}
              type="button"
            >
              Creer
            </button>
          </div>
        </div>
      ) : (
        <button className="mt-3 h-11 w-full rounded-2xl bg-sky px-4 text-sm font-black text-white" onClick={() => setCreating(true)} type="button">
          Ajouter un profil
        </button>
      )}
    </details>
  );
}
