"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useCoachStorage } from "@/lib/storage";

export function AppShell({ children }: { children: ReactNode }) {
  const { isReady, isOnboardingDone } = useCoachStorage();
  const router = useRouter();
  const pathname = usePathname();
  // AppHeader is hidden everywhere: Dashboard has its own integrated header,
  // other pages have their own internal headers.
  const showHeader = false;
  void pathname;

  useEffect(() => {
    if (isReady && !isOnboardingDone) {
      router.replace("/onboarding");
    }
  }, [isReady, isOnboardingDone, router]);

  if (!isReady) {
    return (
      <div className="app-shell mx-auto flex min-h-screen w-full max-w-[96rem] items-center justify-center px-4 safe-bottom sm:px-6 lg:px-8">
        <div className="card-dark w-full max-w-md p-6 text-center">
          <p className="text-sm font-black uppercase text-sky">Chargement</p>
          <h1 className="mt-3 text-2xl font-black text-white">On remet ton espace en place</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
            L&apos;application recharge ton profil et ton programme.
          </p>
        </div>
      </div>
    );
  }

  if (!isOnboardingDone) {
    return (
      <div className="app-shell mx-auto flex min-h-screen w-full max-w-[96rem] items-center justify-center px-4 safe-bottom sm:px-6 lg:px-8">
        <div className="card-dark w-full max-w-md p-6 text-center">
          <p className="text-sm font-black uppercase text-sky">Configuration</p>
          <h1 className="mt-3 text-2xl font-black text-white">On t&apos;emmene vers l&apos;onboarding</h1>
          <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
            Ton profil n&apos;est pas encore finalise sur cette session. Si la redirection ne part pas toute seule,
            ouvre directement la configuration initiale.
          </p>
          <Link
            className="mt-5 inline-flex h-12 items-center justify-center rounded-md premium-action px-5 font-black text-white"
            href="/onboarding"
          >
            Ouvrir l&apos;onboarding
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell mx-auto min-h-screen w-full max-w-[96rem] px-4 safe-bottom safe-top sm:px-6 lg:px-8">
      {showHeader ? <AppHeader /> : null}
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  );
}
