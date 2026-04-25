import Link from "next/link";
import {
  CircleDollarSign,
  Clock3,
  Package,
  Truck,
  Users2,
} from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import { getDashboardSnapshot } from "@/lib/repository";
import {
  formatCurrency,
  formatDateTime,
  getInquiryTone,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

export default async function DashboardOverviewPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Operations overview
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Start with the queue, review new client inquiries, then move into
          deliveries, driver runs, planning, inventory, or client accounts from
          the sidebar.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <div className="flex items-center justify-between gap-3">
            <Truck className="h-5 w-5 text-orange-200" />
            <span className="section-label">Active</span>
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.metrics.activeDeliveries}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Live deliveries</p>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between gap-3">
            <Clock3 className="h-5 w-5 text-orange-200" />
            <span className="section-label">Awaiting</span>
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.metrics.awaitingDispatch}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Need dispatch</p>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between gap-3">
            <CircleDollarSign className="h-5 w-5 text-orange-200" />
            <span className="section-label">Collected</span>
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">
            {formatCurrency(snapshot.metrics.cashCollected)}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Booked payments</p>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between gap-3">
            <Users2 className="h-5 w-5 text-orange-200" />
            <span className="section-label">Clients</span>
          </div>
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.clientAccounts.length}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Portal accounts</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Dispatch queue</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Orders needing attention
              </h2>
            </div>
            <Link href="/dashboard/planning" className="button-secondary">
              Plan assignments
            </Link>
          </div>

          <div className="space-y-4">
            {snapshot.dispatchQueue.slice(0, 5).map((delivery) => (
              <div key={delivery.id} className="metric-card">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                      {delivery.trackingCode}
                    </p>
                    <p className="mt-2 text-base font-semibold text-white">
                      {delivery.clientName}
                    </p>
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
                      label={delivery.priority}
                      tone={getPriorityTone(delivery.priority)}
                    />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                  <p>
                    {delivery.zone.toUpperCase()} / {delivery.driverName ?? "Unassigned"}
                  </p>
                  <p>{formatDateTime(delivery.scheduledFor)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Client inquiries</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                New prospect inquiries
              </h2>
            </div>
            <Link href="/dashboard/inquiries" className="button-secondary">
              Review all
            </Link>
          </div>

          <div className="space-y-4">
            {snapshot.inquiries.slice(0, 4).map((inquiry) => (
              <div key={inquiry.id} className="metric-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {inquiry.businessName}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {inquiry.contactName}
                    </p>
                  </div>
                  <StatusPill
                    label={getStatusLabel(inquiry.status)}
                    tone={getInquiryTone(inquiry.status)}
                  />
                </div>
                <p className="mt-4 text-sm text-[var(--muted)]">
                  {inquiry.businessAddress}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Drivers</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Driver run snapshot
              </h2>
            </div>
            <Link href="/dashboard/runs" className="button-secondary">
              Open driver runs
            </Link>
          </div>

          <div className="space-y-4">
            {snapshot.driverRuns.slice(0, 4).map((run) => (
              <div key={run.driver.id} className="metric-card">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{run.driver.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {run.driver.zone.toUpperCase()} / {run.driver.currentRun}
                    </p>
                  </div>
                  <p className="text-right text-sm text-[var(--muted)]">
                    <span className="block text-white">{run.activeStops} active</span>
                    <span>{run.issueStops} issue</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Recent activity</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                What changed lately
              </h2>
            </div>
            <Package className="h-5 w-5 text-orange-200" />
          </div>

          <div className="space-y-4">
            {snapshot.activity.map((entry) => (
              <div key={entry.id} className="metric-card">
                <p className="text-sm font-semibold text-white">{entry.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">{entry.detail}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {formatDateTime(entry.timestamp)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
