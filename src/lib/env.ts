const DEMO_EMAIL = "admin@routegrid.local";
const DEMO_PASSWORD = "dispatch123";
const DEMO_SECRET = "routegrid-demo-session-secret-change-me";

export function getAppName() {
  return "RouteGrid Courier";
}

export function getSupabaseUrl() {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseSecretKey() {
  return (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    ""
  );
}

export function getSupabasePublishableKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    getSupabaseSecretKey()
  );
}

export function hasSupabaseConfig() {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey());
}

export function isDemoMode() {
  return !hasSupabaseConfig();
}

export function getAdminEmail() {
  if (process.env.COURIER_ADMIN_EMAIL) {
    return process.env.COURIER_ADMIN_EMAIL;
  }

  return DEMO_EMAIL;
}

export function getAdminPassword() {
  if (process.env.COURIER_ADMIN_PASSWORD) {
    return process.env.COURIER_ADMIN_PASSWORD;
  }

  return DEMO_PASSWORD;
}

export function getSessionSecret() {
  return process.env.SESSION_SECRET ?? DEMO_SECRET;
}
