import { Search } from "lucide-react";

import { InventoryCreateForm } from "@/components/dashboard/InventoryCreateForm";
import { InventoryItemEditor } from "@/components/dashboard/InventoryItemEditor";
import { getDashboardSnapshot } from "@/lib/repository";
import type { InventoryHealth, InventoryItem } from "@/lib/types";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function isInventoryHealth(value: string): value is InventoryHealth {
  return ["healthy", "low", "critical"].includes(value);
}

function filterInventory(
  inventory: InventoryItem[],
  filters: {
    query: string;
    health: string;
  },
) {
  const normalizedQuery = normalizeSearch(filters.query);

  return inventory.filter((item) => {
    if (isInventoryHealth(filters.health) && item.health !== filters.health) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = normalizeSearch([item.name, item.location].join(" "));
    return searchText.includes(normalizedQuery);
  });
}

export default async function DashboardInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[] | undefined;
    health?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;
  const query = searchValueFromParam(params.q);
  const health = searchValueFromParam(params.health);
  const snapshot = await getDashboardSnapshot();
  const inventory = filterInventory(snapshot.inventory, { query, health });

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Inventory</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Packing materials and reorder control
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Add stock items, update unit counts, and flag low or critical
          materials before they slow down dispatch or proof-of-delivery work.
        </p>

        <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_14rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              className="field pl-11"
              placeholder="Search item name or storage location"
            />
          </div>

          <select name="health" defaultValue={health} className="select-field">
            <option value="">All health states</option>
            <option value="healthy">Healthy</option>
            <option value="low">Low</option>
            <option value="critical">Critical</option>
          </select>

          <button className="button-secondary">Apply filters</button>
        </form>
      </section>

      <InventoryCreateForm />

      <section className="space-y-4">
        {inventory.map((item) => (
          <InventoryItemEditor key={item.id} item={item} />
        ))}

        {inventory.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No inventory items matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
