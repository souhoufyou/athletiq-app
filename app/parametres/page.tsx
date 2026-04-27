import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { SettingsPanel } from "@/components/SettingsPanel";

export default function SettingsPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="Paramètres" title="Préférences" />
      <SettingsPanel />
    </AppShell>
  );
}
