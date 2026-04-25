import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import {
  inviteClientFromInquiry,
  recordAuditEvent,
} from "@/lib/repository";
import { inquiryInviteRequestSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const rawBody = await request.text();
    const payload = rawBody
      ? inquiryInviteRequestSchema.parse(JSON.parse(rawBody))
      : { onboardingMethod: "temporary_password" as const };
    const { id } = await params;
    const invitation = await inviteClientFromInquiry(id, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
      onboardingMethod: payload.onboardingMethod,
    });

    if (!invitation) {
      return NextResponse.json(
        { ok: false, message: "Inquiry not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      account: invitation.account,
      temporaryPassword: invitation.temporaryPassword,
      setupEmailSent: invitation.setupEmailSent,
      setupEmailFallback: invitation.setupEmailFallback,
      deliveredAs: invitation.deliveredAs,
    });
  } catch (error) {
    const message = getErrorMessage(error, "Invitation failed.");
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "business_inquiry",
      entityId: id,
      action: "client_account.invite_failed",
      summary: `Client invitation failed: ${message}`,
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
