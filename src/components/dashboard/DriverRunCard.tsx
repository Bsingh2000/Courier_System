import Link from "next/link";
import { PhoneCall, Route, Wallet } from "lucide-react";

import type { DriverRunSnapshot } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  formatRelativeHours,
  getDriverTone,
  getPaymentTone,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";
import { StatusPill } from "@/components/dashboard/StatusPill";

interface DriverRunCardProps {
  run: DriverRunSnapshot;
}

export function DriverRunCard({ run }: DriverRunCardProps) {
  const { driver } = run;

  return (
    <article className="panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xl font-semibold text-white">{driver.name}</p>
            <StatusPill
              label={getStatusLabel(run.effectiveStatus)}
              tone={getDriverTone(run.effectiveStatus)}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
            <p className="inline-flex items-center gap-2">
              <Route className="h-4 w-4 text-orange-200" />
              {driver.zone.toUpperCase()} / {driver.currentRun}
            </p>
            <p className="inline-flex items-center gap-2">
              <PhoneCall className="h-4 w-4 text-orange-200" />
              {driver.phone}
            </p>
            <p className="inline-flex items-center gap-2">
              <Wallet className="h-4 w-4 text-orange-200" />
              Received {formatCurrency(run.cashCollected)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2 lg:min-w-[20rem]">
          <p className="metric-card">
            <span className="block section-label">Active stops</span>
            <span className="mt-2 block text-2xl font-semibold text-white">
              {run.activeStops}
            </span>
          </p>
          <p className="metric-card">
            <span className="block section-label">Delivered</span>
            <span className="mt-2 block text-2xl font-semibold text-white">
              {run.deliveredStops}
            </span>
          </p>
          <p className="metric-card">
            <span className="block section-label">Issues</span>
            <span className="mt-2 block text-2xl font-semibold text-white">
              {run.issueStops}
            </span>
          </p>
          <p className="metric-card">
            <span className="block section-label">Cash to collect</span>
            <span className="mt-2 block text-2xl font-semibold text-white">
              {formatCurrency(run.outstandingBalance)}
            </span>
          </p>
        </div>
      </div>

      {run.nextEta ? (
        <div className="mt-5 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-[var(--muted)]">
          Next stop expected {formatDateTime(run.nextEta)} ({formatRelativeHours(run.nextEta)}).
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="section-label">Assigned stops</p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Current run details
            </h3>
          </div>
          <p className="text-sm text-[var(--muted)]">
            {run.activeDeliveries.length === 0
              ? "No live stops assigned"
              : `${run.activeDeliveries.length} live stop${
                  run.activeDeliveries.length === 1 ? "" : "s"
                }`}
          </p>
        </div>

        {run.activeDeliveries.length > 0 ? (
          <div className="space-y-3">
            {run.activeDeliveries.map((delivery) => (
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
                  <div className="flex flex-wrap items-center gap-2">
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
                </div>
                <div className="mt-4 flex flex-col gap-3 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    ETA {formatDateTime(delivery.eta)} / Amount due{" "}
                    {formatCurrency(Math.max(delivery.quotedPrice - delivery.amountPaid, 0))}
                  </p>
                  <Link
                    href={`/dashboard/deliveries/${delivery.id}`}
                    className="button-secondary"
                  >
                    Open order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/8 bg-black/15 p-5 text-sm text-[var(--muted)]">
            This driver is clear right now. New assignments will appear here after dispatch.
          </div>
        )}
      </div>
    </article>
  );
}
