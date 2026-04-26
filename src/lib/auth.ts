import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

import type {
  AdminRole,
  ClientAccountRecord,
  DriverRecord,
  PasswordSetupAccountType,
} from "@/lib/types";
import { getAdminEmail, getAdminPassword, getSessionSecret } from "@/lib/env";

const ADMIN_COOKIE_NAME = "routegrid-admin-session";
const CLIENT_COOKIE_NAME = "routegrid-client-session";
const DRIVER_COOKIE_NAME = "routegrid-driver-session";

export interface AdminSession {
  adminId?: string;
  name: string;
  email: string;
  role: AdminRole;
  source: "account" | "bootstrap";
}

export interface ClientSession {
  clientId: string;
  email: string;
  businessName: string;
}

export interface DriverSession {
  driverId: string;
  email: string;
  name: string;
}

export interface FirstLoginPasswordToken {
  accountId: string;
  email: string;
  accountType: PasswordSetupAccountType;
}

function getSecret() {
  return new TextEncoder().encode(getSessionSecret());
}

export function getAdminCookieName() {
  return ADMIN_COOKIE_NAME;
}

export function getClientCookieName() {
  return CLIENT_COOKIE_NAME;
}

export function getDriverCookieName() {
  return DRIVER_COOKIE_NAME;
}

export function getAdminCredentials() {
  return {
    email: getAdminEmail(),
    password: getAdminPassword(),
  };
}

export async function createAdminSession(session: AdminSession) {
  return new SignJWT({
    adminId: session.adminId,
    name: session.name,
    email: session.email,
    role: session.role,
    source: session.source,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminSession(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<AdminSession>(token, getSecret());
    const { adminId, name, email, role, source } = verified.payload;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      !["owner", "admin", "dispatcher", "viewer"].includes(role) ||
      !["account", "bootstrap"].includes(source)
    ) {
      return null;
    }

    return {
      adminId: typeof adminId === "string" ? adminId : undefined,
      name,
      email,
      role,
      source,
    } satisfies AdminSession;
  } catch {
    return null;
  }
}

export async function getCurrentAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return verifyAdminSession(token);
}

export async function requireAdminSession() {
  const session = await getCurrentAdminSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export function canManageAdminAccounts(session: AdminSession) {
  return session.role === "owner" || session.role === "admin";
}

export function requireAdminManagementSession(session: AdminSession) {
  if (!canManageAdminAccounts(session)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function createClientSession(account: ClientAccountRecord) {
  return new SignJWT({
    clientId: account.id,
    email: account.email,
    businessName: account.businessName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyClientSession(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<{
      clientId: string;
      email: string;
      businessName: string;
    }>(token, getSecret());

    return {
      clientId: verified.payload.clientId,
      email: verified.payload.email,
      businessName: verified.payload.businessName,
    } satisfies ClientSession;
  } catch {
    return null;
  }
}

export async function getCurrentClientSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CLIENT_COOKIE_NAME)?.value;
  return verifyClientSession(token);
}

export async function requireClientSession() {
  const session = await getCurrentClientSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function createDriverSession(driver: DriverRecord) {
  return new SignJWT({
    driverId: driver.id,
    email: driver.email,
    name: driver.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyDriverSession(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<{
      driverId: string;
      email: string;
      name: string;
    }>(token, getSecret());

    return {
      driverId: verified.payload.driverId,
      email: verified.payload.email,
      name: verified.payload.name,
    } satisfies DriverSession;
  } catch {
    return null;
  }
}

export async function getCurrentDriverSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(DRIVER_COOKIE_NAME)?.value;
  return verifyDriverSession(token);
}

export async function requireDriverSession() {
  const session = await getCurrentDriverSession();

  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function createFirstLoginPasswordToken(payload: FirstLoginPasswordToken) {
  return new SignJWT({
    purpose: "first-login-password",
    accountId: payload.accountId,
    email: payload.email,
    accountType: payload.accountType,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getSecret());
}

export async function verifyFirstLoginPasswordToken(token?: string | null) {
  if (!token) {
    return null;
  }

  try {
    const verified = await jwtVerify<{
      purpose: string;
      accountId: string;
      email: string;
      accountType: string;
    }>(token, getSecret());
    const { purpose, accountId, email, accountType } = verified.payload;

    if (
      purpose !== "first-login-password" ||
      typeof accountId !== "string" ||
      typeof email !== "string" ||
      !["admin", "client", "driver"].includes(accountType)
    ) {
      return null;
    }

    return {
      accountId,
      email,
      accountType: accountType as PasswordSetupAccountType,
    } satisfies FirstLoginPasswordToken;
  } catch {
    return null;
  }
}
