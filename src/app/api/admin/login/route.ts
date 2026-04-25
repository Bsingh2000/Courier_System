import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createAdminSession,
  getAdminCookieName,
} from "@/lib/auth";
import { authenticateAdmin, recordAuditEvent } from "@/lib/repository";
import { adminLoginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const payload = adminLoginSchema.parse(await request.json());
    const result = await authenticateAdmin(payload.email, payload.password);

    if (!result) {
      await recordAuditEvent({
        requestId,
        entityType: "auth",
        action: "admin.login_failed",
        summary: `Admin login failed for ${payload.email}.`,
        actor: {
          type: "admin",
          label: payload.email,
        },
        outcome: "error",
      });

      return NextResponse.json(
        { ok: false, message: "Invalid admin credentials." },
        { status: 401 },
      );
    }

    const token = await createAdminSession({
      adminId: result.source === "account" ? result.account.id : undefined,
      name: result.account.name,
      email: result.account.email,
      role: result.account.role,
      source: result.source,
    });
    const cookieStore = await cookies();
    cookieStore.set(getAdminCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await recordAuditEvent({
      requestId,
      entityType: "auth",
      action: "admin.login",
      summary: `${result.account.name} signed in to the admin workspace.`,
      actor: {
        type: "admin",
        id: result.source === "account" ? result.account.id : undefined,
        label: result.account.email,
      },
      metadata: {
        role: result.account.role,
        source: result.source,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";

    await recordAuditEvent({
      requestId,
      entityType: "auth",
      action: "admin.login_failed",
      summary: `Admin login failed: ${message}`,
      actor: {
        type: "admin",
        label: "unknown-admin",
      },
      outcome: "error",
      metadata: {
        message,
      },
    }).catch(() => undefined);

    return NextResponse.json(
      { ok: false, message },
      { status: 400 },
    );
  }
}
