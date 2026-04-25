import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleDollarSign, ClipboardList, Clock3, Truck } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import { getCurrentDriverSession } from "@/lib/auth";
import { getDriverWorkspaceSnapshot } from "@/lib/repository";
import {
  formatCurrency,
  formatDateTime,
  getPaymentTone,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

export default async function DriverOverviewPage() {
  const session = await getCurrentDriverSession();

  if (!session) {
    redirect("/driver-sign-in");
  }

  const snapshot = await getDriverWorkspaceSnapshot(session.driverId);

  if (!snapshot) {
    redirect("/driver-sign-in");
  }

  return (
    <div className="space-y-6">
      <section className="panel-strong">
        <p className="section-label">Today</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          {snapshot.driver.currentRun}
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Keep your run current from here. Open stops as you move, record what
          you received, and leave clear notes whenever dispatch needs context.
        </p>

        {snapshot.nextStop ? (
          <div className="mt-6 rounded-[24px] border border-orange-400/20 bg-orange-500/10 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="section-label text-orange-100">Next stop</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {snapshot.nextStop.recipientName}
                </h2>
                <p className="mt-2 text-sm text-orange-50/90">
                  {snapshot.nextStop.dropoffAddress}
                </p>
              </div>
              <div className="grid gap-3 text-sm text-orange-50/90 sm:grid-cols-3 lg:min-w-[24rem]">
                <p>
                  <span className="block section-label text-orange-100/70">
                    Tracking
                  </span>
                  {snapshot.nextStop.trackingCode}
                </p>
                <p>
                  <span className="block section-label text-orange-100/70">ETA</span>
                  {formatDateTime(snapshot.nextStop.eta)}
                </p>
                <p>
                  <span className="block section-label text-orange-100/70">
                    Amount due
                  </span>
                  {formatCurrency(
                    Math.max(
                      snapshot.nextStop.quotedPrice - snapshot.nextStop.amountPaid,
                      0,
                    ),
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link href="/driver/stops" className="button-primary">
                Open active stops
              </Link>
              <a
                href={`tel:${snapshot.nextStop.recipientPhone.replaceAll(/\D/g, "")}`}
                className="button-secondary"
              >
                Call recipient
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-white/8 bg-black/15 p-5 text-sm text-[var(--muted)]">
            No live stops are assigned right now. New dispatches will appear here
            as soon as they are handed to you.
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <Truck className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.run.activeStops}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Active stops</p>
        </div>
        <div className="panel">
          <ClipboardList className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.run.deliveredStops}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Delivered today</p>
        </div>
        <div className="panel">
          <Clock3 className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.run.issueStops}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Needs follow-up</p>
        </div>
        <div className="panel">
          <CircleDollarSign className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {formatCurrency(snapshot.run.cashCollected)}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Payments received</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel">
          <p className="section-label">Run flow</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            What to do from here
          </h2>
          <div className="mt-5 space-y-4 text-sm text-[var(--muted)]">
            <p>Open the stops tab to work through your current drop-offs.</p>
            <p>Use the status buttons to mark pickup, transit, delivery, or issues.</p>
            <p>Update the amount received so dispatch and finance stay current.</p>
            <p>Leave a short road note when timing or handoff details change.</p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/driver/stops" className="button-secondary">
              Work active stops
            </Link>
            <Link href="/driver/history" className="button-secondary">
              Review completed work
            </Link>
          </div>
        </div>

        <div className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Live queue</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Current assigned stops
              </h2>
            </div>
            <Link href="/driver/stops" className="button-secondary">
              Open all
            </Link>
          </div>

          <div className="space-y-4">
            {snapshot.activeDeliveries.slice(0, 3).map((delivery) => (
              <div key={delivery.id} className="metric-card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                      {delivery.trackingCode}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {delivery.recipientName}
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
                    <StatusPill
                      label={delivery.priority}
                      tone={getPriorityTone(delivery.priority)}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                  <p>ETA {formatDateTime(delivery.eta)}</p>
                  <p>
                    Amount due{" "}
                    {formatCurrency(
                      Math.max(delivery.quotedPrice - delivery.amountPaid, 0),
                    )}
                  </p>
                </div>
              </div>
            ))}

            {snapshot.activeDeliveries.length === 0 ? (
              <div className="rounded-[24px] border border-white/8 bg-black/15 p-4 text-sm text-[var(--muted)]">
                No active stops on the run right now.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
