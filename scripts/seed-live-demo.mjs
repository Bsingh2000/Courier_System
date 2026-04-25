import fs from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

loadEnvFile(envPath);

const supabase = createClient(
  getRequiredEnv("SUPABASE_URL"),
  getRequiredEnv("SUPABASE_SECRET_KEY"),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const ADMIN_PASSWORD_HASH =
  "scrypt:33c0727e50dd98a2da727a1fa3b7fc31:0e9b49b79912f93db67868ac5ca0e73efbb3272b65afb76a23ae97d6b490f8b8ccf91155903ce9d1093b6d9ce7428395ca54e7bc29c8df4060760205777028df";
const CLIENT_PASSWORD_HASH =
  "scrypt:01010101010101010101010101010101:dad0e57b8b21e62e2bc0c421a2e30f0215a33cc9195ab74c960e7591bbf0e56b2a6f85f9dd87518812724c9769313d1507a2629b72147b323a06d9cda83fcd3f";
const DRIVER_PASSWORD_HASH =
  "scrypt:75caebc761da0424601b9b8b6113d00d:31e7263a7e1c12f1956a133eeac36412e7ae3ed1fe242db37d728386a457a2af93e370344552d26babdfe4900399579883ed641bcaab48be739b6bc702414073";

const adminAccounts = [
  {
    name: "RouteGrid Owner",
    email: "admin@routegrid.local",
    role: "owner",
    status: "active",
    password_hash: ADMIN_PASSWORD_HASH,
    created_by_label: "seed",
    last_login_at: "2026-04-24T20:49:00.000Z",
    updated_at: "2026-04-24T20:49:00.000Z",
  },
];

const clientAccounts = [
  {
    contact_name: "Nadia Ramdial",
    business_name: "Niko Auto Parts",
    email: "ops@nikoautoparts.com",
    phone: "(868) 622-9087",
    business_address: "34 Wrightson Road, Port of Spain",
    status: "active",
    password_hash: CLIENT_PASSWORD_HASH,
    last_login_at: "2026-04-22T14:20:00.000Z",
    updated_at: "2026-04-22T18:00:00.000Z",
  },
  {
    contact_name: "Keon Baptiste",
    business_name: "Harbor Electronics",
    email: "warehouse@harborelectronics.co",
    phone: "(868) 760-4041",
    business_address: "58 Independence Square, Port of Spain",
    status: "active",
    password_hash: CLIENT_PASSWORD_HASH,
    last_login_at: "2026-04-22T16:05:00.000Z",
    updated_at: "2026-04-22T18:00:00.000Z",
  },
];

const drivers = [
  {
    name: "Jalen Ford",
    phone: "(868) 301-1142",
    email: "jalen@routegrid.local",
    zone: "east",
    status: "on_run",
    access_status: "active",
    password_hash: DRIVER_PASSWORD_HASH,
    current_run: "Mayaro / Arima spine",
    today_deliveries: 9,
    cash_on_hand: 780,
    last_login_at: "2026-04-22T15:05:00.000Z",
    updated_at: "2026-04-22T15:05:00.000Z",
  },
  {
    name: "Keri Browne",
    phone: "(868) 332-5411",
    email: "keri@routegrid.local",
    zone: "west",
    status: "available",
    access_status: "active",
    password_hash: DRIVER_PASSWORD_HASH,
    current_run: "Port of Spain urban loop",
    today_deliveries: 6,
    cash_on_hand: 420,
    last_login_at: "2026-04-22T13:48:00.000Z",
    updated_at: "2026-04-22T13:48:00.000Z",
  },
  {
    name: "Marlon James",
    phone: "(868) 456-2221",
    email: "marlon@routegrid.local",
    zone: "north",
    status: "on_run",
    access_status: "active",
    password_hash: DRIVER_PASSWORD_HASH,
    current_run: "St. Augustine / Tunapuna",
    today_deliveries: 11,
    cash_on_hand: 960,
    last_login_at: "2026-04-22T17:02:00.000Z",
    updated_at: "2026-04-22T17:02:00.000Z",
  },
  {
    name: "Asha Khan",
    phone: "(868) 785-9930",
    email: "asha@routegrid.local",
    zone: "south",
    status: "available",
    access_status: "active",
    password_hash: DRIVER_PASSWORD_HASH,
    current_run: "San Fernando / Penal",
    today_deliveries: 7,
    cash_on_hand: 605,
    last_login_at: "2026-04-22T12:12:00.000Z",
    updated_at: "2026-04-22T12:12:00.000Z",
  },
];

const inventoryItems = [
  {
    item_name: "Tamper-proof satchels",
    available_units: 128,
    reserved_units: 24,
    reorder_point: 60,
    location: "Central depot",
    health: "healthy",
  },
  {
    item_name: "Insulated food bags",
    available_units: 18,
    reserved_units: 11,
    reorder_point: 20,
    location: "Dispatch cage",
    health: "low",
  },
  {
    item_name: "Barcode labels",
    available_units: 960,
    reserved_units: 180,
    reorder_point: 400,
    location: "Printing station",
    health: "healthy",
  },
  {
    item_name: "Medium parcel boxes",
    available_units: 12,
    reserved_units: 19,
    reorder_point: 20,
    location: "Packing lane B",
    health: "critical",
  },
];

const deliverySeeds = [
  {
    tracking_code: "RG-24001",
    client_key: "ops@nikoautoparts.com",
    client_name: "Niko Auto Parts",
    client_phone: "(868) 622-9087",
    client_email: "ops@nikoautoparts.com",
    recipient_name: "Devon Sookraj",
    recipient_phone: "(868) 774-3102",
    pickup_address: "34 Wrightson Road, Port of Spain",
    dropoff_address: "7 Eastern Main Road, Arima",
    parcel_description: "Brake pads and filter kit",
    item_count: 3,
    declared_value: 1450,
    quoted_price: 210,
    amount_paid: 210,
    payment_method: "bank_transfer",
    payment_status: "paid",
    dispatch_zone: "east",
    status: "dispatched",
    priority: "standard",
    driver_key: "jalen@routegrid.local",
    driver_name: "Jalen Ford",
    scheduled_for: "2026-04-22T09:30:00.000Z",
    eta: "2026-04-22T20:45:00.000Z",
    notes: "Call before arriving at storefront.",
    driver_notes:
      "Picked up and loaded cleanly. Workshop asked for a call on arrival.",
    created_at: "2026-04-22T08:05:00.000Z",
    updated_at: "2026-04-22T16:18:00.000Z",
  },
  {
    tracking_code: "RG-24002",
    client_key: null,
    client_name: "Bloom Pantry",
    client_phone: "(868) 311-1442",
    client_email: "dispatch@bloompantry.tt",
    recipient_name: "Ariana Pierre",
    recipient_phone: "(868) 739-2804",
    pickup_address: "12 Maraval Road, St. Clair",
    dropoff_address: "145 Diego Martin Main Road, Diego Martin",
    parcel_description: "Same-day grocery basket",
    item_count: 1,
    declared_value: 380,
    quoted_price: 120,
    amount_paid: 60,
    payment_method: "cash",
    payment_status: "partial",
    dispatch_zone: "west",
    status: "in_transit",
    priority: "express",
    driver_key: "keri@routegrid.local",
    driver_name: "Keri Browne",
    scheduled_for: "2026-04-22T10:00:00.000Z",
    eta: "2026-04-22T19:55:00.000Z",
    notes: "Customer may pay remaining cash on delivery.",
    driver_notes:
      "Deposit received on first attempt. Amount still due at handoff.",
    created_at: "2026-04-22T08:40:00.000Z",
    updated_at: "2026-04-22T17:11:00.000Z",
  },
  {
    tracking_code: "RG-24003",
    client_key: null,
    client_name: "Carewell Pharmacy",
    client_phone: "(868) 690-9913",
    client_email: "carewell.ops@mail.com",
    recipient_name: "Shanna Ali",
    recipient_phone: "(868) 327-6011",
    pickup_address: "2 Saddle Road, Maraval",
    dropoff_address: "20 Orange Grove Road, Trincity",
    parcel_description: "Prescription package",
    item_count: 1,
    declared_value: 210,
    quoted_price: 95,
    amount_paid: 95,
    payment_method: "card",
    payment_status: "paid",
    dispatch_zone: "north",
    status: "delivered",
    priority: "fragile",
    driver_key: "marlon@routegrid.local",
    driver_name: "Marlon James",
    scheduled_for: "2026-04-22T11:00:00.000Z",
    eta: "2026-04-22T18:10:00.000Z",
    notes: "Temperature-sensitive packet.",
    driver_notes:
      "Delivered to front desk and recipient confirmed contents.",
    created_at: "2026-04-22T09:12:00.000Z",
    updated_at: "2026-04-22T18:12:00.000Z",
  },
  {
    tracking_code: "RG-24004",
    client_key: "warehouse@harborelectronics.co",
    client_name: "Harbor Electronics",
    client_phone: "(868) 760-4041",
    client_email: "warehouse@harborelectronics.co",
    recipient_name: "Jaden Mohammed",
    recipient_phone: "(868) 707-8774",
    pickup_address: "58 Independence Square, Port of Spain",
    dropoff_address: "84 Cipero Road, San Fernando",
    parcel_description: "Tablet accessory order",
    item_count: 4,
    declared_value: 980,
    quoted_price: 180,
    amount_paid: 0,
    payment_method: "cash",
    payment_status: "unpaid",
    dispatch_zone: "south",
    status: "queued",
    priority: "standard",
    driver_key: null,
    driver_name: null,
    scheduled_for: "2026-04-22T13:00:00.000Z",
    eta: "2026-04-22T21:15:00.000Z",
    notes: "Collect payment before release.",
    driver_notes: null,
    created_at: "2026-04-22T10:03:00.000Z",
    updated_at: "2026-04-22T15:30:00.000Z",
  },
  {
    tracking_code: "RG-24005",
    client_key: "ops@nikoautoparts.com",
    client_name: "Niko Auto Parts",
    client_phone: "(868) 622-9087",
    client_email: "ops@nikoautoparts.com",
    recipient_name: "Kevin John",
    recipient_phone: "(868) 766-4500",
    pickup_address: "34 Wrightson Road, Port of Spain",
    dropoff_address: "16 O'Meara Road, Tacarigua",
    parcel_description: "Alternator assembly",
    item_count: 1,
    declared_value: 2200,
    quoted_price: 240,
    amount_paid: 240,
    payment_method: "bank_transfer",
    payment_status: "paid",
    dispatch_zone: "east",
    status: "new",
    priority: "express",
    driver_key: null,
    driver_name: null,
    scheduled_for: "2026-04-22T14:30:00.000Z",
    eta: "2026-04-22T22:00:00.000Z",
    notes: "Rush order for workshop client.",
    driver_notes: null,
    created_at: "2026-04-22T12:21:00.000Z",
    updated_at: "2026-04-22T12:21:00.000Z",
  },
  {
    tracking_code: "RG-24006",
    client_key: null,
    client_name: "Paperlane Studio",
    client_phone: "(868) 395-7714",
    client_email: "hello@paperlanestudio.com",
    recipient_name: "Mia Baptiste",
    recipient_phone: "(868) 488-7201",
    pickup_address: "18 Ariapita Avenue, Woodbrook",
    dropoff_address: "11 Mucurapo Road, St. James",
    parcel_description: "Printed invite boxes",
    item_count: 2,
    declared_value: 650,
    quoted_price: 110,
    amount_paid: 110,
    payment_method: "card",
    payment_status: "paid",
    dispatch_zone: "west",
    status: "delivered",
    priority: "fragile",
    driver_key: "keri@routegrid.local",
    driver_name: "Keri Browne",
    scheduled_for: "2026-04-22T08:50:00.000Z",
    eta: "2026-04-22T15:30:00.000Z",
    notes: "Keep flat. No stacking.",
    driver_notes: "Delivered flat and signed off by studio assistant.",
    created_at: "2026-04-22T07:58:00.000Z",
    updated_at: "2026-04-22T15:26:00.000Z",
  },
  {
    tracking_code: "RG-24007",
    client_key: null,
    client_name: "Island Fresh",
    client_phone: "(868) 731-8120",
    client_email: "orders@islandfresh.io",
    recipient_name: "Tameka Charles",
    recipient_phone: "(868) 681-2233",
    pickup_address: "6 El Socorro Main Road, San Juan",
    dropoff_address: "31 Churchill Roosevelt Highway, Barataria",
    parcel_description: "Restaurant produce refill",
    item_count: 5,
    declared_value: 730,
    quoted_price: 140,
    amount_paid: 140,
    payment_method: "bank_transfer",
    payment_status: "paid",
    dispatch_zone: "north",
    status: "in_transit",
    priority: "standard",
    driver_key: "marlon@routegrid.local",
    driver_name: "Marlon James",
    scheduled_for: "2026-04-22T15:00:00.000Z",
    eta: "2026-04-22T20:20:00.000Z",
    notes: "Dock entrance only.",
    driver_notes:
      "Dock gate took extra time. Security cleared entry after verification.",
    created_at: "2026-04-22T13:44:00.000Z",
    updated_at: "2026-04-22T17:55:00.000Z",
  },
  {
    tracking_code: "RG-24008",
    client_key: "warehouse@harborelectronics.co",
    client_name: "Harbor Electronics",
    client_phone: "(868) 760-4041",
    client_email: "warehouse@harborelectronics.co",
    recipient_name: "Khalil Joseph",
    recipient_phone: "(868) 505-2992",
    pickup_address: "58 Independence Square, Port of Spain",
    dropoff_address: "70 Siparia Old Road, Penal",
    parcel_description: "Replacement charging docks",
    item_count: 3,
    declared_value: 560,
    quoted_price: 165,
    amount_paid: 0,
    payment_method: "cash",
    payment_status: "unpaid",
    dispatch_zone: "south",
    status: "issue",
    priority: "standard",
    driver_key: "asha@routegrid.local",
    driver_name: "Asha Khan",
    scheduled_for: "2026-04-22T09:15:00.000Z",
    eta: "2026-04-22T18:40:00.000Z",
    notes: "Customer requested reschedule after first attempt.",
    driver_notes:
      "Arrived at 5:55 PM. Recipient asked for tomorrow morning redelivery.",
    created_at: "2026-04-22T08:02:00.000Z",
    updated_at: "2026-04-22T18:22:00.000Z",
  },
];

const activitySeeds = [
  {
    id: "70000000-0000-4000-8000-000000000001",
    tracking_code: "RG-24003",
    title: "Delivered in North zone",
    detail: "Marlon completed RG-24003 and card payment posted.",
    created_at: "2026-04-22T18:12:00.000Z",
  },
  {
    id: "70000000-0000-4000-8000-000000000002",
    tracking_code: "RG-24008",
    title: "Delivery issue logged",
    detail: "South route requested reschedule because recipient was unavailable.",
    created_at: "2026-04-22T18:22:00.000Z",
  },
  {
    id: "70000000-0000-4000-8000-000000000003",
    tracking_code: "RG-24007",
    title: "North driver on route",
    detail: "Island Fresh order handed off to Marlon for same-day completion.",
    created_at: "2026-04-22T17:55:00.000Z",
  },
  {
    id: "70000000-0000-4000-8000-000000000004",
    tracking_code: "RG-24002",
    title: "Partial payment received",
    detail:
      "Bloom Pantry customer paid a deposit, and the remaining amount is still due on delivery.",
    created_at: "2026-04-22T17:11:00.000Z",
  },
  {
    id: "70000000-0000-4000-8000-000000000005",
    tracking_code: "RG-24001",
    title: "East route dispatched",
    detail: "Jalen picked up Niko Auto Parts batch and confirmed dispatch.",
    created_at: "2026-04-22T16:18:00.000Z",
  },
  {
    id: "70000000-0000-4000-8000-000000000006",
    tracking_code: "RG-24004",
    title: "Pay-on-delivery item queued",
    detail: "Harbor Electronics south run waiting for driver assignment.",
    created_at: "2026-04-22T15:30:00.000Z",
  },
];

async function upsertRows(table, rows, onConflict) {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from(table).upsert(rows, {
    onConflict,
    ignoreDuplicates: false,
  });

  if (error) {
    throw error;
  }
}

async function selectMap(table, keyColumn, valueColumn = "id") {
  const { data, error } = await supabase.from(table).select(`${keyColumn}, ${valueColumn}`);

  if (error) {
    throw error;
  }

  return new Map(data.map((row) => [row[keyColumn], row[valueColumn]]));
}

async function ensureInquiry(record, invitedClientId) {
  const { data: existing, error: selectError } = await supabase
    .from("business_inquiries")
    .select("id")
    .eq("business_name", record.business_name)
    .eq("email", record.email)
    .order("created_at", { ascending: true })
    .limit(1);

  if (selectError) {
    throw selectError;
  }

  const payload = {
    ...record,
    invited_client_id: invitedClientId ?? null,
  };

  if (existing.length > 0) {
    const inquiryId = existing[0].id;
    const { error: updateError } = await supabase
      .from("business_inquiries")
      .update(payload)
      .eq("id", inquiryId);

    if (updateError) {
      throw updateError;
    }

    return inquiryId;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("business_inquiries")
    .insert(payload)
    .select("id")
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserted.id;
}

async function seedInquiries(clientIdsByEmail) {
  const inquiryIds = new Map();
  const records = [
    {
      key: "island-kitchen",
      payload: {
        contact_name: "Janelle Singh",
        business_name: "Island Kitchen Wholesale",
        phone: "(868) 477-2008",
        email: "janelle@islandkitchen.tt",
        business_address: "22 Endeavour Road, Chaguanas",
        notes: "Needs recurring same-day drop-offs for restaurant accounts.",
        status: "new",
        created_at: "2026-04-22T09:10:00.000Z",
        updated_at: "2026-04-22T09:10:00.000Z",
      },
      invitedClientId: null,
    },
    {
      key: "northshore",
      payload: {
        contact_name: "Marcus Lewis",
        business_name: "Northshore Medics",
        phone: "(868) 311-9001",
        email: "marcus@northshoremedics.com",
        business_address: "4 Saddle Road, Maraval",
        notes: "Interested in scheduled pharmacy runs and medical document handling.",
        status: "qualified",
        created_at: "2026-04-21T14:00:00.000Z",
        updated_at: "2026-04-22T11:45:00.000Z",
      },
      invitedClientId: null,
    },
    {
      key: "niko-invited",
      payload: {
        contact_name: "Nadia Ramdial",
        business_name: "Niko Auto Parts",
        phone: "(868) 622-9087",
        email: "ops@nikoautoparts.com",
        business_address: "34 Wrightson Road, Port of Spain",
        notes: "Converted to a live account after trial week.",
        status: "invited",
        created_at: "2026-04-18T09:00:00.000Z",
        updated_at: "2026-04-18T11:20:00.000Z",
      },
      invitedClientId: clientIdsByEmail.get("ops@nikoautoparts.com") ?? null,
    },
  ];

  for (const record of records) {
    const inquiryId = await ensureInquiry(record.payload, record.invitedClientId);
    inquiryIds.set(record.key, inquiryId);
  }

  return inquiryIds;
}

async function run() {
  await upsertRows("admin_accounts", adminAccounts, "email");
  await upsertRows("client_accounts", clientAccounts, "email");
  await upsertRows("drivers", drivers, "phone");
  await upsertRows("inventory_items", inventoryItems, "item_name");

  const clientIdsByEmail = await selectMap("client_accounts", "email");
  const driverIdsByEmail = await selectMap("drivers", "email");
  const inquiryIds = await seedInquiries(clientIdsByEmail);

  const deliveryRows = deliverySeeds.map((delivery) => ({
    client_account_id: delivery.client_key
      ? clientIdsByEmail.get(delivery.client_key) ?? null
      : null,
    tracking_code: delivery.tracking_code,
    client_name: delivery.client_name,
    client_phone: delivery.client_phone,
    client_email: delivery.client_email,
    recipient_name: delivery.recipient_name,
    recipient_phone: delivery.recipient_phone,
    pickup_address: delivery.pickup_address,
    dropoff_address: delivery.dropoff_address,
    parcel_description: delivery.parcel_description,
    item_count: delivery.item_count,
    declared_value: delivery.declared_value,
    quoted_price: delivery.quoted_price,
    amount_paid: delivery.amount_paid,
    payment_method: delivery.payment_method,
    payment_status: delivery.payment_status,
    dispatch_zone: delivery.dispatch_zone,
    status: delivery.status,
    priority: delivery.priority,
    driver_id: delivery.driver_key
      ? driverIdsByEmail.get(delivery.driver_key) ?? null
      : null,
    driver_name: delivery.driver_name,
    scheduled_for: delivery.scheduled_for,
    eta: delivery.eta,
    notes: delivery.notes,
    driver_notes: delivery.driver_notes,
    created_at: delivery.created_at,
    updated_at: delivery.updated_at,
  }));

  await upsertRows("delivery_orders", deliveryRows, "tracking_code");

  const { data: deliveries, error: deliverySelectError } = await supabase
    .from("delivery_orders")
    .select("id,tracking_code")
    .in(
      "tracking_code",
      deliverySeeds.map((delivery) => delivery.tracking_code),
    );

  if (deliverySelectError) {
    throw deliverySelectError;
  }

  const deliveryIdsByTracking = new Map(
    deliveries.map((delivery) => [delivery.tracking_code, delivery.id]),
  );

  await upsertRows(
    "activity_log",
    activitySeeds.map((entry) => ({
      id: entry.id,
      delivery_id: deliveryIdsByTracking.get(entry.tracking_code) ?? null,
      title: entry.title,
      detail: entry.detail,
      created_at: entry.created_at,
    })),
    "id",
  );

  const auditEvents = [
    {
      id: "71000000-0000-4000-8000-000000000001",
      entity_type: "delivery",
      entity_id: deliveryIdsByTracking.get("RG-24008"),
      delivery_id: deliveryIdsByTracking.get("RG-24008"),
      action: "delivery.updated",
      summary: "RG-24008 was marked as issue after a failed attempt in Penal.",
      actor_type: "admin",
      actor_label: "admin@routegrid.local",
      outcome: "success",
      metadata: {
        trackingCode: "RG-24008",
        status: "issue",
        paymentStatus: "unpaid",
        driverName: "Asha Khan",
      },
      created_at: "2026-04-22T18:22:00.000Z",
    },
    {
      id: "71000000-0000-4000-8000-000000000002",
      entity_type: "delivery",
      entity_id: deliveryIdsByTracking.get("RG-24007"),
      delivery_id: deliveryIdsByTracking.get("RG-24007"),
      action: "delivery.assigned",
      summary: "RG-24007 was assigned to Marlon James for the north route.",
      actor_type: "admin",
      actor_label: "admin@routegrid.local",
      outcome: "success",
      metadata: {
        trackingCode: "RG-24007",
        status: "in_transit",
        driverName: "Marlon James",
        zone: "north",
      },
      created_at: "2026-04-22T17:55:00.000Z",
    },
    {
      id: "71000000-0000-4000-8000-000000000003",
      entity_type: "delivery",
      entity_id: deliveryIdsByTracking.get("RG-24002"),
      delivery_id: deliveryIdsByTracking.get("RG-24002"),
      action: "delivery.payment_updated",
      summary: "RG-24002 recorded a partial cash payment of 60.",
      actor_type: "admin",
      actor_label: "admin@routegrid.local",
      outcome: "success",
      metadata: {
        trackingCode: "RG-24002",
        amountPaid: 60,
        paymentStatus: "partial",
      },
      created_at: "2026-04-22T17:11:00.000Z",
    },
    {
      id: "71000000-0000-4000-8000-000000000004",
      entity_type: "driver",
      entity_id: driverIdsByEmail.get("asha@routegrid.local"),
      action: "driver.login",
      summary: "Asha Khan signed in to the driver workspace.",
      actor_type: "driver",
      actor_id: driverIdsByEmail.get("asha@routegrid.local"),
      actor_label: "asha@routegrid.local",
      outcome: "success",
      metadata: {},
      created_at: "2026-04-22T12:12:00.000Z",
    },
    {
      id: "71000000-0000-4000-8000-000000000005",
      entity_type: "business_inquiry",
      entity_id: inquiryIds.get("northshore"),
      action: "inquiry.status_updated",
      summary: "Northshore Medics was moved to qualified.",
      actor_type: "admin",
      actor_label: "admin@routegrid.local",
      outcome: "success",
      metadata: {
        status: "qualified",
      },
      created_at: "2026-04-22T11:45:00.000Z",
    },
    {
      id: "71000000-0000-4000-8000-000000000006",
      entity_type: "business_inquiry",
      entity_id: inquiryIds.get("island-kitchen"),
      action: "inquiry.created",
      summary: "Island Kitchen Wholesale submitted a new onboarding inquiry.",
      actor_type: "system",
      actor_label: "public-form",
      outcome: "success",
      metadata: {},
      created_at: "2026-04-22T09:10:00.000Z",
    },
  ];

  await upsertRows("audit_events", auditEvents, "id");

  const tables = [
    "admin_accounts",
    "client_accounts",
    "business_inquiries",
    "drivers",
    "delivery_orders",
    "inventory_items",
    "activity_log",
    "audit_events",
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select("*", { head: true, count: "exact" });

    if (error) {
      throw error;
    }

    console.log(`${table}:${count ?? 0}`);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
