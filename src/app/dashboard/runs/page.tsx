import { DriverRunCard } from "@/components/dashboard/DriverRunCard";
import { getDashboardSnapshot } from "@/lib/repository";

export default async function DashboardRunsPage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Driver runs</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Live driver run board
        </h1>
        <p className="copy mt-3 max-w-3xl">
          See what each driver is carrying right now, how many active stops are
          still open, and how much cash still needs to be collected on the road.
        </p>
      </section>

      <section className="grid gap-6 2xl:grid-cols-2">
        {snapshot.driverRuns.map((run) => (
          <DriverRunCard key={run.driver.id} run={run} />
        ))}
      </section>
    </div>
  );
}
