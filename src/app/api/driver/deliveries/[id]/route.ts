import { NextResponse } from "next/server";

import { requireDriverSession } from "@/lib/auth";
import { recordAuditEvent, updateDriverDelivery } from "@/lib/repository";
import { driverDeliveryUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireDriverSession();
    const payload = driverDeliveryUpdateSchema.parse(await request.json());
    const { id } = await params;
    const record = await updateDriverDelivery(id, session.driverId, {
      status: payload.status,
      amountPaid: payload.amountPaid,
      driverNotes: payload.driverNotes === "" ? null : payload.driverNotes,
    }, {
      requestId,
      actor: {
        type: "driver",
        id: session.driverId,
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
    const status =
      message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "delivery",
      entityId: id,
      deliveryId: id,
      action: "driver.delivery_update_failed",
      summary: `Driver update failed: ${message}`,
      actor: {
        type: "driver",
        label: "unknown-driver",
      },
      outcome: "error",
      metadata: {
        message,
      },
    }).catch(() => undefined);

    return NextResponse.json({ ok: false, message }, { status });
  }
}
