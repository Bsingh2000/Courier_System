import { NextResponse } from "next/server";

import { recordAuditEvent, submitBusinessInquiry } from "@/lib/repository";
import { businessInquirySchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const payload = businessInquirySchema.parse(await request.json());
    await submitBusinessInquiry({
      ...payload,
      notes: payload.notes || undefined,
    }, { requestId });

    return NextResponse.json({
      ok: true,
      message: "Inquiry received. We will review it and contact you shortly.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to send inquiry.";

    await recordAuditEvent({
      requestId,
      entityType: "business_inquiry",
      action: "inquiry.create_failed",
      summary: `Business inquiry submission failed: ${message}`,
      actor: {
        type: "system",
        label: "public-form",
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
      { status: 400 },
    );
  }
}
