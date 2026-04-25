import { NextResponse } from "next/server";

import {
  requireAdminManagementSession,
  requireAdminSession,
} from "@/lib/auth";
import {
  deleteAdminAccount as deleteAdminAccountRecord,
  recordAuditEvent,
  updateAdminAccount,
} from "@/lib/repository";
import { adminAccountUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = requireAdminManagementSession(await requireAdminSession());
    const { id } = await context.params;
    const payload = adminAccountUpdateSchema.parse(await request.json());
    const account = await updateAdminAccount(id, payload, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, message: "Admin user was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin update failed.";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "admin_account",
      action: "admin_account.update_failed",
      summary: `Admin update failed: ${message}`,
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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = requireAdminManagementSession(await requireAdminSession());
    const { id } = await context.params;
    const account = await deleteAdminAccountRecord(id, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!account) {
      return NextResponse.json(
        { ok: false, message: "Admin user was not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin delete failed.";
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    const { id } = await context.params;

    await recordAuditEvent({
      requestId,
      entityType: "admin_account",
      entityId: id,
      action: "admin_account.delete_failed",
      summary: `Admin delete failed: ${message}`,
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
