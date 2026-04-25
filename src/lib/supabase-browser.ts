"use client";

import { createClient } from "@supabase/supabase-js";

let browserSupabaseClient: ReturnType<typeof createClient> | null = null;

export function createSupabaseBrowserClient() {
  if (browserSupabaseClient) {
    return browserSupabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!url || !publishableKey) {
    throw new Error("Supabase browser client is not configured.");
  }

  browserSupabaseClient = createClient(url, publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserSupabaseClient;
}
