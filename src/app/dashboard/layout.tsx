import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLogoutButton } from "@/components/dashboard/AdminLogoutButton";
import { BrandMark } from "@/components/shell/BrandMark";
import { WorkspaceSidebar } from "@/components/shell/WorkspaceSidebar";
import { canManageAdminAccounts, getCurrentAdminSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentAdminSession();

  if (!session) {
    redirect("/admin");
  }

  const demoMode = isDemoMode();
  const adminNavItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      note: "High-level operations overview",
    },
    {
      href: "/dashboard/inquiries",
      label: "Client inquiries",
      note: "Review prospects and send invites",
    },
    {
      href: "/dashboard/deliveries",
      label: "Deliveries",
      note: "Dispatch and payment controls",
    },
    {
      href: "/dashboard/drivers",
      label: "Drivers",
      note: "Driver roster and availability",
    },
    {
      href: "/dashboard/runs",
      label: "Driver runs",
      note: "See live stops and road activity",
    },
    {
      href: "/dashboard/planning",
      label: "Dispatch planning",
      note: "Bulk assignment and zone balance",
    },
    {
      href: "/dashboard/inventory",
      label: "Inventory",
      note: "Stock and reorder attention",
    },
    {
      href: "/dashboard/audit",
      label: "Audit",
      note: "Trace actions, sign-ins, and failures",
    },
    {
      href: "/dashboard/users",
      label: "Client accounts",
      note: "Client accounts and access",
    },
    ...(canManageAdminAccounts(session)
      ? [
          {
            href: "/dashboard/admins",
            label: "Admins",
            note: "Buyer-side admin users and roles",
          },
        ]
      : []),
  ];

  return (
    <main className="workspace-shell">
      <WorkspaceSidebar
        brand={<BrandMark />}
        title="Admin workspace"
        subtitle="Keep client inquiries, dispatch, driver runs, inventory, and client access separated into clear tabs."
        items={adminNavItems}
        quickAction={{
          href: "/dashboard/deliveries",
          label: "Dispatch",
        }}
        footer={
          <>
            <div>
              <p className="section-label">Signed in</p>
              <p className="mt-2 text-sm text-white">{session.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                {session.role}
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">{session.email}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {demoMode ? "Demo mode" : "Live mode"}
              </p>
            </div>
            <div className="grid gap-3">
              <Link href="/" className="button-secondary w-full">
                Public site
              </Link>
              <AdminLogoutButton />
            </div>
          </>
        }
      />

      <section className="workspace-main">{children}</section>
    </main>
  );
}
