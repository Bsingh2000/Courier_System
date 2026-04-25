import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentClientSession } from "@/lib/auth";
import { isDemoMode } from "@/lib/env";
import { BrandMark } from "@/components/shell/BrandMark";
import { ClientLoginForm } from "@/components/public/ClientLoginForm";

export default async function SignInPage() {
  const session = await getCurrentClientSession();

  if (session) {
    redirect("/portal");
  }

  const demoHint = isDemoMode()
    ? {
        email: "ops@nikoautoparts.com",
        password: "client123",
      }
    : undefined;

  return (
    <main className="shell flex min-h-screen flex-col justify-center py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <BrandMark />
        <Link href="/" className="button-secondary">
          Back to site
        </Link>
      </div>

      <ClientLoginForm demoHint={demoHint} />
    </main>
  );
}
