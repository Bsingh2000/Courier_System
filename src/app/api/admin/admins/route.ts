import { NextResponse } from "next/server";

import {
  requireAdminManagementSession,
  requireAdminSession,
} from "@/lib/auth";
import { createAdminAccount, recordAuditEvent } from "@/lib/repository";
import { adminAccountCreateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = requireAdminManagementSession(await requireAdminSession());
    const payload = adminAccountCreateSchema.parse(await request.json());
    const result = await createAdminAccount(payload, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin creation failed.";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "admin_account",
      action: "admin_account.create_failed",
      summary: `Admin creation failed: ${message}`,
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
