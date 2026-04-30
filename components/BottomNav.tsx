"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Accueil", shortLabel: "Accueil", icon: "home" },
  { href: "/programme", label: "Programme", shortLabel: "Prog.", icon: "program" },
  { href: "/seance", label: "Séance", shortLabel: "Séance", icon: "session" },
  { href: "/performances", label: "Performances", shortLabel: "Perf.", icon: "performance" },
  { href: "/historique", label: "Historique", shortLabel: "Hist.", icon: "history" },
  { href: "/parametres", label: "Paramètres", shortLabel: "Param.", icon: "settings" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-white/95 px-2 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 shadow-soft backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[3.75rem] flex-col items-center justify-center rounded-lg px-0.5 text-[9px] font-black transition ${
                isActive ? "text-sky" : "text-white/50 hover:bg-white/5"
              }`}
              href={item.href}
              key={item.href}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-sm font-black leading-none ${
                  isActive ? "bg-sky/10 text-sky" : "bg-white/8 text-white/50"
                }`}
                aria-hidden="true"
              >
                <NavIcon name={item.icon} />
              </span>
              <span className="mt-1 max-w-full text-center leading-none">{item.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function NavIcon({ name }: { name: string }) {
  if (name === "home") {
    return (
      <svg className="size-4" fill="none" viewBox="0 0 24 24">
        <path d="M4 11.5 12 5l8 6.5V20h-5v-5H9v5H4v-8.5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "program") {
    return (
      <svg className="size-4" fill="none" viewBox="0 0 24 24">
        <path d="M7 6h12M7 12h12M7 18h12" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    );
  }

  if (name === "session") {
    return (
      <svg className="size-4" fill="none" viewBox="0 0 24 24">
        <path d="M4 12h16M7 8v8M17 8v8M3 10v4M21 10v4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "performance") {
    return (
      <svg className="size-4" fill="none" viewBox="0 0 24 24">
        <path d="M5 19V9M12 19V5M19 19v-7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "history") {
    return (
      <svg className="size-4" fill="none" viewBox="0 0 24 24">
        <path d="M7 5h10v14H7V5Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M10 9h4M10 13h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3v2M12 19v2M4.2 6.2l1.4 1.4M18.4 16.4l1.4 1.4M3 12h2M19 12h2M4.2 17.8l1.4-1.4M18.4 7.6l1.4-1.4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}
