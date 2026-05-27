import { createClient } from "@supabase/supabase-js";
import { API_BASE_URL } from "@/constants/oauth";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: API_BASE_URL ? { "x-client-info": "hyphen-app" } : {},
  },
});

