import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import { AuditEventCard } from "@/components/dashboard/AuditEventCard";
import { StatusPill } from "@/components/dashboard/StatusPill";
import { getDriverDetailSnapshot } from "@/lib/repository";
import {
  formatCurrency,
  formatDateTime,
  getAccountTone,
  getDriverTone,
  getPaymentTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

export default async function DashboardDriverDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const snapshot = await getDriverDetailSnapshot(id);

  if (!snapshot) {
    notFound();
  }

  const { driver, run, activeDeliveries, completedDeliveries, issueDeliveries, auditEvents } =
    snapshot;

  return (
    <div className="space-y-6">
      <section className="panel">
        <Link href="/dashboard/drivers" className="button-ghost -ml-3">
          <ArrowLeft className="h-4 w-4" />
          Back to drivers
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-label">Driver detail</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{driver.name}</h1>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {driver.zone.toUpperCase()} / {driver.phone} / {driver.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusPill
              label={getStatusLabel(run.effectiveStatus)}
              tone={getDriverTone(run.effectiveStatus)}
            />
            <StatusPill
              label={driver.accessStatus}
              tone={getAccountTone(driver.accessStatus)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <p className="section-label">Current run</p>
          <p className="mt-3 text-xl font-semibold text-white">{driver.currentRun}</p>
        </div>
        <div className="metric-card">
          <p className="section-label">Payments received</p>
          <p className="mt-3 text-xl font-semibold text-white">
            {formatCurrency(run.cashCollected)}
          </p>
        </div>
        <div className="metric-card">
          <p className="section-label">Cash to collect</p>
          <p className="mt-3 text-xl font-semibold text-white">
            {formatCurrency(run.outstandingBalance)}
          </p>
        </div>
        <div className="metric-card">
          <p className="section-label">Last login</p>
          <p className="mt-3 text-xl font-semibold text-white">
            {driver.lastLoginAt ? formatDateTime(driver.lastLoginAt) : "No login yet"}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <article className="panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Active run</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Live assigned stops
                </h2>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {activeDeliveries.length} active
              </p>
            </div>

            {activeDeliveries.length > 0 ? (
              <div className="mt-5 space-y-3">
                {activeDeliveries.map((delivery) => (
                  <div key={delivery.id} className="metric-card">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                          {delivery.trackingCode}
                        </p>
                        <p className="mt-2 text-base font-semibold text-white">
                          {delivery.clientName} to {delivery.recipientName}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {delivery.dropoffAddress}
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

                    <div className="mt-4 flex justify-end">
                      <Link
                        href={`/dashboard/deliveries/${delivery.id}`}
                        className="button-secondary"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                        Open order
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted)]">
                No active stops are assigned right now.
              </p>
            )}
          </article>

          <article className="panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Issue history</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Stops with issues
                </h2>
              </div>
              <p className="text-sm text-[var(--muted)]">{issueDeliveries.length} flagged</p>
            </div>

            {issueDeliveries.length > 0 ? (
              <div className="mt-5 space-y-3">
                {issueDeliveries.map((delivery) => (
                  <div key={delivery.id} className="metric-card">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                      {delivery.trackingCode}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {delivery.clientName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {delivery.driverNotes || delivery.notes || "No issue note captured"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted)]">
                No issue stops are attached to this driver yet.
              </p>
            )}
          </article>

          <section className="space-y-4">
            <div className="panel">
              <p className="section-label">Audit</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Driver activity trail
              </h2>
            </div>

            {auditEvents.length > 0 ? (
              auditEvents.map((event) => <AuditEventCard key={event.id} event={event} />)
            ) : (
              <div className="panel text-sm text-[var(--muted)]">
                No driver audit events are attached yet.
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <article className="panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Completed</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Delivered history
                </h2>
              </div>
              <p className="text-sm text-[var(--muted)]">
                {completedDeliveries.length} delivered
              </p>
            </div>

            {completedDeliveries.length > 0 ? (
              <div className="mt-5 space-y-3">
                {completedDeliveries.slice(0, 8).map((delivery) => (
                  <div key={delivery.id} className="metric-card">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                      {delivery.trackingCode}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {delivery.recipientName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatDateTime(delivery.updatedAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-[var(--muted)]">
                No completed stops yet.
              </p>
            )}
          </article>
        </div>
      </section>
    </div>
  );
}
