import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SessionRunner } from "@/components/SessionRunner";

export default function SessionPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Mode guidé" title="Entraînement" />
      <SessionRunner />
    </AppShell>
  );
}
