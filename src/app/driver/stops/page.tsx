import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { DriverStopActionCard } from "@/components/driver/DriverStopActionCard";
import { getCurrentDriverSession } from "@/lib/auth";
import { getDriverWorkspaceSnapshot } from "@/lib/repository";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function DriverStopsPage({
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
        <p className="section-label">Stops</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Work your active stops
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Search your assigned stops, keep each one updated, and send road notes
          back to dispatch as you move.
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

      <section className="space-y-5">
        {snapshot.activeDeliveries.map((delivery) => (
          <DriverStopActionCard
            key={delivery.id}
            delivery={delivery}
            highlight={snapshot.nextStop?.id === delivery.id}
          />
        ))}

        {snapshot.activeDeliveries.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No active stops matched this search.
          </div>
        ) : null}
      </section>
    </div>
  );
}
