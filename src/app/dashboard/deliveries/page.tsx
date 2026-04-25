import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import { getDashboardSnapshot } from "@/lib/repository";
import type { DeliveryRecord, DeliveryStatus, DispatchZone } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  getPaymentTone,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function isZoneValue(value: string): value is DispatchZone {
  return value === "east" || value === "west" || value === "north" || value === "south";
}

function isStatusValue(value: string): value is DeliveryStatus {
  return (
    value === "new" ||
    value === "queued" ||
    value === "dispatched" ||
    value === "in_transit" ||
    value === "delivered" ||
    value === "issue"
  );
}

function filterDeliveries(
  deliveries: DeliveryRecord[],
  filters: {
    status: string;
    zone: string;
  },
) {
  return deliveries.filter((delivery) => {
    if (isStatusValue(filters.status) && delivery.status !== filters.status) {
      return false;
    }

    if (isZoneValue(filters.zone) && delivery.zone !== filters.zone) {
      return false;
    }

    return true;
  });
}

export default async function DashboardDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[] | undefined;
    status?: string | string[] | undefined;
    zone?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;
  const query = searchValueFromParam(params.q);
  const status = searchValueFromParam(params.status);
  const zone = searchValueFromParam(params.zone);
  const snapshot = await getDashboardSnapshot(query);
  const deliveries = filterDeliveries(snapshot.deliveries, { status, zone });
  const queueDeliveries = filterDeliveries(
    snapshot.dispatchQueue.map((item) =>
      snapshot.deliveries.find((delivery) => delivery.id === item.id),
    ).filter(Boolean) as DeliveryRecord[],
    { status, zone },
  ).slice(0, 5);
  const outstandingBalance = deliveries.reduce(
    (total, delivery) => total + Math.max(delivery.quotedPrice - delivery.amountPaid, 0),
    0,
  );
  const issueCount = deliveries.filter((delivery) => delivery.status === "issue").length;
  const awaitingDispatchCount = deliveries.filter(
    (delivery) => delivery.status === "new" || delivery.status === "queued",
  ).length;

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Deliveries</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Dispatch list and order workspaces
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Use the list to scan the queue quickly, then open a single order
          workspace for assignment, payment updates, notes, and audit history.
        </p>

        <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_14rem_14rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              className="field pl-11"
              placeholder="Search tracking, client, recipient, driver, address, or parcel"
            />
          </div>

          <select name="status" defaultValue={status} className="select-field">
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="queued">Queued</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
            <option value="issue">Issue</option>
          </select>

          <select name="zone" defaultValue={zone} className="select-field">
            <option value="">All zones</option>
            <option value="east">East</option>
            <option value="west">West</option>
            <option value="north">North</option>
            <option value="south">South</option>
          </select>

          <button className="button-secondary">Apply filters</button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <p className="section-label">Matching orders</p>
          <p className="mt-3 text-3xl font-semibold text-white">{deliveries.length}</p>
        </div>
        <div className="metric-card">
          <p className="section-label">Awaiting dispatch</p>
          <p className="mt-3 text-3xl font-semibold text-white">{awaitingDispatchCount}</p>
        </div>
        <div className="metric-card">
          <p className="section-label">Issues</p>
          <p className="mt-3 text-3xl font-semibold text-white">{issueCount}</p>
        </div>
        <div className="metric-card">
          <p className="section-label">Amount still due</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {formatCurrency(outstandingBalance)}
          </p>
        </div>
      </section>

      {queueDeliveries.length > 0 ? (
        <section className="panel">
          <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-label">Needs attention</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Orders to review first
              </h2>
            </div>
            <p className="text-sm text-[var(--muted)]">
              These orders still need assignment, follow-up, or issue handling.
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {queueDeliveries.map((delivery) => (
              <article key={delivery.id} className="metric-card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                      {delivery.trackingCode}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {delivery.clientName}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {delivery.parcelDescription}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label={getStatusLabel(delivery.status)}
                      tone={getStatusTone(delivery.status)}
                    />
                    <StatusPill
                      label={delivery.paymentStatus}
                      tone={getPaymentTone(delivery.paymentStatus)}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
                  <p>
                    <span className="block section-label">Route</span>
                    {delivery.zone.toUpperCase()} / {delivery.driverName ?? "Unassigned"}
                  </p>
                  <p>
                    <span className="block section-label">Recipient</span>
                    {delivery.recipientName}
                  </p>
                  <p>
                    <span className="block section-label">Scheduled</span>
                    {formatDateTime(delivery.scheduledFor)}
                  </p>
                </div>

                <div className="mt-4 flex justify-end">
                  <Link href={`/dashboard/deliveries/${delivery.id}`} className="button-primary">
                    <ArrowUpRight className="h-4 w-4" />
                    Open order
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">All results</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Compact delivery list
            </h2>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Open an order only when you need the full record.
          </p>
        </div>

        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <article key={delivery.id} className="metric-card">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                      {delivery.trackingCode}
                    </p>
                    <StatusPill
                      label={getStatusLabel(delivery.status)}
                      tone={getStatusTone(delivery.status)}
                    />
                    <StatusPill
                      label={delivery.paymentStatus}
                      tone={getPaymentTone(delivery.paymentStatus)}
                    />
                    <StatusPill
                      label={delivery.priority}
                      tone={getPriorityTone(delivery.priority)}
                    />
                  </div>

                  <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-white">
                        {delivery.clientName}
                      </h3>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        {delivery.parcelDescription}
                      </p>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        {delivery.pickupAddress} to {delivery.dropoffAddress}
                      </p>
                    </div>

                    <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                      <p>
                        <span className="block section-label">Route</span>
                        {delivery.zone.toUpperCase()} / {delivery.driverName ?? "Unassigned"}
                      </p>
                      <p>
                        <span className="block section-label">Schedule</span>
                        {formatDateTime(delivery.scheduledFor)}
                      </p>
                      <p>
                        <span className="block section-label">Recipient</span>
                        {delivery.recipientName} / {delivery.recipientPhone}
                      </p>
                      <p>
                        <span className="block section-label">Amount due</span>
                        {formatCurrency(
                          Math.max(delivery.quotedPrice - delivery.amountPaid, 0),
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 justify-end">
                  <Link href={`/dashboard/deliveries/${delivery.id}`} className="button-secondary">
                    <ArrowUpRight className="h-4 w-4" />
                    Open order
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        {deliveries.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-white/8 bg-black/15 p-5 text-sm text-[var(--muted)]">
            No deliveries matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
