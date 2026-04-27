import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageHeader } from "@/components/PageHeader";
import { PerformanceDashboard } from "@/components/PerformanceDashboard";

export default function PerformancesPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Tableau d'athlete" title="Mes performances" />
      <ErrorBoundary>
        <PerformanceDashboard />
      </ErrorBoundary>
    </AppShell>
  );
}
