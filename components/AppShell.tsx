import type { ReactNode } from "react";
import { BrandMark } from "@/components/BrandMark";
import { BottomNav } from "@/components/BottomNav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[430px] px-4 pt-4 safe-bottom sm:px-5">
      <header className="app-topbar">
        <BrandMark />
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase text-white/55">
          Coach
        </div>
      </header>
      <main className="mt-4 space-y-4">{children}</main>
      <BottomNav />
    </div>
  );
}
