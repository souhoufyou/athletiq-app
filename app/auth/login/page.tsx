"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { signInWithEmail, signUpWithEmail, supabase } from "@/lib/supabaseClient";

import { migrateLocalStorageToSupabase, ensureSupabaseProfile } from "@/lib/migrateToSupabase";
import { isWelcomeSeen } from "@/lib/welcomeState";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [prenom, setPrenom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handlePostLogin(destination: string) {
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      const user = data.session.user;
      await ensureSupabaseProfile(user.id, user.email || "");
      await migrateLocalStorageToSupabase(user.id);
    }
    router.push(destination);
  }

  async function handleSignIn() {
    setLoading(true);
    setError("");
    setSuccess("");
    const { error: err } = await signInWithEmail(email, password);
    if (err) {
      setError(err.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : err.message);
    } else {
      const destination = isWelcomeSeen() ? "/" : "/welcome";
      await handlePostLogin(destination);
    }
    setLoading(false);
  }

  async function handleSignUp() {
    setLoading(true);
    setError("");
    setSuccess("");

    if (!prenom.trim()) {
      setError("Le prénom est requis");
      setLoading(false);
      return;
    }

    const { data: signUpData, error: err } = await signUpWithEmail(email, password, prenom.trim());
    if (err) {
      setError(err.message);
    } else if (signUpData?.session) {
      // Save prénom in localStorage so onboarding pre-fills it
      try {
        const settingsKey = "coach-adaptatif:p:default:settings";
        const existing = window.localStorage.getItem(settingsKey);
        const settings = existing ? JSON.parse(existing) : {};
        settings.athleteName = prenom.trim();
        window.localStorage.setItem(settingsKey, JSON.stringify(settings));
      } catch { /* ignore */ }

      // Reset welcome flag so carousel shows
      try {
        window.localStorage.removeItem("coach-adaptatif:welcome-seen");
      } catch { /* ignore */ }

      await handlePostLogin("/welcome");
    } else {
      setSuccess("Un email de confirmation t'a été envoyé. Vérifie ta boîte mail.");
    }
    setLoading(false);
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center px-5 py-12">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="relative flex size-24 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-coral/20 blur-3xl" />
          <div className="relative flex size-20 items-center justify-center rounded-2xl border-2 border-coral/40 bg-gradient-to-br from-coral/30 to-coral/10 shadow-[0_18px_50px_rgba(255,90,0,0.4)]">
            <BrandLogo className="size-12" variant="icon" />
          </div>
        </div>
        <h1 className="mt-5 text-3xl font-black text-white">
          {mode === "signin" ? "Content de te revoir." : "Bienvenue sur AthletIQ."}
        </h1>
        <p className="mt-2 text-center text-sm font-semibold text-white/55">
          {mode === "signin"
            ? "Connecte-toi pour retrouver tes données."
            : "Crée ton compte pour commencer à t'entraîner."}
        </p>
      </div>

      {/* Card */}
      <div className="card-dark w-full max-w-md p-6">
        <div className="space-y-4">
          {/* Prénom (signup only) */}
          {mode === "signup" && (
            <label className="block">
              <span className="text-xs font-black uppercase tracking-wide text-white/55">Prénom</span>
              <input
                type="text"
                placeholder="Ton prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 font-semibold text-white placeholder-white/30 outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/20"
              />
            </label>
          )}

          {/* Email */}
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-white/55">Email</span>
            <input
              type="email"
              placeholder="ton@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 font-semibold text-white placeholder-white/30 outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/20"
            />
          </label>

          {/* Password */}
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-white/55">Mot de passe</span>
            <input
              type="password"
              placeholder={mode === "signup" ? "6 caractères minimum" : "••••••••"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 font-semibold text-white placeholder-white/30 outline-none focus:border-coral/50 focus:ring-2 focus:ring-coral/20"
            />
          </label>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-coral/20 bg-coral/10 px-4 py-2.5">
              <p className="text-sm font-semibold text-coral">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="rounded-lg border border-sea/20 bg-sea/10 px-4 py-2.5">
              <p className="text-sm font-semibold text-sea">{success}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={mode === "signin" ? handleSignIn : handleSignUp}
            disabled={loading || !email || !password || (mode === "signup" && !prenom.trim())}
            className="session-cta-primary mt-2 w-full disabled:opacity-40"
            type="button"
          >
            {loading
              ? "Chargement..."
              : mode === "signin"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </div>
      </div>

      {/* Toggle mode */}
      <p className="mt-6 text-center text-sm font-semibold text-white/55">
        {mode === "signin" ? (
          <>
            Pas encore inscrit ?{" "}
            <button
              className="font-black text-coral transition hover:text-coral/80"
              onClick={() => { setMode("signup"); setError(""); setSuccess(""); }}
              type="button"
            >
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <button
              className="font-black text-coral transition hover:text-coral/80"
              onClick={() => { setMode("signin"); setError(""); setSuccess(""); }}
              type="button"
            >
              Se connecter
            </button>
          </>
        )}
      </p>
    </div>
  );
}
