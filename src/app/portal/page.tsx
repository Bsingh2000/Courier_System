import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleDollarSign, Package, Truck, Wallet } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import { getCurrentClientSession } from "@/lib/auth";
import { getClientPortalSnapshot } from "@/lib/repository";
import {
  formatCurrency,
  formatDateTime,
  getPaymentTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

export default async function PortalOverviewPage() {
  const session = await getCurrentClientSession();

  if (!session) {
    redirect("/sign-in");
  }

  const snapshot = await getClientPortalSnapshot(session.clientId);

  if (!snapshot) {
    redirect("/sign-in");
  }

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Welcome back, {snapshot.client.businessName}
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Create new delivery requests, track your active jobs, and review your
          own history without needing the internal operations view.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel">
          <Truck className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.metrics.activeDeliveries}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Active deliveries</p>
        </div>
        <div className="panel">
          <Package className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {snapshot.metrics.deliveredDeliveries}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Delivered orders</p>
        </div>
        <div className="panel">
          <CircleDollarSign className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {formatCurrency(snapshot.metrics.totalRevenue)}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Booked value</p>
        </div>
        <div className="panel">
          <Wallet className="h-5 w-5 text-orange-200" />
          <p className="mt-5 text-3xl font-semibold text-white">
            {formatCurrency(snapshot.metrics.outstandingBalance)}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">Amount still due</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="panel">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Quick actions</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                What you can do here
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <div className="metric-card">
              <p className="text-base font-semibold text-white">Create a new delivery</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Submit parcel, route, pricing, and schedule details for dispatch.
              </p>
              <Link href="/portal/new-delivery" className="button-secondary mt-4">
                New delivery
              </Link>
            </div>
            <div className="metric-card">
              <p className="text-base font-semibold text-white">
                Review tracking and history
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Search your own jobs by tracking code, recipient, route, or status.
              </p>
              <Link href="/portal/tracking" className="button-secondary mt-4">
                Open history
              </Link>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="mb-5">
            <p className="section-label">Recent deliveries</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Latest client activity
            </h2>
          </div>

          <div className="space-y-4">
            {snapshot.deliveries.slice(0, 5).map((delivery) => (
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

                <div className="mt-4 flex flex-col gap-2 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between">
                  <p>{delivery.zone.toUpperCase()}</p>
                  <p>{formatDateTime(delivery.eta)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
