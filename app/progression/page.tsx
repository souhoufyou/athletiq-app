import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProgressionDashboard } from "@/components/ProgressionDashboard";

export default function ProgressionPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Progression" title="Suivi" />
      <ProgressionDashboard />
    </AppShell>
  );
}
