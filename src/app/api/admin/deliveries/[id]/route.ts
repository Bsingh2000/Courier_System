import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { recordAuditEvent, updateDelivery } from "@/lib/repository";
import { deliveryUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = deliveryUpdateSchema.parse(await request.json());
    const { id } = await params;
    const record = await updateDelivery(id, {
      ...payload,
      driverId: payload.driverId === "" ? null : payload.driverId,
      notes: payload.notes === "" ? null : payload.notes,
    }, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!record) {
      return NextResponse.json(
        { ok: false, message: "Delivery record not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, delivery: record });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    const { id } = await params;
    await recordAuditEvent({
      requestId,
      entityType: "delivery",
      entityId: id,
      deliveryId: id,
      action: "delivery.update_failed",
      summary: `Delivery update failed: ${message}`,
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
