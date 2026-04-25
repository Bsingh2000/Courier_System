import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { bulkAssignDeliveries, recordAuditEvent } from "@/lib/repository";
import { bulkAssignmentSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = bulkAssignmentSchema.parse(await request.json());
    const deliveries = await bulkAssignDeliveries(
      payload.deliveryIds,
      payload.driverId === "" ? null : payload.driverId,
      payload.status,
      {
        requestId,
        actor: {
          type: "admin",
          id: session.adminId,
          label: session.email,
        },
      },
    );

    await recordAuditEvent({
      requestId,
      entityType: "system",
      action: "planning.bulk_assigned",
      summary: `${deliveries.length} deliveries were bulk assigned from planning.`,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
      metadata: {
        deliveryIds: payload.deliveryIds,
        driverId: payload.driverId || null,
        status: payload.status,
      },
    });

    return NextResponse.json({ ok: true, deliveries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk assignment failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "system",
      action: "planning.bulk_assign_failed",
      summary: `Bulk assignment failed: ${message}`,
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
