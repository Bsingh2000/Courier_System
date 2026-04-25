import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  createClientSession,
  getClientCookieName,
} from "@/lib/auth";
import { authenticateClient, recordAuditEvent } from "@/lib/repository";
import { clientLoginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const payload = clientLoginSchema.parse(await request.json());
    const client = await authenticateClient(payload.email, payload.password);

    if (!client) {
      await recordAuditEvent({
        requestId,
        entityType: "auth",
        action: "client.login_failed",
        summary: `Client login failed for ${payload.email}.`,
        actor: {
          type: "client",
          label: payload.email,
        },
        outcome: "error",
      });

      return NextResponse.json(
        { ok: false, message: "Invalid client credentials." },
        { status: 401 },
      );
    }

    const token = await createClientSession(client);
    const cookieStore = await cookies();
    cookieStore.set(getClientCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await recordAuditEvent({
      requestId,
      entityType: "client_account",
      entityId: client.id,
      action: "client.login",
      summary: `${client.businessName} signed in to the client portal.`,
      actor: {
        type: "client",
        id: client.id,
        label: client.email,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";

    await recordAuditEvent({
      requestId,
      entityType: "auth",
      action: "client.login_failed",
      summary: `Client login failed: ${message}`,
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
      { status: 400 },
    );
  }
}
