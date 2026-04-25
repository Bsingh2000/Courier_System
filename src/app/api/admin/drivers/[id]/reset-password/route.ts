import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { recordAuditEvent, resetDriverPassword } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const result = await resetDriverPassword(id, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "Driver not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "driver",
      entityId: id,
      action: "driver.password_reset_failed",
      summary: `Driver password reset failed: ${message}`,
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
