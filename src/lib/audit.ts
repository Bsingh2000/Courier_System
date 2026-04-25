import type { AuditEventRecord } from "@/lib/types";

function isPrimitiveComparable(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function buildChangeSet(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
) {
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  for (const field of fields) {
    const previousValue = before[field];
    const nextValue = after[field];

    if (!isPrimitiveComparable(previousValue) || !isPrimitiveComparable(nextValue)) {
      continue;
    }

    if (previousValue !== nextValue) {
      changes[field] = {
        before: previousValue ?? null,
        after: nextValue ?? null,
      };
    }
  }

  return changes;
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  const escaped = text.replaceAll('"', '""');
  return `"${escaped}"`;
}

export function auditEventsToCsv(events: AuditEventRecord[]) {
  const header = [
    "id",
    "occurred_at",
    "entity_type",
    "entity_id",
    "delivery_id",
    "action",
    "outcome",
    "actor_type",
    "actor_id",
    "actor_label",
    "request_id",
    "summary",
    "metadata",
  ];
  const rows = events.map((event) =>
    [
      event.id,
      event.occurredAt,
      event.entityType,
      event.entityId ?? "",
      event.deliveryId ?? "",
      event.action,
      event.outcome,
      event.actorType,
      event.actorId ?? "",
      event.actorLabel ?? "",
      event.requestId ?? "",
      event.summary,
      JSON.stringify(event.metadata ?? {}),
    ]
      .map(escapeCsv)
      .join(","),
  );

  return [header.join(","), ...rows].join("\n");
}
