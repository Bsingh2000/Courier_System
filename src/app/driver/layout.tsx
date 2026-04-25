import Link from "next/link";
import { redirect } from "next/navigation";

import { DriverLogoutButton } from "@/components/driver/DriverLogoutButton";
import { BrandMark } from "@/components/shell/BrandMark";
import { WorkspaceSidebar } from "@/components/shell/WorkspaceSidebar";
import { getCurrentDriverSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { getDriverAccount } from "@/lib/repository";
import { getDriverTone } from "@/lib/utils";

const driverNavItems = [
  {
    href: "/driver",
    label: "Today",
    note: "Run summary and next stop",
  },
  {
    href: "/driver/stops",
    label: "Stops",
    note: "Active stops and live updates",
  },
  {
    href: "/driver/history",
    label: "History",
    note: "Delivered stops and notes",
  },
];

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentDriverSession();

  if (!session) {
    redirect("/driver-sign-in");
  }

  const driver = await getDriverAccount(session.driverId);

  if (!driver) {
    redirect("/driver-sign-in");
  }

  const operationalTone = getDriverTone(driver.status);

  return (
    <main className="workspace-shell">
      <WorkspaceSidebar
        brand={<BrandMark />}
        title="Driver workspace"
        subtitle="See your run, update stops, and keep dispatch informed without opening the admin view."
        items={driverNavItems}
        quickAction={{
          href: "/driver/stops",
          label: "Stops",
        }}
        mobileHeaderMode="brand_only"
        footer={
          <>
            <div>
              <p className="section-label">Signed in</p>
              <p className="mt-2 text-sm text-white">{driver.name}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                {driver.email} / {isDemoMode() ? "Demo mode" : "Live mode"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={`chip ${operationalTone}`}>
                  {driver.status.replaceAll("_", " ")}
                </span>
                <span className="chip tone-default">
                  {driver.zone.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              <Link href="/" className="button-secondary w-full">
                Public site
              </Link>
              <DriverLogoutButton />
            </div>
          </>
        }
      />

      <section className="workspace-main pb-6">{children}</section>
    </main>
  );
}
