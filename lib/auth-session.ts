import type { Session } from "@supabase/supabase-js";

import * as Auth from "@/lib/_core/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function persistAuthSession(session: Session | null | undefined): Promise<void> {
  if (!session?.access_token) return;
  await Auth.setSessionToken(session.access_token);
}

/** Restore or refresh Supabase session, then sync access token for API calls. */
export async function syncSessionFromSupabase(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return Auth.getSessionToken();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("[AuthSession] getSession failed:", error.message);
    return Auth.getSessionToken();
  }

  if (data.session?.access_token) {
    await persistAuthSession(data.session);
    return data.session.access_token;
  }

  return Auth.getSessionToken();
}

export async function clearSupabaseSession(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await getSupabase().auth.signOut();
  } catch (err) {
    console.warn("[AuthSession] signOut failed:", err);
  }
}
