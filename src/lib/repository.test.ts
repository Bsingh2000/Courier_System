import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  createAdminAccount,
  createClientAccount,
  createDriverAccount,
  createInventoryItem,
  deleteAdminAccount,
  deleteClientAccount,
  deleteDriverAccount,
  deleteInventoryItem,
  getDashboardSnapshot,
  inviteClientFromInquiry,
} from "./repository";

const DEMO_STORE_KEY = "__routegridDemoStore";
const SUPABASE_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
];

function clearDemoStore() {
  delete (globalThis as typeof globalThis & { __routegridDemoStore?: unknown })[
    DEMO_STORE_KEY
  ];
}

describe("repository demo workflows", () => {
  beforeEach(() => {
    clearDemoStore();

    for (const key of SUPABASE_ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("invites a qualified inquiry into the client portal", async () => {
    const snapshot = await getDashboardSnapshot();
    const inquiry = snapshot.inquiries.find(
      (item) => item.status === "qualified" && !item.invitedClientId,
    );

    expect(inquiry).toBeDefined();

    const invitation = await inviteClientFromInquiry(inquiry!.id, {
      actor: {
        type: "admin",
        id: "admin-owner-1",
        label: "admin@routegrid.local",
      },
    });

    expect(invitation?.account.email).toBe("marcus@northshoremedics.com");
    expect(invitation?.temporaryPassword).toBeTruthy();

    const after = await getDashboardSnapshot();
    const updatedInquiry = after.inquiries.find((item) => item.id === inquiry!.id);
    const invitedAccount = after.clientAccounts.find(
      (item) => item.email === "marcus@northshoremedics.com",
    );

    expect(updatedInquiry?.status).toBe("invited");
    expect(updatedInquiry?.invitedClientId).toBe(invitedAccount?.id);
    expect(invitedAccount?.businessName).toBe("Northshore Medics");
  });

  it("falls back to a temporary password when setup email is requested in demo mode", async () => {
    const createdAdmin = await createAdminAccount(
      {
        name: "Email First Admin",
        email: "email-first-admin@example.com",
        role: "admin",
        status: "active",
      },
      {
        onboardingMethod: "setup_email",
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      },
    );

    expect(createdAdmin.onboardingMethod).toBe("setup_email");
    expect(createdAdmin.deliveredAs).toBe("temporary_password");
    expect(createdAdmin.setupEmailSent).toBe(false);
    expect(createdAdmin.setupEmailFallback).toBe(true);
    expect(createdAdmin.temporaryPassword).toBeTruthy();

    const createdClient = await createClientAccount(
      {
        contactName: "Email First Client",
        businessName: "Email First Co",
        phone: "(868) 555-1010",
        email: "email-first-client@example.com",
        businessAddress: "10 Demo Street, Chaguanas",
        status: "active",
      },
      {
        onboardingMethod: "setup_email",
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      },
    );

    expect(createdClient.deliveredAs).toBe("temporary_password");
    expect(createdClient.setupEmailFallback).toBe(true);
    expect(createdClient.temporaryPassword).toBeTruthy();

    const createdDriver = await createDriverAccount(
      {
        name: "Email First Driver",
        phone: "(868) 555-2020",
        email: "email-first-driver@example.com",
        zone: "east",
        status: "available",
        accessStatus: "active",
        currentRun: "East AM",
        cashOnHand: 0,
      },
      {
        onboardingMethod: "setup_email",
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      },
    );

    expect(createdDriver.deliveredAs).toBe("temporary_password");
    expect(createdDriver.setupEmailFallback).toBe(true);
    expect(createdDriver.temporaryPassword).toBeTruthy();
  });

  it("falls back to a temporary password when inviting from an inquiry in demo mode with setup email", async () => {
    const snapshot = await getDashboardSnapshot();
    const inquiry = snapshot.inquiries.find(
      (item) => item.status === "qualified" && !item.invitedClientId,
    );

    expect(inquiry).toBeDefined();

    const invitation = await inviteClientFromInquiry(inquiry!.id, {
      onboardingMethod: "setup_email",
      actor: {
        type: "admin",
        id: "admin-owner-1",
        label: "admin@routegrid.local",
      },
    });

    expect(invitation?.onboardingMethod).toBe("setup_email");
    expect(invitation?.deliveredAs).toBe("temporary_password");
    expect(invitation?.setupEmailSent).toBe(false);
    expect(invitation?.setupEmailFallback).toBe(true);
    expect(invitation?.temporaryPassword).toBeTruthy();
  });

  it("prevents deleting the last active owner", async () => {
    const snapshot = await getDashboardSnapshot();
    const owner = snapshot.adminAccounts.find((item) => item.role === "owner");

    await expect(
      deleteAdminAccount(owner!.id, {
        actor: {
          type: "admin",
          id: "admin-other",
          label: "ops@buyerco.com",
        },
      }),
    ).rejects.toThrow("At least one active owner must remain.");
  });

  it("creates and deletes a removable admin account", async () => {
    const created = await createAdminAccount(
      {
        name: "Temp Dispatcher",
        email: "temp.dispatcher@example.com",
        role: "dispatcher",
        status: "active",
      },
      {
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      },
    );

    const removed = await deleteAdminAccount(created.account.id, {
      actor: {
        type: "admin",
        id: "admin-owner-1",
        label: "admin@routegrid.local",
      },
    });

    expect(removed?.email).toBe("temp.dispatcher@example.com");

    const snapshot = await getDashboardSnapshot();
    expect(snapshot.adminAccounts.some((item) => item.id === created.account.id)).toBe(false);
  });

  it("prevents deleting a client account that has delivery history", async () => {
    const snapshot = await getDashboardSnapshot();
    const accountWithHistory = snapshot.clientAccounts.find((item) =>
      snapshot.deliveries.some((delivery) => delivery.clientAccountId === item.id),
    );

    await expect(
      deleteClientAccount(accountWithHistory!.id, {
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      }),
    ).rejects.toThrow("This client has delivery history. Pause access instead of deleting it.");
  });

  it("creates and deletes a client account with no delivery history", async () => {
    const created = await createClientAccount(
      {
        contactName: "Demo Contact",
        businessName: "Temp Client Co",
        phone: "(868) 555-1000",
        email: "temp.client@example.com",
        businessAddress: "1 Demo Street, Port of Spain",
        status: "active",
      },
      {
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      },
    );

    const removed = await deleteClientAccount(created.account.id, {
      actor: {
        type: "admin",
        id: "admin-owner-1",
        label: "admin@routegrid.local",
      },
    });

    expect(removed?.email).toBe("temp.client@example.com");
  });

  it("prevents deleting a driver who still has assigned stops", async () => {
    const snapshot = await getDashboardSnapshot();
    const driverWithStops = snapshot.drivers.find((driver) =>
      snapshot.deliveries.some(
        (delivery) => delivery.driverId === driver.id && delivery.status !== "delivered",
      ),
    );

    await expect(
      deleteDriverAccount(driverWithStops!.id, {
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      }),
    ).rejects.toThrow("This driver still has assigned stops. Unassign those orders first.");
  });

  it("creates and deletes an unassigned driver", async () => {
    const created = await createDriverAccount(
      {
        name: "Temp Driver",
        phone: "(868) 555-2000",
        email: "temp.driver@example.com",
        zone: "west",
        status: "available",
        accessStatus: "active",
        currentRun: "Staging lane",
        cashOnHand: 0,
      },
      {
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      },
    );

    const removed = await deleteDriverAccount(created.driver.id, {
      actor: {
        type: "admin",
        id: "admin-owner-1",
        label: "admin@routegrid.local",
      },
    });

    expect(removed?.email).toBe("temp.driver@example.com");
  });

  it("creates and deletes an inventory item", async () => {
    const created = await createInventoryItem(
      {
        name: "Temp Mailers",
        availableUnits: 20,
        reservedUnits: 2,
        reorderPoint: 8,
        location: "Demo shelf",
        health: "healthy",
      },
      {
        actor: {
          type: "admin",
          id: "admin-owner-1",
          label: "admin@routegrid.local",
        },
      },
    );

    const removed = await deleteInventoryItem(created.id, {
      actor: {
        type: "admin",
        id: "admin-owner-1",
        label: "admin@routegrid.local",
      },
    });

    expect(removed?.name).toBe("Temp Mailers");
  });
});
