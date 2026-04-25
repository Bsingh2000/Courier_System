import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/auth";
import {
  deleteInventoryItem,
  recordAuditEvent,
  updateInventoryItem,
} from "@/lib/repository";
import { inventoryUpdateSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const payload = inventoryUpdateSchema.parse(await request.json());
    const { id } = await params;
    const item = await updateInventoryItem(id, payload, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, message: "Inventory item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory update failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "inventory_item",
      entityId: id,
      action: "inventory_item.update_failed",
      summary: `Inventory update failed: ${message}`,
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const { id } = await params;
    const item = await deleteInventoryItem(id, {
      requestId,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
    });

    if (!item) {
      return NextResponse.json(
        { ok: false, message: "Inventory item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Inventory delete failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;
    const { id } = await params;

    await recordAuditEvent({
      requestId,
      entityType: "inventory_item",
      entityId: id,
      action: "inventory_item.delete_failed",
      summary: `Inventory delete failed: ${message}`,
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
