import "server-only";

import { createClient } from "@supabase/supabase-js";

import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
  getSupabaseUrl,
} from "@/lib/env";

const authOptions = {
  persistSession: false,
  autoRefreshToken: false,
  detectSessionInUrl: false,
};

export function createSupabaseAdminClient() {
  return createClient(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: authOptions,
  });
}

export function createSupabaseAuthClient() {
  return createClient(getSupabaseUrl(), getSupabasePublishableKey(), {
    auth: authOptions,
  });
}
