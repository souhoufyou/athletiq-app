"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { fileToCompressedAvatar } from "@/lib/imageUpload";
import {
  appendCalibrationEvent,
  createReferenceDeletedCalibrationEvent,
  createReferenceLockCalibrationEvent
} from "@/lib/calibrationEvents";
import { getActiveProgramTemplate } from "@/lib/activeProgram";
import { COMPLEMENTARY_PROGRAMS } from "@/lib/complementaryPrograms";
import { supabaseAuth } from "@/lib/supabaseAuth";
import { buildStrengthReferenceFromSet, estimateOneRepMaxFromSet, formatEstimatedOneRepMax } from "@/lib/strengthCalibration";
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
  StrengthReference,
  UserSex,
  UserSettings,
  Weekday,
  WeightEntry
} from "@/types/training";

const AVATAR_CHOICES: string[] = [];

const goalLabels: Record<PrimaryGoal, string> = {
  "perte-gras": "Perte de gras",
  "prise-masse": "Prise de masse",
  recomposition: "Recomposition",
  performance: "Performance",
  sante: "Santé"
};

const equipmentLabels: Record<Equipment, string> = {
  "salle-complete": "Salle complète",
  "halteres-maison": "Maison équipée",
  "poids-corps": "Poids du corps"
};

const experienceLabels: Record<ExperienceLevel, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé"
};

const sexLabels: Record<UserSex, string> = {
  female: "Femme",
  male: "Homme",
  other: "Autre",
  "prefer-not-to-say": "Non renseigné"
};

const durationLabels: Record<SessionDurationPreference, string> = {
  short: "35-45 min",
  standard: "50-65 min",
  long: "70-90 min"
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

function getPrimaryGoalLabel(settings: UserSettings): string {
  return settings.primaryGoal ? goalLabels[settings.primaryGoal] : settings.mainGoal;
}

function LegacySettingsPanel() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const {
    activeProfileId,
    createProfile,
    deleteProfile,
    history,
    isReady,
    profiles,
    regenerateProgram,
    renameProfile,
    resetAll,
    setSettings,
    settings,
    switchProfile
  } = useCoachStorage();

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <ProfilesSection
        activeProfileId={activeProfileId}
        onCreate={createProfile}
        onDelete={deleteProfile}
        onRename={renameProfile}
        onSwitch={switchProfile}
        profiles={profiles}
      />
      <section className="overflow-hidden rounded-2xl border border-white/10 premium-gradient p-5 text-white shadow-soft">
        <p className="text-xs font-black uppercase text-sky">Profil sportif</p>
        <h2 className="mt-1 text-2xl font-black">{settings.athleteName}</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <ProfileTile label="Âge" value={`${settings.age} ans`} />
          <ProfileTile label="Taille" value={`${settings.heightCm} cm`} />
          <ProfileTile label="Poids actuel" value={`${settings.currentWeightKg} kg`} />
          <ProfileTile label="Objectif" value={`~${settings.targetWeightKg} kg`} />
        </div>
        <p className="mt-4 text-sm font-semibold text-white/70">{settings.mainGoal}</p>
        <p className="mt-2 text-sm font-semibold text-white/50">
          {settings.gym ? `Salle ${settings.gym} · ` : ""}Sport externe {settings.judoDays.length > 0 ? `${settings.judoDays.length}x/semaine` : "non planifié"}
        </p>
      </section>

      <section className="card-dark p-4">
        <h2 className="text-xl font-black text-white">Mesures</h2>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Prénom</span>
          <input
            className="mt-1 h-12 w-full rounded-md border border-white/10 px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => setSettings({ ...settings, athleteName: event.target.value })}
            placeholder="Ton prénom"
            value={settings.athleteName}
          />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Profil biologique</span>
          <select
            className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => setSettings({ ...settings, sex: event.target.value as UserSex })}
            value={settings.sex}
          >
            {(Object.entries(sexLabels) as Array<[UserSex, string]>).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberField
            label="Poids actuel"
            onChange={(value) => setSettings({ ...settings, currentWeightKg: value })}
            value={settings.currentWeightKg}
          />
          <NumberField
            label="Objectif poids"
            onChange={(value) => setSettings({ ...settings, targetWeightKg: value })}
            value={settings.targetWeightKg}
          />
        </div>
        <NumberField
          className="mt-4"
          label="1RM développé couché"
          onChange={(value) => setSettings({ ...settings, benchOneRepMaxKg: value })}
          value={settings.benchOneRepMaxKg}
        />
        <label className="mt-4 block">
          <span className="text-sm font-bold text-ink/60">Unité de charge</span>
          <select
            className="mt-1 h-12 w-full rounded-md border border-black/10 bg-white px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) =>
              setSettings({ ...settings, loadUnit: event.target.value === "lb" ? "lb" : "kg" })
            }
            value={settings.loadUnit}
          >
            <option value="kg">kg</option>
            <option value="lb">lb</option>
          </select>
        </label>
      </section>

      <section className="card-dark p-4">
        <h2 className="text-xl font-black text-white">Planification</h2>
        <p className="mt-1 text-sm font-semibold text-white/55">Jours de sport externe</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {weekdays.map((day) => {
            const checked = settings.judoDays.includes(day.value);

            return (
              <label
                className={`flex min-h-12 items-center gap-2 rounded-md border px-3 font-bold ${
                  checked ? "border-sky/40 bg-sky/10 text-sky" : "border-white/8 bg-white/5 text-white/60"
                }`}
                key={day.value}
              >
                <input
                  checked={checked}
                  onChange={(event) => {
                    const nextDays = event.target.checked
                      ? [...settings.judoDays, day.value]
                      : settings.judoDays.filter((item) => item !== day.value);
                    setSettings({ ...settings, judoDays: nextDays });
                  }}
                  type="checkbox"
                />
                {day.label}
              </label>
            );
          })}
        </div>

        <p className="mt-5 text-sm font-semibold text-white/55">Jours disponibles pour la muscu</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {weekdays.map((day) => {
            const checked = settings.availableDays.includes(day.value);

            return (
              <label
                className={`flex min-h-12 items-center gap-2 rounded-md border px-3 font-bold ${
                  checked ? "border-sea/40 bg-sea/10 text-sea" : "border-white/8 bg-white/5 text-white/60"
                }`}
                key={day.value}
              >
                <input
                  checked={checked}
                  onChange={(event) => {
                    const nextDays = event.target.checked
                      ? [...settings.availableDays, day.value]
                      : settings.availableDays.filter((item) => item !== day.value);
                    setSettings({ ...settings, availableDays: nextDays.length > 0 ? nextDays : settings.availableDays });
                  }}
                  type="checkbox"
                />
                {day.label}
              </label>
            );
          })}
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Durée préférée des séances</span>
          <select
            className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) =>
              setSettings({ ...settings, sessionDurationPreference: event.target.value as SessionDurationPreference })
            }
            value={settings.sessionDurationPreference}
          >
            {(Object.entries(durationLabels) as Array<[SessionDurationPreference, string]>).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Niveau de prudence</span>
          <select
            className="mt-1 h-12 w-full rounded-md border border-white/10 px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => setSettings({ ...settings, cautionLevel: event.target.value as CautionLevel })}
            value={settings.cautionLevel}
          >
            <option value="prudent">Prudent</option>
            <option value="normal">Normal</option>
            <option value="agressif">Agressif</option>
          </select>
        </label>

        <ToggleRow
          checked={settings.aiEnabled}
          label="Activer l'IA coach"
          onChange={(checked) => setSettings({ ...settings, aiEnabled: checked })}
        />
      </section>

      <ExternalSportsSection
        externalSports={settings.externalSports}
        onChange={(externalSports) => setSettings({ ...settings, externalSports })}
      />

      <StrengthReferencesSection
        loadUnit={settings.loadUnit}
        onChange={(strengthReferences) => setSettings({ ...settings, strengthReferences })}
        onSettingsChange={setSettings}
        settings={settings}
        strengthReferences={settings.strengthReferences}
      />

      <WeightLogSection
        currentWeightKg={settings.currentWeightKg}
        targetWeightKg={settings.targetWeightKg}
        weightLog={settings.weightLog ?? []}
        onLog={(entry) => {
          const existing = settings.weightLog ?? [];
          const sameDay = existing.find((e) => e.date === entry.date);
          const nextLog = sameDay
            ? existing.map((e) => (e.date === entry.date ? entry : e))
            : [entry, ...existing].slice(0, 30);
          setSettings({ ...settings, weightLog: nextLog, currentWeightKg: entry.kg });
        }}
      />

      <section className="card-dark p-4">
        <h2 className="text-xl font-black text-white">Préférences & contraintes</h2>
        <p className="mt-1 text-sm font-semibold text-white/55">
          Ces listes sont utilisées à la prochaine régénération du programme.
        </p>
        <TextListField
          label="Points de vigilance"
          onChange={(values) => setSettings({ ...settings, watchPoints: values })}
          placeholder="ex. poignet droit, lombaires, genou gauche"
          values={settings.watchPoints}
        />
        <TextListField
          label="Préférences"
          onChange={(values) => setSettings({ ...settings, preferences: values })}
          placeholder="ex. machines, haltères, full body"
          values={settings.preferences}
        />
        <TextListField
          label="Exercices à éviter"
          onChange={(values) => setSettings({ ...settings, avoid: values })}
          placeholder="ex. dips, squat barre, course"
          values={settings.avoid}
        />
      </section>

      <section className="card-dark p-4">
        <h2 className="text-xl font-black text-white">Programme & objectif</h2>
        <p className="mt-1 text-sm font-semibold text-white/55">
          Modifie ton objectif, ta fréquence ou ton équipement pour régénérer un programme adapté.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-sm font-bold text-white/60">Objectif principal</p>
            <select
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              onChange={(e) => setSettings({ ...settings, primaryGoal: e.target.value as PrimaryGoal })}
              value={settings.primaryGoal ?? "recomposition"}
            >
              {(Object.entries(goalLabels) as Array<[PrimaryGoal, string]>).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-bold text-white/60">Fréquence (séances/semaine)</p>
            <div className="mt-1 grid grid-cols-5 gap-2">
              {[2, 3, 4, 5, 6].map((freq) => (
                <button
                  className={`h-11 rounded-md border font-black transition ${
                    (settings.weeklyFrequency ?? 4) === freq
                      ? "border-sky/50 bg-sky/10 text-sky"
                      : "border-white/10 bg-white/5 text-white/60"
                  }`}
                  key={freq}
                  onClick={() => setSettings({ ...settings, weeklyFrequency: freq })}
                  type="button"
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-white/60">Équipement</p>
            <select
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              onChange={(e) => setSettings({ ...settings, equipment: e.target.value as Equipment })}
              value={settings.equipment ?? "salle-complete"}
            >
              {(Object.entries(equipmentLabels) as Array<[Equipment, string]>).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-sm font-bold text-white/60">Niveau d&apos;expérience</p>
            <select
              className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
              onChange={(e) => setSettings({ ...settings, experienceLevel: e.target.value as ExperienceLevel })}
              value={settings.experienceLevel ?? "intermediaire"}
            >
              {(Object.entries(experienceLabels) as Array<[ExperienceLevel, string]>).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          className="mt-4 h-12 w-full rounded-md border border-sky/30 bg-sky/10 px-4 font-black text-sky transition hover:bg-sky/20"
          onClick={() => setConfirmRegen(true)}
          type="button"
        >
          Régénérer mon programme
        </button>
        {confirmRegen ? (
          <div className="mt-3 rounded-lg border border-sky/20 bg-sky/10 p-3">
            <p className="text-sm font-black text-sky">
              Cela remplace le programme actuel par un nouveau basé sur tes paramètres ci-dessus. L&apos;historique des séances déjà validées est conservé.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-md border border-white/10 bg-white/8 px-3 font-black text-white"
                onClick={() => setConfirmRegen(false)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="h-11 rounded-md bg-sky px-3 font-black text-white"
                onClick={() => {
                  regenerateProgram();
                  setConfirmRegen(false);
                }}
                type="button"
              >
                Régénérer
              </button>
            </div>
          </div>
        ) : null}
      </section>

      <section className="card-dark p-4">
        <h2 className="text-xl font-black text-white">Données locales</h2>
        <p className="mt-2 text-sm font-semibold text-white/55">
          {history.length} séance{history.length > 1 ? "s" : ""} enregistrée{history.length > 1 ? "s" : ""}.
        </p>
        <button
          className="mt-4 h-12 w-full rounded-md border border-coral/30 bg-coral/10 px-4 font-black text-coral transition hover:bg-coral hover:text-white"
          onClick={() => setConfirmReset(true)}
          type="button"
        >
          Réinitialiser les données locales
        </button>
        {confirmReset ? (
          <div className="mt-3 rounded-lg border border-coral/20 bg-coral/10 p-3">
            <p className="text-sm font-black text-coral">Cette action efface l&apos;historique et le programme ajusté.</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-md border border-white/10 bg-white/8 px-3 font-black text-white"
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

void LegacySettingsPanel;

export function SettingsPanel() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [confirmOnboardingReset, setConfirmOnboardingReset] = useState(false);
  const {
    activeProfileId,
    createProfile,
    currentProgram,
    deleteProfile,
    history,
    isReady,
    profiles,
    regenerateProgram,
    renameProfile,
    resetAll,
    setProfilePhoto,
    setSettings,
    settings,
    switchProfile
  } = useCoachStorage();

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const activeProgram = getActiveProgramTemplate(currentProgram);
  const weeklyFrequency = settings.weeklyFrequency ?? Math.max(currentProgram.length, 3);

  const activeProfile = profiles.find((p) => p.id === activeProfileId);

  return (
    <div className="space-y-4">
      {/* ── PROFIL ───────────────────────────────────────────────── */}
      <SectionCard subtitle="Tes infos personnelles essentielles." title="Profil">
        <ProfilePhotoUpload
          name={settings.athleteName || "Athlète"}
          photoUrl={activeProfile?.photoUrl}
          onPhotoChange={(dataUrl) => {
            if (activeProfile) setProfilePhoto(activeProfile.id, dataUrl);
          }}
        />

        <label className="mt-4 block">
          <span className="text-sm font-bold text-white/60">Prénom</span>
          <input
            className="mt-1 h-12 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
            onChange={(event) => setSettings({ ...settings, athleteName: event.target.value })}
            placeholder="Ton prénom"
            value={settings.athleteName}
          />
        </label>

        <div className="mt-4">
          <p className="text-sm font-bold text-white/60">Sexe</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <PillButton onClick={() => setSettings({ ...settings, sex: "male" })} selected={settings.sex === "male"}>
              Homme
            </PillButton>
            <PillButton onClick={() => setSettings({ ...settings, sex: "female" })} selected={settings.sex === "female"}>
              Femme
            </PillButton>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberField
            label="Âge"
            onChange={(value) => setSettings({ ...settings, age: value })}
            value={settings.age}
          />
          <NumberField
            label="Taille (cm)"
            onChange={(value) => setSettings({ ...settings, heightCm: value })}
            value={settings.heightCm}
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumberField
            label="Poids actuel (kg)"
            onChange={(value) => setSettings({ ...settings, currentWeightKg: value })}
            value={settings.currentWeightKg}
          />
          <NumberField
            label="Objectif (kg)"
            onChange={(value) => setSettings({ ...settings, targetWeightKg: value })}
            value={settings.targetWeightKg}
          />
        </div>

        <WeightProgressBar
          current={settings.currentWeightKg}
          target={settings.targetWeightKg}
          weightLog={settings.weightLog ?? []}
        />
      </SectionCard>

      {/* ── OBJECTIF ─────────────────────────────────────────────── */}
      <SectionCard subtitle="Ce que tu veux atteindre — utilisé pour recommander un programme." title="Objectif">
        <p className="text-[11px] font-black uppercase tracking-wide text-white/55">Objectif principal</p>
        <GoalGrid
          onChange={(value) => setSettings({ ...settings, primaryGoal: value })}
          value={settings.primaryGoal}
        />

        <p className="mt-5 text-[11px] font-black uppercase tracking-wide text-white/55">
          Objectif secondaire <span className="text-white/35">(optionnel)</span>
        </p>
        <GoalGrid
          allowNone
          excludeValue={settings.primaryGoal}
          onChange={(value) => setSettings({ ...settings, secondaryGoal: value })}
          value={settings.secondaryGoal}
        />
      </SectionCard>

      {/* ── ENTRAÎNEMENT ─────────────────────────────────────────── */}
      <SectionCard subtitle="Comment tu t'entraînes au quotidien." title="Entraînement">
        <p className="text-[11px] font-black uppercase tracking-wide text-white/55">Niveau</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.entries(experienceLabels) as Array<[ExperienceLevel, string]>).map(([value, label]) => (
            <PillButton
              key={value}
              onClick={() => setSettings({ ...settings, experienceLevel: value })}
              selected={(settings.experienceLevel ?? "intermediaire") === value}
            >
              {label}
            </PillButton>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-wide text-white/55">Séances par semaine</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {[2, 3, 4, 5, 6].map((freq) => (
            <PillButton
              key={freq}
              onClick={() => setSettings({ ...settings, weeklyFrequency: freq })}
              selected={(settings.weeklyFrequency ?? 4) === freq}
            >
              {String(freq)}
            </PillButton>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-wide text-white/55">Durée par séance</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(Object.entries(durationLabels) as Array<[SessionDurationPreference, string]>).map(([value, label]) => (
            <PillButton
              key={value}
              onClick={() => setSettings({ ...settings, sessionDurationPreference: value })}
              selected={settings.sessionDurationPreference === value}
            >
              {label}
            </PillButton>
          ))}
        </div>

        <p className="mt-5 text-[11px] font-black uppercase tracking-wide text-white/55">Matériel disponible</p>
        <div className="mt-2 grid grid-cols-1 gap-2">
          {(Object.entries(equipmentLabels) as Array<[Equipment, string]>).map(([value, label]) => (
            <PillButton
              key={value}
              onClick={() => setSettings({ ...settings, equipment: value })}
              selected={(settings.equipment ?? "salle-complete") === value}
            >
              {label}
            </PillButton>
          ))}
        </div>
      </SectionCard>

      {/* ── PROGRAMME ────────────────────────────────────────────── */}
      <SectionCard subtitle="Ton plan d'entraînement actif." title="Programme">
        <div className="rounded-xl border border-white/8 bg-white/4 p-3">
          <p className="text-base font-black text-white">
            {activeProgram?.name ?? "Programme personnalisé"}
          </p>
          <p className="mt-1 text-xs font-semibold text-white/55">
            {activeProgram?.level ? capitalize(activeProgram.level) : "Perso"}
            {" · "}
            {(activeProgram?.frequency ?? weeklyFrequency)} j/sem.
            {" · "}
            {activeProgram?.averageDuration ?? durationLabels[settings.sessionDurationPreference]}
          </p>
        </div>

        <Link
          className="session-cta-secondary mt-3 inline-flex items-center justify-center"
          href="/programme"
        >
          Changer de programme
        </Link>

        <button
          className="mt-2 h-11 w-full rounded-md border border-sky/25 bg-sky/10 px-4 text-sm font-black text-sky transition hover:bg-sky/20"
          onClick={() => setConfirmRegen(true)}
          type="button"
        >
          Régénérer depuis mes réglages
        </button>
        <p className="mt-5 text-[11px] font-black uppercase tracking-wide text-white/55">
          Programmes complémentaires <span className="text-white/35">(optionnel)</span>
        </p>
        <p className="mt-1 text-xs font-semibold text-white/45">
          Petits modules à ajouter en plus du programme principal. Ils n&apos;écrasent rien.
        </p>
        <div className="mt-2 space-y-2">
          {COMPLEMENTARY_PROGRAMS.map((complement) => {
            const active = (settings.complementaryPrograms ?? []).includes(complement.id);
            return (
              <button
                className={`flex w-full items-start justify-between gap-3 rounded-xl border p-3 text-left transition ${
                  active
                    ? "border-sea/40 bg-sea/10"
                    : "border-white/10 bg-white/5 hover:bg-white/8"
                }`}
                key={complement.id}
                onClick={() => {
                  const current = settings.complementaryPrograms ?? [];
                  const next = active
                    ? current.filter((id) => id !== complement.id)
                    : [...current, complement.id];
                  setSettings({ ...settings, complementaryPrograms: next });
                }}
                type="button"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{complement.name}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-white/55">
                    {complement.weeklyTarget} · ~{complement.defaultDurationMin} min
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                    active ? "border-sea/30 bg-sea/15 text-sea" : "border-white/10 bg-white/8 text-white/55"
                  }`}
                >
                  {active ? "Actif" : "Ajouter"}
                </span>
              </button>
            );
          })}
        </div>

        {confirmRegen ? (
          <div className="mt-3 rounded-lg border border-sky/20 bg-sky/10 p-3">
            <p className="text-sm font-black text-sky">
              Régénérer remplace ton programme actuel par un nouveau basé sur tes réglages. Ton historique reste conservé.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-md border border-white/10 bg-white/8 px-3 font-black text-white"
                onClick={() => setConfirmRegen(false)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="h-11 rounded-md bg-sky px-3 font-black text-white"
                onClick={() => {
                  regenerateProgram();
                  setConfirmRegen(false);
                }}
                type="button"
              >
                Régénérer
              </button>
            </div>
          </div>
        ) : null}
      </SectionCard>

      {/* ── APPARENCE ────────────────────────────────────────────── */}
      <SectionCard subtitle="Thème de l'application." title="Apparence">
        <div className="grid grid-cols-2 gap-2">
          <PillButton onClick={() => setSettings({ ...settings, darkMode: true })} selected={settings.darkMode}>
            🌙 Sombre
          </PillButton>
          <PillButton onClick={() => setSettings({ ...settings, darkMode: false })} selected={!settings.darkMode}>
            ☀️ Clair
          </PillButton>
        </div>
        {!settings.darkMode ? (
          <p className="mt-3 rounded-md bg-amber/10 px-3 py-2 text-xs font-semibold text-amber">
            Le mode clair complet est en préparation. Certaines surfaces restent sombres pour l&apos;instant.
          </p>
        ) : null}
      </SectionCard>

      {/* ── DONNÉES ──────────────────────────────────────────────── */}
      <SectionCard
        subtitle={`${history.length} séance${history.length > 1 ? "s" : ""} dans l'historique pour ce profil.`}
        title="Données"
      >
        <button
          className="h-11 w-full rounded-md border border-white/10 bg-white/8 px-4 text-sm font-black text-white/80 transition hover:bg-white/12"
          onClick={() => setConfirmOnboardingReset(true)}
          type="button"
        >
          Refaire le questionnaire
        </button>
        {confirmOnboardingReset ? (
          <div className="mt-3 rounded-lg border border-white/10 bg-white/8 p-3">
            <p className="text-sm font-black text-white/80">
              Refaire le questionnaire pour ce profil ? Ton historique et tes réglages actuels sont conservés.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-md border border-white/10 bg-white/8 px-3 font-black text-white"
                onClick={() => setConfirmOnboardingReset(false)}
                type="button"
              >
                Annuler
              </button>
              <button
                className="h-11 rounded-md bg-sky px-3 font-black text-white"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.localStorage.removeItem(`coach-adaptatif:p:${activeProfileId}:onboarding-done`);
                    window.location.href = "/onboarding";
                  }
                }}
                type="button"
              >
                Refaire
              </button>
            </div>
          </div>
        ) : null}

        <button
          className="mt-3 h-11 w-full rounded-md border border-coral/30 bg-coral/10 px-4 text-sm font-black text-coral transition hover:bg-coral/20"
          onClick={() => setConfirmReset(true)}
          type="button"
        >
          Réinitialiser toutes mes données
        </button>
        {confirmReset ? (
          <div className="mt-3 rounded-lg border border-coral/20 bg-coral/10 p-3">
            <p className="text-sm font-black text-coral">
              Cette action efface l&apos;historique, le programme et tes réglages pour ce profil. Définitif.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="h-11 rounded-md border border-white/10 bg-white/8 px-3 font-black text-white"
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
                Tout effacer
              </button>
            </div>
          </div>
        ) : null}
      </SectionCard>

      {/* ── SUIVI POIDS ─────────────────────────────────────────── */}
      <WeightLogSection
        currentWeightKg={settings.currentWeightKg}
        targetWeightKg={settings.targetWeightKg}
        weightLog={settings.weightLog ?? []}
        onLog={(entry) => {
          const existing = settings.weightLog ?? [];
          const sameDay = existing.find((e) => e.date === entry.date);
          const nextLog = sameDay
            ? existing.map((e) => (e.date === entry.date ? entry : e))
            : [entry, ...existing].slice(0, 30);
          setSettings({ ...settings, weightLog: nextLog, currentWeightKg: entry.kg });
        }}
      />

      {/* ── DÉCONNEXION (tout en bas) ──────────────────────────── */}
      <LogoutButton />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Local helpers for the new SettingsPanel UI
// ─────────────────────────────────────────────────────────────────────────

function SectionCard({
  children,
  subtitle,
  title
}: {
  children: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <section className="card-dark p-4">
      <h2 className="text-xl font-black text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm font-semibold text-white/55">{subtitle}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PillButton({
  children,
  onClick,
  selected
}: {
  children: ReactNode;
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

const goalGridOptions: Array<{ value: PrimaryGoal; label: string }> = [
  { value: "perte-gras", label: "Perte de gras" },
  { value: "prise-masse", label: "Prise de muscle" },
  { value: "recomposition", label: "Recomposition" },
  { value: "performance", label: "Force / Performance" },
  { value: "sante", label: "Santé / Cardio" }
];

function GoalGrid({
  allowNone = false,
  excludeValue,
  onChange,
  value
}: {
  allowNone?: boolean;
  excludeValue?: PrimaryGoal;
  onChange: (value: PrimaryGoal | undefined) => void;
  value: PrimaryGoal | undefined;
}) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      {allowNone ? (
        <PillButton onClick={() => onChange(undefined)} selected={!value}>
          Aucun
        </PillButton>
      ) : null}
      {goalGridOptions
        .filter((opt) => opt.value !== excludeValue)
        .map((opt) => (
          <PillButton
            key={opt.value}
            onClick={() => onChange(opt.value)}
            selected={value === opt.value}
          >
            {opt.label}
          </PillButton>
        ))}
    </div>
  );
}

function WeightProgressBar({
  current,
  target,
  weightLog
}: {
  current: number;
  target: number;
  weightLog: WeightEntry[];
}) {
  const earliest = [...weightLog].sort((a, b) => a.date.localeCompare(b.date))[0];
  const startKg = earliest ? earliest.kg : current;
  const totalDelta = startKg - target;
  const doneDelta = startKg - current;
  const isLoss = startKg > target;
  const isGain = startKg < target;
  const ratio = totalDelta !== 0 ? doneDelta / totalDelta : current === target ? 1 : 0;
  const progress = Math.max(0, Math.min(1, ratio));
  const remaining = Math.abs(target - current);
  const fmt = (kg: number) => kg.toFixed(1).replace(/\.0$/, "").replace(".", ",");

  return (
    <div className="mt-5 rounded-xl border border-white/8 bg-white/4 p-3">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-white/55">
        <span>Actuel</span>
        <span>Objectif</span>
      </div>
      <div className="mt-1 flex items-baseline justify-between text-lg font-black text-white">
        <span>{fmt(current)} kg</span>
        <span>{fmt(target)} kg</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-sea transition-all"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] font-semibold text-white/55">
        {current === target
          ? "Objectif atteint."
          : `${isLoss ? "Reste" : isGain ? "À prendre" : ""} ${fmt(remaining)} kg`}
      </p>
    </div>
  );
}

function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ProfileTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3">
      <p className="text-xs font-bold text-white/55">{label}</p>
      <p className="mt-1 font-black text-white">{value}</p>
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
      <span className="text-sm font-bold text-white/60">{label}</span>
      <input
        className="mt-1 h-12 w-full rounded-md border border-white/10 px-3 font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
        inputMode="decimal"
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
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
    <label className="mt-3 flex min-h-12 items-center justify-between gap-3 rounded-md border border-white/8 bg-white/5 px-3 font-bold text-white">
      <span>{label}</span>
      <input checked={checked} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
    </label>
  );
}

function ExternalSportsSection({
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
    <details className="card-dark group p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Sports externes</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">
            L&apos;app evite les semaines trop chargees quand ces sports sont renseignes.
          </p>
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55 group-open:bg-sky/10 group-open:text-sky">
          {externalSports.length > 0 ? `${externalSports.length} sport(s)` : "Ouvrir"}
        </span>
      </summary>

      <button
        className="mt-4 h-10 rounded-md bg-sky px-3 text-sm font-black text-white transition hover:bg-sky/80"
        onClick={addSport}
        type="button"
      >
        + Sport
      </button>

      {externalSports.length === 0 ? (
        <p className="mt-4 rounded-md bg-white/5 p-3 text-sm font-semibold text-white/50">
          Aucun sport externe renseigne.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {externalSports.map((sport) => (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3" key={sport.id}>
              <div className="flex items-center gap-2">
                <input
                  className="h-11 flex-1 rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                  onChange={(event) => updateSport(sport.id, { name: event.target.value })}
                  placeholder="Nom du sport"
                  value={sport.name}
                />
                <button
                  aria-label="Supprimer le sport"
                  className="flex size-11 shrink-0 items-center justify-center rounded-md border border-coral/20 bg-coral/10 font-black text-coral"
                  onClick={() => onChange(externalSports.filter((item) => item.id !== sport.id))}
                  type="button"
                >
                  x
                </button>
              </div>

              <select
                className="mt-3 h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                onChange={(event) => updateSport(sport.id, { intensity: event.target.value as ExternalSportIntensity })}
                value={sport.intensity}
              >
                {(Object.entries(externalSportIntensityLabels) as Array<[ExternalSportIntensity, string]>).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {weekdays.map((day) => {
                  const checked = sport.days.includes(day.value);

                  return (
                    <label
                      className={`flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold ${
                        checked ? "border-amber/40 bg-amber/10 text-amber" : "border-white/8 bg-white/5 text-white/60"
                      }`}
                      key={day.value}
                    >
                      <input
                        checked={checked}
                        onChange={(event) => {
                          const days = event.target.checked
                            ? [...sport.days, day.value]
                            : sport.days.filter((item) => item !== day.value);
                          updateSport(sport.id, { days });
                        }}
                        type="checkbox"
                      />
                      {day.label}
                    </label>
                  );
                })}
              </div>

              <input
                className="mt-3 h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                onChange={(event) => updateSport(sport.id, { notes: event.target.value })}
                placeholder="Note optionnelle"
                value={sport.notes ?? ""}
              />
            </div>
          ))}
        </div>
      )}
    </details>
  );
}

function StrengthReferencesSection({
  loadUnit,
  onChange,
  onSettingsChange,
  settings,
  strengthReferences
}: {
  loadUnit: "kg" | "lb";
  onChange: (references: StrengthReference[]) => void;
  onSettingsChange: (settings: UserSettings) => void;
  settings: UserSettings;
  strengthReferences: StrengthReference[];
}) {
  const commitWithEvent = (references: StrengthReference[], reference: StrengthReference, eventType: "delete" | "toggle-lock") => {
    const event = eventType === "delete"
      ? createReferenceDeletedCalibrationEvent(reference)
      : createReferenceLockCalibrationEvent(reference, !(reference.locked ?? false));

    onSettingsChange(
      appendCalibrationEvent(
        {
          ...settings,
          strengthReferences: references
        },
        event
      )
    );
  };

  const addReference = () => {
    onChange([
      ...strengthReferences,
      {
        lift: "Nouvel exercice",
        value: `0 ${loadUnit} x 5`,
        loadKg: 0,
        reps: 5,
        estimatedOneRepMaxKg: 0,
        confidence: "estimated",
        origin: "manual",
        locked: false
      }
    ]);
  };

  const updateReference = (index: number, patch: Partial<StrengthReference>) => {
    onChange(strengthReferences.map((reference, itemIndex) => (
      itemIndex === index ? { ...reference, ...patch } : reference
    )));
  };

  const updateReferenceSet = (index: number, load: number, reps: number) => {
    const current = strengthReferences[index];
    const next = buildStrengthReferenceFromSet(current.lift, load, reps, loadUnit) ?? {
      ...current,
      value: `${load || 0} ${loadUnit} x ${reps || 1}`,
      loadKg: loadUnit === "kg" ? load : undefined,
      reps: reps || 1,
      estimatedOneRepMaxKg: estimateOneRepMaxFromSet(load, reps, loadUnit),
      confidence: reps === 1 ? "declared" as const : "estimated" as const
    };

    updateReference(index, {
      ...next,
      lift: current.lift,
      note: current.note ?? next.note,
      lastTestedAt: current.lastTestedAt,
      origin: current.origin ?? "manual",
      locked: current.locked ?? false
    });
  };

  const learnedReferences = strengthReferences
    .map((reference, index) => ({ reference, index }))
    .filter((item) => item.reference.origin === "learned");
  const editableReferences = strengthReferences
    .map((reference, index) => ({ reference, index }))
    .filter((item) => item.reference.origin !== "learned");

  return (
    <details className="card-dark group p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Reperes de force</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">
            Renseigne une serie propre, par exemple 100 kg x 5. L&apos;app estime ensuite ton 1RM.
          </p>
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55 group-open:bg-sky/10 group-open:text-sky">
          {strengthReferences.length > 0 ? `${strengthReferences.length} repere(s)` : "Ouvrir"}
        </span>
      </summary>

      <button
        className="mt-4 h-10 rounded-md bg-sky px-3 text-sm font-black text-white transition hover:bg-sky/80"
        onClick={addReference}
        type="button"
      >
        + Repere
      </button>

      {strengthReferences.length === 0 ? (
        <p className="mt-4 rounded-md bg-white/5 p-3 text-sm font-semibold text-white/50">
          Aucun repere renseigne. L&apos;app utilisera une estimation prudente.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {learnedReferences.length > 0 ? (
            <div className="rounded-xl border border-amber/20 bg-amber/5 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-amber">Reperes appris automatiquement</h3>
                  <p className="mt-1 text-xs font-semibold text-white/55">
                    Construits depuis tes seances valides. Verrouille un repere si tu ne veux plus qu&apos;il bouge.
                  </p>
                </div>
                <span className="rounded-md bg-amber/15 px-2 py-1 text-xs font-black text-amber">
                  {learnedReferences.length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {learnedReferences.map(({ reference, index }) => (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3" key={`${reference.lift}-${index}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <ReferenceBadge tone="warn">Appris</ReferenceBadge>
                          <ReferenceBadge tone={reference.locked ? "info" : "muted"}>
                            {reference.locked ? "Verrouille" : "Auto"}
                          </ReferenceBadge>
                        </div>
                        <p className="mt-2 font-black text-white">{reference.lift}</p>
                        <p className="mt-1 text-xs font-semibold text-white/55">
                          {reference.lastTestedAt ? `Mis a jour le ${formatReferenceDate(reference.lastTestedAt)}` : "Date inconnue"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white/45">{reference.value}</p>
                        <p className="mt-1 text-sm font-black text-sky">
                          {formatEstimatedOneRepMax(reference.estimatedOneRepMaxKg)}
                        </p>
                      </div>
                    </div>
                    {reference.note ? (
                      <p className="mt-3 rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-white/65">
                        {reference.note}
                      </p>
                    ) : null}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        className={`h-10 rounded-md border text-xs font-black transition ${
                          reference.locked
                            ? "border-sky/30 bg-sky/15 text-sky"
                            : "border-white/10 bg-white/8 text-white/70"
                        }`}
                        onClick={() => {
                          const nextReferences = strengthReferences.map((item, itemIndex) => (
                            itemIndex === index ? { ...item, locked: !reference.locked } : item
                          ));
                          commitWithEvent(nextReferences, reference, "toggle-lock");
                        }}
                        type="button"
                      >
                        {reference.locked ? "Deverrouiller" : "Verrouiller"}
                      </button>
                      <button
                        className="h-10 rounded-md border border-coral/20 bg-coral/10 text-xs font-black text-coral transition hover:bg-coral/15"
                        onClick={() => {
                          const nextReferences = strengthReferences.filter((_item, itemIndex) => itemIndex !== index);
                          commitWithEvent(nextReferences, reference, "delete");
                        }}
                        type="button"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {editableReferences.length > 0 ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-black text-white">Reperes manuels</h3>
                <p className="mt-1 text-xs font-semibold text-white/55">
                  Ceux-ci viennent de l&apos;onboarding ou de tes reglages manuels.
                </p>
              </div>
              {editableReferences.map(({ reference, index }) => (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3" key={`${reference.lift}-${index}`}>
                  <div className="flex items-center gap-2">
                    <input
                      className="h-11 flex-1 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                      onChange={(event) => updateReference(index, { lift: event.target.value, origin: reference.origin ?? "manual" })}
                      placeholder="Exercice"
                      value={reference.lift}
                    />
                    <button
                      aria-label="Supprimer le repere"
                      className="flex size-11 shrink-0 items-center justify-center rounded-md border border-coral/20 bg-coral/10 font-black text-coral"
                      onClick={() => {
                        const nextReferences = strengthReferences.filter((_item, itemIndex) => itemIndex !== index);
                        commitWithEvent(nextReferences, reference, "delete");
                      }}
                      type="button"
                    >
                      x
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <ReferenceBadge tone={reference.origin === "onboarding" ? "muted" : "info"}>
                      {reference.origin === "onboarding" ? "Onboarding" : "Manuel"}
                    </ReferenceBadge>
                    {reference.locked ? <ReferenceBadge tone="info">Verrouille</ReferenceBadge> : null}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <label>
                      <span className="text-xs font-bold text-white/45">Charge {loadUnit}</span>
                      <input
                        className="mt-1 h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                        inputMode="decimal"
                        onChange={(event) => updateReferenceSet(index, Number(event.target.value), reference.reps ?? 5)}
                        placeholder={`Charge ${loadUnit}`}
                        step={2.5}
                        type="number"
                        value={getDisplayedReferenceLoad(reference, loadUnit)}
                      />
                    </label>
                    <label>
                      <span className="text-xs font-bold text-white/45">Reps</span>
                      <input
                        className="mt-1 h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                        inputMode="numeric"
                        max={12}
                        min={1}
                        onChange={(event) => updateReferenceSet(index, getDisplayedReferenceLoad(reference, loadUnit), Number(event.target.value))}
                        placeholder="Reps"
                        type="number"
                        value={reference.reps ?? 1}
                      />
                    </label>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                    <p className="text-xs font-bold text-white/45">{reference.value}</p>
                    <p className="text-xs font-black text-sky">
                      {formatEstimatedOneRepMax(reference.estimatedOneRepMaxKg)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <select
                      className="h-11 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                      onChange={(event) => updateReference(index, { confidence: event.target.value as StrengthReference["confidence"] })}
                      value={reference.confidence ?? "declared"}
                    >
                      <option value="declared">Declare</option>
                      <option value="estimated">Estime</option>
                      <option value="measured">Mesure</option>
                    </select>
                  </div>
                  <input
                    className="mt-3 h-11 w-full rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                    onChange={(event) => updateReference(index, { note: event.target.value })}
                    placeholder="Note optionnelle"
                    value={reference.note ?? ""}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </details>
  );
}

function getDisplayedReferenceLoad(reference: StrengthReference, loadUnit: "kg" | "lb"): number {
  const loadKg = reference.loadKg ?? reference.estimatedOneRepMaxKg ?? 0;
  if (loadUnit === "lb") return Math.round((loadKg / 0.45359237) * 10) / 10;
  return loadKg;
}

function ReferenceBadge({
  children,
  tone
}: {
  children: string;
  tone: "info" | "muted" | "warn";
}) {
  const toneClass = {
    info: "bg-sky/10 text-sky",
    muted: "bg-white/8 text-white/60",
    warn: "bg-amber/10 text-amber"
  }[tone];

  return <span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase ${toneClass}`}>{children}</span>;
}

function formatReferenceDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
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
        className="mt-1 min-h-20 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
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

function WeightLogSection({
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
  const delta = weightLog.length >= 2
    ? weightLog[0].kg - weightLog[weightLog.length - 1].kg
    : undefined;
  const toGoKg = +(currentWeightKg - targetWeightKg).toFixed(1);

  return (
    <details className="card-dark group p-4">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">Suivi du poids</h2>
          <p className="mt-1 text-sm font-semibold text-white/55">
            Journal rapide du poids actuel, de l&apos;objectif et de la tendance recente.
          </p>
        </div>
        <span className="rounded-md bg-white/8 px-3 py-2 text-xs font-black text-white/55 group-open:bg-sky/10 group-open:text-sky">
          {weightLog.length > 0 ? `${weightLog.length} entree(s)` : "Ouvrir"}
        </span>
      </summary>

      <div className="mt-4 flex gap-2">
        <input
          className="h-12 flex-1 rounded-md border border-white/10 px-3 text-base font-semibold outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
          inputMode="decimal"
          onChange={(e) => setDraftKg(Number(e.target.value))}
          placeholder="kg aujourd'hui"
          step="0.1"
          type="number"
          value={draftKg}
        />
        <button
          className="h-12 rounded-md bg-sky px-4 font-black text-white transition hover:bg-sky/80"
          onClick={() => onLog({ date: today, kg: draftKg })}
          type="button"
        >
          Enregistrer
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-md bg-white/8 p-3 text-center">
          <p className="text-lg font-black text-white">{currentWeightKg} kg</p>
          <p className="mt-1 text-[10px] font-black uppercase text-white/45">Actuel</p>
        </div>
        <div className={`rounded-md p-3 text-center ${toGoKg > 0 ? "bg-amber/10" : "bg-sea/10"}`}>
          <p className={`text-lg font-black ${toGoKg > 0 ? "text-amber" : "text-sea"}`}>
            {toGoKg > 0 ? `-${toGoKg}` : `+${Math.abs(toGoKg)}`} kg
          </p>
          <p className="mt-1 text-[10px] font-black uppercase text-white/45">Vers objectif</p>
        </div>
      </div>

      {delta !== undefined ? (
        <p className={`mt-3 text-sm font-black ${delta > 0 ? "text-sea" : delta < 0 ? "text-coral" : "text-white/55"}`}>
          {delta > 0 ? `−${delta.toFixed(1)} kg depuis le début du suivi` : delta < 0 ? `+${Math.abs(delta).toFixed(1)} kg depuis le début` : "Poids stable"}
        </p>
      ) : null}

      {weightLog.length > 0 ? (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-black uppercase text-white/40">Historique récent</p>
          {weightLog.slice(0, 8).map((entry) => (
            <div className="flex items-center justify-between rounded-md bg-white/5 px-3 py-2" key={entry.date}>
              <span className="text-xs font-semibold text-white/55">
                {new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(new Date(entry.date))}
              </span>
              <span className="font-black text-white">{entry.kg} kg</span>
            </div>
          ))}
        </div>
      ) : null}
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
  const [draftAvatar, setDraftAvatar] = useState(AVATAR_CHOICES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState(AVATAR_CHOICES[0]);

  const submitCreate = () => {
    if (!draftName.trim()) return;
    onCreate(draftName, draftAvatar);
    setDraftName("");
    setDraftAvatar(AVATAR_CHOICES[0]);
    setCreating(false);
  };

  return (
    <section className="card-dark p-4">
      <h2 className="text-xl font-black text-white">Profils</h2>

      <div className="mt-3 space-y-2">
        {profiles.map((profile) => {
          const isActive = profile.id === activeProfileId;
          const isEditing = editingId === profile.id;
          const initial = profile.name.trim().charAt(0).toUpperCase() || "P";

          if (isEditing) {
            return (
              <div className="rounded-xl border border-sky/30 bg-sky/5 p-3" key={profile.id}>
                <div className="flex items-center gap-2">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sky/20 text-sm font-black text-sky">{initial}</span>
                  <input
                    className="h-11 flex-1 rounded-md border border-white/10 bg-white/5 px-3 font-semibold text-white outline-none focus:border-sky focus:ring-2 focus:ring-sky/20"
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Nom du profil"
                    value={editName}
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="h-10 flex-1 rounded-md border border-white/10 bg-white/8 text-sm font-black text-white"
                    onClick={() => setEditingId(null)}
                    type="button"
                  >
                    Annuler
                  </button>
                  <button
                    className="h-10 flex-1 rounded-md bg-sky text-sm font-black text-white"
                    onClick={() => {
                      onRename(profile.id, editName, editAvatar);
                      setEditingId(null);
                    }}
                    type="button"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                isActive
                  ? "border-sky/40 bg-sky/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              key={profile.id}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black text-white">
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-black text-white">{profile.name}</p>
                {isActive ? (
                  <p className="text-xs font-black uppercase text-sky">Profil actif</p>
                ) : null}
              </div>
              {!isActive ? (
                <button
                  className="h-9 shrink-0 rounded-md bg-sky/15 px-3 text-xs font-black text-sky transition hover:bg-sky/25"
                  onClick={() => onSwitch(profile.id)}
                  type="button"
                >
                  Activer
                </button>
              ) : null}
              <button
                aria-label="Modifier"
                className="flex size-9 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10"
                onClick={() => {
                  setEditingId(profile.id);
                  setEditName(profile.name);
                  setEditAvatar(profile.avatar);
                }}
                type="button"
              >
                <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await supabaseAuth.auth.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-sm font-black text-red-400 transition hover:bg-red-500/20"
      disabled={loading}
      onClick={handleLogout}
      type="button"
    >
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
      </svg>
      {loading ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}

function ProfilePhotoUpload({
  name,
  photoUrl,
  onPhotoChange
}: {
  name: string;
  photoUrl?: string;
  onPhotoChange: (dataUrl: string | undefined) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const initials = name.trim().charAt(0).toUpperCase() || "A";

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    try {
      const dataUrl = await fileToCompressedAvatar(file);
      onPhotoChange(dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erreur d'import");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        aria-label="Changer la photo de profil"
        className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-coral/30 bg-coral/15 transition hover:border-coral/60"
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt={name} className="size-full object-cover" src={photoUrl} />
        ) : (
          <span className="text-xl font-black text-coral">{initials}</span>
        )}
        <span className="absolute inset-0 hidden items-center justify-center bg-black/50 text-[10px] font-black uppercase text-white group-hover:flex">
          {photoUrl ? "Changer" : "Photo"}
        </span>
      </button>
      <input
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
        ref={fileInputRef}
        type="file"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white/60">Photo de profil</p>
        <button
          className="mt-1 text-xs font-bold text-sky underline-offset-2 hover:underline"
          onClick={() => fileInputRef.current?.click()}
          type="button"
        >
          {photoUrl ? "Changer la photo" : "Ajouter une photo"}
        </button>
        {photoUrl ? (
          <button
            className="ml-3 text-xs font-bold text-white/40 underline-offset-2 hover:underline"
            onClick={() => onPhotoChange(undefined)}
            type="button"
          >
            Supprimer
          </button>
        ) : null}
        {uploadError ? (
          <p className="mt-1 text-xs text-coral">{uploadError}</p>
        ) : null}
      </div>
    </div>
  );
}
