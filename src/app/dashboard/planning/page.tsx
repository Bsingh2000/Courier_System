import { PlanningBoard } from "@/components/dashboard/PlanningBoard";
import { getDashboardSnapshot } from "@/lib/repository";

export default async function DashboardPlanningPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Dispatch planning</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Queue filters and bulk assignment
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Filter by zone or day, compare lane balance, select multiple jobs, and
          dispatch them in one step before moving into individual order
          workspaces for exceptions.
        </p>
      </section>

      <PlanningBoard
        deliveries={snapshot.deliveries}
        drivers={snapshot.drivers}
        zones={snapshot.zones}
      />
    </div>
  );
}
