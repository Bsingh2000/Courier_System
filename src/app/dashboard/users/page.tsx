import { Search } from "lucide-react";

import { ClientAccessCard } from "@/components/dashboard/ClientAccessCard";
import { CreateClientAccountCard } from "@/components/dashboard/CreateClientAccountCard";
import { getDashboardSnapshot } from "@/lib/repository";
import type { ClientAccountRecord, ClientAccountStatus } from "@/lib/types";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function isClientAccountStatus(value: string): value is ClientAccountStatus {
  return ["active", "paused"].includes(value);
}

function filterAccounts(
  accounts: ClientAccountRecord[],
  filters: {
    query: string;
    status: string;
  },
) {
  const normalizedQuery = normalizeSearch(filters.query);

  return accounts.filter((account) => {
    if (isClientAccountStatus(filters.status) && account.status !== filters.status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = normalizeSearch(
      [
        account.businessName,
        account.contactName,
        account.email,
        account.phone,
        account.businessAddress,
      ].join(" "),
    );

    return searchText.includes(normalizedQuery);
  });
}

export default async function DashboardUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[] | undefined;
    status?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;
  const query = searchValueFromParam(params.q);
  const status = searchValueFromParam(params.status);
  const snapshot = await getDashboardSnapshot();
  const accounts = filterAccounts(snapshot.clientAccounts, { query, status });

  const totals = new Map(
    snapshot.clientAccounts.map((account) => [account.id, { deliveries: 0, revenue: 0 }]),
  );

  for (const delivery of snapshot.deliveries) {
    if (!delivery.clientAccountId) {
      continue;
    }

    const current = totals.get(delivery.clientAccountId);

    if (!current) {
      continue;
    }

    current.deliveries += 1;
    current.revenue += delivery.quotedPrice;
  }

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Client accounts</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Client accounts and portal access
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Invite clients from inquiries first, or create them directly here when
          onboarding happens offline. Then manage active access, reset
          passwords, and review their delivery footprint without exposing
          internal dispatch details.
        </p>

        <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_14rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              className="field pl-11"
              placeholder="Search business, contact, email, phone, or address"
            />
          </div>

          <select name="status" defaultValue={status} className="select-field">
            <option value="">All access states</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>

          <button className="button-secondary">Apply filters</button>
        </form>
      </section>

      <CreateClientAccountCard />

      <section className="space-y-4">
        {accounts.map((account) => (
          <ClientAccessCard
            key={account.id}
            account={account}
            totals={totals.get(account.id) ?? { deliveries: 0, revenue: 0 }}
          />
        ))}

        {accounts.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No client accounts matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
