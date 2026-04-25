import { clsx } from "clsx";

import type {
  AdminRole,
  AuditEntityType,
  AuditOutcome,
  BusinessInquiryStatus,
  ClientAccountStatus,
  DeliveryStatus,
  DriverStatus,
  InventoryHealth,
  PaymentStatus,
  PriorityLevel,
} from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return clsx(values);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatRelativeHours(value: string) {
  const hours = Math.max(
    0,
    Math.round((new Date(value).getTime() - Date.now()) / (1000 * 60 * 60)),
  );

  if (hours <= 1) {
    return "within 1 hr";
  }

  return `within ${hours} hrs`;
}

export function getStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export function getStatusTone(status: DeliveryStatus) {
  switch (status) {
    case "delivered":
      return "tone-success";
    case "in_transit":
    case "dispatched":
      return "tone-info";
    case "issue":
      return "tone-danger";
    case "queued":
      return "tone-warning";
    default:
      return "tone-default";
  }
}

export function getPaymentTone(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "tone-success";
    case "partial":
      return "tone-warning";
    default:
      return "tone-danger";
  }
}

export function getInventoryTone(health: InventoryHealth) {
  switch (health) {
    case "healthy":
      return "tone-success";
    case "low":
      return "tone-warning";
    default:
      return "tone-danger";
  }
}

export function getDriverTone(status: DriverStatus) {
  switch (status) {
    case "available":
      return "tone-success";
    case "on_run":
      return "tone-info";
    default:
      return "tone-default";
  }
}

export function getPriorityTone(priority: PriorityLevel) {
  switch (priority) {
    case "express":
      return "tone-warning";
    case "fragile":
      return "tone-magenta";
    default:
      return "tone-default";
  }
}

export function getInquiryTone(status: BusinessInquiryStatus) {
  switch (status) {
    case "new":
      return "tone-info";
    case "contacted":
      return "tone-warning";
    case "qualified":
      return "tone-success";
    case "invited":
      return "tone-magenta";
    default:
      return "tone-default";
  }
}

export function getAccountTone(status: ClientAccountStatus) {
  switch (status) {
    case "active":
      return "tone-success";
    default:
      return "tone-danger";
  }
}

export function getAdminRoleTone(role: AdminRole) {
  switch (role) {
    case "owner":
      return "tone-warning";
    case "admin":
      return "tone-info";
    case "dispatcher":
      return "tone-success";
    default:
      return "tone-default";
  }
}

export function getAuditOutcomeTone(outcome: AuditOutcome) {
  switch (outcome) {
    case "error":
      return "tone-danger";
    default:
      return "tone-success";
  }
}

export function getAuditEntityTone(entityType: AuditEntityType) {
  switch (entityType) {
    case "delivery":
      return "tone-info";
    case "business_inquiry":
      return "tone-warning";
    case "client_account":
      return "tone-magenta";
    case "admin_account":
      return "tone-warning";
    case "driver":
      return "tone-success";
    case "inventory_item":
      return "tone-cyan";
    case "auth":
      return "tone-default";
    default:
      return "tone-default";
  }
}
