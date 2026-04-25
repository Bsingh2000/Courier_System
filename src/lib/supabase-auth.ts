import "server-only";

import type { User } from "@supabase/supabase-js";

import { createSupabaseAdminClient, createSupabaseAuthClient } from "@/lib/supabase";

export type ManagedAccountKind = "admin" | "client" | "driver";

type SupabaseIdentityInput = {
  id: string;
  email: string;
  kind: ManagedAccountKind;
  password?: string;
  createPassword?: string;
  requireExisting?: boolean;
  name?: string;
  contactName?: string;
  businessName?: string;
  phone?: string;
  role?: string;
  status?: string;
  zone?: string;
  currentRun?: string;
};

function normalizeMessage(message?: string) {
  return message?.trim().toLowerCase() ?? "";
}

function buildAppMetadata(input: SupabaseIdentityInput) {
  const metadata: Record<string, string> = {
    routegrid_account_type: input.kind,
  };

  if (input.role) {
    metadata.routegrid_role = input.role;
  }

  if (input.status) {
    metadata.routegrid_status = input.status;
  }

  if (input.zone) {
    metadata.routegrid_zone = input.zone;
  }

  return metadata;
}

function buildUserMetadata(input: SupabaseIdentityInput) {
  const metadata: Record<string, string> = {};

  if (input.name) {
    metadata.name = input.name;
  }

  if (input.contactName) {
    metadata.contact_name = input.contactName;
  }

  if (input.businessName) {
    metadata.business_name = input.businessName;
  }

  if (input.phone) {
    metadata.phone = input.phone;
  }

  if (input.currentRun) {
    metadata.current_run = input.currentRun;
  }

  return metadata;
}

function isAuthUserMissingError(message?: string) {
  const normalized = normalizeMessage(message);

  return normalized.includes("user not found");
}

function isAuthUserConflictError(message?: string) {
  const normalized = normalizeMessage(message);

  return (
    normalized.includes("already been registered") ||
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("duplicate key")
  );
}

function duplicateAuthUserError(email: string) {
  return new Error(
    `Supabase Auth already has a different user for ${email}. Resolve the duplicate auth account first.`,
  );
}

export async function authenticateSupabaseIdentity(
  id: string,
  email: string,
  password: string,
) {
  const supabase = createSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return null;
  }

  try {
    if (data.user.id !== id) {
      throw new Error(`Supabase Auth identity mismatch for ${email}.`);
    }

    return data.user;
  } finally {
    await supabase.auth.signOut().catch(() => undefined);
  }
}

export async function syncSupabaseAuthIdentity(input: SupabaseIdentityInput) {
  const supabase = createSupabaseAdminClient();
  const attributes = {
    email: input.email,
    ...(input.password ? { password: input.password } : {}),
    email_confirm: true,
    app_metadata: buildAppMetadata(input),
    user_metadata: buildUserMetadata(input),
  };

  const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
    input.id,
    attributes,
  );

  if (!updateError) {
    return updated.user;
  }

  if (!isAuthUserMissingError(updateError.message)) {
    throw updateError;
  }

  const createPassword = input.password ?? input.createPassword;

  if (!createPassword) {
    if (input.requireExisting) {
      throw new Error(`Supabase Auth user for ${input.email} is missing.`);
    }

    return null;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    id: input.id,
    email: input.email,
    password: createPassword,
    email_confirm: true,
    app_metadata: buildAppMetadata(input),
    user_metadata: buildUserMetadata(input),
  });

  if (createError) {
    if (isAuthUserConflictError(createError.message)) {
      throw duplicateAuthUserError(input.email);
    }

    throw createError;
  }

  return created.user;
}

export async function sendSupabasePasswordSetupEmail(email: string, redirectTo: string) {
  const supabase = createSupabaseAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    throw error;
  }
}

export async function deleteSupabaseAuthIdentity(id: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.auth.admin.deleteUser(id);

  if (error && !isAuthUserMissingError(error.message)) {
    throw error;
  }
}

export function isSupabaseAuthMissingUserError(error: unknown) {
  return error instanceof Error && isAuthUserMissingError(error.message);
}

export function hasSupabaseAuthIdentity(user: User | null | undefined) {
  return Boolean(user?.id);
}
