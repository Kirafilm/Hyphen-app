import { useEffect } from "react";

import { clearSupabaseSession, persistAuthSession, syncSessionFromSupabase } from "@/lib/auth-session";
import * as Auth from "@/lib/_core/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

/** Keeps Supabase refresh tokens in storage and mirrors access tokens for the API client. */
export function AuthSessionBootstrap() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    void syncSessionFromSupabase();

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        void Auth.removeSessionToken();
        void Auth.clearUserInfo();
        return;
      }
      if (session) {
        void persistAuthSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}

export { clearSupabaseSession };
