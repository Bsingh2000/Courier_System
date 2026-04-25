import { z } from "zod";

export const businessInquirySchema = z.object({
  contactName: z.string().trim().min(2).max(80),
  businessName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email(),
  businessAddress: z.string().trim().min(8).max(180),
  notes: z.string().trim().max(320).optional().or(z.literal("")),
});

export const deliveryIntakeSchema = z.object({
  clientName: z.string().trim().min(2).max(80),
  clientPhone: z.string().trim().min(7).max(30),
  clientEmail: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("")),
  recipientName: z.string().trim().min(2).max(80),
  recipientPhone: z.string().trim().min(7).max(30),
  pickupAddress: z.string().trim().min(8).max(180),
  dropoffAddress: z.string().trim().min(8).max(180),
  parcelDescription: z.string().trim().min(4).max(180),
  itemCount: z.coerce.number().int().min(1).max(100),
  declaredValue: z.coerce.number().min(0).max(100000),
  quotedPrice: z.coerce.number().min(0).max(100000),
  paymentMethod: z.enum(["cash", "card", "bank_transfer"]),
  zone: z.enum(["east", "west", "north", "south"]),
  priority: z.enum(["standard", "express", "fragile"]),
  scheduledFor: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date"),
  notes: z.string().trim().max(240).optional().or(z.literal("")),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6).max(120),
});

export const clientLoginSchema = adminLoginSchema;
export const driverLoginSchema = adminLoginSchema;

export const trackingQuerySchema = z.object({
  q: z.string().trim().min(3).max(40),
});

export const inquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "qualified", "invited", "archived"]),
});

export const driverUpsertSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email(),
  zone: z.enum(["east", "west", "north", "south"]),
  status: z.enum(["available", "on_run", "off_duty"]),
  accessStatus: z.enum(["active", "paused"]),
  currentRun: z.string().trim().min(2).max(120),
  cashOnHand: z.coerce.number().min(0).max(100000).optional(),
});

export const driverUpdateSchema = driverUpsertSchema.partial().refine(
  (value) => Object.values(value).some((item) => item !== undefined),
  "Provide at least one change",
);

export const clientAccountCreateSchema = z.object({
  contactName: z.string().trim().min(2).max(80),
  businessName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email(),
  businessAddress: z.string().trim().min(8).max(180),
  status: z.enum(["active", "paused"]).default("active"),
});

export const clientAccountUpdateSchema = z
  .object({
    status: z.enum(["active", "paused"]).optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "Provide at least one change",
  );

export const adminAccountCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  role: z.enum(["owner", "admin", "dispatcher", "viewer"]).default("admin"),
  status: z.enum(["active", "paused"]).default("active"),
});

export const adminAccountUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().optional(),
    role: z.enum(["owner", "admin", "dispatcher", "viewer"]).optional(),
    status: z.enum(["active", "paused"]).optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "Provide at least one change",
  );

export const inventoryItemSchema = z.object({
  name: z.string().trim().min(2).max(120),
  availableUnits: z.coerce.number().int().min(0).max(100000),
  reservedUnits: z.coerce.number().int().min(0).max(100000),
  reorderPoint: z.coerce.number().int().min(0).max(100000),
  location: z.string().trim().min(2).max(120),
  health: z.enum(["healthy", "low", "critical"]),
});

export const inventoryUpdateSchema = inventoryItemSchema.partial().refine(
  (value) => Object.values(value).some((item) => item !== undefined),
  "Provide at least one change",
);

export const bulkAssignmentSchema = z.object({
  deliveryIds: z.array(z.string().trim().min(3)).min(1).max(100),
  driverId: z.union([z.string().trim().min(3), z.literal("")]),
  status: z
    .enum(["queued", "dispatched", "in_transit", "issue"])
    .optional()
    .default("queued"),
});

export const deliveryUpdateSchema = z
  .object({
    status: z
      .enum(["new", "queued", "dispatched", "in_transit", "delivered", "issue"])
      .optional(),
    paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
    amountPaid: z.coerce.number().min(0).max(100000).optional(),
    zone: z.enum(["east", "west", "north", "south"]).optional(),
    driverId: z.union([z.string().trim().min(3).max(120), z.literal("")]).optional(),
    notes: z.union([z.string().trim().max(240), z.literal("")]).optional(),
    driverNotes: z.union([z.string().trim().max(240), z.literal("")]).optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "Provide at least one change",
  );

export const driverDeliveryUpdateSchema = z
  .object({
    status: z.enum(["dispatched", "in_transit", "delivered", "issue"]).optional(),
    amountPaid: z.coerce.number().min(0).max(100000).optional(),
    driverNotes: z.union([z.string().trim().max(240), z.literal("")]).optional(),
  })
  .refine(
    (value) => Object.values(value).some((item) => item !== undefined),
    "Provide at least one change",
  );
