"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCoachStorage } from "@/lib/storage";
import type { PlannedSession } from "@/types/training";

const weekdayLabels: Record<PlannedSession["weekday"], string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche"
};

export function ProgramPlanner() {
  const { currentProgram, isReady, settings, startSession, todaySession } = useCoachStorage();
  const [selectedId, setSelectedId] = useState(todaySession.id);
  const router = useRouter();
  const selectedSession = useMemo(
    () => currentProgram.find((session) => session.id === selectedId) ?? todaySession,
    [currentProgram, selectedId, todaySession]
  );

  if (!isReady) {
    return <div className="rounded-lg bg-white p-5 font-bold shadow-soft">Chargement...</div>;
  }

  const startSelectedSession = (session: PlannedSession) => {
    startSession(session);
    router.push("/seance");
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 premium-gradient p-5 text-white shadow-soft">
        <p className="text-xs font-black uppercase text-sky">Plan du jour</p>
        <h2 className="athletiq-hero-title mt-2 font-black">{todaySession.title}</h2>
        <p className="mt-3 line-clamp-2 text-sm font-semibold text-white/70">{todaySession.focus}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <HeroTile label="Exos" value={String(todaySession.exercises.length)} />
          <HeroTile label="Temps" value={todaySession.duration} />
          <HeroTile label="Judo" value={isJudoDay(todaySession, settings.judoDays) ? "Oui" : "Non"} />
        </div>

        <div className="mt-4 rounded-lg bg-white/10 p-3">
          <p className="text-xs font-black uppercase text-white/55">Premier bloc</p>
          <p className="mt-1 line-clamp-1 text-xl font-black">
            {todaySession.exercises[0]?.name ?? "Repos"}
            {todaySession.exercises[0]?.plannedLoad ? ` - ${todaySession.exercises[0].plannedLoad}` : ""}
          </p>
          <p className="mt-1 text-sm font-semibold text-white/70">{todaySession.exercises[0]?.target}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            className="h-16 rounded-md border border-white/15 bg-white/10 px-3 text-base font-black text-white"
            onClick={() => setSelectedId(todaySession.id)}
            type="button"
          >
            Detail
          </button>
          <button
            className="h-16 rounded-md premium-action px-3 text-base font-black text-white shadow-sm"
            onClick={() => startSelectedSession(todaySession)}
            type="button"
          >
            Start
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase text-moss">Semaine</p>
          <h2 className="mt-1 text-2xl font-black">Plan d&apos;entrainement</h2>
        </div>
        {currentProgram.map((session) => (
          <ProgramDayCard
            isSelected={session.id === selectedSession.id}
            isToday={session.id === todaySession.id}
            key={session.id}
            onSelect={() => setSelectedId(session.id)}
            session={session}
            showJudo={isJudoDay(session, settings.judoDays)}
          />
        ))}
      </section>

      <SessionDetailCard
        onStart={() => startSelectedSession(selectedSession)}
        session={selectedSession}
        showJudo={isJudoDay(selectedSession, settings.judoDays)}
      />
    </div>
  );
}

function ProgramDayCard({
  isSelected,
  isToday,
  onSelect,
  session,
  showJudo
}: {
  isSelected: boolean;
  isToday: boolean;
  onSelect: () => void;
  session: PlannedSession;
  showJudo: boolean;
}) {
  const main = session.exercises[0];

  return (
    <article className={`rounded-xl border bg-white p-4 shadow-soft ${isSelected ? "border-sky" : "border-black/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2">
            <Badge tone={isToday ? "info" : "muted"}>{isToday ? "Aujourd'hui" : weekdayLabels[session.weekday]}</Badge>
            <Badge tone={getIntensityTone(session.intensity)}>
              {session.intensity}
            </Badge>
            {showJudo ? <Badge tone="warn">Judo</Badge> : null}
            {isCardioSession(session) ? <Badge tone="info">Cardio</Badge> : null}
          </div>
          <h3 className="mt-3 text-xl font-black leading-tight">{session.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink/60">{session.focus}</p>
        </div>
        <span className="shrink-0 rounded-md bg-mist px-3 py-2 text-xs font-black">{session.duration}</span>
      </div>

      {main ? (
        <div className="mt-3 rounded-lg bg-mist p-3">
          <p className="text-xs font-black uppercase text-ink/50">Bloc cle</p>
          <p className="mt-1 line-clamp-1 font-black">
            {main.name}
            {main.plannedLoad ? ` - ${main.plannedLoad}` : ""}
          </p>
          <p className="mt-1 text-sm font-bold text-ink/60">{main.target}</p>
        </div>
      ) : null}

      <button
        className="mt-3 h-14 w-full rounded-md border border-sky/20 bg-sky/10 px-4 text-base font-black text-sky"
        onClick={onSelect}
        type="button"
      >
        Voir
      </button>
    </article>
  );
}

function SessionDetailCard({
  onStart,
  session,
  showJudo
}: {
  onStart: () => void;
  session: PlannedSession;
  showJudo: boolean;
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase text-sky">Detail</p>
          <h2 className="mt-1 text-2xl font-black leading-tight">{session.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink/60">{session.focus}</p>
        </div>
        <span className="rounded-md bg-mist px-3 py-2 text-xs font-black">{session.duration}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone="info">{weekdayLabels[session.weekday]}</Badge>
        <Badge tone={getIntensityTone(session.intensity)}>
          {session.intensity}
        </Badge>
        {showJudo ? <Badge tone="warn">Judo</Badge> : null}
      </div>

      <div className="mt-4 space-y-3">
        {session.exercises.map((exercise, index) => (
          <article className="rounded-lg border border-black/10 bg-mist p-3" key={exercise.id}>
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-sm font-black text-sky">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-black leading-tight">{exercise.name}</h3>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <MiniStat label="Cible" value={exercise.target} />
                  <MiniStat label="Charge" value={exercise.plannedLoad ?? "Libre"} />
                  <MiniStat label="Repos" value={exercise.rest} />
                </div>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-ink/65">{exercise.cue}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        className="mt-4 h-16 w-full rounded-md premium-action px-4 text-base font-black text-white shadow-soft"
        onClick={onStart}
        type="button"
      >
        Commencer
      </button>
    </section>
  );
}

function HeroTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-3 text-center">
      <p className="text-lg font-black leading-tight">{value}</p>
      <p className="mt-1 text-[11px] font-black uppercase text-white/60">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white p-2">
      <p className="text-[10px] font-black uppercase text-ink/50">{label}</p>
      <p className="mt-1 text-xs font-black leading-tight">{value}</p>
    </div>
  );
}

function Badge({ children, tone }: { children: string; tone: "calm" | "force" | "info" | "muted" | "warn" }) {
  const toneClass = {
    calm: "bg-sea/10 text-sea",
    force: "bg-coral/10 text-coral",
    info: "bg-sky/10 text-sky",
    muted: "bg-mist text-ink/60",
    warn: "bg-amber/10 text-amber"
  }[tone];

  return <span className={`rounded-md px-2 py-1 text-xs font-black ${toneClass}`}>{children}</span>;
}

function getIntensityTone(intensity: PlannedSession["intensity"]): "calm" | "force" | "info" {
  if (intensity === "Soutenue") {
    return "force";
  }

  if (intensity.startsWith("L")) {
    return "calm";
  }

  return "info";
}

function isJudoDay(session: PlannedSession, judoDays: PlannedSession["weekday"][]) {
  return judoDays.includes(session.weekday);
}

function isCardioSession(session: PlannedSession) {
  return /cardio|tapis|marche|rameur|stairmaster|intervalles|zone 2/i.test(
    `${session.title} ${session.focus} ${session.exercises.map((exercise) => exercise.name).join(" ")}`
  );
}
