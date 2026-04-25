import { describe, expect, it } from "vitest";

import { auditEventsToCsv, buildChangeSet } from "./audit";
import type { AuditEventRecord } from "./types";

describe("buildChangeSet", () => {
  it("captures changed primitive fields", () => {
    expect(
      buildChangeSet(
        {
          status: "queued",
          paymentStatus: "unpaid",
        },
        {
          status: "dispatched",
          paymentStatus: "unpaid",
        },
        ["status", "paymentStatus"],
      ),
    ).toEqual({
      status: {
        before: "queued",
        after: "dispatched",
      },
    });
  });

  it("ignores object values and unchanged fields", () => {
    expect(
      buildChangeSet(
        {
          status: "queued",
          nested: { a: 1 },
        },
        {
          status: "queued",
          nested: { a: 2 },
        },
        ["status", "nested"],
      ),
    ).toEqual({});
  });
});

describe("auditEventsToCsv", () => {
  it("serializes audit rows into CSV", () => {
    const events: AuditEventRecord[] = [
      {
        id: "audit-1",
        occurredAt: "2026-04-24T10:00:00.000Z",
        entityType: "delivery",
        entityId: "delivery-1",
        deliveryId: "delivery-1",
        action: "delivery.updated",
        summary: "Delivery updated.",
        actorType: "admin",
        actorId: "admin-1",
        actorLabel: "ops@routegrid.local",
        outcome: "success",
        requestId: "req-1",
        metadata: {
          trackingCode: "RG-24008",
        },
      },
    ];

    const csv = auditEventsToCsv(events);

    expect(csv).toContain('"delivery.updated"');
    expect(csv).toContain('"ops@routegrid.local"');
    expect(csv).toContain('"{""trackingCode"":""RG-24008""}"');
  });
});
