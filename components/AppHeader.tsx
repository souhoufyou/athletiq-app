"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { formatLongDate } from "@/lib/date";
import { useCoachStorage } from "@/lib/storage";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bonjour";
  if (hour >= 12 && hour < 18) return "Bon apres-midi";
  return "Bonsoir";
}

const pageTitles: Record<string, string> = {
  "/": "",
  "/programme": "Programme",
  "/seance": "Seance",
  "/performances": "Performances",
  "/historique": "Historique",
  "/parametres": "Parametres",
  "/progression": "Progression"
};

export function AppHeader() {
  const pathname = usePathname();
  const { settings, isReady } = useCoachStorage();
  const pageTitle = pageTitles[pathname] ?? "";
  const athleteName = isReady ? settings.athleteName : undefined;
  const isHome = pathname === "/";

  return (
    <header className="app-header">
      <div className="flex items-center justify-between gap-3">
        <Link aria-label="Accueil AthletIQ IA" className="min-w-0" href="/">
          <BrandLogo className="h-9" priority variant="wordmark" />
        </Link>

        <Link aria-label="Parametres" className="app-header-settings" href="/parametres">
          <svg className="size-4" fill="none" viewBox="0 0 24 24">
            <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" stroke="currentColor" strokeWidth="2" />
            <path
              d="M12 3v2M12 19v2M4.2 6.2l1.4 1.4M18.4 16.4l1.4 1.4M3 12h2M19 12h2M4.2 17.8l1.4-1.4M18.4 7.6l1.4-1.4"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
            />
          </svg>
        </Link>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase text-white/35">Entraine. Progresse. Depasse-toi.</p>
          {pageTitle ? (
            <p className="mt-0.5 text-xl font-black leading-tight text-white">{pageTitle}</p>
          ) : (
            <p className="mt-0.5 text-xl font-black leading-tight text-white">
              {athleteName ? `${getGreeting()}, ${athleteName}` : "Dashboard"}
            </p>
          )}
        </div>
        {isHome ? (
          <p className="shrink-0 text-right text-[11px] font-semibold capitalize leading-tight text-white/40">
            {formatLongDate()}
          </p>
        ) : null}
      </div>
    </header>
  );
}
