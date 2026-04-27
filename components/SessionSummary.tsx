import type { PlannedSession } from "@/types/training";

type SessionSummaryProps = {
  session: PlannedSession;
  completed?: boolean;
};

export function SessionSummary({ completed, session }: SessionSummaryProps) {
  return (
    <section className="rounded-lg border border-black/10 bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase text-sky">{session.scheduleLabel ?? session.focus}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight">{session.title}</h2>
          {session.scheduleLabel ? <p className="mt-1 text-sm font-semibold text-ink/60">{session.focus}</p> : null}
        </div>
        <span className="rounded-md bg-sky/10 px-3 py-2 text-right text-xs font-black text-sky">
          {session.duration}
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-mist p-3">
          <p className="text-xl font-black">{session.exercises.length}</p>
          <p className="text-xs font-semibold text-ink/60">exercices</p>
        </div>
        <div className="rounded-md bg-amber/10 p-3 text-amber">
          <p className="text-xl font-black">{session.intensity}</p>
          <p className="text-xs font-semibold text-ink/60">intensité</p>
        </div>
        <div className={`rounded-md p-3 ${completed ? "bg-sea/10 text-sea" : "bg-mist text-ink"}`}>
          <p className="text-xl font-black">{completed ? "Oui" : "Non"}</p>
          <p className="text-xs font-semibold text-ink/60">validée</p>
        </div>
      </div>
      {session.notes?.length ? (
        <div className="mt-4 rounded-md bg-coral/10 p-3">
          {session.notes.map((note) => (
            <p className="text-sm font-bold text-coral" key={note}>
              {note}
            </p>
          ))}
        </div>
      ) : null}
    </section>
  );
}
