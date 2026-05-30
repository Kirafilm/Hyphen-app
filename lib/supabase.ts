import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { API_BASE_URL } from "@/constants/oauth";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let client: SupabaseClient | null = null;

function createSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase 未設定。請在 EAS 加入 EXPO_PUBLIC_SUPABASE_URL 與 EXPO_PUBLIC_SUPABASE_ANON_KEY 後重新 build。",
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: API_BASE_URL ? { "x-client-info": "hyphen-app" } : {},
    },
  });
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createSupabaseClient();
  }
  return client;
}

/** @deprecated Prefer getSupabase() so missing env fails gracefully instead of at import time. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabase() as object, prop, receiver);
  },
});
