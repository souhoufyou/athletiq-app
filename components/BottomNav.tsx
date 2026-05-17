"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Accueil", shortLabel: "Accueil", icon: "home" },
  { href: "/programme", label: "Programme", shortLabel: "Prog.", icon: "program" },
  { href: "/seance", label: "Séance", shortLabel: "Séance", icon: "session" },
  { href: "/performances", label: "Performances", shortLabel: "Perf.", icon: "performance" },
  { href: "/parametres", label: "Paramètres", shortLabel: "Param.", icon: "settings" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto grid w-full max-w-[64rem] grid-cols-5 gap-1 rounded-[1.6rem] border border-white/10 bg-[#090a0d]/94 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.62)] backdrop-blur-xl">
        {items.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-[3.85rem] flex-col items-center justify-center rounded-[1.2rem] px-0.5 text-[9px] font-black transition ${
                isActive
                  ? "bg-gradient-to-b from-[#ff7a18] to-[#ff4d00] text-white shadow-[0_10px_26px_rgba(255,90,0,0.26)]"
                  : "text-white/45 hover:bg-white/5 hover:text-white/75"
              }`}
              href={item.href}
              key={item.href}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-sm font-black leading-none ${
                  isActive ? "bg-black/20 text-white" : "bg-white/8 text-white/50"
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
