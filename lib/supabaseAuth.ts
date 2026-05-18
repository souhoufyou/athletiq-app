import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Real Supabase client, used only for authentication (sign up / sign in).
// Data sync still goes through the disabled stub in supabaseClient.ts.
//
// The URL and the anon ("publishable") key are public by design — they ship
// in every client bundle. They are kept here as a fallback so the app builds
// and runs even when the environment variables are not set on the host.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://bbcmipssznlgarbpfaif.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_0eyoOxJQX37Jf45dD55u8g_pDMQKLwb";

let client: SupabaseClient | null = null;

/**
 * Lazily creates the auth client. Created on first use (in the browser) rather
 * than at module load, so it never runs during the build/prerender step.
 */
export function getSupabaseAuth(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

/** Translates common Supabase auth errors into user-facing French messages. */
export function authErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Cet email est déjà utilisé.";
  }
  if (m.includes("password should be at least")) {
    return "Le mot de passe doit faire au moins 6 caractères.";
  }
  if (m.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirme ton email avant de te connecter.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid format")) {
    return "Adresse email invalide.";
  }
  return message;
}
