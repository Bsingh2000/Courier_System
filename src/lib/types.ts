export type DispatchZone = "east" | "west" | "north" | "south";

export type DeliveryStatus =
  | "new"
  | "queued"
  | "dispatched"
  | "in_transit"
  | "delivered"
  | "issue";

export type PaymentStatus = "unpaid" | "partial" | "paid";
export type PaymentMethod = "cash" | "card" | "bank_transfer";
export type PriorityLevel = "standard" | "express" | "fragile";
export type DriverStatus = "available" | "on_run" | "off_duty";
export type DriverAccessStatus = "active" | "paused";
export type InventoryHealth = "healthy" | "low" | "critical";
export type AdminRole = "owner" | "admin" | "dispatcher" | "viewer";
export type AdminAccountStatus = "active" | "paused";
export type BusinessInquiryStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "invited"
  | "archived";
export type ClientAccountStatus = "active" | "paused";
export type AccountOnboardingMethod = "temporary_password" | "setup_email";
export type PasswordSetupAccountType = "admin" | "client" | "driver";
export type AuditActorType = "admin" | "client" | "driver" | "system";
export type AuditEntityType =
  | "delivery"
  | "business_inquiry"
  | "client_account"
  | "admin_account"
  | "driver"
  | "inventory_item"
  | "auth"
  | "system";
export type AuditOutcome = "success" | "error";

export interface DeliveryRecord {
  id: string;
  clientAccountId?: string;
  trackingCode: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  parcelDescription: string;
  itemCount: number;
  declaredValue: number;
  quotedPrice: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  zone: DispatchZone;
  status: DeliveryStatus;
  priority: PriorityLevel;
  driverId?: string;
  driverName?: string;
  scheduledFor: string;
  eta: string;
  notes?: string;
  driverNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DriverRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  zone: DispatchZone;
  status: DriverStatus;
  accessStatus: DriverAccessStatus;
  currentRun: string;
  todayDeliveries: number;
  cashOnHand: number;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  availableUnits: number;
  reservedUnits: number;
  reorderPoint: number;
  location: string;
  health: InventoryHealth;
}

export interface ActivityEntry {
  id: string;
  deliveryId?: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface BusinessInquiryRecord {
  id: string;
  contactName: string;
  businessName: string;
  phone: string;
  email: string;
  businessAddress: string;
  notes?: string;
  status: BusinessInquiryStatus;
  invitedClientId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClientAccountRecord {
  id: string;
  contactName: string;
  businessName: string;
  email: string;
  phone: string;
  businessAddress: string;
  status: ClientAccountStatus;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAccountRecord {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminAccountStatus;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  createdByAdminId?: string;
  createdByLabel?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEventRecord {
  id: string;
  requestId?: string;
  entityType: AuditEntityType;
  entityId?: string;
  deliveryId?: string;
  action: string;
  summary: string;
  actorType: AuditActorType;
  actorId?: string;
  actorLabel?: string;
  outcome: AuditOutcome;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface AuditActor {
  type: AuditActorType;
  id?: string;
  label?: string;
}

export interface AuditEventInput {
  requestId?: string;
  entityType: AuditEntityType;
  entityId?: string;
  deliveryId?: string;
  action: string;
  summary: string;
  actor: AuditActor;
  outcome?: AuditOutcome;
  metadata?: Record<string, unknown>;
}

export interface ClientSummary {
  id: string;
  clientName: string;
  phone: string;
  totalOrders: number;
  totalRevenue: number;
  outstandingBalance: number;
  lastOrderAt: string;
}

export interface ZoneSummary {
  zone: DispatchZone;
  total: number;
  pending: number;
  moving: number;
  completed: number;
  revenue: number;
}

export interface DashboardMetrics {
  activeDeliveries: number;
  deliveredToday: number;
  awaitingDispatch: number;
  totalRevenue: number;
  cashCollected: number;
  outstandingBalance: number;
}

export interface DispatchQueueItem {
  id: string;
  trackingCode: string;
  clientName: string;
  recipientName: string;
  parcelDescription: string;
  zone: DispatchZone;
  status: DeliveryStatus;
  priority: PriorityLevel;
  driverId?: string;
  driverName?: string;
  scheduledFor: string;
  eta: string;
  quotedPrice: number;
  amountPaid: number;
}

export interface DriverRunStop {
  id: string;
  trackingCode: string;
  clientName: string;
  recipientName: string;
  dropoffAddress: string;
  status: DeliveryStatus;
  priority: PriorityLevel;
  paymentStatus: PaymentStatus;
  eta: string;
  quotedPrice: number;
  amountPaid: number;
}

export interface DriverRunSnapshot {
  driver: DriverRecord;
  effectiveStatus: DriverStatus;
  activeStops: number;
  deliveredStops: number;
  issueStops: number;
  cashCollected: number;
  outstandingBalance: number;
  nextEta?: string;
  activeDeliveries: DriverRunStop[];
}

export interface DashboardSnapshot {
  deliveries: DeliveryRecord[];
  drivers: DriverRecord[];
  adminAccounts: AdminAccountRecord[];
  dispatchQueue: DispatchQueueItem[];
  driverRuns: DriverRunSnapshot[];
  inventory: InventoryItem[];
  activity: ActivityEntry[];
  auditEvents: AuditEventRecord[];
  inquiries: BusinessInquiryRecord[];
  clientAccounts: ClientAccountRecord[];
  clients: ClientSummary[];
  zones: ZoneSummary[];
  metrics: DashboardMetrics;
}

export interface DriverWorkspaceSnapshot {
  driver: DriverRecord;
  run: DriverRunSnapshot;
  nextStop?: DeliveryRecord;
  activeDeliveries: DeliveryRecord[];
  completedDeliveries: DeliveryRecord[];
}

export interface DeliveryWorkspaceSnapshot {
  delivery: DeliveryRecord;
  drivers: DriverRecord[];
  auditEvents: AuditEventRecord[];
  relatedDeliveries: DeliveryRecord[];
  zoneQueue: DeliveryRecord[];
}

export interface ClientPortalMetrics {
  activeDeliveries: number;
  deliveredDeliveries: number;
  totalRevenue: number;
  outstandingBalance: number;
}

export interface ClientPortalSnapshot {
  client: ClientAccountRecord;
  deliveries: DeliveryRecord[];
  metrics: ClientPortalMetrics;
}

export interface DeliveryIntakeInput {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  recipientName: string;
  recipientPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  parcelDescription: string;
  itemCount: number;
  declaredValue: number;
  quotedPrice: number;
  paymentMethod: PaymentMethod;
  zone: DispatchZone;
  priority: PriorityLevel;
  scheduledFor: string;
  notes?: string;
}

export interface DeliveryUpdateInput {
  status?: DeliveryStatus;
  paymentStatus?: PaymentStatus;
  amountPaid?: number;
  zone?: DispatchZone;
  driverId?: string | null;
  notes?: string | null;
  driverNotes?: string | null;
}

export interface BusinessInquiryInput {
  contactName: string;
  businessName: string;
  phone: string;
  email: string;
  businessAddress: string;
  notes?: string;
}

export interface DriverUpsertInput {
  name: string;
  phone: string;
  email: string;
  zone: DispatchZone;
  status: DriverStatus;
  accessStatus: DriverAccessStatus;
  currentRun: string;
  cashOnHand?: number;
}

export interface ClientAccountCreateInput {
  contactName: string;
  businessName: string;
  email: string;
  phone: string;
  businessAddress: string;
  status: ClientAccountStatus;
}

export interface ClientAccountUpdateInput {
  status?: ClientAccountStatus;
}

export interface AdminAccountCreateInput {
  name: string;
  email: string;
  role: AdminRole;
  status: AdminAccountStatus;
}

export interface AdminAccountUpdateInput {
  name?: string;
  email?: string;
  role?: AdminRole;
  status?: AdminAccountStatus;
}

export interface InventoryItemInput {
  name: string;
  availableUnits: number;
  reservedUnits: number;
  reorderPoint: number;
  location: string;
  health: InventoryHealth;
}
