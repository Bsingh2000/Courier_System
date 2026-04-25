import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import {
  recordAuditEvent,
  updateBusinessInquiryStatus,
} from "@/lib/repository";
import { inquiryStatusSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = inquiryStatusSchema.parse(await request.json());
    const { id } = await params;
    const inquiry = await updateBusinessInquiryStatus(id, payload.status, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!inquiry) {
      return NextResponse.json(
        { ok: false, message: "Inquiry not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, inquiry });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    const { id } = await params;
    await recordAuditEvent({
      requestId,
      entityType: "business_inquiry",
      entityId: id,
      action: "inquiry.status_update_failed",
      summary: `Inquiry status update failed: ${message}`,
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
