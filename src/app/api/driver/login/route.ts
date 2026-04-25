import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createDriverSession, getDriverCookieName } from "@/lib/auth";
import { authenticateDriver, recordAuditEvent } from "@/lib/repository";
import { driverLoginSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const payload = driverLoginSchema.parse(await request.json());
    const driver = await authenticateDriver(payload.email, payload.password);

    if (!driver) {
      await recordAuditEvent({
        requestId,
        entityType: "auth",
        action: "driver.login_failed",
        summary: `Driver login failed for ${payload.email}.`,
        actor: {
          type: "driver",
          label: payload.email,
        },
        outcome: "error",
      });

      return NextResponse.json(
        { ok: false, message: "Invalid driver credentials." },
        { status: 401 },
      );
    }

    const token = await createDriverSession(driver);
    const cookieStore = await cookies();
    cookieStore.set(getDriverCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    await recordAuditEvent({
      requestId,
      entityType: "driver",
      entityId: driver.id,
      action: "driver.login",
      summary: `${driver.name} signed in to the driver workspace.`,
      actor: {
        type: "driver",
        id: driver.id,
        label: driver.email,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";

    await recordAuditEvent({
      requestId,
      entityType: "auth",
      action: "driver.login_failed",
      summary: `Driver login failed: ${message}`,
      actor: {
        type: "driver",
        label: "unknown-driver",
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
