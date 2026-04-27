"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { goalLabels, progressionStyleDescriptions, progressionStyleLabels } from "@/lib/personalization";
import { useCoachStorage } from "@/lib/storage";
import type { DetailPreference, ExperienceLevel, ProgramGoal, ProgressionStyle, UserSettings, Weekday } from "@/types/training";

const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: "monday", label: "Lundi" },
  { value: "tuesday", label: "Mardi" },
  { value: "wednesday", label: "Mercredi" },
  { value: "thursday", label: "Jeudi" },
  { value: "friday", label: "Vendredi" },
  { value: "saturday", label: "Samedi" },
  { value: "sunday", label: "Dimanche" }
];

const programGoals = Object.entries(goalLabels) as Array<[ProgramGoal, string]>;

export function SettingsPanel() {
  const [confirmReset, setConfirmReset] = useState(false);
  const { currentProgram, history, isReady, resetAll, setSettings, settings } = useCoachStorage();

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const patchSettings = (patch: Partial<UserSettings>) => setSettings({ ...settings, ...patch });

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <p className="text-sm font-black uppercase text-sky">Profil sportif</p>
        <h2 className="mt-1 text-2xl font-black">{settings.athleteName}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <ProfileTile label="Age" value={`${settings.age} ans`} />
          <ProfileTile label="Taille" value={`${settings.heightCm} cm`} />
          <ProfileTile label="Poids actuel" value={`${settings.currentWeightKg} kg`} />
          <ProfileTile label="Objectif" value={`~${settings.targetWeightKg} kg`} />
          <ProfileTile label="Seances" value={`${settings.sessionsPerWeek}/semaine`} />
          <ProfileTile label="Progression" value={progressionStyleLabels[settings.progressionStyle]} />
        </div>
        <p className="mt-4 text-sm font-semibold text-ink/70">{goalLabels[settings.mainObjective]}</p>
        <p className="mt-2 text-sm font-semibold text-ink/60">
          Planning actuel: {currentProgram.length} seance{currentProgram.length > 1 ? "s" : ""} adaptee
          {currentProgram.length > 1 ? "s" : ""}.
        </p>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <h2 className="text-xl font-black">Identite et mesures</h2>
        <TextField
          className="mt-4"
          label="Prenom"
          onChange={(value) => patchSettings({ athleteName: value })}
          placeholder="Ton prenom"
          value={settings.athleteName}
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberField label="Age" onChange={(value) => patchSettings({ age: value })} value={settings.age} />
          <NumberField
            label="Taille cm"
            onChange={(value) => patchSettings({ heightCm: value })}
            value={settings.heightCm}
          />
          <NumberField
            label="Poids actuel"
            onChange={(value) => patchSettings({ currentWeightKg: value })}
            value={settings.currentWeightKg}
          />
          <NumberField
            label="Objectif poids"
            onChange={(value) => patchSettings({ targetWeightKg: value })}
            value={settings.targetWeightKg}
          />
        </div>
        <NumberField
          className="mt-4"
          label="1RM developpe couche"
          onChange={(value) => patchSettings({ benchOneRepMaxKg: value })}
          value={settings.benchOneRepMaxKg}
        />
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <h2 className="text-xl font-black">Objectif du programme</h2>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {programGoals.map(([value, label]) => (
            <OptionButton
              active={settings.mainObjective === value}
              key={value}
              label={label}
              onClick={() => patchSettings({ mainObjective: value })}
            />
          ))}
        </div>

        <SelectField
          className="mt-4"
          label="Style de progression"
          onChange={(value) => patchSettings({ progressionStyle: value as ProgressionStyle })}
          value={settings.progressionStyle}
        >
          <option value="regular">{progressionStyleLabels.regular} - {progressionStyleDescriptions.regular}</option>
          <option value="dynamic">{progressionStyleLabels.dynamic} - {progressionStyleDescriptions.dynamic}</option>
          <option value="controlled_aggressive">
            {progressionStyleLabels.controlled_aggressive} - {progressionStyleDescriptions.controlled_aggressive}
          </option>
        </SelectField>

        <SelectField
          className="mt-4"
          label="Preference d'affichage"
          onChange={(value) => patchSettings({ detailPreference: value as DetailPreference })}
          value={settings.detailPreference}
        >
          <option value="simple">Simple</option>
          <option value="detailed">Detaille</option>
        </SelectField>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <h2 className="text-xl font-black">Planification</h2>
        <SegmentedNumber
          label="Nombre de seances par semaine"
          onChange={(value) => patchSettings({ sessionsPerWeek: value })}
          value={settings.sessionsPerWeek}
          values={[3, 4, 5, 6]}
        />

        <p className="mt-4 text-sm font-bold text-ink/60">Jours disponibles</p>
        <WeekdayGrid
          selected={settings.availableDays}
          onChange={(availableDays) => patchSettings({ availableDays })}
        />

        <p className="mt-4 text-sm font-bold text-ink/60">Jours de judo</p>
        <WeekdayGrid selected={settings.judoDays} onChange={(judoDays) => patchSettings({ judoDays })} />

        <ToggleRow
          checked={settings.sports.judo}
          label="Je pratique le judo"
          onChange={(checked) => patchSettings({ sports: { ...settings.sports, judo: checked } })}
        />
        <TextField
          className="mt-3"
          label="Autre sport"
          onChange={(value) => patchSettings({ sports: { ...settings.sports, other: value } })}
          placeholder="Boxe, foot, course..."
          value={settings.sports.other}
        />
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <h2 className="text-xl font-black">Preferences terrain</h2>
        <SelectField
          className="mt-4"
          label="Niveau actuel"
          onChange={(value) => patchSettings({ level: value as ExperienceLevel })}
          value={settings.level}
        >
          <option value="beginner">Debutant</option>
          <option value="intermediate">Intermediaire</option>
          <option value="advanced">Avance</option>
        </SelectField>
        <TagsField
          label="Materiel disponible"
          onChange={(equipment) => patchSettings({ equipment })}
          value={settings.equipment}
        />
        <TagsField
          label="Exercices aimes"
          onChange={(likedExercises) => patchSettings({ likedExercises })}
          value={settings.likedExercises}
        />
        <TagsField
          label="Exercices refuses"
          onChange={(refusedExercises) => patchSettings({ refusedExercises })}
          value={settings.refusedExercises}
        />
        <TagsField
          label="Douleurs a surveiller"
          onChange={(painWatchList) => patchSettings({ painWatchList })}
          value={settings.painWatchList}
        />

        <SelectField
          className="mt-4"
          label="Unite de charge"
          onChange={(value) => patchSettings({ loadUnit: value === "lb" ? "lb" : "kg" })}
          value={settings.loadUnit}
        >
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </SelectField>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <h2 className="text-xl font-black">Options</h2>
        <ToggleRow
          checked={settings.aiEnabled}
          label="Activer l'IA"
          onChange={(checked) => patchSettings({ aiEnabled: checked })}
        />
        <p className="mt-3 rounded-md bg-mist p-3 text-sm font-semibold text-ink/60">
          AthletIQ utilise un theme sombre fixe pour garder une experience stable et lisible en salle.
        </p>
      </section>

      <section className="rounded-lg border border-black/10 bg-white p-4 shadow-soft">
        <h2 className="text-xl font-black">Donnees locales</h2>
        <p className="mt-2 text-sm font-semibold text-ink/60">
          {history.length} seance{history.length > 1 ? "s" : ""} enregistree{history.length > 1 ? "s" : ""}.
        </p>
        <button
          className="mt-4 h-12 w-full rounded-md border border-coral bg-white px-4 font-black text-coral transition hover:bg-coral hover:text-white"
          onClick={() => setConfirmReset(true)}
          type="button"
        >
          Reinitialiser les donnees locales
        </button>
        {confirmReset ? (
          <div className="mt-3 rounded-lg border border-coral/20 bg-coral/10 p-3">
            <p className="text-sm font-black text-coral">Cette action efface l&apos;historique et le programme ajuste.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-md border border-black/10 bg-white px-3 font-black text-ink"
                onClick={() => setConfirmReset(false)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="h-11 rounded-md bg-coral px-3 font-black text-white"
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
      </section>
    </div>
  );
}

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-mist p-3">
      <p className="font-bold text-ink/60">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function NumberField({
  className = "",
  label,
  onChange,
  value
}: {
  className?: string;
  label: string;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-ink/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-black/10 px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        inputMode="decimal"
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

function TextField({
  className = "",
  label,
  onChange,
  placeholder,
  value
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-ink/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-black/10 px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}

function SelectField({
  children,
  className = "",
  label,
  onChange,
  value
}: {
  children: ReactNode;
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-ink/60">{label}</span>
      <select
        className="mt-1 h-12 w-full rounded-md border border-black/10 bg-white px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function SegmentedNumber({
  label,
  onChange,
  value,
  values
}: {
  label: string;
  onChange: (value: 3 | 4 | 5 | 6) => void;
  value: 3 | 4 | 5 | 6;
  values: Array<3 | 4 | 5 | 6>;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-ink/60">{label}</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {values.map((item) => (
          <button
            className={`h-12 rounded-md border px-2 font-black ${
              value === item ? "border-sky bg-sky/10 text-sky" : "border-black/10 bg-mist text-ink/70"
            }`}
            key={item}
            onClick={() => onChange(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function WeekdayGrid({ onChange, selected }: { onChange: (days: Weekday[]) => void; selected: Weekday[] }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {weekdays.map((day) => {
        const checked = selected.includes(day.value);

        return (
          <label
            className={`flex min-h-12 items-center gap-2 rounded-md border px-3 font-bold ${
              checked ? "border-sky bg-sky/10 text-sky" : "border-black/10 bg-mist text-ink/70"
            }`}
            key={day.value}
          >
            <input
              checked={checked}
              onChange={(event) => {
                const nextDays = event.target.checked
                  ? [...selected, day.value]
                  : selected.filter((item) => item !== day.value);
                onChange(nextDays);
              }}
              type="checkbox"
            />
            {day.label}
          </label>
        );
      })}
    </div>
  );
}

function TagsField({
  label,
  onChange,
  value
}: {
  label: string;
  onChange: (value: string[]) => void;
  value: string[];
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-bold text-ink/60">{label}</span>
      <textarea
        className="mt-1 min-h-24 w-full rounded-md border border-black/10 px-3 py-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(splitTags(event.target.value))}
        value={value.join(", ")}
      />
    </label>
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
    <label className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-md bg-mist px-3 font-bold">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function OptionButton({
  active,
  label,
  onClick
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`min-h-12 rounded-md border px-3 text-left font-black ${
        active ? "border-sky bg-sky/10 text-sky" : "border-black/10 bg-mist text-ink/70"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
