"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LockKeyhole, ShieldCheck } from "lucide-react";

interface AdminLoginFormProps {
  demoMode: boolean;
  demoEmail: string;
  demoPassword: string;
  initialEmail?: string;
  notice?: string;
}

export function AdminLoginForm({
  demoMode,
  demoEmail,
  demoPassword,
  initialEmail,
  notice,
}: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? demoEmail);
  const [password, setPassword] = useState(demoPassword);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Login failed.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="panel-strong max-w-xl">
      <div className="mb-6">
        <p className="section-label">Admin Portal</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Access dispatch, finance, and delivery history
        </h1>
        <p className="copy mt-3">
          Sign in with a company admin account. Fresh deployments can still
          use the bootstrap owner credentials until the first real admin users
          are created inside the system.
        </p>
      </div>

      {notice ? (
        <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      {demoMode ? (
        <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Demo credentials are prefilled.</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em]">
                {demoEmail} / {demoPassword}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="field-label">Admin email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field"
          />
        </label>

        <label className="block">
          <span className="field-label">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
          />
        </label>

        <button type="submit" className="button-primary w-full" disabled={isPending}>
          <LockKeyhole className="h-4 w-4" />
          {isPending ? "Signing in..." : "Open dashboard"}
        </button>
      </form>

      {feedback ? <p className="mt-4 text-sm text-rose-200">{feedback}</p> : null}
    </div>
  );
}
