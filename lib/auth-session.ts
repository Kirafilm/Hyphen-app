import type { Session } from "@supabase/supabase-js";

import * as Auth from "@/lib/_core/auth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function persistAuthSession(session: Session | null | undefined): Promise<void> {
  if (!session?.access_token) return;
  await Auth.setSessionToken(session.access_token);
}

/** Ask Supabase to refresh the access token using the stored refresh token. */
export async function refreshSupabaseSession(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return Auth.getSessionToken();
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.warn("[AuthSession] refreshSession failed:", error.message);
    return null;
  }

  if (data.session?.access_token) {
    await persistAuthSession(data.session);
    return data.session.access_token;
  }

  return null;
}

/** Restore or refresh Supabase session, then sync access token for API calls. */
export async function syncSessionFromSupabase(options?: { forceRefresh?: boolean }): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return Auth.getSessionToken();
  }

  if (options?.forceRefresh) {
    const refreshed = await refreshSupabaseSession();
    if (refreshed) return refreshed;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.warn("[AuthSession] getSession failed:", error.message);
    return refreshSupabaseSession();
  }

  if (data.session?.access_token) {
    const expiresAt = data.session.expires_at ?? 0;
    const expiresSoon = expiresAt > 0 && expiresAt * 1000 < Date.now() + 5 * 60 * 1000;
    if (expiresSoon) {
      const refreshed = await refreshSupabaseSession();
      if (refreshed) return refreshed;
    }
    await persistAuthSession(data.session);
    return data.session.access_token;
  }

  return refreshSupabaseSession();
}

export async function clearSupabaseSession(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await getSupabase().auth.signOut();
  } catch (err) {
    console.warn("[AuthSession] signOut failed:", err);
  }
}
