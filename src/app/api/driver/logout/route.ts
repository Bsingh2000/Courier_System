import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getCurrentDriverSession, getDriverCookieName } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST() {
  const requestId = crypto.randomUUID();
  const session = await getCurrentDriverSession();
  const cookieStore = await cookies();
  cookieStore.set(getDriverCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  await recordAuditEvent({
    requestId,
    entityType: "driver",
    entityId: session?.driverId,
    action: "driver.logout",
    summary: `${session?.name ?? "Driver"} signed out of the driver workspace.`,
    actor: {
      type: "driver",
      id: session?.driverId,
      label: session?.email ?? "unknown-driver",
    },
  }).catch(() => undefined);

  return NextResponse.json({ ok: true });
}
