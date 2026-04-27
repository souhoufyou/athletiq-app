import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { ProgramPlanner } from "@/components/ProgramPlanner";

export default function ProgrammePage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Planning sportif" title="Programme" />
      <ProgramPlanner />
    </AppShell>
  );
}
