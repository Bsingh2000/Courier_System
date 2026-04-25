import { NextResponse } from "next/server";

import {
  requireAdminManagementSession,
  requireAdminSession,
} from "@/lib/auth";
import { recordAuditEvent, resetAdminPassword } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = requireAdminManagementSession(await requireAdminSession());
    const { id } = await context.params;
    const result = await resetAdminPassword(id, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "Admin user was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Password reset failed.";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "admin_account",
      action: "admin_account.password_reset_failed",
      summary: `Admin password reset failed: ${message}`,
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
