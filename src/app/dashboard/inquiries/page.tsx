import { Search } from "lucide-react";

import { InquiryActionCard } from "@/components/dashboard/InquiryActionCard";
import { getDashboardSnapshot } from "@/lib/repository";
import type { BusinessInquiryRecord, BusinessInquiryStatus } from "@/lib/types";

function searchValueFromParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

function isInquiryStatus(value: string): value is BusinessInquiryStatus {
  return ["new", "contacted", "qualified", "invited", "archived"].includes(value);
}

function filterInquiries(
  inquiries: BusinessInquiryRecord[],
  filters: {
    query: string;
    status: string;
  },
) {
  const normalizedQuery = normalizeSearch(filters.query);

  return inquiries.filter((inquiry) => {
    if (isInquiryStatus(filters.status) && inquiry.status !== filters.status) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const searchText = normalizeSearch(
      [
        inquiry.businessName,
        inquiry.contactName,
        inquiry.phone,
        inquiry.email,
        inquiry.businessAddress,
        inquiry.notes ?? "",
      ].join(" "),
    );

    return searchText.includes(normalizedQuery);
  });
}

export default async function DashboardInquiriesPage({
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
  const inquiries = filterInquiries(snapshot.inquiries, { query, status });

  return (
    <div className="space-y-6">
      <section className="panel">
        <p className="section-label">Client inquiries</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Prospect review and onboarding
        </h1>
        <p className="copy mt-3 max-w-3xl">
          New prospects land here first. Qualify them, update the conversation
          status, and create a client portal invite once the business agreement
          is ready.
        </p>

        <form className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_14rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              className="field pl-11"
              placeholder="Search business, contact, phone, email, address, or notes"
            />
          </div>

          <select name="status" defaultValue={status} className="select-field">
            <option value="">All inquiry statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="invited">Invited</option>
            <option value="archived">Archived</option>
          </select>

          <button className="button-secondary">Apply filters</button>
        </form>
      </section>

      <section className="space-y-4">
        {inquiries.map((inquiry) => (
          <InquiryActionCard key={inquiry.id} inquiry={inquiry} />
        ))}

        {inquiries.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No client inquiries matched these filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
