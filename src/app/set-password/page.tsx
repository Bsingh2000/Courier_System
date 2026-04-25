import Link from "next/link";

import { SetPasswordForm } from "@/components/public/SetPasswordForm";
import { BrandMark } from "@/components/shell/BrandMark";

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ account?: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const account = Array.isArray(params.account) ? params.account[0] : params.account;

  return (
    <main className="shell flex min-h-screen flex-col justify-center py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <BrandMark />
        <Link href="/" className="button-secondary">
          Back to site
        </Link>
      </div>

      <SetPasswordForm fallbackAccountType={account} />
    </main>
  );
}
