import { Download, Search } from "lucide-react";

import { AuditEventCard } from "@/components/dashboard/AuditEventCard";
import { getAuditTrail } from "@/lib/repository";
import type { AuditActorType, AuditEntityType, AuditOutcome } from "@/lib/types";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function toEntityType(value: string): AuditEntityType | undefined {
  return [
    "delivery",
    "business_inquiry",
    "client_account",
    "admin_account",
    "driver",
    "inventory_item",
    "auth",
    "system",
  ].includes(value)
    ? (value as AuditEntityType)
    : undefined;
}

function toActorType(value: string): AuditActorType | undefined {
  return ["admin", "client", "driver", "system"].includes(value)
    ? (value as AuditActorType)
    : undefined;
}

function toOutcome(value: string): AuditOutcome | undefined {
  return ["success", "error"].includes(value) ? (value as AuditOutcome) : undefined;
}

export default async function DashboardAuditPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[] | undefined;
    day?: string | string[] | undefined;
    entityType?: string | string[] | undefined;
    actorType?: string | string[] | undefined;
    outcome?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;
  const query = searchValueFromParam(params.q);
  const day = searchValueFromParam(params.day);
  const entityType = searchValueFromParam(params.entityType);
  const actorType = searchValueFromParam(params.actorType);
  const outcome = searchValueFromParam(params.outcome);
  const events = await getAuditTrail({
    search: query || undefined,
    day: day || undefined,
    entityType: toEntityType(entityType),
    actorType: toActorType(actorType),
    outcome: toOutcome(outcome),
  });
  const exportParams = new URLSearchParams();

  if (query) exportParams.set("q", query);
  if (day) exportParams.set("day", day);
  if (entityType) exportParams.set("entityType", entityType);
  if (actorType) exportParams.set("actorType", actorType);
  if (outcome) exportParams.set("outcome", outcome);

  return (
    <div className="space-y-6">
      <section className="panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="section-label">Audit</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              System audit trail
            </h1>
            <p className="copy mt-3 max-w-3xl">
              Filter by day, entity, actor, and outcome when you need to trace
              a specific order, user action, or operational failure.
            </p>
          </div>

          <a
            href={`/api/admin/audit/export?${exportParams.toString()}`}
            className="button-secondary"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        </div>

        <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_12rem_12rem_12rem_12rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              className="field pl-11"
              placeholder="Search tracking, action, business, actor, request, or entity"
            />
          </div>
          <input name="day" type="date" defaultValue={day} className="field" />
          <select name="entityType" defaultValue={entityType} className="select-field">
            <option value="">All entities</option>
            <option value="delivery">Delivery</option>
            <option value="business_inquiry">Inquiry</option>
            <option value="client_account">Client account</option>
            <option value="admin_account">Admin account</option>
            <option value="driver">Driver</option>
            <option value="inventory_item">Inventory item</option>
            <option value="auth">Auth</option>
            <option value="system">System</option>
          </select>
          <select name="actorType" defaultValue={actorType} className="select-field">
            <option value="">All actors</option>
            <option value="admin">Admin</option>
            <option value="client">Client</option>
            <option value="driver">Driver</option>
            <option value="system">System</option>
          </select>
          <select name="outcome" defaultValue={outcome} className="select-field">
            <option value="">All outcomes</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
          <button className="button-primary">Apply filters</button>
        </form>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="metric-card">
          <p className="section-label">Matching events</p>
          <p className="mt-3 text-3xl font-semibold text-white">{events.length}</p>
        </div>
        <div className="metric-card">
          <p className="section-label">Errors</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {events.filter((event) => event.outcome === "error").length}
          </p>
        </div>
        <div className="metric-card">
          <p className="section-label">Driver actions</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {events.filter((event) => event.actorType === "driver").length}
          </p>
        </div>
        <div className="metric-card">
          <p className="section-label">Delivery events</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {events.filter((event) => event.entityType === "delivery").length}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        {events.map((event) => (
          <AuditEventCard key={event.id} event={event} />
        ))}

        {events.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No audit events matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
