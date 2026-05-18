import { createClient } from "@supabase/supabase-js";

// Real Supabase client, used only for authentication (sign up / sign in).
// Data sync still goes through the disabled stub in supabaseClient.ts.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

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
