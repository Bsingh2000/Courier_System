import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import {
  deleteDriverAccount,
  recordAuditEvent,
  updateDriverAccount,
} from "@/lib/repository";
import { driverUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = driverUpdateSchema.parse(await request.json());
    const { id } = await params;
    const driver = await updateDriverAccount(id, payload, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { ok: false, message: "Driver not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, driver });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Driver update failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "driver",
      entityId: id,
      action: "driver.update_failed",
      summary: `Driver update failed: ${message}`,
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
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const driver = await deleteDriverAccount(id, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!driver) {
      return NextResponse.json(
        { ok: false, message: "Driver not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Driver delete failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "driver",
      entityId: id,
      action: "driver.delete_failed",
      summary: `Driver delete failed: ${message}`,
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
