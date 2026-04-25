import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import { createInventoryItem, recordAuditEvent } from "@/lib/repository";
import { inventoryItemSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = inventoryItemSchema.parse(await request.json());
    const item = await createInventoryItem(payload, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory create failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "inventory_item",
      action: "inventory_item.create_failed",
      summary: `Inventory create failed: ${message}`,
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
