import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import { createClientAccount, recordAuditEvent } from "@/lib/repository";
import { clientAccountCreateRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = clientAccountCreateRequestSchema.parse(await request.json());
    const result = await createClientAccount(payload, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
      onboardingMethod: payload.onboardingMethod,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = getErrorMessage(error, "Client creation failed.");
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "client_account",
      action: "client_account.create_failed",
      summary: `Client account creation failed: ${message}`,
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
