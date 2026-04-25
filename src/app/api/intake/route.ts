import { NextResponse } from "next/server";

import { requireClientSession } from "@/lib/auth";
import {
  createDeliveryRequest,
  getClientAccount,
  recordAuditEvent,
} from "@/lib/repository";
import { deliveryIntakeSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireClientSession();
    const clientAccount = await getClientAccount(session.clientId);

    if (!clientAccount) {
      return NextResponse.json(
        { ok: false, message: "Client account not found." },
        { status: 404 },
      );
    }

    const payload = deliveryIntakeSchema.parse(await request.json());
    const record = await createDeliveryRequest({
      ...payload,
      clientEmail: payload.clientEmail || undefined,
      notes: payload.notes || undefined,
    }, clientAccount, {
      requestId,
      actor: {
        type: "client",
        id: clientAccount.id,
        label: clientAccount.email,
      },
    });

    return NextResponse.json({
      ok: true,
      trackingCode: record.trackingCode,
      message: "Delivery intake submitted successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to submit delivery intake.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "delivery",
      action: "delivery.create_failed",
      summary: `Delivery submission failed: ${message}`,
      actor: {
        type: "client",
        label: "unknown-client",
      },
      outcome: "error",
      metadata: {
        message,
      },
    }).catch(() => undefined);

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status },
    );
  }
}
