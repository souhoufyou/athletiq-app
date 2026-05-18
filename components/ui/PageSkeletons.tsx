import { Skeleton } from "@/components/ui/Skeleton";

const cardBox = "rounded-2xl border border-white/8 bg-white/4";

function StatusWrapper({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div aria-busy="true" className="space-y-4" role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <StatusWrapper label="Chargement du tableau de bord">
      {/* Header: logo + theme toggle */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="rounded-lg" height={40} variant="card" width={132} />
        <Skeleton className="rounded-xl" height={40} variant="card" width={40} />
      </div>

      {/* Profile header */}
      <div className={`flex items-center gap-3 p-3 ${cardBox}`}>
        <Skeleton className="shrink-0" height={48} variant="circle" width={48} />
        <div className="flex-1 space-y-2">
          <Skeleton height={16} width="55%" />
          <Skeleton height={11} width="72%" />
        </div>
        <Skeleton className="shrink-0 rounded-full" height={24} variant="card" width={72} />
      </div>

      {/* Dynamic hero insight */}
      <div className={`flex items-center gap-3 p-4 ${cardBox}`}>
        <Skeleton className="shrink-0 rounded-xl" height={40} variant="card" width={40} />
        <div className="flex-1 space-y-2">
          <Skeleton height={13} width="45%" />
          <Skeleton height={11} width="82%" />
        </div>
      </div>

      {/* Today session card */}
      <div className="overflow-hidden rounded-[1.75rem] border border-white/8 bg-white/4">
        <Skeleton height={176} variant="card" />
        <div className="grid grid-cols-3 gap-2 p-5 pt-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="rounded-xl" height={56} key={index} variant="card" />
          ))}
        </div>
        <div className="space-y-3 px-5 pb-5">
          <Skeleton className="rounded-xl" height={68} variant="card" />
          <Skeleton className="rounded-xl" height={56} variant="card" />
        </div>
      </div>

      {/* Week timeline */}
      <div className={`p-4 ${cardBox}`}>
        <Skeleton className="mb-3" height={11} width="42%" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton className="rounded-xl" height={52} key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* Recent sessions bar */}
      <Skeleton className="rounded-2xl" height={56} variant="card" />
    </StatusWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PERFORMANCE DASHBOARD
// ─────────────────────────────────────────────────────────────────────────

export function PerformanceSkeleton() {
  return (
    <StatusWrapper label="Chargement des performances">
      {/* Hero "Repères clés" */}
      <div className="rounded-[28px] border border-white/10 bg-white/4 p-5">
        <Skeleton height={11} width="38%" />
        <Skeleton className="mt-3" height={26} width="55%" />
        <Skeleton className="mt-3" height={12} width="46%" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="rounded-md" height={72} key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* Goals section */}
      <div className="rounded-xl border border-white/10 bg-white/4 p-4">
        <Skeleton height={16} width="44%" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton className="rounded-md" height={44} key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* Signal sections */}
      {Array.from({ length: 2 }).map((_, sectionIndex) => (
        <div className="rounded-xl border border-white/10 bg-white/4 p-4" key={sectionIndex}>
          <Skeleton height={16} width="38%" />
          <div className="mt-3 space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton className="rounded-md" height={44} key={index} variant="card" />
            ))}
          </div>
        </div>
      ))}

      {/* Performance cards */}
      {Array.from({ length: 2 }).map((_, cardIndex) => (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-4" key={cardIndex}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton height={22} width="64%" />
              <Skeleton height={12} width="48%" />
            </div>
            <Skeleton className="shrink-0 rounded-md" height={32} variant="card" width={84} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="rounded-lg" height={88} key={index} variant="card" />
            ))}
          </div>
        </div>
      ))}
    </StatusWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// HISTORY LIST
// ─────────────────────────────────────────────────────────────────────────

export function HistorySkeleton() {
  return (
    <StatusWrapper label="Chargement de l'historique">
      {/* Hero header */}
      <div className="rounded-[28px] border border-white/10 bg-white/4 p-5">
        <Skeleton height={11} width="32%" />
        <Skeleton className="mt-3" height={26} width="62%" />
        <Skeleton className="mt-3" height={12} width="50%" />
        <div className="mt-5 grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="rounded-2xl" height={56} key={index} variant="card" />
          ))}
        </div>
      </div>

      {/* History rows */}
      {Array.from({ length: 4 }).map((_, rowIndex) => (
        <div
          className="overflow-hidden rounded-[24px] border border-white/10 bg-white/4 p-4 pl-5"
          key={rowIndex}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton height={11} width="38%" />
              <Skeleton height={18} width="66%" />
              <Skeleton height={11} width="52%" />
              <div className="grid grid-cols-4 gap-2 pt-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton className="rounded-md" height={44} key={index} variant="card" />
                ))}
              </div>
            </div>
            <Skeleton className="shrink-0 rounded-md" height={32} variant="card" width={40} />
          </div>
          <Skeleton className="mt-4 rounded-md" height={56} variant="card" />
          <Skeleton className="mt-3 rounded-md" height={40} variant="card" />
        </div>
      ))}
    </StatusWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// GENERIC (other routes)
// ─────────────────────────────────────────────────────────────────────────

export function GenericPageSkeleton() {
  return (
    <StatusWrapper label="Chargement">
      <div className="rounded-[28px] border border-white/10 bg-white/4 p-5">
        <Skeleton height={11} width="34%" />
        <Skeleton className="mt-3" height={26} width="58%" />
        <Skeleton className="mt-3" height={12} width="48%" />
      </div>
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton className="rounded-2xl" height={120} key={index} variant="card" />
      ))}
    </StatusWrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// ROUTE DISPATCHER
// ─────────────────────────────────────────────────────────────────────────

export function RouteSkeleton({ pathname }: { pathname: string }) {
  if (pathname === "/") return <DashboardSkeleton />;
  if (pathname.startsWith("/performances")) return <PerformanceSkeleton />;
  if (pathname.startsWith("/historique")) return <HistorySkeleton />;
  return <GenericPageSkeleton />;
}
