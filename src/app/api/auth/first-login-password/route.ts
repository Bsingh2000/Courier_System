import { NextResponse } from "next/server";

import { verifyFirstLoginPasswordToken } from "@/lib/auth";
import {
  completeFirstLoginPasswordSetup,
  recordAuditEvent,
} from "@/lib/repository";
import { firstLoginPasswordSetupSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const payload = firstLoginPasswordSetupSchema.parse(await request.json());
    const token = await verifyFirstLoginPasswordToken(payload.token);

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          message: "This password setup link is invalid or has expired.",
        },
        { status: 401 },
      );
    }

    const completed = await completeFirstLoginPasswordSetup(
      token.accountType,
      token.accountId,
      payload.password,
      {
        requestId,
      },
    );

    if (!completed) {
      return NextResponse.json(
        {
          ok: false,
          message: "This account is no longer available for password setup.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      email: completed.email,
      accountType: completed.accountType,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Password setup failed.";

    await recordAuditEvent({
      requestId,
      entityType: "auth",
      action: "auth.first_login_password_failed",
      summary: `First-login password setup failed: ${message}`,
      actor: {
        type: "system",
        label: "first-login-password",
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
