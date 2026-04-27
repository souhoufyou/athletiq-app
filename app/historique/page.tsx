import { AppShell } from "@/components/AppShell";
import { HistoryList } from "@/components/HistoryList";
import { PageHeader } from "@/components/PageHeader";

export default function HistoryPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Historique" title="Séances validées" />
      <HistoryList />
    </AppShell>
  );
}
