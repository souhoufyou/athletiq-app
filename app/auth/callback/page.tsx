"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { migrateLocalStorageToSupabase, ensureSupabaseProfile } from "@/lib/migrateToSupabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Connexion en cours...");

  useEffect(() => {
    async function handleCallback() {
      // Handle the auth code/hash from Supabase redirect
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }

      // Also handle PKCE code exchange (email confirmation flow)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) {
        setStatus("Migration des données...");
        const user = data.session.user;
        await ensureSupabaseProfile(user.id, user.email || "");
        await migrateLocalStorageToSupabase(user.id);
        router.push("/");
      } else {
        router.push("/auth/login");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">{status}</p>
      </div>
    </div>
  );
}
