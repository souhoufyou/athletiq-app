"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { authErrorMessage, getSupabaseAuth } from "@/lib/supabaseAuth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const { data, error: signUpError } = await getSupabaseAuth().auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        throw new Error(authErrorMessage(signUpError.message));
      }

      // Email confirmation still enabled on the Supabase project: no session yet.
      if (!data.session) {
        setNotice(
          "Compte créé. Vérifie ton email pour confirmer ton inscription, puis connecte-toi."
        );
        setLoading(false);
        return;
      }

      // Set the middleware session cookie, then start the onboarding flow.
      await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      router.push("/welcome");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <BrandLogo />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {notice && <div className="text-sm text-orange-400">{notice}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="font-medium text-orange-500 hover:text-orange-400">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
