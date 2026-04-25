import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { AuditEventCard } from "@/components/dashboard/AuditEventCard";
import { DeliveryActionMenu } from "@/components/dashboard/DeliveryActionMenu";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { getDeliveryWorkspaceSnapshot } from "@/lib/repository";
import {
  formatCurrency,
  formatDateTime,
  getPaymentTone,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

export default async function DashboardDeliveryWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await getDeliveryWorkspaceSnapshot(id);

  if (!snapshot) {
    notFound();
  }

  const { delivery, drivers, auditEvents, relatedDeliveries, zoneQueue } = snapshot;
  const assignedDriver = drivers.find((driver) => driver.id === delivery.driverId);

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/dashboard/deliveries" className="button-ghost -ml-3">
              <ArrowLeft className="h-4 w-4" />
              Back to deliveries
            </Link>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.28em] text-orange-200/90">
              {delivery.trackingCode}
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              {delivery.clientName} to {delivery.recipientName}
            </h1>
            <p className="copy mt-3 max-w-3xl">
              Use this workspace to dispatch the order, adjust payment status,
              review route context, and trace exactly what happened on this
              record.
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
            <StatusPill
              label={delivery.priority}
              tone={getPriorityTone(delivery.priority)}
            />
            <Link
              href={`/dashboard/audit?q=${encodeURIComponent(delivery.trackingCode)}`}
              className="button-secondary"
            >
              Audit trail
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <article className="panel">
            <p className="section-label">Order brief</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Dispatch and delivery details
            </h2>

            <div className="mt-5 grid gap-4 text-sm text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-3">
              <p>
                <span className="block section-label">Route</span>
                {delivery.zone.toUpperCase()} / {delivery.driverName ?? "Unassigned"}
              </p>
              <p>
                <span className="block section-label">Scheduled</span>
                {formatDateTime(delivery.scheduledFor)}
              </p>
              <p>
                <span className="block section-label">ETA</span>
                {formatDateTime(delivery.eta)}
              </p>
              <p>
                <span className="block section-label">Delivery fee</span>
                {formatCurrency(delivery.quotedPrice)}
              </p>
              <p>
                <span className="block section-label">Package value</span>
                {formatCurrency(delivery.declaredValue)}
              </p>
              <p>
                <span className="block section-label">Outstanding</span>
                {formatCurrency(Math.max(delivery.quotedPrice - delivery.amountPaid, 0))}
              </p>
            </div>

            <div className="mt-5 grid gap-4 text-sm text-[var(--muted)] md:grid-cols-2">
              <p>
                <span className="block section-label">Pickup</span>
                {delivery.pickupAddress}
              </p>
              <p>
                <span className="block section-label">Dropoff</span>
                {delivery.dropoffAddress}
              </p>
              <p>
                <span className="block section-label">Client contact</span>
                {delivery.clientPhone}
                {delivery.clientEmail ? ` / ${delivery.clientEmail}` : ""}
              </p>
              <p>
                <span className="block section-label">Recipient contact</span>
                {delivery.recipientPhone}
              </p>
              <p>
                <span className="block section-label">Internal dispatch note</span>
                {delivery.notes || "No dispatch notes on file"}
              </p>
              <p>
                <span className="block section-label">Driver note</span>
                {delivery.driverNotes || "No driver notes yet"}
              </p>
            </div>
          </article>

          <article className="panel">
            <p className="section-label">Dispatch controls</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Update this order
            </h2>
            <div className="mt-5">
              <DeliveryActionMenu delivery={delivery} drivers={drivers} />
            </div>
          </article>

          <section className="space-y-4">
            <div className="panel">
              <p className="section-label">Order timeline</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Recent audit events
              </h2>
              <p className="mt-3 text-sm text-[var(--muted)]">
                Every change on this order, including failures, is grouped here
                so dispatch can trace what happened on the record.
              </p>
            </div>

            {auditEvents.length > 0 ? (
              auditEvents.map((event) => <AuditEventCard key={event.id} event={event} />)
            ) : (
              <div className="panel text-sm text-[var(--muted)]">
                No audit events are attached to this order yet.
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <article className="panel">
            <p className="section-label">Assigned driver</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Driver context
            </h2>

            {assignedDriver ? (
              <div className="mt-5 space-y-4">
                <div className="metric-card">
                  <p className="text-lg font-semibold text-white">{assignedDriver.name}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {assignedDriver.zone.toUpperCase()} / {assignedDriver.phone}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{assignedDriver.email}</p>
                </div>

                <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                  <p className="metric-card">
                    <span className="block section-label">Current run</span>
                    <span className="mt-2 block text-white">
                      {assignedDriver.currentRun}
                    </span>
                  </p>
                  <p className="metric-card">
                    <span className="block section-label">Cash on hand</span>
                    <span className="mt-2 block text-white">
                      {formatCurrency(assignedDriver.cashOnHand)}
                    </span>
                  </p>
                </div>

                <Link
                  href={`/dashboard/drivers/${assignedDriver.id}`}
                  className="button-secondary w-full"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  Open driver detail
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-white/8 bg-black/15 p-5 text-sm text-[var(--muted)]">
                No driver is assigned yet. Dispatch this order from the controls
                panel to place it on a run.
              </div>
            )}
          </article>

          <article className="panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Client history</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Recent orders from this client
                </h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{relatedDeliveries.length} related</p>
            </div>

            {relatedDeliveries.length > 0 ? (
              <div className="mt-5 space-y-3">
                {relatedDeliveries.map((item) => (
                  <div key={item.id} className="metric-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                          {item.trackingCode}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {item.recipientName}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {formatDateTime(item.scheduledFor)}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/deliveries/${item.id}`}
                        className="button-ghost"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted)]">
                No other delivery records from this client yet.
              </p>
            )}
          </article>

          <article className="panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Zone queue</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Other jobs in this lane
                </h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{zoneQueue.length} in lane</p>
            </div>

            {zoneQueue.length > 0 ? (
              <div className="mt-5 space-y-3">
                {zoneQueue.map((item) => (
                  <div key={item.id} className="metric-card">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                          {item.trackingCode}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          {item.clientName}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {formatDateTime(item.scheduledFor)}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/deliveries/${item.id}`}
                        className="button-ghost"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted)]">
                No other active jobs are in this zone right now.
              </p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
