import "server-only";

import { buildChangeSet } from "@/lib/audit";
import {
  demoActivity,
  demoAdminAccounts,
  demoAuditEvents,
  demoClientAccounts,
  demoDeliveries,
  demoDrivers,
  demoInquiries,
  demoInventory,
} from "@/lib/demo-data";
import {
  getAdminEmail,
  getAdminPassword,
  hasSupabaseConfig,
  isDemoMode,
} from "@/lib/env";
import {
  generateTemporaryPassword,
  hashPassword,
  hashPasswordSync,
  verifyPassword,
} from "@/lib/passwords";
import {
  authenticateSupabaseIdentity,
  deleteSupabaseAuthIdentity,
  syncSupabaseAuthIdentity,
} from "@/lib/supabase-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import type {
  ActivityEntry,
  AdminAccountCreateInput,
  AdminAccountRecord,
  AdminAccountUpdateInput,
  AuditEventInput,
  AuditEventRecord,
  BusinessInquiryInput,
  BusinessInquiryRecord,
  BusinessInquiryStatus,
  ClientAccountCreateInput,
  ClientAccountRecord,
  ClientPortalMetrics,
  ClientPortalSnapshot,
  ClientSummary,
  ClientAccountUpdateInput,
  DashboardMetrics,
  DashboardSnapshot,
  DispatchQueueItem,
  DeliveryIntakeInput,
  DeliveryRecord,
  DeliveryStatus,
  DeliveryUpdateInput,
  DeliveryWorkspaceSnapshot,
  DispatchZone,
  DriverRecord,
  DriverRunSnapshot,
  DriverRunStop,
  DriverUpsertInput,
  DriverWorkspaceSnapshot,
  InventoryItemInput,
  InventoryItem,
  PaymentStatus,
  PriorityLevel,
  ZoneSummary,
} from "@/lib/types";

type StoredAdminAccount = AdminAccountRecord & {
  passwordHash?: string;
};

type StoredClientAccount = ClientAccountRecord & {
  passwordHash?: string;
};

type StoredDriverRecord = DriverRecord & {
  passwordHash?: string;
};

type DemoStore = {
  deliveries: DeliveryRecord[];
  adminAccounts: StoredAdminAccount[];
  drivers: StoredDriverRecord[];
  inventory: InventoryItem[];
  activity: ActivityEntry[];
  auditEvents: AuditEventRecord[];
  inquiries: BusinessInquiryRecord[];
  clientAccounts: StoredClientAccount[];
};

declare global {
  var __routegridDemoStore: DemoStore | undefined;
}

type DeliveryRow = Record<string, unknown>;
type AdminAccountRow = Record<string, unknown>;
type DriverRow = Record<string, unknown>;
type InventoryRow = Record<string, unknown>;
type ActivityRow = Record<string, unknown>;
type AuditRow = Record<string, unknown>;
type InquiryRow = Record<string, unknown>;
type ClientAccountRow = Record<string, unknown>;

function cloneDemoStore(): DemoStore {
  return JSON.parse(
    JSON.stringify({
      deliveries: demoDeliveries,
      adminAccounts: demoAdminAccounts,
      drivers: demoDrivers,
      inventory: demoInventory,
      activity: demoActivity,
      auditEvents: demoAuditEvents,
      inquiries: demoInquiries,
      clientAccounts: demoClientAccounts,
    }),
  ) as DemoStore;
}

function ensureDemoStoreShape(store?: Partial<DemoStore>): DemoStore {
  const baseline = cloneDemoStore();

  return {
    deliveries: Array.isArray(store?.deliveries) ? store.deliveries : baseline.deliveries,
    adminAccounts: Array.isArray(store?.adminAccounts)
      ? store.adminAccounts.map((account) => {
          const fallback = baseline.adminAccounts.find((item) => item.id === account.id);

          return {
            ...fallback,
            ...account,
            name: account.name ?? fallback?.name ?? "Admin account",
            email: account.email ?? fallback?.email ?? "",
            role: account.role ?? fallback?.role ?? "admin",
            status: account.status ?? fallback?.status ?? "active",
            passwordHash:
              account.passwordHash ?? fallback?.passwordHash ?? hashPasswordSync("dispatch123"),
          } satisfies StoredAdminAccount;
        })
      : baseline.adminAccounts,
    drivers: Array.isArray(store?.drivers)
      ? store.drivers.map((driver) => {
          const fallback = baseline.drivers.find((item) => item.id === driver.id);

          return {
            ...fallback,
            ...driver,
            email: driver.email ?? fallback?.email ?? "",
            accessStatus: driver.accessStatus ?? fallback?.accessStatus ?? "active",
            currentRun: driver.currentRun ?? fallback?.currentRun ?? "Route planning",
            passwordHash:
              driver.passwordHash ?? fallback?.passwordHash ?? hashPasswordSync("driver123"),
          } satisfies StoredDriverRecord;
        })
      : baseline.drivers,
    inventory: Array.isArray(store?.inventory) ? store.inventory : baseline.inventory,
    activity: Array.isArray(store?.activity) ? store.activity : baseline.activity,
    auditEvents: Array.isArray(store?.auditEvents) ? store.auditEvents : baseline.auditEvents,
    inquiries: Array.isArray(store?.inquiries) ? store.inquiries : baseline.inquiries,
    clientAccounts: Array.isArray(store?.clientAccounts)
      ? store.clientAccounts.map((account) => {
          const fallback = baseline.clientAccounts.find((item) => item.id === account.id);

          return {
            ...fallback,
            ...account,
            email: account.email ?? fallback?.email ?? "",
            status: account.status ?? fallback?.status ?? "active",
            passwordHash:
              account.passwordHash ?? fallback?.passwordHash ?? hashPasswordSync("client123"),
          } satisfies StoredClientAccount;
        })
      : baseline.clientAccounts,
  };
}

function getDemoStore() {
  globalThis.__routegridDemoStore = ensureDemoStoreShape(globalThis.__routegridDemoStore);
  return globalThis.__routegridDemoStore;
}

function normalizeSearch(input?: string) {
  return input?.trim().toLowerCase() ?? "";
}

function hasLegacyPasswordHash(value?: string): value is string {
  return typeof value === "string" && value.length > 0;
}

function trackCode() {
  const sequence = Math.floor(Math.random() * 90000) + 10000;
  return `RG-${sequence}`;
}

function nowIso() {
  return new Date().toISOString();
}

function toNumber(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function toStringValue(value: unknown) {
  return String(value ?? "");
}

function toNullableString(value: unknown) {
  const stringValue = toStringValue(value);
  return stringValue.length > 0 ? stringValue : undefined;
}

function toPaymentStatus(amountPaid: number, quotedPrice: number, supplied?: PaymentStatus) {
  if (supplied) {
    return supplied;
  }

  if (amountPaid <= 0) {
    return "unpaid";
  }

  if (amountPaid >= quotedPrice) {
    return "paid";
  }

  return "partial";
}

function isActiveStatus(status: DeliveryStatus) {
  return ["queued", "dispatched", "in_transit", "issue"].includes(status);
}

function hasClientDeliveryHistory(
  deliveries: Array<Pick<DeliveryRecord, "clientAccountId">>,
  clientAccountId: string,
) {
  return deliveries.some((delivery) => delivery.clientAccountId === clientAccountId);
}

function hasBlockingDriverAssignments(
  deliveries: Array<Pick<DeliveryRecord, "driverId" | "status">>,
  driverId: string,
) {
  return deliveries.some(
    (delivery) => delivery.driverId === driverId && delivery.status !== "delivered",
  );
}

function toPublicAdminAccount(account: StoredAdminAccount): AdminAccountRecord {
  const { passwordHash, ...publicAccount } = account;
  void passwordHash;
  return publicAccount;
}

function toPublicClientAccount(account: StoredClientAccount): ClientAccountRecord {
  const { passwordHash, ...publicAccount } = account;
  void passwordHash;
  return publicAccount;
}

function toPublicDriverAccount(driver: StoredDriverRecord): DriverRecord {
  const { passwordHash, ...publicDriver } = driver;
  void passwordHash;
  return publicDriver;
}

function mapDelivery(row: DeliveryRow): DeliveryRecord {
  return {
    id: toStringValue(row.id),
    clientAccountId: toNullableString(row.client_account_id),
    trackingCode: toStringValue(row.tracking_code),
    clientName: toStringValue(row.client_name),
    clientPhone: toStringValue(row.client_phone),
    clientEmail: toNullableString(row.client_email),
    recipientName: toStringValue(row.recipient_name),
    recipientPhone: toStringValue(row.recipient_phone),
    pickupAddress: toStringValue(row.pickup_address),
    dropoffAddress: toStringValue(row.dropoff_address),
    parcelDescription: toStringValue(row.parcel_description),
    itemCount: toNumber(row.item_count),
    declaredValue: toNumber(row.declared_value),
    quotedPrice: toNumber(row.quoted_price),
    amountPaid: toNumber(row.amount_paid),
    paymentMethod: toStringValue(row.payment_method) as DeliveryRecord["paymentMethod"],
    paymentStatus: toStringValue(row.payment_status) as PaymentStatus,
    zone: toStringValue(row.dispatch_zone) as DispatchZone,
    status: toStringValue(row.status) as DeliveryStatus,
    priority: toStringValue(row.priority) as PriorityLevel,
    driverId: toNullableString(row.driver_id),
    driverName: toNullableString(row.driver_name),
    scheduledFor: toStringValue(row.scheduled_for),
    eta: toStringValue(row.eta),
    notes: toNullableString(row.notes),
    driverNotes: toNullableString(row.driver_notes),
    createdAt: toStringValue(row.created_at),
    updatedAt: toStringValue(row.updated_at),
  };
}

function mapStoredAdminAccount(row: AdminAccountRow): StoredAdminAccount {
  return {
    id: toStringValue(row.id),
    name: toStringValue(row.name),
    email: toStringValue(row.email),
    role: toStringValue(row.role) as AdminAccountRecord["role"],
    status: toStringValue(row.status) as AdminAccountRecord["status"],
    lastLoginAt: toNullableString(row.last_login_at),
    createdByAdminId: toNullableString(row.created_by_admin_id),
    createdByLabel: toNullableString(row.created_by_label),
    createdAt: toStringValue(row.created_at),
    updatedAt: toStringValue(row.updated_at),
    passwordHash: toNullableString(row.password_hash),
  };
}

function mapDriver(row: DriverRow): DriverRecord {
  return {
    id: toStringValue(row.id),
    name: toStringValue(row.name),
    phone: toStringValue(row.phone),
    email: toStringValue(row.email),
    zone: toStringValue(row.zone) as DispatchZone,
    status: toStringValue(row.status) as DriverRecord["status"],
    accessStatus: toStringValue(row.access_status) as DriverRecord["accessStatus"],
    currentRun: toStringValue(row.current_run),
    todayDeliveries: toNumber(row.today_deliveries),
    cashOnHand: toNumber(row.cash_on_hand),
    lastLoginAt: toNullableString(row.last_login_at),
  };
}

function mapStoredDriver(row: DriverRow): StoredDriverRecord {
  return {
    ...mapDriver(row),
    passwordHash: toNullableString(row.password_hash),
  };
}

function mapInventory(row: InventoryRow): InventoryItem {
  return {
    id: toStringValue(row.id),
    name: toStringValue(row.item_name),
    availableUnits: toNumber(row.available_units),
    reservedUnits: toNumber(row.reserved_units),
    reorderPoint: toNumber(row.reorder_point),
    location: toStringValue(row.location),
    health: toStringValue(row.health) as InventoryItem["health"],
  };
}

function mapActivity(row: ActivityRow): ActivityEntry {
  return {
    id: toStringValue(row.id),
    deliveryId: toNullableString(row.delivery_id),
    title: toStringValue(row.title),
    detail: toStringValue(row.detail),
    timestamp: toStringValue(row.created_at),
  };
}

function mapAuditEvent(row: AuditRow): AuditEventRecord {
  return {
    id: toStringValue(row.id),
    requestId: toNullableString(row.request_id),
    entityType: toStringValue(row.entity_type) as AuditEventRecord["entityType"],
    entityId: toNullableString(row.entity_id),
    deliveryId: toNullableString(row.delivery_id),
    action: toStringValue(row.action),
    summary: toStringValue(row.summary),
    actorType: toStringValue(row.actor_type) as AuditEventRecord["actorType"],
    actorId: toNullableString(row.actor_id),
    actorLabel: toNullableString(row.actor_label),
    outcome: toStringValue(row.outcome) as AuditEventRecord["outcome"],
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : undefined,
    occurredAt: toStringValue(row.created_at),
  };
}

function mapInquiry(row: InquiryRow): BusinessInquiryRecord {
  return {
    id: toStringValue(row.id),
    contactName: toStringValue(row.contact_name),
    businessName: toStringValue(row.business_name),
    phone: toStringValue(row.phone),
    email: toStringValue(row.email),
    businessAddress: toStringValue(row.business_address),
    notes: toNullableString(row.notes),
    status: toStringValue(row.status) as BusinessInquiryStatus,
    invitedClientId: toNullableString(row.invited_client_id),
    createdAt: toStringValue(row.created_at),
    updatedAt: toStringValue(row.updated_at),
  };
}

function mapStoredClientAccount(row: ClientAccountRow): StoredClientAccount {
  return {
    id: toStringValue(row.id),
    contactName: toStringValue(row.contact_name),
    businessName: toStringValue(row.business_name),
    email: toStringValue(row.email),
    phone: toStringValue(row.phone),
    businessAddress: toStringValue(row.business_address),
    status: toStringValue(row.status) as ClientAccountRecord["status"],
    lastLoginAt: toNullableString(row.last_login_at),
    createdAt: toStringValue(row.created_at),
    updatedAt: toStringValue(row.updated_at),
    passwordHash: toNullableString(row.password_hash),
  };
}

function buildClientSummaries(deliveries: DeliveryRecord[]) {
  const clientMap = new Map<string, ClientSummary>();

  for (const delivery of deliveries) {
    const key = `${delivery.clientName}:${delivery.clientPhone}`;
    const current = clientMap.get(key);

    if (!current) {
      clientMap.set(key, {
        id: key,
        clientName: delivery.clientName,
        phone: delivery.clientPhone,
        totalOrders: 1,
        totalRevenue: delivery.quotedPrice,
        outstandingBalance: Math.max(delivery.quotedPrice - delivery.amountPaid, 0),
        lastOrderAt: delivery.createdAt,
      });
      continue;
    }

    current.totalOrders += 1;
    current.totalRevenue += delivery.quotedPrice;
    current.outstandingBalance += Math.max(delivery.quotedPrice - delivery.amountPaid, 0);

    if (new Date(delivery.createdAt) > new Date(current.lastOrderAt)) {
      current.lastOrderAt = delivery.createdAt;
    }
  }

  return Array.from(clientMap.values()).sort(
    (left, right) => right.totalRevenue - left.totalRevenue,
  );
}

function buildZoneSummaries(deliveries: DeliveryRecord[]) {
  const summaries = new Map<DispatchZone, ZoneSummary>();
  const zones: DispatchZone[] = ["east", "west", "north", "south"];

  for (const zone of zones) {
    summaries.set(zone, {
      zone,
      total: 0,
      pending: 0,
      moving: 0,
      completed: 0,
      revenue: 0,
    });
  }

  for (const delivery of deliveries) {
    const zone = summaries.get(delivery.zone);
    if (!zone) {
      continue;
    }

    zone.total += 1;
    zone.revenue += delivery.quotedPrice;

    if (delivery.status === "delivered") {
      zone.completed += 1;
    } else if (delivery.status === "dispatched" || delivery.status === "in_transit") {
      zone.moving += 1;
    } else {
      zone.pending += 1;
    }
  }

  return Array.from(summaries.values());
}

function buildMetrics(deliveries: DeliveryRecord[]): DashboardMetrics {
  return deliveries.reduce(
    (metrics, delivery) => {
      metrics.totalRevenue += delivery.quotedPrice;
      metrics.cashCollected += delivery.amountPaid;
      metrics.outstandingBalance += Math.max(delivery.quotedPrice - delivery.amountPaid, 0);

      if (isActiveStatus(delivery.status)) {
        metrics.activeDeliveries += 1;
      }

      if (delivery.status === "delivered") {
        metrics.deliveredToday += 1;
      }

      if (delivery.status === "new" || delivery.status === "queued") {
        metrics.awaitingDispatch += 1;
      }

      return metrics;
    },
    {
      activeDeliveries: 0,
      deliveredToday: 0,
      awaitingDispatch: 0,
      totalRevenue: 0,
      cashCollected: 0,
      outstandingBalance: 0,
    } satisfies DashboardMetrics,
  );
}

function buildClientPortalMetrics(deliveries: DeliveryRecord[]): ClientPortalMetrics {
  return deliveries.reduce(
    (metrics, delivery) => {
      metrics.totalRevenue += delivery.quotedPrice;
      metrics.outstandingBalance += Math.max(delivery.quotedPrice - delivery.amountPaid, 0);

      if (isActiveStatus(delivery.status)) {
        metrics.activeDeliveries += 1;
      }

      if (delivery.status === "delivered") {
        metrics.deliveredDeliveries += 1;
      }

      return metrics;
    },
    {
      activeDeliveries: 0,
      deliveredDeliveries: 0,
      totalRevenue: 0,
      outstandingBalance: 0,
    } satisfies ClientPortalMetrics,
  );
}

function priorityRank(priority: PriorityLevel) {
  switch (priority) {
    case "express":
      return 0;
    case "fragile":
      return 1;
    default:
      return 2;
  }
}

function needsDispatchAttention(delivery: DeliveryRecord) {
  return !delivery.driverId || ["new", "queued", "issue"].includes(delivery.status);
}

function buildDispatchQueue(deliveries: DeliveryRecord[]): DispatchQueueItem[] {
  return deliveries
    .filter(needsDispatchAttention)
    .sort((left, right) => {
      const priorityDifference = priorityRank(left.priority) - priorityRank(right.priority);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return (
        new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime()
      );
    })
    .map((delivery) => ({
      id: delivery.id,
      trackingCode: delivery.trackingCode,
      clientName: delivery.clientName,
      recipientName: delivery.recipientName,
      parcelDescription: delivery.parcelDescription,
      zone: delivery.zone,
      status: delivery.status,
      priority: delivery.priority,
      driverId: delivery.driverId,
      driverName: delivery.driverName,
      scheduledFor: delivery.scheduledFor,
      eta: delivery.eta,
      quotedPrice: delivery.quotedPrice,
      amountPaid: delivery.amountPaid,
    }));
}

function buildDriverRunStop(delivery: DeliveryRecord): DriverRunStop {
  return {
    id: delivery.id,
    trackingCode: delivery.trackingCode,
    clientName: delivery.clientName,
    recipientName: delivery.recipientName,
    dropoffAddress: delivery.dropoffAddress,
    status: delivery.status,
    priority: delivery.priority,
    paymentStatus: delivery.paymentStatus,
    eta: delivery.eta,
    quotedPrice: delivery.quotedPrice,
    amountPaid: delivery.amountPaid,
  };
}

function buildDriverRuns(
  deliveries: DeliveryRecord[],
  drivers: DriverRecord[],
): DriverRunSnapshot[] {
  return drivers
    .map((driver) => {
      const assignedDeliveries = deliveries
        .filter((delivery) => delivery.driverId === driver.id)
        .sort(
          (left, right) =>
            new Date(left.eta).getTime() - new Date(right.eta).getTime(),
        );
      const activeDeliveries = assignedDeliveries.filter((delivery) =>
        isActiveStatus(delivery.status),
      );
      const deliveredStops = assignedDeliveries.filter(
        (delivery) => delivery.status === "delivered",
      ).length;
      const issueStops = assignedDeliveries.filter(
        (delivery) => delivery.status === "issue",
      ).length;
      const outstandingBalance = activeDeliveries.reduce(
        (total, delivery) =>
          total + Math.max(delivery.quotedPrice - delivery.amountPaid, 0),
        0,
      );
      const cashCollected = assignedDeliveries.reduce(
        (total, delivery) => total + delivery.amountPaid,
        0,
      );
      const nextEta = activeDeliveries[0]?.eta;

      return {
        driver,
        effectiveStatus:
          driver.status === "off_duty"
            ? "off_duty"
            : activeDeliveries.length > 0
              ? "on_run"
              : "available",
        activeStops: activeDeliveries.length,
        deliveredStops,
        issueStops,
        cashCollected,
        outstandingBalance,
        nextEta,
        activeDeliveries: activeDeliveries.map(buildDriverRunStop),
      } satisfies DriverRunSnapshot;
    })
    .sort((left, right) => {
      if (right.activeStops !== left.activeStops) {
        return right.activeStops - left.activeStops;
      }

      if (left.issueStops !== right.issueStops) {
        return right.issueStops - left.issueStops;
      }

      return left.driver.name.localeCompare(right.driver.name);
    });
}

function buildDriverWorkspaceSnapshot(
  store: DemoStore,
  driverId: string,
  search?: string,
): DriverWorkspaceSnapshot | null {
  const driver = store.drivers.find((item) => item.id === driverId);

  if (!driver) {
    return null;
  }

  const allDeliveries = [...store.deliveries]
    .filter((delivery) => delivery.driverId === driverId)
    .sort(
      (left, right) =>
        new Date(left.eta).getTime() - new Date(right.eta).getTime(),
    );
  const filteredDeliveries = filterDeliveries(allDeliveries, search);
  const activeDeliveries = filteredDeliveries.filter((delivery) =>
    isActiveStatus(delivery.status),
  );
  const completedDeliveries = filteredDeliveries.filter(
    (delivery) => delivery.status === "delivered",
  );
  const run =
    buildDriverRuns(store.deliveries, store.drivers.map(toPublicDriverAccount)).find(
      (item) => item.driver.id === driverId,
    ) ??
    ({
      driver: toPublicDriverAccount(driver),
      effectiveStatus: driver.status,
      activeStops: 0,
      deliveredStops: 0,
      issueStops: 0,
      cashCollected: 0,
      outstandingBalance: 0,
      activeDeliveries: [],
    } satisfies DriverRunSnapshot);

  return {
    driver: toPublicDriverAccount(driver),
    run,
    nextStop: activeDeliveries[0],
    activeDeliveries,
    completedDeliveries,
  };
}

function filterDeliveries(deliveries: DeliveryRecord[], search?: string) {
  const query = normalizeSearch(search);

  if (!query) {
    return deliveries;
  }

  return deliveries.filter((delivery) => {
    const haystack = [
      delivery.trackingCode,
      delivery.clientName,
      delivery.clientPhone,
      delivery.clientEmail,
      delivery.recipientName,
      delivery.recipientPhone,
      delivery.driverName,
      delivery.pickupAddress,
      delivery.dropoffAddress,
      delivery.parcelDescription,
      delivery.zone,
      delivery.status,
      delivery.notes,
      delivery.driverNotes,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

function buildDashboardSnapshot(store: DemoStore, search?: string): DashboardSnapshot {
  const allDeliveries = [...store.deliveries].sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
  const deliveries = filterDeliveries(allDeliveries, search);

  return {
    deliveries,
    adminAccounts: store.adminAccounts
      .map(toPublicAdminAccount)
      .sort((left, right) => left.name.localeCompare(right.name)),
    drivers: store.drivers
      .map(toPublicDriverAccount)
      .sort((left, right) => left.name.localeCompare(right.name)),
    dispatchQueue: buildDispatchQueue(allDeliveries),
    driverRuns: buildDriverRuns(
      allDeliveries,
      store.drivers.map(toPublicDriverAccount),
    ),
    inventory: [...store.inventory].sort((left, right) => left.name.localeCompare(right.name)),
    activity: [...store.activity]
      .sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      )
      .slice(0, 8),
    auditEvents: [...store.auditEvents]
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
      )
      .slice(0, 150),
    inquiries: [...store.inquiries].sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    ),
    clientAccounts: store.clientAccounts
      .map(toPublicClientAccount)
      .sort((left, right) => left.businessName.localeCompare(right.businessName)),
    clients: buildClientSummaries(deliveries).slice(0, 6),
    zones: buildZoneSummaries(deliveries),
    metrics: buildMetrics(deliveries),
  };
}

function buildClientPortalSnapshot(
  store: DemoStore,
  clientId: string,
  search?: string,
): ClientPortalSnapshot | null {
  const clientAccount = store.clientAccounts.find((account) => account.id === clientId);

  if (!clientAccount) {
    return null;
  }

  const clientDeliveries = [...store.deliveries]
    .filter((delivery) => delivery.clientAccountId === clientId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  const filteredDeliveries = filterDeliveries(clientDeliveries, search);

  return {
    client: toPublicClientAccount(clientAccount),
    deliveries: filteredDeliveries,
    metrics: buildClientPortalMetrics(clientDeliveries),
  };
}

function logActivity(store: DemoStore, title: string, detail: string, deliveryId?: string) {
  store.activity.unshift({
    id: `act-${crypto.randomUUID()}`,
    deliveryId,
    title,
    detail,
    timestamp: nowIso(),
  });
  store.activity = store.activity.slice(0, 24);
}

function addAuditEventToDemoStore(store: DemoStore, input: AuditEventInput) {
  store.auditEvents.unshift({
    id: `audit-${crypto.randomUUID()}`,
    requestId: input.requestId,
    entityType: input.entityType,
    entityId: input.entityId,
    deliveryId: input.deliveryId,
    action: input.action,
    summary: input.summary,
    actorType: input.actor.type,
    actorId: input.actor.id,
    actorLabel: input.actor.label,
    outcome: input.outcome ?? "success",
    metadata: input.metadata,
    occurredAt: nowIso(),
  });
  store.auditEvents = store.auditEvents.slice(0, 300);
}

function filterAuditEvents(
  events: AuditEventRecord[],
  options?: {
    search?: string;
    day?: string;
    entityType?: AuditEventRecord["entityType"];
    actorType?: AuditEventRecord["actorType"];
    outcome?: AuditEventRecord["outcome"];
    entityId?: string;
    deliveryId?: string;
  },
) {
  const query = normalizeSearch(options?.search);

  return events.filter((event) => {
    if (options?.entityType && event.entityType !== options.entityType) {
      return false;
    }

    if (options?.actorType && event.actorType !== options.actorType) {
      return false;
    }

    if (options?.outcome && event.outcome !== options.outcome) {
      return false;
    }

    if (options?.entityId && event.entityId !== options.entityId) {
      return false;
    }

    if (options?.deliveryId && event.deliveryId !== options.deliveryId) {
      return false;
    }

    if (options?.day) {
      const eventDay = new Date(event.occurredAt).toISOString().slice(0, 10);

      if (eventDay !== options.day) {
        return false;
      }
    }

    if (!query) {
      return true;
    }

    const haystack = [
      event.action,
      event.summary,
      event.actorLabel,
      event.entityType,
      event.entityId,
      event.deliveryId,
      JSON.stringify(event.metadata ?? {}),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

async function getLiveStore() {
  const supabase = createSupabaseAdminClient();
  const [
    deliveriesResponse,
    adminAccountsResponse,
    driversResponse,
    inventoryResponse,
    activityResponse,
    auditEventsResponse,
    inquiriesResponse,
    clientAccountsResponse,
  ] = await Promise.all([
    supabase.from("delivery_orders").select("*").order("created_at", { ascending: false }),
    supabase.from("admin_accounts").select("*").order("name"),
    supabase.from("drivers").select("*").order("name"),
    supabase.from("inventory_items").select("*").order("item_name"),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
    supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(150),
    supabase.from("business_inquiries").select("*").order("created_at", { ascending: false }),
    supabase.from("client_accounts").select("*").order("business_name"),
  ]);

  if (deliveriesResponse.error) {
    throw deliveriesResponse.error;
  }

  if (driversResponse.error) {
    throw driversResponse.error;
  }

  if (adminAccountsResponse.error) {
    throw adminAccountsResponse.error;
  }

  if (inventoryResponse.error) {
    throw inventoryResponse.error;
  }

  if (activityResponse.error) {
    throw activityResponse.error;
  }

  if (auditEventsResponse.error) {
    throw auditEventsResponse.error;
  }

  if (inquiriesResponse.error) {
    throw inquiriesResponse.error;
  }

  if (clientAccountsResponse.error) {
    throw clientAccountsResponse.error;
  }

  return {
    deliveries: (deliveriesResponse.data ?? []).map(mapDelivery),
    adminAccounts: (adminAccountsResponse.data ?? []).map(mapStoredAdminAccount),
    drivers: (driversResponse.data ?? []).map(mapStoredDriver),
    inventory: (inventoryResponse.data ?? []).map(mapInventory),
    activity: (activityResponse.data ?? []).map(mapActivity),
    auditEvents: (auditEventsResponse.data ?? []).map(mapAuditEvent),
    inquiries: (inquiriesResponse.data ?? []).map(mapInquiry),
    clientAccounts: (clientAccountsResponse.data ?? []).map(mapStoredClientAccount),
  } satisfies DemoStore;
}

export function isLiveRepositoryMode() {
  return hasSupabaseConfig();
}

export async function recordAuditEvent(input: AuditEventInput) {
  if (isDemoMode()) {
    addAuditEventToDemoStore(getDemoStore(), input);
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("audit_events").insert({
    request_id: input.requestId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    delivery_id: input.deliveryId,
    action: input.action,
    summary: input.summary,
    actor_type: input.actor.type,
    actor_id: input.actor.id,
    actor_label: input.actor.label,
    outcome: input.outcome ?? "success",
    metadata: input.metadata ?? {},
  });

  if (error) {
    console.error("audit_events insert failed", error);
  }
}

export async function getAuditTrail(options?: {
  search?: string;
  day?: string;
  entityType?: AuditEventRecord["entityType"];
  actorType?: AuditEventRecord["actorType"];
  outcome?: AuditEventRecord["outcome"];
  entityId?: string;
  deliveryId?: string;
}) {
  const events = isDemoMode()
    ? getDemoStore().auditEvents
    : (await getLiveStore()).auditEvents;

  return filterAuditEvents(
    [...events].sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    ),
    options,
  );
}

export async function getDashboardSnapshot(search?: string) {
  if (isDemoMode()) {
    return buildDashboardSnapshot(getDemoStore(), search);
  }

  return buildDashboardSnapshot(await getLiveStore(), search);
}

export async function getHomeSnapshot() {
  return getDashboardSnapshot();
}

export async function getClientPortalSnapshot(clientId: string, search?: string) {
  if (isDemoMode()) {
    return buildClientPortalSnapshot(getDemoStore(), clientId, search);
  }

  return buildClientPortalSnapshot(await getLiveStore(), clientId, search);
}

export async function getDriverWorkspaceSnapshot(driverId: string, search?: string) {
  if (isDemoMode()) {
    return buildDriverWorkspaceSnapshot(getDemoStore(), driverId, search);
  }

  return buildDriverWorkspaceSnapshot(await getLiveStore(), driverId, search);
}

export async function getClientAccount(clientId: string) {
  if (isDemoMode()) {
    const account = getDemoStore().clientAccounts.find((item) => item.id === clientId);
    return account ? toPublicClientAccount(account) : null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toPublicClientAccount(mapStoredClientAccount(data)) : null;
}

export async function getDriverAccount(driverId: string) {
  if (isDemoMode()) {
    const driver = getDemoStore().drivers.find((item) => item.id === driverId);
    return driver ? toPublicDriverAccount(driver) : null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", driverId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? toPublicDriverAccount(mapStoredDriver(data)) : null;
}

export async function getDriverDetailSnapshot(driverId: string) {
  const store = isDemoMode() ? getDemoStore() : await getLiveStore();
  const driver = store.drivers.find((item) => item.id === driverId);

  if (!driver) {
    return null;
  }

  const deliveries = [...store.deliveries]
    .filter((delivery) => delivery.driverId === driverId)
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  const run =
    buildDriverRuns(store.deliveries, store.drivers.map(toPublicDriverAccount)).find(
      (item) => item.driver.id === driverId,
    ) ??
    ({
      driver: toPublicDriverAccount(driver),
      effectiveStatus: driver.status,
      activeStops: 0,
      deliveredStops: 0,
      issueStops: 0,
      cashCollected: 0,
      outstandingBalance: 0,
      activeDeliveries: [],
    } satisfies DriverRunSnapshot);
  const auditEvents = [...store.auditEvents]
    .filter(
      (event) =>
        (event.entityType === "driver" && event.entityId === driverId) ||
        (event.actorType === "driver" && event.actorId === driverId),
    )
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, 20);

  return {
    driver: toPublicDriverAccount(driver),
    run,
    deliveries,
    activeDeliveries: deliveries.filter((delivery) => isActiveStatus(delivery.status)),
    completedDeliveries: deliveries.filter((delivery) => delivery.status === "delivered"),
    issueDeliveries: deliveries.filter((delivery) => delivery.status === "issue"),
    auditEvents,
  };
}

export interface AuthenticatedAdmin {
  account: AdminAccountRecord;
  source: "account" | "bootstrap";
}

function createBootstrapAdminAccount(): AdminAccountRecord {
  const timestamp = nowIso();

  return {
    id: "bootstrap-owner",
    name: "Bootstrap owner",
    email: getAdminEmail().trim().toLowerCase(),
    role: "owner",
    status: "active",
    createdByLabel: "bootstrap",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AuthenticatedAdmin | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const bootstrapEmail = getAdminEmail().trim().toLowerCase();
  const bootstrapPassword = getAdminPassword();

  if (isDemoMode()) {
    const store = getDemoStore();
    const account = store.adminAccounts.find(
      (item) => normalizeSearch(item.email) === normalizedEmail,
    );

    if (account && account.status === "active" && hasLegacyPasswordHash(account.passwordHash)) {
      const validPassword = await verifyPassword(password, account.passwordHash);

      if (validPassword) {
        const timestamp = nowIso();
        account.lastLoginAt = timestamp;
        account.updatedAt = timestamp;

        return {
          account: toPublicAdminAccount(account),
          source: "account",
        };
      }
    }

    if (normalizedEmail === bootstrapEmail && password === bootstrapPassword) {
      return {
        account: createBootstrapAdminAccount(),
        source: "bootstrap",
      };
    }

    return null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("admin_accounts")
    .select("*")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    const account = mapStoredAdminAccount(data);

    if (account.status === "active") {
      const authUser = await authenticateSupabaseIdentity(account.id, account.email, password);

      if (authUser) {
        const timestamp = nowIso();
        const updatePayload: Record<string, unknown> = {
          last_login_at: timestamp,
          updated_at: timestamp,
        };

        if (hasLegacyPasswordHash(account.passwordHash)) {
          updatePayload.password_hash = null;
        }

        await supabase.from("admin_accounts").update(updatePayload).eq("id", account.id);

        account.lastLoginAt = timestamp;
        account.updatedAt = timestamp;
        account.passwordHash = undefined;

        return {
          account: toPublicAdminAccount(account),
          source: "account",
        };
      }

      if (hasLegacyPasswordHash(account.passwordHash)) {
        const validPassword = await verifyPassword(password, account.passwordHash);

        if (validPassword) {
          await syncSupabaseAuthIdentity({
            id: account.id,
            email: account.email,
            password,
            kind: "admin",
            name: account.name,
            role: account.role,
            status: account.status,
          });

          const timestamp = nowIso();
          await supabase
            .from("admin_accounts")
            .update({
              last_login_at: timestamp,
              updated_at: timestamp,
              password_hash: null,
            })
            .eq("id", account.id);

          account.lastLoginAt = timestamp;
          account.updatedAt = timestamp;
          account.passwordHash = undefined;

          return {
            account: toPublicAdminAccount(account),
            source: "account",
          };
        }
      }
    }
  }

  if (normalizedEmail === bootstrapEmail && password === bootstrapPassword) {
    return {
      account: createBootstrapAdminAccount(),
      source: "bootstrap",
    };
  }

  return null;
}

export async function authenticateClient(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isDemoMode()) {
    const store = getDemoStore();
    const account = store.clientAccounts.find(
      (item) => normalizeSearch(item.email) === normalizedEmail,
    );

    if (!account || account.status !== "active" || !hasLegacyPasswordHash(account.passwordHash)) {
      return null;
    }

    const validPassword = await verifyPassword(password, account.passwordHash);

    if (!validPassword) {
      return null;
    }

    account.lastLoginAt = nowIso();
    account.updatedAt = nowIso();
    return toPublicClientAccount(account);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("client_accounts")
    .select("*")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const account = mapStoredClientAccount(data);

  if (account.status !== "active") {
    return null;
  }

  const authUser = await authenticateSupabaseIdentity(account.id, account.email, password);

  if (authUser) {
    const lastLoginAt = nowIso();
    const updatePayload: Record<string, unknown> = {
      last_login_at: lastLoginAt,
      updated_at: lastLoginAt,
    };

    if (hasLegacyPasswordHash(account.passwordHash)) {
      updatePayload.password_hash = null;
    }

    await supabase.from("client_accounts").update(updatePayload).eq("id", account.id);

    account.lastLoginAt = lastLoginAt;
    account.updatedAt = lastLoginAt;
    account.passwordHash = undefined;
    return toPublicClientAccount(account);
  }

  if (!hasLegacyPasswordHash(account.passwordHash)) {
    return null;
  }

  const validPassword = await verifyPassword(password, account.passwordHash);

  if (!validPassword) {
    return null;
  }

  await syncSupabaseAuthIdentity({
    id: account.id,
    email: account.email,
    password,
    kind: "client",
    contactName: account.contactName,
    businessName: account.businessName,
    phone: account.phone,
    status: account.status,
  });

  const lastLoginAt = nowIso();
  await supabase
    .from("client_accounts")
    .update({
      last_login_at: lastLoginAt,
      updated_at: lastLoginAt,
      password_hash: null,
    })
    .eq("id", account.id);

  account.lastLoginAt = lastLoginAt;
  account.updatedAt = lastLoginAt;
  account.passwordHash = undefined;
  return toPublicClientAccount(account);
}

export async function authenticateDriver(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();

  if (isDemoMode()) {
    const store = getDemoStore();
    const driver = store.drivers.find(
      (item) => normalizeSearch(item.email) === normalizedEmail,
    );

    if (
      !driver ||
      driver.accessStatus !== "active" ||
      !hasLegacyPasswordHash(driver.passwordHash)
    ) {
      return null;
    }

    const validPassword = await verifyPassword(password, driver.passwordHash);

    if (!validPassword) {
      return null;
    }

    driver.lastLoginAt = nowIso();
    return toPublicDriverAccount(driver);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const driver = mapStoredDriver(data);

  if (driver.accessStatus !== "active") {
    return null;
  }

  const authUser = await authenticateSupabaseIdentity(driver.id, driver.email, password);

  if (authUser) {
    const lastLoginAt = nowIso();
    const updatePayload: Record<string, unknown> = {
      last_login_at: lastLoginAt,
      updated_at: lastLoginAt,
    };

    if (hasLegacyPasswordHash(driver.passwordHash)) {
      updatePayload.password_hash = null;
    }

    await supabase.from("drivers").update(updatePayload).eq("id", driver.id);

    driver.lastLoginAt = lastLoginAt;
    driver.passwordHash = undefined;
    return toPublicDriverAccount(driver);
  }

  if (!hasLegacyPasswordHash(driver.passwordHash)) {
    return null;
  }

  const validPassword = await verifyPassword(password, driver.passwordHash);

  if (!validPassword) {
    return null;
  }

  await syncSupabaseAuthIdentity({
    id: driver.id,
    email: driver.email,
    password,
    kind: "driver",
    name: driver.name,
    phone: driver.phone,
    status: driver.accessStatus,
    zone: driver.zone,
    currentRun: driver.currentRun,
  });

  const lastLoginAt = nowIso();
  await supabase
    .from("drivers")
    .update({
      last_login_at: lastLoginAt,
      updated_at: lastLoginAt,
      password_hash: null,
    })
    .eq("id", driver.id);

  driver.lastLoginAt = lastLoginAt;
  driver.passwordHash = undefined;
  return toPublicDriverAccount(driver);
}

export async function submitBusinessInquiry(
  input: BusinessInquiryInput,
  options?: { requestId?: string },
) {
  const timestamp = nowIso();
  const payload: BusinessInquiryRecord = {
    id: crypto.randomUUID(),
    contactName: input.contactName,
    businessName: input.businessName,
    phone: input.phone,
    email: input.email,
    businessAddress: input.businessAddress,
    notes: input.notes,
    status: "new",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  if (isDemoMode()) {
    const store = getDemoStore();
    store.inquiries.unshift(payload);
    logActivity(
      store,
      "Business inquiry received",
      `${payload.businessName} asked for onboarding details.`,
    );
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "business_inquiry",
      entityId: payload.id,
      action: "inquiry.created",
      summary: `${payload.businessName} submitted a new onboarding inquiry.`,
      actor: {
        type: "system",
        label: payload.email,
      },
      metadata: {
        businessName: payload.businessName,
        phone: payload.phone,
      },
    });
    return payload;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("business_inquiries")
    .insert({
      contact_name: payload.contactName,
      business_name: payload.businessName,
      phone: payload.phone,
      email: payload.email,
      business_address: payload.businessAddress,
      notes: payload.notes,
      status: payload.status,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("activity_log").insert({
    title: "Business inquiry received",
    detail: `${payload.businessName} asked for onboarding details.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "business_inquiry",
    entityId: toStringValue(data.id),
    action: "inquiry.created",
    summary: `${payload.businessName} submitted a new onboarding inquiry.`,
    actor: {
      type: "system",
      label: payload.email,
    },
    metadata: {
      businessName: payload.businessName,
      phone: payload.phone,
    },
  });

  return mapInquiry(data);
}

export async function updateBusinessInquiryStatus(
  id: string,
  status: BusinessInquiryStatus,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const inquiry = store.inquiries.find((item) => item.id === id);

    if (!inquiry) {
      return null;
    }

    const before = { ...inquiry };
    inquiry.status = status;
    inquiry.updatedAt = nowIso();
    logActivity(
      store,
      "Inquiry status updated",
      `${inquiry.businessName} moved to ${status}.`,
    );
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "business_inquiry",
      entityId: inquiry.id,
      action: "inquiry.status_updated",
      summary: `${inquiry.businessName} was moved to ${status}.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        changes: buildChangeSet(
          before as unknown as Record<string, unknown>,
          inquiry as unknown as Record<string, unknown>,
          ["status"],
        ),
      },
    });
    return inquiry;
  }

  const supabase = createSupabaseAdminClient();
  const { data: existingInquiryData, error: existingInquiryError } = await supabase
    .from("business_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (existingInquiryError) {
    throw existingInquiryError;
  }

  if (!existingInquiryData) {
    return null;
  }

  const before = mapInquiry(existingInquiryData);
  const updatedAt = nowIso();
  const { data, error } = await supabase
    .from("business_inquiries")
    .update({ status, updated_at: updatedAt })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const mapped = mapInquiry(data);

  await supabase.from("activity_log").insert({
    title: "Inquiry status updated",
    detail: `${toStringValue(data.business_name)} moved to ${status}.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "business_inquiry",
    entityId: id,
    action: "inquiry.status_updated",
    summary: `${toStringValue(data.business_name)} was moved to ${status}.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      changes: buildChangeSet(
        before as unknown as Record<string, unknown>,
        mapped as unknown as Record<string, unknown>,
        ["status"],
      ),
    },
  });

  return mapped;
}

export async function inviteClientFromInquiry(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const temporaryPassword = generateTemporaryPassword();

  if (isDemoMode()) {
    const passwordHash = await hashPassword(temporaryPassword);
    const store = getDemoStore();
    const inquiry = store.inquiries.find((item) => item.id === id);

    if (!inquiry) {
      return null;
    }

    if (inquiry.invitedClientId) {
      throw new Error("This inquiry has already been invited.");
    }

    if (
      store.clientAccounts.some(
        (account) => normalizeSearch(account.email) === normalizeSearch(inquiry.email),
      )
    ) {
      throw new Error("A client account already exists for this email.");
    }

    const timestamp = nowIso();
    const account: StoredClientAccount = {
      id: crypto.randomUUID(),
      contactName: inquiry.contactName,
      businessName: inquiry.businessName,
      email: inquiry.email,
      phone: inquiry.phone,
      businessAddress: inquiry.businessAddress,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
      passwordHash,
    };

    store.clientAccounts.unshift(account);
    inquiry.invitedClientId = account.id;
    inquiry.status = "invited";
    inquiry.updatedAt = timestamp;
    logActivity(
      store,
      "Client portal invitation created",
      `${inquiry.businessName} can now sign in to the client portal.`,
    );
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "client_account",
      entityId: account.id,
      action: "client_account.invited",
      summary: `${inquiry.businessName} was invited into the client portal.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        inquiryId: inquiry.id,
        email: account.email,
      },
    });

    return {
      account: toPublicClientAccount(account),
      temporaryPassword,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: inquiryData, error: inquiryError } = await supabase
    .from("business_inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (inquiryError) {
    throw inquiryError;
  }

  if (!inquiryData) {
    return null;
  }

  const inquiry = mapInquiry(inquiryData);

  if (inquiry.invitedClientId) {
    throw new Error("This inquiry has already been invited.");
  }

  const timestamp = nowIso();
  const clientId = crypto.randomUUID();

  await syncSupabaseAuthIdentity({
    id: clientId,
    email: inquiry.email,
    password: temporaryPassword,
    kind: "client",
    contactName: inquiry.contactName,
    businessName: inquiry.businessName,
    phone: inquiry.phone,
    status: "active",
  });

  const { data: clientData, error: clientError } = await supabase
    .from("client_accounts")
    .insert({
      id: clientId,
      contact_name: inquiry.contactName,
      business_name: inquiry.businessName,
      email: inquiry.email,
      phone: inquiry.phone,
      business_address: inquiry.businessAddress,
      status: "active",
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select()
    .single();

  if (clientError) {
    await deleteSupabaseAuthIdentity(clientId).catch(() => undefined);
    throw clientError;
  }

  const invitedAccount = mapStoredClientAccount(clientData);

  const { error: updateError } = await supabase
    .from("business_inquiries")
    .update({
      invited_client_id: invitedAccount.id,
      status: "invited",
      updated_at: timestamp,
    })
    .eq("id", id);

  if (updateError) {
    const cleanupResult = await supabase.from("client_accounts").delete().eq("id", invitedAccount.id);
    void cleanupResult;
    await deleteSupabaseAuthIdentity(clientId).catch(() => undefined);
    throw updateError;
  }

  await supabase.from("activity_log").insert({
    title: "Client portal invitation created",
    detail: `${inquiry.businessName} can now sign in to the client portal.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "client_account",
    entityId: invitedAccount.id,
    action: "client_account.invited",
    summary: `${inquiry.businessName} was invited into the client portal.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      inquiryId: inquiry.id,
      email: invitedAccount.email,
    },
  });

  return {
    account: toPublicClientAccount(invitedAccount),
    temporaryPassword,
  };
}

function countActiveOwners(accounts: Array<Pick<AdminAccountRecord, "id" | "role" | "status">>) {
  return accounts.filter((account) => account.role === "owner" && account.status === "active")
    .length;
}

function nextAdminState(current: AdminAccountRecord, updates: AdminAccountUpdateInput) {
  return {
    ...current,
    ...updates,
    email: updates.email?.trim().toLowerCase() ?? current.email,
  } satisfies AdminAccountRecord;
}

export async function createAdminAccount(
  input: AdminAccountCreateInput,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const temporaryPassword = generateTemporaryPassword();
  const normalizedEmail = input.email.trim().toLowerCase();
  const timestamp = nowIso();

  if (isDemoMode()) {
    const passwordHash = await hashPassword(temporaryPassword);
    const store = getDemoStore();

    if (
      store.adminAccounts.some(
        (account) => normalizeSearch(account.email) === normalizedEmail,
      )
    ) {
      throw new Error("An admin account already exists for this email.");
    }

    const account: StoredAdminAccount = {
      id: crypto.randomUUID(),
      name: input.name,
      email: normalizedEmail,
      role: input.role,
      status: input.status,
      createdByAdminId: options?.actor?.id,
      createdByLabel: options?.actor?.label,
      createdAt: timestamp,
      updatedAt: timestamp,
      passwordHash,
    };

    store.adminAccounts.unshift(account);
    logActivity(store, "Admin user created", `${account.name} was added with ${account.role} access.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "admin_account",
      entityId: account.id,
      action: "admin_account.created",
      summary: `${account.name} was added with ${account.role} access.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        email: account.email,
        role: account.role,
        status: account.status,
      },
    });

    return {
      account: toPublicAdminAccount(account),
      temporaryPassword,
    };
  }

  const supabase = createSupabaseAdminClient();
  const adminId = crypto.randomUUID();

  await syncSupabaseAuthIdentity({
    id: adminId,
    email: normalizedEmail,
    password: temporaryPassword,
    kind: "admin",
    name: input.name,
    role: input.role,
    status: input.status,
  });

  const { data, error } = await supabase
    .from("admin_accounts")
    .insert({
      id: adminId,
      name: input.name,
      email: normalizedEmail,
      role: input.role,
      status: input.status,
      created_by_admin_id: options?.actor?.id,
      created_by_label: options?.actor?.label,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select()
    .single();

  if (error) {
    await deleteSupabaseAuthIdentity(adminId).catch(() => undefined);
    throw error;
  }

  const account = mapStoredAdminAccount(data);

  await supabase.from("activity_log").insert({
    title: "Admin user created",
    detail: `${account.name} was added with ${account.role} access.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "admin_account",
    entityId: account.id,
    action: "admin_account.created",
    summary: `${account.name} was added with ${account.role} access.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      email: account.email,
      role: account.role,
      status: account.status,
    },
  });

  return {
    account: toPublicAdminAccount(account),
    temporaryPassword,
  };
}

export async function updateAdminAccount(
  id: string,
  updates: AdminAccountUpdateInput,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const account = store.adminAccounts.find((item) => item.id === id);

    if (!account) {
      return null;
    }

    const normalizedEmail = updates.email?.trim().toLowerCase();

    if (
      normalizedEmail &&
      store.adminAccounts.some(
        (item) => item.id !== id && normalizeSearch(item.email) === normalizedEmail,
      )
    ) {
      throw new Error("Another admin account already uses that email.");
    }

    const before = { ...account };
    const next = nextAdminState(account, updates);
    const removingLastActiveOwner =
      account.role === "owner" &&
      account.status === "active" &&
      (next.role !== "owner" || next.status !== "active") &&
      countActiveOwners(store.adminAccounts) <= 1;

    if (removingLastActiveOwner) {
      throw new Error("At least one active owner must remain.");
    }

    if (updates.name !== undefined) account.name = updates.name;
    if (normalizedEmail !== undefined) account.email = normalizedEmail;
    if (updates.role !== undefined) account.role = updates.role;
    if (updates.status !== undefined) account.status = updates.status;
    account.updatedAt = nowIso();

    const changes = buildChangeSet(
      before as unknown as Record<string, unknown>,
      account as unknown as Record<string, unknown>,
      ["name", "email", "role", "status"],
    );

    logActivity(store, "Admin user updated", `${account.name} access settings were updated.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "admin_account",
      entityId: account.id,
      action: "admin_account.updated",
      summary: `${account.name} access settings were updated.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        changes,
      },
    });

    return toPublicAdminAccount(account);
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("admin_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const currentAccount = mapStoredAdminAccount(current);
  const normalizedEmail = updates.email?.trim().toLowerCase();

  if (normalizedEmail) {
    const { data: duplicate, error: duplicateError } = await supabase
      .from("admin_accounts")
      .select("id")
      .ilike("email", normalizedEmail)
      .neq("id", id)
      .maybeSingle();

    if (duplicateError) {
      throw duplicateError;
    }

    if (duplicate) {
      throw new Error("Another admin account already uses that email.");
    }
  }

  const next = nextAdminState(currentAccount, updates);
  const removingLastActiveOwner =
    currentAccount.role === "owner" &&
    currentAccount.status === "active" &&
    (next.role !== "owner" || next.status !== "active");

  if (removingLastActiveOwner) {
    const { count, error: countError } = await supabase
      .from("admin_accounts")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner")
      .eq("status", "active");

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) <= 1) {
      throw new Error("At least one active owner must remain.");
    }
  }

  const payload: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (normalizedEmail !== undefined) payload.email = normalizedEmail;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.status !== undefined) payload.status = updates.status;

  const { data, error } = await supabase
    .from("admin_accounts")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const mappedNext = mapStoredAdminAccount(data);

  await syncSupabaseAuthIdentity({
    id,
    email: mappedNext.email,
    kind: "admin",
    requireExisting: !hasLegacyPasswordHash(currentAccount.passwordHash),
    name: mappedNext.name,
    role: mappedNext.role,
    status: mappedNext.status,
  });

  const changes = buildChangeSet(
    currentAccount as unknown as Record<string, unknown>,
    mappedNext as unknown as Record<string, unknown>,
    ["name", "email", "role", "status"],
  );

  await supabase.from("activity_log").insert({
    title: "Admin user updated",
    detail: `${mappedNext.name} access settings were updated.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "admin_account",
    entityId: id,
    action: "admin_account.updated",
    summary: `${mappedNext.name} access settings were updated.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      changes,
    },
  });

  return toPublicAdminAccount(mappedNext);
}

export async function resetAdminPassword(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const temporaryPassword = generateTemporaryPassword();

  if (isDemoMode()) {
    const passwordHash = await hashPassword(temporaryPassword);
    const store = getDemoStore();
    const account = store.adminAccounts.find((item) => item.id === id);

    if (!account) {
      return null;
    }

    account.passwordHash = passwordHash;
    account.updatedAt = nowIso();
    logActivity(store, "Admin password reset", `${account.name} received a new temporary password.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "admin_account",
      entityId: account.id,
      action: "admin_account.password_reset",
      summary: `${account.name} received a new temporary password.`,
      actor: options?.actor ?? { type: "system", label: "system" },
    });

    return {
      account: toPublicAdminAccount(account),
      temporaryPassword,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("admin_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const currentAccount = mapStoredAdminAccount(current);

  await syncSupabaseAuthIdentity({
    id,
    email: currentAccount.email,
    password: temporaryPassword,
    kind: "admin",
    name: currentAccount.name,
    role: currentAccount.role,
    status: currentAccount.status,
  });

  const { data, error } = await supabase
    .from("admin_accounts")
    .update({
      password_hash: null,
      updated_at: nowIso(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const account = mapStoredAdminAccount(data);
  account.passwordHash = undefined;

  await supabase.from("activity_log").insert({
    title: "Admin password reset",
    detail: `${account.name} received a new temporary password.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "admin_account",
    entityId: id,
    action: "admin_account.password_reset",
    summary: `${account.name} received a new temporary password.`,
    actor: options?.actor ?? { type: "system", label: "system" },
  });

  return {
    account: toPublicAdminAccount(account),
    temporaryPassword,
  };
}

export async function deleteAdminAccount(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (options?.actor?.id && options.actor.id === id) {
    throw new Error("You cannot delete your own admin account while signed in.");
  }

  if (isDemoMode()) {
    const store = getDemoStore();
    const accountIndex = store.adminAccounts.findIndex((item) => item.id === id);

    if (accountIndex < 0) {
      return null;
    }

    const account = store.adminAccounts[accountIndex];

    if (
      account.role === "owner" &&
      account.status === "active" &&
      countActiveOwners(store.adminAccounts) <= 1
    ) {
      throw new Error("At least one active owner must remain.");
    }

    store.adminAccounts.splice(accountIndex, 1);
    logActivity(store, "Admin user removed", `${account.name} was removed from admin access.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "admin_account",
      entityId: id,
      action: "admin_account.deleted",
      summary: `${account.name} was removed from admin access.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        email: account.email,
        role: account.role,
      },
    });

    return toPublicAdminAccount(account);
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("admin_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const account = mapStoredAdminAccount(current);

  if (account.role === "owner" && account.status === "active") {
    const { count, error: countError } = await supabase
      .from("admin_accounts")
      .select("*", { count: "exact", head: true })
      .eq("role", "owner")
      .eq("status", "active");

    if (countError) {
      throw countError;
    }

    if ((count ?? 0) <= 1) {
      throw new Error("At least one active owner must remain.");
    }
  }

  const { error } = await supabase.from("admin_accounts").delete().eq("id", id);

  if (error) {
    throw error;
  }

  await deleteSupabaseAuthIdentity(id).catch(() => undefined);

  await supabase.from("activity_log").insert({
    title: "Admin user removed",
    detail: `${account.name} was removed from admin access.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "admin_account",
    entityId: id,
    action: "admin_account.deleted",
    summary: `${account.name} was removed from admin access.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      email: account.email,
      role: account.role,
    },
  });

  return toPublicAdminAccount(account);
}

export async function createClientAccount(
  input: ClientAccountCreateInput,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const temporaryPassword = generateTemporaryPassword();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (isDemoMode()) {
    const passwordHash = await hashPassword(temporaryPassword);
    const store = getDemoStore();

    if (
      store.clientAccounts.some(
        (account) => normalizeSearch(account.email) === normalizedEmail,
      )
    ) {
      throw new Error("A client account already exists for this email.");
    }

    const timestamp = nowIso();
    const account: StoredClientAccount = {
      id: crypto.randomUUID(),
      contactName: input.contactName,
      businessName: input.businessName,
      email: normalizedEmail,
      phone: input.phone,
      businessAddress: input.businessAddress,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
      passwordHash,
    };

    store.clientAccounts.unshift(account);
    logActivity(
      store,
      "Client account created",
      `${account.businessName} was added directly to the client portal.`,
    );
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "client_account",
      entityId: account.id,
      action: "client_account.created",
      summary: `${account.businessName} was created directly in the client portal.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        email: account.email,
        status: account.status,
        source: "admin_direct_create",
      },
    });

    return {
      account: toPublicClientAccount(account),
      temporaryPassword,
    };
  }

  const supabase = createSupabaseAdminClient();
  const timestamp = nowIso();
  const clientId = crypto.randomUUID();

  await syncSupabaseAuthIdentity({
    id: clientId,
    email: normalizedEmail,
    password: temporaryPassword,
    kind: "client",
    contactName: input.contactName,
    businessName: input.businessName,
    phone: input.phone,
    status: input.status,
  });

  const { data, error } = await supabase
    .from("client_accounts")
    .insert({
      id: clientId,
      contact_name: input.contactName,
      business_name: input.businessName,
      email: normalizedEmail,
      phone: input.phone,
      business_address: input.businessAddress,
      status: input.status,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select()
    .single();

  if (error) {
    await deleteSupabaseAuthIdentity(clientId).catch(() => undefined);
    throw error;
  }

  const account = mapStoredClientAccount(data);

  await supabase.from("activity_log").insert({
    title: "Client account created",
    detail: `${account.businessName} was added directly to the client portal.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "client_account",
    entityId: account.id,
    action: "client_account.created",
    summary: `${account.businessName} was created directly in the client portal.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      email: account.email,
      status: account.status,
      source: "admin_direct_create",
    },
  });

  return {
    account: toPublicClientAccount(account),
    temporaryPassword,
  };
}

export async function createDriverAccount(
  input: DriverUpsertInput,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const temporaryPassword = generateTemporaryPassword();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (isDemoMode()) {
    const passwordHash = await hashPassword(temporaryPassword);
    const store = getDemoStore();

    if (
      store.drivers.some(
        (driver) =>
          normalizeSearch(driver.email) === normalizedEmail ||
          driver.phone === input.phone,
      )
    ) {
      throw new Error("A driver already exists with that email or phone.");
    }

    const driver: StoredDriverRecord = {
      id: crypto.randomUUID(),
      name: input.name,
      phone: input.phone,
      email: normalizedEmail,
      zone: input.zone,
      status: input.status,
      accessStatus: input.accessStatus,
      currentRun: input.currentRun,
      todayDeliveries: 0,
      cashOnHand: input.cashOnHand ?? 0,
      passwordHash,
    };

    store.drivers.unshift(driver);
    logActivity(store, "Driver added", `${driver.name} was added to the ${driver.zone} route.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "driver",
      entityId: driver.id,
      action: "driver.created",
      summary: `${driver.name} was added to the driver roster.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        zone: driver.zone,
        email: driver.email,
      },
    });

    return {
      driver: toPublicDriverAccount(driver),
      temporaryPassword,
    };
  }

  const supabase = createSupabaseAdminClient();
  const timestamp = nowIso();
  const driverId = crypto.randomUUID();

  await syncSupabaseAuthIdentity({
    id: driverId,
    email: normalizedEmail,
    password: temporaryPassword,
    kind: "driver",
    name: input.name,
    phone: input.phone,
    status: input.accessStatus,
    zone: input.zone,
    currentRun: input.currentRun,
  });

  const { data, error } = await supabase
    .from("drivers")
    .insert({
      id: driverId,
      name: input.name,
      phone: input.phone,
      email: normalizedEmail,
      zone: input.zone,
      status: input.status,
      access_status: input.accessStatus,
      current_run: input.currentRun,
      today_deliveries: 0,
      cash_on_hand: input.cashOnHand ?? 0,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select()
    .single();

  if (error) {
    await deleteSupabaseAuthIdentity(driverId).catch(() => undefined);
    throw error;
  }

  await supabase.from("activity_log").insert({
    title: "Driver added",
    detail: `${input.name} was added to the ${input.zone} route.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "driver",
    entityId: toStringValue(data.id),
    action: "driver.created",
    summary: `${input.name} was added to the driver roster.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      zone: input.zone,
      email: normalizedEmail,
    },
  });

  return {
    driver: toPublicDriverAccount(mapStoredDriver(data)),
    temporaryPassword,
  };
}

export async function updateDriverAccount(
  id: string,
  updates: Partial<DriverUpsertInput>,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const driver = store.drivers.find((item) => item.id === id);

    if (!driver) {
      return null;
    }

    const normalizedEmail = updates.email?.trim().toLowerCase();

    if (
      normalizedEmail &&
      store.drivers.some(
        (item) => item.id !== id && normalizeSearch(item.email) === normalizedEmail,
      )
    ) {
      throw new Error("Another driver already uses that email.");
    }

    if (
      updates.phone &&
      store.drivers.some((item) => item.id !== id && item.phone === updates.phone)
    ) {
      throw new Error("Another driver already uses that phone number.");
    }

    const before = { ...driver };
    if (updates.name !== undefined) driver.name = updates.name;
    if (updates.phone !== undefined) driver.phone = updates.phone;
    if (normalizedEmail !== undefined) driver.email = normalizedEmail;
    if (updates.zone !== undefined) driver.zone = updates.zone;
    if (updates.status !== undefined) driver.status = updates.status;
    if (updates.accessStatus !== undefined) driver.accessStatus = updates.accessStatus;
    if (updates.currentRun !== undefined) driver.currentRun = updates.currentRun;
    if (updates.cashOnHand !== undefined) driver.cashOnHand = updates.cashOnHand;

    const changes = buildChangeSet(
      before as unknown as Record<string, unknown>,
      driver as unknown as Record<string, unknown>,
      [
      "name",
      "phone",
      "email",
      "zone",
      "status",
      "accessStatus",
      "currentRun",
      "cashOnHand",
      ],
    );

    logActivity(store, "Driver updated", `${driver.name} profile was updated.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "driver",
      entityId: driver.id,
      action: "driver.updated",
      summary: `${driver.name} profile was updated.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        changes,
      },
    });

    return toPublicDriverAccount(driver);
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const normalizedEmail = updates.email?.trim().toLowerCase();
  const payload: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (normalizedEmail !== undefined) payload.email = normalizedEmail;
  if (updates.zone !== undefined) payload.zone = updates.zone;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.accessStatus !== undefined) payload.access_status = updates.accessStatus;
  if (updates.currentRun !== undefined) payload.current_run = updates.currentRun;
  if (updates.cashOnHand !== undefined) payload.cash_on_hand = updates.cashOnHand;

  const { data, error } = await supabase
    .from("drivers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const mappedCurrent = mapStoredDriver(current);
  const mappedNext = mapStoredDriver(data);

  await syncSupabaseAuthIdentity({
    id,
    email: mappedNext.email,
    kind: "driver",
    requireExisting: !hasLegacyPasswordHash(mappedCurrent.passwordHash),
    name: mappedNext.name,
    phone: mappedNext.phone,
    status: mappedNext.accessStatus,
    zone: mappedNext.zone,
    currentRun: mappedNext.currentRun,
  });

  const changes = buildChangeSet(
    mappedCurrent as unknown as Record<string, unknown>,
    mappedNext as unknown as Record<string, unknown>,
    ["name", "phone", "email", "zone", "status", "accessStatus", "currentRun", "cashOnHand"],
  );

  await supabase.from("activity_log").insert({
    title: "Driver updated",
    detail: `${mappedNext.name} profile was updated.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "driver",
    entityId: id,
    action: "driver.updated",
    summary: `${mappedNext.name} profile was updated.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      changes,
    },
  });

  return toPublicDriverAccount(mappedNext);
}

export async function resetDriverPassword(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const temporaryPassword = generateTemporaryPassword();

  if (isDemoMode()) {
    const passwordHash = await hashPassword(temporaryPassword);
    const store = getDemoStore();
    const driver = store.drivers.find((item) => item.id === id);

    if (!driver) {
      return null;
    }

    driver.passwordHash = passwordHash;
    logActivity(store, "Driver password reset", `${driver.name} received a new temporary password.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "driver",
      entityId: driver.id,
      action: "driver.password_reset",
      summary: `${driver.name} received a new temporary password.`,
      actor: options?.actor ?? { type: "system", label: "system" },
    });

    return {
      driver: toPublicDriverAccount(driver),
      temporaryPassword,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const currentDriver = mapStoredDriver(current);

  await syncSupabaseAuthIdentity({
    id,
    email: currentDriver.email,
    password: temporaryPassword,
    kind: "driver",
    name: currentDriver.name,
    phone: currentDriver.phone,
    status: currentDriver.accessStatus,
    zone: currentDriver.zone,
    currentRun: currentDriver.currentRun,
  });

  const { data, error } = await supabase
    .from("drivers")
    .update({
      password_hash: null,
      updated_at: nowIso(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const driver = mapStoredDriver(data);
  driver.passwordHash = undefined;

  await supabase.from("activity_log").insert({
    title: "Driver password reset",
    detail: `${driver.name} received a new temporary password.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "driver",
    entityId: id,
    action: "driver.password_reset",
    summary: `${driver.name} received a new temporary password.`,
    actor: options?.actor ?? { type: "system", label: "system" },
  });

  return {
    driver: toPublicDriverAccount(driver),
    temporaryPassword,
  };
}

export async function deleteDriverAccount(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const driverIndex = store.drivers.findIndex((item) => item.id === id);

    if (driverIndex < 0) {
      return null;
    }

    if (hasBlockingDriverAssignments(store.deliveries, id)) {
      throw new Error("This driver still has assigned stops. Unassign those orders first.");
    }

    const driver = store.drivers[driverIndex];
    for (const delivery of store.deliveries) {
      if (delivery.driverId === id) {
        delivery.driverId = undefined;
      }
    }

    store.drivers.splice(driverIndex, 1);
    logActivity(store, "Driver removed", `${driver.name} was removed from the driver roster.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "driver",
      entityId: id,
      action: "driver.deleted",
      summary: `${driver.name} was removed from the driver roster.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        email: driver.email,
        zone: driver.zone,
      },
    });

    return toPublicDriverAccount(driver);
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const { count, error: countError } = await supabase
    .from("delivery_orders")
    .select("*", { count: "exact", head: true })
    .eq("driver_id", id)
    .neq("status", "delivered");

  if (countError) {
    throw countError;
  }

  if ((count ?? 0) > 0) {
    throw new Error("This driver still has assigned stops. Unassign those orders first.");
  }

  const driver = mapStoredDriver(current);

  const { error: clearDeliveriesError } = await supabase
    .from("delivery_orders")
    .update({
      driver_id: null,
      updated_at: nowIso(),
    })
    .eq("driver_id", id);

  if (clearDeliveriesError) {
    throw clearDeliveriesError;
  }

  const { error } = await supabase.from("drivers").delete().eq("id", id);

  if (error) {
    throw error;
  }

  await deleteSupabaseAuthIdentity(id).catch(() => undefined);

  await supabase.from("activity_log").insert({
    title: "Driver removed",
    detail: `${driver.name} was removed from the driver roster.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "driver",
    entityId: id,
    action: "driver.deleted",
    summary: `${driver.name} was removed from the driver roster.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      email: driver.email,
      zone: driver.zone,
    },
  });

  return toPublicDriverAccount(driver);
}

export async function updateClientAccount(
  id: string,
  updates: ClientAccountUpdateInput,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const account = store.clientAccounts.find((item) => item.id === id);

    if (!account) {
      return null;
    }

    const before = { ...account };
    if (updates.status !== undefined) {
      account.status = updates.status;
      account.updatedAt = nowIso();
    }

    const changes = buildChangeSet(
      before as unknown as Record<string, unknown>,
      account as unknown as Record<string, unknown>,
      ["status"],
    );

    logActivity(store, "Client account updated", `${account.businessName} account access changed.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "client_account",
      entityId: account.id,
      action: "client_account.updated",
      summary: `${account.businessName} account access changed.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        changes,
      },
    });

    return toPublicClientAccount(account);
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const payload: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  const { data, error } = await supabase
    .from("client_accounts")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const mappedCurrent = mapStoredClientAccount(current);
  const mappedNext = mapStoredClientAccount(data);

  await syncSupabaseAuthIdentity({
    id,
    email: mappedNext.email,
    kind: "client",
    requireExisting: !hasLegacyPasswordHash(mappedCurrent.passwordHash),
    contactName: mappedNext.contactName,
    businessName: mappedNext.businessName,
    phone: mappedNext.phone,
    status: mappedNext.status,
  });

  const changes = buildChangeSet(
    mappedCurrent as unknown as Record<string, unknown>,
    mappedNext as unknown as Record<string, unknown>,
    ["status"],
  );

  await supabase.from("activity_log").insert({
    title: "Client account updated",
    detail: `${mappedNext.businessName} account access changed.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "client_account",
    entityId: id,
    action: "client_account.updated",
    summary: `${mappedNext.businessName} account access changed.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      changes,
    },
  });

  return toPublicClientAccount(mappedNext);
}

export async function resetClientPassword(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const temporaryPassword = generateTemporaryPassword();

  if (isDemoMode()) {
    const passwordHash = await hashPassword(temporaryPassword);
    const store = getDemoStore();
    const account = store.clientAccounts.find((item) => item.id === id);

    if (!account) {
      return null;
    }

    account.passwordHash = passwordHash;
    account.updatedAt = nowIso();
    logActivity(store, "Client password reset", `${account.businessName} received a new temporary password.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "client_account",
      entityId: account.id,
      action: "client_account.password_reset",
      summary: `${account.businessName} received a new temporary password.`,
      actor: options?.actor ?? { type: "system", label: "system" },
    });

    return {
      account: toPublicClientAccount(account),
      temporaryPassword,
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const currentAccount = mapStoredClientAccount(current);

  await syncSupabaseAuthIdentity({
    id,
    email: currentAccount.email,
    password: temporaryPassword,
    kind: "client",
    contactName: currentAccount.contactName,
    businessName: currentAccount.businessName,
    phone: currentAccount.phone,
    status: currentAccount.status,
  });

  const { data, error } = await supabase
    .from("client_accounts")
    .update({
      password_hash: null,
      updated_at: nowIso(),
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const account = mapStoredClientAccount(data);
  account.passwordHash = undefined;

  await supabase.from("activity_log").insert({
    title: "Client password reset",
    detail: `${account.businessName} received a new temporary password.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "client_account",
    entityId: id,
    action: "client_account.password_reset",
    summary: `${account.businessName} received a new temporary password.`,
    actor: options?.actor ?? { type: "system", label: "system" },
  });

  return {
    account: toPublicClientAccount(account),
    temporaryPassword,
  };
}

export async function deleteClientAccount(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const accountIndex = store.clientAccounts.findIndex((item) => item.id === id);

    if (accountIndex < 0) {
      return null;
    }

    if (hasClientDeliveryHistory(store.deliveries, id)) {
      throw new Error("This client has delivery history. Pause access instead of deleting it.");
    }

    const account = store.clientAccounts[accountIndex];
    store.clientAccounts.splice(accountIndex, 1);

    store.inquiries = store.inquiries.map((inquiry) =>
      inquiry.invitedClientId === id
        ? {
            ...inquiry,
            invitedClientId: undefined,
            updatedAt: nowIso(),
          }
        : inquiry,
    );

    logActivity(store, "Client account removed", `${account.businessName} portal access was removed.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "client_account",
      entityId: id,
      action: "client_account.deleted",
      summary: `${account.businessName} portal access was removed.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        email: account.email,
      },
    });

    return toPublicClientAccount(account);
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("client_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const { count, error: countError } = await supabase
    .from("delivery_orders")
    .select("*", { count: "exact", head: true })
    .eq("client_account_id", id);

  if (countError) {
    throw countError;
  }

  if ((count ?? 0) > 0) {
    throw new Error("This client has delivery history. Pause access instead of deleting it.");
  }

  const account = mapStoredClientAccount(current);
  const { error } = await supabase.from("client_accounts").delete().eq("id", id);

  if (error) {
    throw error;
  }

  await deleteSupabaseAuthIdentity(id).catch(() => undefined);

  await supabase.from("activity_log").insert({
    title: "Client account removed",
    detail: `${account.businessName} portal access was removed.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "client_account",
    entityId: id,
    action: "client_account.deleted",
    summary: `${account.businessName} portal access was removed.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      email: account.email,
    },
  });

  return toPublicClientAccount(account);
}

export async function createInventoryItem(
  input: InventoryItemInput,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();

    if (
      store.inventory.some((item) => item.name.toLowerCase() === input.name.toLowerCase())
    ) {
      throw new Error("An inventory item with that name already exists.");
    }

    const item: InventoryItem = {
      id: crypto.randomUUID(),
      name: input.name,
      availableUnits: input.availableUnits,
      reservedUnits: input.reservedUnits,
      reorderPoint: input.reorderPoint,
      location: input.location,
      health: input.health,
    };

    store.inventory.unshift(item);
    logActivity(store, "Inventory item added", `${item.name} was added to inventory.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "inventory_item",
      entityId: item.id,
      action: "inventory_item.created",
      summary: `${item.name} was added to inventory.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        location: item.location,
      },
    });

    return item;
  }

  const supabase = createSupabaseAdminClient();
  const timestamp = nowIso();
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      item_name: input.name,
      available_units: input.availableUnits,
      reserved_units: input.reservedUnits,
      reorder_point: input.reorderPoint,
      location: input.location,
      health: input.health,
      created_at: timestamp,
      updated_at: timestamp,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("activity_log").insert({
    title: "Inventory item added",
    detail: `${input.name} was added to inventory.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "inventory_item",
    entityId: toStringValue(data.id),
    action: "inventory_item.created",
    summary: `${input.name} was added to inventory.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      location: input.location,
    },
  });

  return mapInventory(data);
}

export async function updateInventoryItem(
  id: string,
  updates: Partial<InventoryItemInput>,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const item = store.inventory.find((entry) => entry.id === id);

    if (!item) {
      return null;
    }

    const before = { ...item };
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.availableUnits !== undefined) item.availableUnits = updates.availableUnits;
    if (updates.reservedUnits !== undefined) item.reservedUnits = updates.reservedUnits;
    if (updates.reorderPoint !== undefined) item.reorderPoint = updates.reorderPoint;
    if (updates.location !== undefined) item.location = updates.location;
    if (updates.health !== undefined) item.health = updates.health;

    const changes = buildChangeSet(
      before as unknown as Record<string, unknown>,
      item as unknown as Record<string, unknown>,
      [
      "name",
      "availableUnits",
      "reservedUnits",
      "reorderPoint",
      "location",
      "health",
      ],
    );

    logActivity(store, "Inventory item updated", `${item.name} inventory values changed.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "inventory_item",
      entityId: item.id,
      action: "inventory_item.updated",
      summary: `${item.name} inventory values changed.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        changes,
      },
    });

    return item;
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const payload: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (updates.name !== undefined) payload.item_name = updates.name;
  if (updates.availableUnits !== undefined) payload.available_units = updates.availableUnits;
  if (updates.reservedUnits !== undefined) payload.reserved_units = updates.reservedUnits;
  if (updates.reorderPoint !== undefined) payload.reorder_point = updates.reorderPoint;
  if (updates.location !== undefined) payload.location = updates.location;
  if (updates.health !== undefined) payload.health = updates.health;

  const { data, error } = await supabase
    .from("inventory_items")
    .update(payload)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const mappedCurrent = mapInventory(current);
  const mappedNext = mapInventory(data);
  const changes = buildChangeSet(
    mappedCurrent as unknown as Record<string, unknown>,
    mappedNext as unknown as Record<string, unknown>,
    ["name", "availableUnits", "reservedUnits", "reorderPoint", "location", "health"],
  );

  await supabase.from("activity_log").insert({
    title: "Inventory item updated",
    detail: `${mappedNext.name} inventory values changed.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "inventory_item",
    entityId: id,
    action: "inventory_item.updated",
    summary: `${mappedNext.name} inventory values changed.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      changes,
    },
  });

  return mappedNext;
}

export async function deleteInventoryItem(
  id: string,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const itemIndex = store.inventory.findIndex((entry) => entry.id === id);

    if (itemIndex < 0) {
      return null;
    }

    const [item] = store.inventory.splice(itemIndex, 1);
    logActivity(store, "Inventory item removed", `${item.name} was removed from inventory.`);
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "inventory_item",
      entityId: id,
      action: "inventory_item.deleted",
      summary: `${item.name} was removed from inventory.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        location: item.location,
      },
    });

    return item;
  }

  const supabase = createSupabaseAdminClient();
  const { data: current, error: currentError } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentError) {
    throw currentError;
  }

  if (!current) {
    return null;
  }

  const item = mapInventory(current);
  const { error } = await supabase.from("inventory_items").delete().eq("id", id);

  if (error) {
    throw error;
  }

  await supabase.from("activity_log").insert({
    title: "Inventory item removed",
    detail: `${item.name} was removed from inventory.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "inventory_item",
    entityId: id,
    action: "inventory_item.deleted",
    summary: `${item.name} was removed from inventory.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      location: item.location,
    },
  });

  return item;
}

export async function bulkAssignDeliveries(
  deliveryIds: string[],
  driverId: string | null,
  status: DeliveryRecord["status"] = "queued",
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const updates = await Promise.all(
    deliveryIds.map((deliveryId) =>
      updateDelivery(
        deliveryId,
        {
          driverId,
          status,
        },
        options,
      ),
    ),
  );

  return updates.filter(Boolean) as DeliveryRecord[];
}

export async function createDeliveryRequest(
  input: DeliveryIntakeInput,
  clientAccount?: ClientAccountRecord,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const createdAt = nowIso();
  const payload: DeliveryRecord = {
    id: crypto.randomUUID(),
    clientAccountId: clientAccount?.id,
    trackingCode: trackCode(),
    clientName: clientAccount?.businessName ?? input.clientName,
    clientPhone: clientAccount?.phone ?? input.clientPhone,
    clientEmail: clientAccount?.email ?? input.clientEmail,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    pickupAddress: input.pickupAddress,
    dropoffAddress: input.dropoffAddress,
    parcelDescription: input.parcelDescription,
    itemCount: input.itemCount,
    declaredValue: input.declaredValue,
    quotedPrice: input.quotedPrice,
    amountPaid: 0,
    paymentMethod: input.paymentMethod,
    paymentStatus: "unpaid",
    zone: input.zone,
    status: "new",
    priority: input.priority,
    scheduledFor: input.scheduledFor,
    eta: input.scheduledFor,
    notes: input.notes,
    createdAt,
    updatedAt: createdAt,
  };

  if (isDemoMode()) {
    const store = getDemoStore();
    store.deliveries.unshift(payload);
    logActivity(
      store,
      "New client delivery submitted",
      `${payload.clientName} created ${payload.trackingCode} for ${payload.zone} dispatch.`,
      payload.id,
    );
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "delivery",
      entityId: payload.id,
      deliveryId: payload.id,
      action: "delivery.created",
      summary: `${payload.clientName} submitted ${payload.trackingCode} for ${payload.zone} dispatch.`,
      actor:
        options?.actor ??
        (clientAccount
          ? {
              type: "client",
              id: clientAccount.id,
              label: clientAccount.email,
            }
          : {
              type: "system",
              label: payload.clientEmail ?? payload.clientName,
            }),
      metadata: {
        trackingCode: payload.trackingCode,
        zone: payload.zone,
        priority: payload.priority,
      },
    });
    return payload;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("delivery_orders")
    .insert({
      client_account_id: payload.clientAccountId,
      tracking_code: payload.trackingCode,
      client_name: payload.clientName,
      client_phone: payload.clientPhone,
      client_email: payload.clientEmail,
      recipient_name: payload.recipientName,
      recipient_phone: payload.recipientPhone,
      pickup_address: payload.pickupAddress,
      dropoff_address: payload.dropoffAddress,
      parcel_description: payload.parcelDescription,
      item_count: payload.itemCount,
      declared_value: payload.declaredValue,
      quoted_price: payload.quotedPrice,
      amount_paid: payload.amountPaid,
      payment_method: payload.paymentMethod,
      payment_status: payload.paymentStatus,
      dispatch_zone: payload.zone,
      status: payload.status,
      priority: payload.priority,
      scheduled_for: payload.scheduledFor,
      eta: payload.eta,
      notes: payload.notes,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  await supabase.from("activity_log").insert({
    delivery_id: data.id,
    title: "New client delivery submitted",
    detail: `${payload.clientName} created ${payload.trackingCode} for ${payload.zone} dispatch.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "delivery",
    entityId: toStringValue(data.id),
    deliveryId: toStringValue(data.id),
    action: "delivery.created",
    summary: `${payload.clientName} submitted ${payload.trackingCode} for ${payload.zone} dispatch.`,
    actor:
      options?.actor ??
      (clientAccount
        ? {
            type: "client",
            id: clientAccount.id,
            label: clientAccount.email,
          }
        : {
            type: "system",
            label: payload.clientEmail ?? payload.clientName,
          }),
    metadata: {
      trackingCode: payload.trackingCode,
      zone: payload.zone,
      priority: payload.priority,
    },
  });

  return mapDelivery(data);
}

export async function findTrackingRecord(query: string, clientAccountId?: string) {
  const normalized = query.trim();

  if (!normalized) {
    return null;
  }

  if (isDemoMode()) {
    const deliveries = getDemoStore().deliveries.filter((delivery) =>
      clientAccountId ? delivery.clientAccountId === clientAccountId : true,
    );

    return (
      deliveries.find(
        (delivery) =>
          delivery.trackingCode.toLowerCase() === normalized.toLowerCase() ||
          delivery.clientPhone.replaceAll(/\D/g, "").includes(normalized.replaceAll(/\D/g, "")),
      ) ?? null
    );
  }

  const supabase = createSupabaseAdminClient();

  if (normalized.toUpperCase().startsWith("RG-")) {
    let exactTracking = supabase
      .from("delivery_orders")
      .select("*")
      .eq("tracking_code", normalized.toUpperCase());

    if (clientAccountId) {
      exactTracking = exactTracking.eq("client_account_id", clientAccountId);
    }

    const result = await exactTracking.maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data ? mapDelivery(result.data) : null;
  }

  const digitsOnly = normalized.replaceAll(/\D/g, "");
  let phoneLookup = supabase
    .from("delivery_orders")
    .select("*")
    .ilike("client_phone", `%${digitsOnly}%`)
    .order("created_at", { ascending: false })
    .limit(1);

  if (clientAccountId) {
    phoneLookup = phoneLookup.eq("client_account_id", clientAccountId);
  }

  const result = await phoneLookup.maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return result.data ? mapDelivery(result.data) : null;
}

export async function getDeliveryWorkspaceSnapshot(
  id: string,
): Promise<DeliveryWorkspaceSnapshot | null> {
  const store = isDemoMode() ? getDemoStore() : await getLiveStore();
  const delivery = store.deliveries.find((item) => item.id === id);

  if (!delivery) {
    return null;
  }

  const auditEvents = [...store.auditEvents]
    .filter(
      (event) =>
        event.deliveryId === delivery.id ||
        (event.entityType === "delivery" && event.entityId === delivery.id),
    )
    .sort(
      (left, right) =>
        new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
    )
    .slice(0, 24);

  const relatedDeliveries = [...store.deliveries]
    .filter(
      (item) => item.clientName === delivery.clientName && item.id !== delivery.id,
    )
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )
    .slice(0, 6);

  const zoneQueue = [...store.deliveries]
    .filter(
      (item) =>
        item.zone === delivery.zone &&
        item.id !== delivery.id &&
        (item.status === "new" ||
          item.status === "queued" ||
          item.status === "issue" ||
          isActiveStatus(item.status)),
    )
    .sort(
      (left, right) =>
        new Date(left.scheduledFor).getTime() - new Date(right.scheduledFor).getTime(),
    )
    .slice(0, 8);

  return {
    delivery,
    drivers: store.drivers.map(toPublicDriverAccount),
    auditEvents,
    relatedDeliveries,
    zoneQueue,
  };
}

export async function getDeliveryRecord(id: string) {
  if (isDemoMode()) {
    return getDemoStore().deliveries.find((delivery) => delivery.id === id) ?? null;
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("delivery_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapDelivery(data) : null;
}

export async function updateDelivery(
  id: string,
  updates: DeliveryUpdateInput,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const delivery = store.deliveries.find((item) => item.id === id);

    if (!delivery) {
      return null;
    }

    const before = { ...delivery };

    if (typeof updates.driverId === "string") {
      const driver = store.drivers.find((item) => item.id === updates.driverId);
      delivery.driverId = driver?.id;
      delivery.driverName = driver?.name;
      delivery.zone = driver?.zone ?? delivery.zone;
      delivery.status =
        updates.status ?? (delivery.status === "new" ? "queued" : delivery.status);
    }

    if (updates.driverId === null) {
      delivery.driverId = undefined;
      delivery.driverName = undefined;
    }

    if (updates.status) {
      delivery.status = updates.status;
    }

    if (updates.zone) {
      delivery.zone = updates.zone;
    }

    if (typeof updates.amountPaid === "number") {
      delivery.amountPaid = updates.amountPaid;
    }

    if (updates.paymentStatus || typeof updates.amountPaid === "number") {
      delivery.paymentStatus = toPaymentStatus(
        delivery.amountPaid,
        delivery.quotedPrice,
        updates.paymentStatus,
      );
    }

    if (updates.notes !== undefined) {
      delivery.notes = updates.notes ?? undefined;
    }

    if (updates.driverNotes !== undefined) {
      delivery.driverNotes = updates.driverNotes ?? undefined;
    }

    delivery.updatedAt = nowIso();

    const detailParts = [
      updates.status ? `status ${updates.status.replaceAll("_", " ")}` : null,
      typeof updates.driverId === "string" && delivery.driverName
        ? `driver ${delivery.driverName}`
        : updates.driverId === null
          ? "driver cleared"
          : null,
      updates.zone ? `zone ${updates.zone}` : null,
      updates.paymentStatus ? `payment ${updates.paymentStatus}` : null,
      typeof updates.amountPaid === "number" ? `paid ${delivery.amountPaid}` : null,
      updates.notes === null ? "notes cleared" : null,
      updates.driverNotes !== undefined ? "driver notes updated" : null,
    ].filter(Boolean);
    const changes = buildChangeSet(
      before as Record<string, unknown>,
      delivery as unknown as Record<string, unknown>,
      [
        "status",
        "paymentStatus",
        "amountPaid",
        "zone",
        "driverId",
        "driverName",
        "notes",
        "driverNotes",
      ],
    );

    logActivity(
      store,
      "Delivery updated",
      `${delivery.trackingCode} changed: ${detailParts.join(", ") || "notes updated"}.`,
      delivery.id,
    );
    addAuditEventToDemoStore(store, {
      requestId: options?.requestId,
      entityType: "delivery",
      entityId: delivery.id,
      deliveryId: delivery.id,
      action: "delivery.updated",
      summary: `${delivery.trackingCode} changed: ${detailParts.join(", ") || "notes updated"}.`,
      actor: options?.actor ?? { type: "system", label: "system" },
      metadata: {
        trackingCode: delivery.trackingCode,
        status: delivery.status,
        paymentStatus: delivery.paymentStatus,
        zone: delivery.zone,
        driverName: delivery.driverName,
        driverNotes: delivery.driverNotes,
        changes,
      },
    });

    return delivery;
  }

  const supabase = createSupabaseAdminClient();
  const { data: currentDelivery, error: currentDeliveryError } = await supabase
    .from("delivery_orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (currentDeliveryError) {
    throw currentDeliveryError;
  }

  if (!currentDelivery) {
    return null;
  }

  const before = mapDelivery(currentDelivery);
  let driverName: string | null | undefined;
  let zone = updates.zone;

  if (typeof updates.driverId === "string") {
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("*")
      .eq("id", updates.driverId)
      .single();

    if (driverError) {
      throw driverError;
    }

    driverName = toStringValue(driver.name);
    zone = toStringValue(driver.zone) as DispatchZone;
  }

  if (updates.driverId === null) {
    driverName = null;
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: nowIso(),
  };

  if (updates.status) {
    updatePayload.status = updates.status;
  }

  if (updates.paymentStatus) {
    updatePayload.payment_status = updates.paymentStatus;
  }

  if (typeof updates.amountPaid === "number") {
    updatePayload.amount_paid = updates.amountPaid;
  }

  if (zone) {
    updatePayload.dispatch_zone = zone;
  }

  if (updates.driverId !== undefined) {
    updatePayload.driver_id = updates.driverId;
    updatePayload.driver_name = driverName;
  }

  if (updates.notes !== undefined) {
    updatePayload.notes = updates.notes;
  }

  if (updates.driverNotes !== undefined) {
    updatePayload.driver_notes = updates.driverNotes;
  }

  const { data, error } = await supabase
    .from("delivery_orders")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  const mapped = mapDelivery(data);
  const paymentStatus = toPaymentStatus(
    mapped.amountPaid,
    mapped.quotedPrice,
    updates.paymentStatus,
  );

  if (paymentStatus !== mapped.paymentStatus) {
    await supabase
      .from("delivery_orders")
      .update({ payment_status: paymentStatus, updated_at: nowIso() })
      .eq("id", id);
    mapped.paymentStatus = paymentStatus;
  }

  const detailParts = [
    updates.status ? `status ${updates.status.replaceAll("_", " ")}` : null,
    typeof updates.driverId === "string" && driverName
      ? `driver ${driverName}`
      : updates.driverId === null
        ? "driver cleared"
        : null,
    zone ? `zone ${zone}` : null,
    updates.paymentStatus ? `payment ${updates.paymentStatus}` : null,
    typeof updates.amountPaid === "number" ? `paid ${mapped.amountPaid}` : null,
    updates.notes === null ? "notes cleared" : null,
    updates.driverNotes !== undefined ? "driver notes updated" : null,
  ].filter(Boolean);
  const changes = buildChangeSet(
    before as unknown as Record<string, unknown>,
    mapped as unknown as Record<string, unknown>,
    ["status", "paymentStatus", "amountPaid", "zone", "driverId", "driverName", "notes", "driverNotes"],
  );

  await supabase.from("activity_log").insert({
    delivery_id: id,
    title: "Delivery updated",
    detail: `${mapped.trackingCode} changed: ${detailParts.join(", ") || "notes updated"}.`,
  });

  await recordAuditEvent({
    requestId: options?.requestId,
    entityType: "delivery",
    entityId: id,
    deliveryId: id,
    action: "delivery.updated",
    summary: `${mapped.trackingCode} changed: ${detailParts.join(", ") || "notes updated"}.`,
    actor: options?.actor ?? { type: "system", label: "system" },
    metadata: {
      trackingCode: mapped.trackingCode,
      status: mapped.status,
      paymentStatus: mapped.paymentStatus,
      zone: mapped.zone,
      driverName: mapped.driverName,
      driverNotes: mapped.driverNotes,
      changes,
    },
  });

  return mapped;
}

export async function updateDriverDelivery(
  id: string,
  driverId: string,
  updates: Pick<DeliveryUpdateInput, "status" | "amountPaid" | "driverNotes">,
  options?: {
    requestId?: string;
    actor?: AuditEventInput["actor"];
  },
) {
  const snapshot = await getDriverWorkspaceSnapshot(driverId);

  if (!snapshot) {
    throw new Error("UNAUTHORIZED");
  }

  const delivery = snapshot.activeDeliveries.find((item) => item.id === id);

  if (!delivery) {
    const completedMatch = snapshot.completedDeliveries.find((item) => item.id === id);

    if (completedMatch) {
      throw new Error("FORBIDDEN");
    }

    return null;
  }

  return updateDelivery(id, {
    status: updates.status,
    amountPaid: updates.amountPaid,
    driverNotes: updates.driverNotes,
  }, options);
}
