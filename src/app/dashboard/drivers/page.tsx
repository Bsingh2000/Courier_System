import { Search } from "lucide-react";

import { DriverCreateForm } from "@/components/dashboard/DriverCreateForm";
import { DriverManagementCard } from "@/components/dashboard/DriverManagementCard";
import { getDashboardSnapshot } from "@/lib/repository";
import type {
  DriverAccessStatus,
  DriverRunSnapshot,
  DriverStatus,
  DispatchZone,
} from "@/lib/types";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function isZoneValue(value: string): value is DispatchZone {
  return ["east", "west", "north", "south"].includes(value);
}

function isDriverStatus(value: string): value is DriverStatus {
  return ["available", "on_run", "off_duty"].includes(value);
}

function isDriverAccessStatus(value: string): value is DriverAccessStatus {
  return ["active", "paused"].includes(value);
}

function filterRuns(
  runs: DriverRunSnapshot[],
  filters: {
    query: string;
    zone: string;
    status: string;
    access: string;
  },
) {
  const normalizedQuery = normalizeSearch(filters.query);

  return runs.filter((run) => {
    const { driver } = run;

    if (isZoneValue(filters.zone) && driver.zone !== filters.zone) {
      return false;
    }

    if (isDriverStatus(filters.status) && driver.status !== filters.status) {
      return false;
    }

    if (
      isDriverAccessStatus(filters.access) &&
      driver.accessStatus !== filters.access
    ) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = normalizeSearch(
      [driver.name, driver.phone, driver.email, driver.currentRun].join(" "),
    );

    return searchText.includes(normalizedQuery);
  });
}

export default async function DashboardDriversPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[] | undefined;
    zone?: string | string[] | undefined;
    status?: string | string[] | undefined;
    access?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;
  const query = searchValueFromParam(params.q);
  const zone = searchValueFromParam(params.zone);
  const status = searchValueFromParam(params.status);
  const access = searchValueFromParam(params.access);
  const snapshot = await getDashboardSnapshot();
  const runs = filterRuns(snapshot.driverRuns, { query, zone, status, access });

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Drivers</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Driver roster and access
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Add drivers, edit route ownership, pause access, reset passwords, and
          move into the driver detail view when you need a full run history.
        </p>

        <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_12rem_12rem_12rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              className="field pl-11"
              placeholder="Search driver name, phone, email, or run label"
            />
          </div>

          <select name="zone" defaultValue={zone} className="select-field">
            <option value="">All zones</option>
            <option value="east">East</option>
            <option value="west">West</option>
            <option value="north">North</option>
            <option value="south">South</option>
          </select>

          <select name="status" defaultValue={status} className="select-field">
            <option value="">All driver states</option>
            <option value="available">Available</option>
            <option value="on_run">On run</option>
            <option value="off_duty">Off duty</option>
          </select>

          <select name="access" defaultValue={access} className="select-field">
            <option value="">All access states</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>

          <button className="button-secondary">Apply filters</button>
        </form>
      </section>

      <DriverCreateForm />

      <section className="space-y-4">
        {runs.map((run) => (
          <DriverManagementCard
            key={run.driver.id}
            driver={run.driver}
            run={run}
          />
        ))}

        {runs.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No drivers matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
