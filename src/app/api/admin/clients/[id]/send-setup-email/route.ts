import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { recordAuditEvent, sendClientSetupEmail } from "@/lib/repository";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const result = await sendClientSetupEmail(id, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!result) {
      return NextResponse.json(
        { ok: false, message: "Client account not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error, "Setup email failed.");
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "client_account",
      entityId: id,
      action: "client_account.setup_email_failed",
      summary: `Client setup email failed: ${message}`,
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
