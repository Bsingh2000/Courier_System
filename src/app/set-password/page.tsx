import Link from "next/link";

import { SetPasswordForm } from "@/components/public/SetPasswordForm";
import { BrandMark } from "@/components/shell/BrandMark";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    account?: string | string[] | undefined;
    email?: string | string[] | undefined;
    token?: string | string[] | undefined;
  }>;
}) {
  const params = await searchParams;
  const account = Array.isArray(params.account) ? params.account[0] : params.account;
  const email = Array.isArray(params.email) ? params.email[0] : params.email;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return (
    <main className="shell flex min-h-screen flex-col justify-center py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <BrandMark />
        <Link href="/" className="button-secondary">
          Back to site
        </Link>
      </div>

      <SetPasswordForm
        fallbackAccountType={account}
        firstLoginEmail={email}
        firstLoginToken={token}
      />
    </main>
  );
}
