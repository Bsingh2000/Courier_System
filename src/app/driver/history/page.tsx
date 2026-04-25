import { redirect } from "next/navigation";
import { Search } from "lucide-react";

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

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function DriverHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] | undefined }>;
}) {
  const session = await getCurrentDriverSession();

  if (!session) {
    redirect("/driver-sign-in");
  }

  const query = searchValueFromParam((await searchParams).q);
  const snapshot = await getDriverWorkspaceSnapshot(session.driverId, query);

  if (!snapshot) {
    redirect("/driver-sign-in");
  }

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">History</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Review completed stops
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Use this view to confirm what was completed on the run and review the
          notes already sent back to dispatch.
        </p>

        <form className="relative mt-5">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            className="field pl-11"
            placeholder="Search tracking, recipient, address, parcel, or note"
          />
        </form>
      </section>

      <section className="space-y-4">
        {snapshot.completedDeliveries.map((delivery) => (
          <article key={delivery.id} className="panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-200/90">
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

                <h2 className="mt-3 text-2xl font-semibold text-white">
                  {delivery.recipientName}
                </h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {delivery.clientName} / {delivery.parcelDescription}
                </p>
              </div>

              <div className="grid gap-4 text-sm text-[var(--muted)] sm:grid-cols-3 lg:min-w-[24rem]">
                <p>
                  <span className="block section-label">Completed</span>
                  {formatDateTime(delivery.updatedAt)}
                </p>
                <p>
                  <span className="block section-label">Collected</span>
                  {formatCurrency(delivery.amountPaid)}
                </p>
                <p>
                  <span className="block section-label">Zone</span>
                  {delivery.zone.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 text-sm text-[var(--muted)] md:grid-cols-2">
              <p>
                <span className="block section-label">Dropoff</span>
                {delivery.dropoffAddress}
              </p>
              <p>
                <span className="block section-label">Pickup</span>
                {delivery.pickupAddress}
              </p>
              <p>
                <span className="block section-label">Dispatch note</span>
                {delivery.notes || "No dispatch note attached."}
              </p>
              <p>
                <span className="block section-label">Driver note</span>
                {delivery.driverNotes || "No driver note recorded."}
              </p>
            </div>
          </article>
        ))}

        {snapshot.completedDeliveries.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No completed stops matched this search.
          </div>
        ) : null}
      </section>
    </div>
  );
}
