export function MainGoalsSection({ targetWeight }: { targetWeight: number }) {
  const goals = [
    "Developpe couche court terme : 100 kg x 5 x 5 propre",
    "Developpe couche 12 semaines : 130-135 kg x1 si progression bonne",
    `Objectif poids : ${targetWeight || 84} kg environ`,
    "Objectif cardio : etre moins essouffle et mieux recuperer",
    "Objectif judo : ameliorer souffle, grip et recuperation"
  ];

  return (
    <section className="rounded-xl border border-sky/20 bg-sky/10 p-4 shadow-soft">
      <h2 className="text-lg font-black">Objectifs principaux</h2>
      <div className="mt-3 space-y-2">
        {goals.map((goal) => (
          <p className="rounded-md bg-white/80 p-3 text-sm font-bold leading-relaxed text-ink" key={goal}>
            {goal}
          </p>
        ))}
      </div>
    </section>
  );
}
