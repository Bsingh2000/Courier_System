import Link from "next/link";
import { redirect } from "next/navigation";

import { ClientLogoutButton } from "@/components/portal/ClientLogoutButton";
import { BrandMark } from "@/components/shell/BrandMark";
import { WorkspaceSidebar } from "@/components/shell/WorkspaceSidebar";
import { getCurrentClientSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { getClientAccount } from "@/lib/repository";

const portalNavItems = [
  {
    href: "/portal",
    label: "Overview",
    note: "Quick client account summary",
  },
  {
    href: "/portal/new-delivery",
    label: "New delivery",
    note: "Submit a job for dispatch",
  },
  {
    href: "/portal/tracking",
    label: "Tracking & history",
    note: "Review your delivery statuses",
  },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentClientSession();

  if (!session) {
    redirect("/sign-in");
  }

  const client = await getClientAccount(session.clientId);

  if (!client) {
    redirect("/sign-in");
  }

  return (
    <main className="workspace-shell">
      <WorkspaceSidebar
        brand={<BrandMark />}
        title="Client portal"
        subtitle="Create deliveries, track your own jobs, and keep your requests organized without seeing internal operations data."
        items={portalNavItems}
        quickAction={{
          href: "/portal/new-delivery",
          label: "New job",
        }}
        footer={
          <>
            <div>
              <p className="section-label">Business</p>
              <p className="mt-2 text-sm text-white">{client.businessName}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {client.email} / {isDemoMode() ? "Demo mode" : "Live mode"}
              </p>
            </div>
            <div className="grid gap-3">
              <Link href="/" className="button-secondary w-full">
                Public site
              </Link>
              <ClientLogoutButton />
            </div>
          </>
        }
      />

      <section className="workspace-main">{children}</section>
    </main>
  );
}
