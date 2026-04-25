import { redirect } from "next/navigation";
import { Search } from "lucide-react";

import { AdminCreateForm } from "@/components/dashboard/AdminCreateForm";
import { AdminManagementCard } from "@/components/dashboard/AdminManagementCard";
import {
  canManageAdminAccounts,
  getCurrentAdminSession,
} from "@/lib/auth";
import { getDashboardSnapshot } from "@/lib/repository";
import type { AdminAccountRecord, AdminAccountStatus, AdminRole } from "@/lib/types";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function isAdminRole(value: string): value is AdminRole {
  return ["owner", "admin", "dispatcher", "viewer"].includes(value);
}

function isAdminStatus(value: string): value is AdminAccountStatus {
  return ["active", "paused"].includes(value);
}

function filterAccounts(
  accounts: AdminAccountRecord[],
  filters: {
    query: string;
    role: string;
    status: string;
  },
) {
  const normalizedQuery = normalizeSearch(filters.query);

  return accounts.filter((account) => {
    if (isAdminRole(filters.role) && account.role !== filters.role) {
      return false;
    }

    if (isAdminStatus(filters.status) && account.status !== filters.status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = normalizeSearch(
      [
        account.name,
        account.email,
        account.role,
        account.status,
        account.createdByLabel,
      ].join(" "),
    );

    return searchText.includes(normalizedQuery);
  });
}

export default async function DashboardAdminsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[] | undefined;
    role?: string | string[] | undefined;
    status?: string | string[] | undefined;
  }>;
}) {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/admin");
  }

  if (!canManageAdminAccounts(session)) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const query = searchValueFromParam(params.q);
  const role = searchValueFromParam(params.role);
  const status = searchValueFromParam(params.status);
  const snapshot = await getDashboardSnapshot();
  const accounts = filterAccounts(snapshot.adminAccounts, { query, role, status });

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Admins</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Admin users and role access
        </h1>
        <p className="copy mt-3 max-w-3xl">
          Create owner, admin, dispatcher, and viewer accounts for your company here.
          Use this tab to control who can sign in to the private workspace and
          what level of access they should keep.
        </p>

        <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_12rem_12rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              className="field pl-11"
              placeholder="Search admin name, email, role, or creator"
            />
          </div>

          <select name="role" defaultValue={role} className="select-field">
            <option value="">All roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="dispatcher">Dispatcher</option>
            <option value="viewer">Viewer</option>
          </select>

          <select name="status" defaultValue={status} className="select-field">
            <option value="">All access states</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>

          <button className="button-secondary">Apply filters</button>
        </form>
      </section>

      <AdminCreateForm />

      <section className="space-y-4">
        {accounts.map((account) => (
          <AdminManagementCard
            key={account.id}
            account={account}
            currentAdminId={session.adminId}
          />
        ))}

        {accounts.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No admin users matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
