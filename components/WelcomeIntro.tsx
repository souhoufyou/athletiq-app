"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { markWelcomeSeen } from "@/lib/welcomeState";

type Slide = {
  key: string;
  badge: string;
  title: string;
  body: string;
  visual: "logo" | "steps" | "pillars" | "go";
};

const SLIDES: Slide[] = [
  {
    key: "welcome",
    badge: "Bienvenue",
    title: "On est contents que tu sois là.",
    body: "On a créé AthletIQ parce qu'on en avait marre des applis de muscu qui te balancent un programme générique et te laissent te débrouiller. Ici, tout s'adapte à toi — ton niveau, tes contraintes, ta progression. C'est ton entraînement, pas celui de quelqu'un d'autre.",
    visual: "logo"
  },
  {
    key: "how",
    badge: "Comment ça marche",
    title: "Pas de prise de tête.",
    body: "Tu réponds à quelques questions sur toi, tes objectifs, ton emploi du temps. À partir de là, on te génère un vrai programme structuré. Quand tu arrives à la salle, tu lances ta séance et on te guide série par série, exercice par exercice. Tu n'as qu'à suivre.",
    visual: "steps"
  },
  {
    key: "why",
    badge: "Pourquoi AthletIQ",
    title: "Un coach qui progresse avec toi.",
    body: "À chaque séance, l'app apprend. Elle ajuste tes charges, tes volumes, ta récupération. Si t'as mal dormi, si t'as un poignet fragile, si t'as fait du judo la veille — elle le sait et elle s'adapte. Pas de formule magique, juste de la logique et de l'attention à ce que tu vis vraiment.",
    visual: "pillars"
  },
  {
    key: "go",
    badge: "On y va",
    title: "Ta première séance t'attend.",
    body: "Dans deux minutes, ta configuration est faite et ton programme est prêt. Et à chaque entraînement, il deviendra un peu plus le tien. On y va ?",
    visual: "go"
  }
];

export function WelcomeIntro() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const isLast = activeIndex === SLIDES.length - 1;

  // Sync active index when user swipes
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const width = track.clientWidth;
        if (!width) return;
        const index = Math.round(track.scrollLeft / width);
        setActiveIndex(Math.max(0, Math.min(SLIDES.length - 1, index)));
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const goToSlide = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
  };

  const handleSkipOrFinish = () => {
    markWelcomeSeen();
    router.replace("/onboarding");
  };

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col bg-ink text-white">
      {/* Top bar */}
      <div className="flex items-center justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <BrandLogo className="h-9" variant="wordmark" />
        {!isLast ? (
          <button
            className="text-xs font-black uppercase tracking-wide text-white/55 transition hover:text-white"
            onClick={handleSkipOrFinish}
            type="button"
          >
            Passer
          </button>
        ) : (
          <span className="w-12" />
        )}
      </div>

      {/* Slides carousel */}
      <div
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        ref={trackRef}
        style={{ scrollbarWidth: "none" }}
      >
        {SLIDES.map((slide) => (
          <div
            className="flex w-full shrink-0 snap-center flex-col items-center justify-center px-6 py-8 text-center"
            key={slide.key}
          >
            <SlideVisual visual={slide.visual} />
            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.32em] text-coral">
              {slide.badge}
            </p>
            <h1 className="mt-3 max-w-md text-3xl font-black leading-tight sm:text-4xl">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-sm text-base font-semibold leading-relaxed text-white/70">
              {slide.body}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-4 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((slide, index) => (
            <button
              aria-label={`Aller au slide ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? "w-8 bg-coral" : "w-2 bg-white/25"
              }`}
              key={slide.key}
              onClick={() => goToSlide(index)}
              type="button"
            />
          ))}
        </div>

        {/* CTA */}
        <button
          className="session-cta-primary w-full max-w-md"
          onClick={isLast ? handleSkipOrFinish : () => goToSlide(activeIndex + 1)}
          type="button"
        >
          {isLast ? "Commencer ma configuration" : "Suivant"}
        </button>
      </div>
    </div>
  );
}

function SlideVisual({ visual }: { visual: Slide["visual"] }) {
  if (visual === "logo") {
    return (
      <div className="relative flex size-44 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-coral/20 blur-3xl" />
        <div className="relative flex size-32 items-center justify-center rounded-3xl border-2 border-coral/40 bg-gradient-to-br from-coral/30 to-coral/10 shadow-[0_18px_50px_rgba(255,90,0,0.4)]">
          <BrandLogo className="size-20" variant="icon" />
        </div>
      </div>
    );
  }

  if (visual === "steps") {
    return (
      <div className="flex flex-col gap-3">
        {[
          { label: "Questionnaire", color: "coral", icon: "?" },
          { label: "Programme", color: "sky", icon: "≡" },
          { label: "Séance guidée", color: "sea", icon: "▶" }
        ].map((step, index) => (
          <div className="flex items-center gap-3" key={step.label}>
            <span
              className={`flex size-12 items-center justify-center rounded-2xl border-2 text-xl font-black ${
                step.color === "coral"
                  ? "border-coral/40 bg-coral/15 text-coral"
                  : step.color === "sky"
                    ? "border-sky/40 bg-sky/15 text-sky"
                    : "border-sea/40 bg-sea/15 text-sea"
              }`}
            >
              {step.icon}
            </span>
            <span className="text-sm font-black text-white/85">
              {index + 1}. {step.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (visual === "pillars") {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Adaptatif", icon: "⚡" },
          { label: "Simple", icon: "✓" },
          { label: "Premium", icon: "★" }
        ].map((pillar) => (
          <div
            className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4"
            key={pillar.label}
          >
            <span className="text-2xl">{pillar.icon}</span>
            <span className="text-[11px] font-black uppercase tracking-wide text-white/85">
              {pillar.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // "go"
  return (
    <div className="relative flex size-40 items-center justify-center">
      <div className="absolute inset-0 animate-pulse rounded-full bg-coral/20 blur-3xl" />
      <div
        className="relative flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-coral to-[#ff4d00] text-white"
        style={{ boxShadow: "0 18px 50px rgba(255, 90, 0, 0.5)" }}
      >
        <svg className="size-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    </div>
  );
}
