export function WatchListSection({ items }: { items: string[] }) {
  return (
    <SignalSection
      empty="Aucun signal critique recent."
      items={items}
      limit={6}
      title="A surveiller"
      tone="danger"
    />
  );
}

export function TopProgressionsSection({ items }: { items: string[] }) {
  return (
    <SignalSection
      empty="Pas encore assez de donnees positives."
      items={items}
      limit={3}
      title="Top progressions"
      tone="progress"
    />
  );
}

export function NextTargetsSection({ items }: { items: string[] }) {
  return (
    <SignalSection
      empty="Aucune cible prioritaire."
      items={items}
      limit={6}
      title="Prochaines cibles"
      tone="info"
    />
  );
}

function SignalSection({
  empty,
  items,
  limit,
  title,
  tone
}: {
  empty: string;
  items: string[];
  limit: number;
  title: string;
  tone: "danger" | "info" | "progress";
}) {
  const toneClass = {
    danger: "border-coral/20 bg-coral/10",
    info: "border-sky/20 bg-sky/10",
    progress: "border-amber/20 bg-amber/10"
  }[tone];

  return (
    <section className={`rounded-xl border p-4 shadow-soft ${toneClass}`}>
      <h2 className="text-lg font-black">{title}</h2>
      <div className="mt-3 space-y-2">
        {items.length ? (
          items.slice(0, limit).map((item) => (
            <p className="rounded-md bg-white/80 p-3 text-sm font-bold leading-relaxed text-ink" key={item}>
              {item}
            </p>
          ))
        ) : (
          <p className="rounded-md bg-white/80 p-3 text-sm font-semibold text-ink/60">{empty}</p>
        )}
      </div>
    </section>
  );
}
