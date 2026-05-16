"use client";

import { useAuth } from "@/lib/useAuth";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";

export default function DashboardPage() {
  const { loading, isAuthenticated } = useAuth({ redirectTo: "/auth/login" });

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}
