import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getClientCookieName, getCurrentClientSession } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST() {
  const requestId = crypto.randomUUID();
  const session = await getCurrentClientSession();
  const cookieStore = await cookies();
  cookieStore.set(getClientCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  await recordAuditEvent({
    requestId,
    entityType: "client_account",
    entityId: session?.clientId,
    action: "client.logout",
    summary: `${session?.businessName ?? "Client"} signed out of the client portal.`,
    actor: {
      type: "client",
      id: session?.clientId,
      label: session?.email ?? "unknown-client",
    },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
