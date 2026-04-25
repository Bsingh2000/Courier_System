import { describe, expect, it } from "vitest";

import {
  adminAccountCreateSchema,
  adminAccountUpdateSchema,
  bulkAssignmentSchema,
  clientAccountCreateSchema,
  clientAccountUpdateSchema,
  deliveryUpdateSchema,
  driverUpsertSchema,
} from "./validators";

describe("driverUpsertSchema", () => {
  it("accepts a valid driver payload", () => {
    expect(
      driverUpsertSchema.parse({
        name: "Asha Khan",
        phone: "(868) 785-9930",
        email: "asha@routegrid.local",
        zone: "south",
        status: "available",
        accessStatus: "active",
        currentRun: "South Corridor PM",
        cashOnHand: 0,
      }),
    ).toMatchObject({
      name: "Asha Khan",
      zone: "south",
    });
  });
});

describe("bulkAssignmentSchema", () => {
  it("defaults the resulting status to queued", () => {
    expect(
      bulkAssignmentSchema.parse({
        deliveryIds: ["delivery-1"],
        driverId: "",
      }),
    ).toMatchObject({
      status: "queued",
    });
  });
});

describe("clientAccountCreateSchema", () => {
  it("accepts a valid direct client-create payload", () => {
    expect(
      clientAccountCreateSchema.parse({
        contactName: "Nadia Ramdial",
        businessName: "Niko Auto Parts",
        phone: "(868) 622-9087",
        email: "ops@nikoautoparts.com",
        businessAddress: "34 Wrightson Road, Port of Spain",
        status: "active",
      }),
    ).toMatchObject({
      businessName: "Niko Auto Parts",
      status: "active",
    });
  });
});

describe("adminAccountCreateSchema", () => {
  it("accepts a valid admin account payload", () => {
    expect(
      adminAccountCreateSchema.parse({
        name: "Nadia Ramdial",
        email: "nadia@buyerco.com",
        role: "dispatcher",
        status: "active",
      }),
    ).toMatchObject({
      role: "dispatcher",
      status: "active",
    });
  });
});

describe("update schemas", () => {
  it("rejects an empty delivery update", () => {
    expect(() => deliveryUpdateSchema.parse({})).toThrow();
  });

  it("rejects an empty client access update", () => {
    expect(() => clientAccountUpdateSchema.parse({})).toThrow();
  });

  it("rejects an empty admin update", () => {
    expect(() => adminAccountUpdateSchema.parse({})).toThrow();
  });
});
