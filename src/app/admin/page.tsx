import { redirect } from "next/navigation";
import Link from "next/link";

import { AdminLoginForm } from "@/components/public/AdminLoginForm";
import { BrandMark } from "@/components/shell/BrandMark";
import { getCurrentAdminSession, getAdminCredentials } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";

export default async function AdminPage() {
  const session = await getCurrentAdminSession();

  if (session) {
    redirect("/dashboard");
  }

  const demoMode = isDemoMode();
  const credentials = getAdminCredentials();
  const demoEmail = demoMode ? credentials.email : "";
  const demoPassword = demoMode ? credentials.password : "";

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
      />
    </main>
  );
}
