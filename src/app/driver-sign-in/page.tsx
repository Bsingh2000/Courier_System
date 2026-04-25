import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentDriverSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { BrandMark } from "@/components/shell/BrandMark";
import { DriverLoginForm } from "@/components/public/DriverLoginForm";

export default async function DriverSignInPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[] | undefined;
    setup?: string | string[] | undefined;
  }>;
}) {
  const session = await getCurrentDriverSession();

  if (session) {
    redirect("/driver");
  }

  const demoHint = isDemoMode()
    ? {
        email: "asha@routegrid.local",
        password: "driver123",
      }
    : undefined;
  const params = await searchParams;
  const initialEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const setup = Array.isArray(params.setup) ? params.setup[0] : params.setup;
  const notice =
    setup === "1" ? "Password updated. Sign in to continue." : undefined;

  return (
    <main className="shell flex min-h-screen flex-col justify-center py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <BrandMark />
        <Link href="/" className="button-secondary">
          Back to site
        </Link>
      </div>

      <DriverLoginForm
        demoHint={demoHint}
        initialEmail={initialEmail}
        notice={notice}
      />
    </main>
  );
}
