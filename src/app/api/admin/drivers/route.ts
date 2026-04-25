import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { createDriverAccount, recordAuditEvent } from "@/lib/repository";
import { driverUpsertSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = driverUpsertSchema.parse(await request.json());
    const result = await createDriverAccount(payload, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error, "Driver creation failed.");
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "driver",
      action: "driver.create_failed",
      summary: `Driver creation failed: ${message}`,
      actor: {
        type: "admin",
        label: "unknown-admin",
      },
      outcome: "error",
      metadata: {
        message,
      },
    }).catch(() => undefined);

    return NextResponse.json({ ok: false, message }, { status });
  }
}
