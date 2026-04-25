import { NextResponse } from "next/server";

import { auditEventsToCsv } from "@/lib/audit";
import { requireAdminSession } from "@/lib/auth";
import { getAuditTrail, recordAuditEvent } from "@/lib/repository";
import type { AuditActorType, AuditEntityType, AuditOutcome } from "@/lib/types";

export const runtime = "nodejs";

const entityTypes: AuditEntityType[] = [
  "delivery",
  "business_inquiry",
  "client_account",
  "admin_account",
  "driver",
  "inventory_item",
  "auth",
  "system",
];

const actorTypes: AuditActorType[] = ["admin", "client", "driver", "system"];
const outcomes: AuditOutcome[] = ["success", "error"];

function toFilteredValue<T extends string>(value: string | null, values: T[]) {
  if (!value) {
    return undefined;
  }

  return values.includes(value as T) ? (value as T) : undefined;
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const session = await requireAdminSession();
    const url = new URL(request.url);
    const events = await getAuditTrail({
      search: url.searchParams.get("q") || undefined,
      day: url.searchParams.get("day") || undefined,
      entityType: toFilteredValue(url.searchParams.get("entityType"), entityTypes),
      actorType: toFilteredValue(url.searchParams.get("actorType"), actorTypes),
      outcome: toFilteredValue(url.searchParams.get("outcome"), outcomes),
      entityId: url.searchParams.get("entityId") || undefined,
      deliveryId: url.searchParams.get("deliveryId") || undefined,
    });

    await recordAuditEvent({
      requestId,
      entityType: "system",
      action: "audit.exported",
      summary: `${events.length} audit events were exported.`,
      actor: {
        type: "admin",
        id: session.adminId,
        label: session.email,
      },
      metadata: {
        count: events.length,
      },
    });

    return new NextResponse(auditEventsToCsv(events), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="routegrid-audit-${new Date()
          .toISOString()
          .slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Audit export failed.";
    const status = message === "UNAUTHORIZED" ? 401 : 400;

    await recordAuditEvent({
      requestId,
      entityType: "system",
      action: "audit.export_failed",
      summary: `Audit export failed: ${message}`,
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
