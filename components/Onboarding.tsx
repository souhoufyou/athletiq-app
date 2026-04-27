"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { goalLabels, progressionStyleLabels } from "@/lib/personalization";
import type { DetailPreference, ExperienceLevel, ProgramGoal, ProgressionStyle, UserSettings, Weekday } from "@/types/training";

const weekdays: Array<{ value: Weekday; label: string }> = [
  { value: "monday", label: "Lun" },
  { value: "tuesday", label: "Mar" },
  { value: "wednesday", label: "Mer" },
  { value: "thursday", label: "Jeu" },
  { value: "friday", label: "Ven" },
  { value: "saturday", label: "Sam" },
  { value: "sunday", label: "Dim" }
];

const steps = ["Profil", "Objectif", "Terrain"];

export function Onboarding({
  setSettings,
  settings
}: {
  setSettings: (settings: UserSettings) => void;
  settings: UserSettings;
}) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<UserSettings>(settings);
  const progressLabel = useMemo(() => `${step + 1}/${steps.length}`, [step]);

  const patchDraft = (patch: Partial<UserSettings>) => setDraft((current) => ({ ...current, ...patch }));
  const finish = () => {
    setSettings({
      ...draft,
      onboardingCompleted: true
    });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 premium-gradient p-5 text-white shadow-soft">
        <p className="text-xs font-black uppercase text-white/60">AthletIQ setup {progressLabel}</p>
        <h1 className="athletiq-hero-title mt-2 font-black">Ton coach en poche</h1>
        <p className="mt-3 text-sm font-semibold text-white/70">
          Profil rapide. Programme clair. Actions faciles en salle.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {steps.map((label, index) => (
            <div
              className={`h-2 rounded-full ${index <= step ? "bg-white" : "bg-white/20"}`}
              key={label}
            />
          ))}
        </div>
      </section>

      {step === 0 ? (
        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
          <h2 className="text-xl font-black">Profil</h2>
          <TextField
            className="mt-4"
            label="Prenom"
            onChange={(athleteName) => patchDraft({ athleteName })}
            value={draft.athleteName}
          />
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField label="Age" onChange={(age) => patchDraft({ age })} value={draft.age} />
            <NumberField label="Taille cm" onChange={(heightCm) => patchDraft({ heightCm })} value={draft.heightCm} />
            <NumberField
              label="Poids"
              onChange={(currentWeightKg) => patchDraft({ currentWeightKg })}
              value={draft.currentWeightKg}
            />
            <NumberField
              label="Objectif kg"
              onChange={(targetWeightKg) => patchDraft({ targetWeightKg })}
              value={draft.targetWeightKg}
            />
          </div>
          <SelectField
            className="mt-4"
            label="Niveau actuel"
            onChange={(level) => patchDraft({ level: level as ExperienceLevel })}
            value={draft.level}
          >
            <option value="beginner">Debutant</option>
            <option value="intermediate">Intermediaire</option>
            <option value="advanced">Avance</option>
          </SelectField>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
          <h2 className="text-xl font-black">Objectif et rythme</h2>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {(Object.entries(goalLabels) as Array<[ProgramGoal, string]>).map(([value, label]) => (
              <button
                className={`min-h-12 rounded-md border px-3 text-left font-black ${
                  draft.mainObjective === value ? "border-sky bg-sky/10 text-sky" : "border-black/10 bg-mist text-ink/70"
                }`}
                key={value}
                onClick={() => patchDraft({ mainObjective: value })}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <SegmentedNumber
            className="mt-4"
            label="Seances par semaine"
            onChange={(sessionsPerWeek) => patchDraft({ sessionsPerWeek })}
            value={draft.sessionsPerWeek}
          />
          <p className="mt-4 text-sm font-bold text-ink/60">Jours disponibles</p>
          <WeekdayGrid selected={draft.availableDays} onChange={(availableDays) => patchDraft({ availableDays })} />
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
          <h2 className="text-xl font-black">Terrain</h2>
          <ToggleRow
            checked={draft.sports.judo}
            label="Judo pratique"
            onChange={(checked) => patchDraft({ sports: { ...draft.sports, judo: checked } })}
          />
          <TextField
            className="mt-3"
            label="Autre sport"
            onChange={(other) => patchDraft({ sports: { ...draft.sports, other } })}
            value={draft.sports.other}
          />
          <TagsField label="Materiel disponible" onChange={(equipment) => patchDraft({ equipment })} value={draft.equipment} />
          <TagsField label="Exercices aimes" onChange={(likedExercises) => patchDraft({ likedExercises })} value={draft.likedExercises} />
          <TagsField label="Exercices refuses" onChange={(refusedExercises) => patchDraft({ refusedExercises })} value={draft.refusedExercises} />
          <TagsField label="Douleurs a surveiller" onChange={(painWatchList) => patchDraft({ painWatchList })} value={draft.painWatchList} />
          <SelectField
            className="mt-4"
            label="Preference"
            onChange={(detailPreference) => patchDraft({ detailPreference: detailPreference as DetailPreference })}
            value={draft.detailPreference}
          >
            <option value="simple">Simple</option>
            <option value="detailed">Detaille</option>
          </SelectField>
          <SelectField
            className="mt-4"
            label="Style de progression"
            onChange={(progressionStyle) => patchDraft({ progressionStyle: progressionStyle as ProgressionStyle })}
            value={draft.progressionStyle}
          >
            <option value="regular">{progressionStyleLabels.regular}</option>
            <option value="dynamic">{progressionStyleLabels.dynamic}</option>
            <option value="controlled_aggressive">{progressionStyleLabels.controlled_aggressive}</option>
          </SelectField>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <button
          className="h-14 rounded-md border border-black/10 bg-white px-4 font-black text-ink disabled:opacity-40"
          disabled={step === 0}
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          type="button"
        >
          Retour
        </button>
        <button
          className="h-14 rounded-md premium-action px-4 font-black"
          onClick={() => (step === steps.length - 1 ? finish() : setStep((current) => current + 1))}
          type="button"
        >
          {step === steps.length - 1 ? "Terminer" : "Continuer"}
        </button>
      </div>
    </div>
  );
}

function TextField({
  className = "",
  label,
  onChange,
  value
}: {
  className?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold text-ink/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-black/10 px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function NumberField({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
  return (
    <label className="block">
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
  className = "",
  label,
  onChange,
  value
}: {
  className?: string;
  label: string;
  onChange: (value: 3 | 4 | 5 | 6) => void;
  value: 3 | 4 | 5 | 6;
}) {
  const values: Array<3 | 4 | 5 | 6> = [3, 4, 5, 6];

  return (
    <div className={className}>
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
    <div className="mt-3 grid grid-cols-4 gap-2">
      {weekdays.map((day) => {
        const checked = selected.includes(day.value);

        return (
          <button
            className={`h-11 rounded-md border px-2 text-sm font-black ${
              checked ? "border-sky bg-sky/10 text-sky" : "border-black/10 bg-mist text-ink/70"
            }`}
            key={day.value}
            onClick={() => {
              const nextDays = checked ? selected.filter((item) => item !== day.value) : [...selected, day.value];
              onChange(nextDays);
            }}
            type="button"
          >
            {day.label}
          </button>
        );
      })}
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
    <label className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-md bg-mist px-3 font-bold">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
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
        className="mt-1 min-h-20 w-full rounded-md border border-black/10 px-3 py-3 text-sm font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        onChange={(event) => onChange(splitTags(event.target.value))}
        value={value.join(", ")}
      />
    </label>
  );
}

function splitTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
