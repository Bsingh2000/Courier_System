import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getAdminCookieName, getCurrentAdminSession } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST() {
  const requestId = crypto.randomUUID();
  const session = await getCurrentAdminSession();
  const cookieStore = await cookies();
  cookieStore.set(getAdminCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  await recordAuditEvent({
    requestId,
    entityType: "auth",
    action: "admin.logout",
    summary: `${session?.name ?? session?.email ?? "Admin"} signed out.`,
    actor: {
      type: "admin",
      id: session?.adminId,
      label: session?.email ?? "unknown-admin",
    },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
