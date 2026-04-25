import { redirect } from "next/navigation";
import Link from "next/link";

import { AdminLoginForm } from "@/components/public/AdminLoginForm";
import { BrandMark } from "@/components/shell/BrandMark";
import { getCurrentAdminSession, getAdminCredentials } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string | string[] | undefined;
    setup?: string | string[] | undefined;
  }>;
}) {
  const session = await getCurrentAdminSession();

  if (session) {
    redirect("/dashboard");
  }

  const demoMode = isDemoMode();
  const credentials = getAdminCredentials();
  const demoEmail = demoMode ? credentials.email : "";
  const demoPassword = demoMode ? credentials.password : "";
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
          Back to public site
        </Link>
      </div>

      <AdminLoginForm
        demoMode={demoMode}
        demoEmail={demoEmail}
        demoPassword={demoPassword}
        initialEmail={initialEmail}
        notice={notice}
      />
    </main>
  );
}
