"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";

type AuthState = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
};

export function useAuth(options?: { redirectTo?: string }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  });

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getSession();
      if (!data?.session) {
        if (options?.redirectTo) {
          router.push(options.redirectTo);
        }
        setState({ user: null, loading: false, isAuthenticated: false });
      } else {
        setState({ user: data.session.user, loading: false, isAuthenticated: true });
      }
    }

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setState({ user: null, loading: false, isAuthenticated: false });
        if (options?.redirectTo) {
          router.push(options.redirectTo);
        }
      } else {
        setState({ user: session.user, loading: false, isAuthenticated: true });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [router, options?.redirectTo]);

  return state;
}

export async function logout() {
  await supabase.auth.signOut();
}
