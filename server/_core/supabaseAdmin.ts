import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { ENV } from "./env";

let adminClient: SupabaseClient | null = null;

export function isSupabaseAdminConfigured() {
  return Boolean(ENV.supabaseUrl && ENV.supabaseServiceRoleKey);
}

function adminApiKey() {
  return ENV.supabaseServiceRoleKey;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseAdminConfigured()) return null;
  if (!adminClient) {
    adminClient = createClient(ENV.supabaseUrl, adminApiKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export async function deleteSupabaseAuthUser(authUserId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 未設定，無法刪除登入帳戶。");
  }
  const { error } = await admin.auth.admin.deleteUser(authUserId);
  if (error) throw error;
}
