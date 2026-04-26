"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LockKeyhole, Smartphone } from "lucide-react";

type LoginResponse =
  | { ok: true; message?: string }
  | { ok: false; message?: string }
  | {
      ok: false;
      message?: string;
      requiresPasswordChange: true;
      setupToken: string;
      email: string;
      accountType: "driver";
    };

interface DriverLoginFormProps {
  demoHint?: {
    email: string;
    password: string;
  };
  initialEmail?: string;
  notice?: string;
}

export function DriverLoginForm({
  demoHint,
  initialEmail,
  notice,
}: DriverLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? demoHint?.email ?? "");
  const [password, setPassword] = useState(demoHint?.password ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch("/api/driver/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as LoginResponse;

      if (
        response.status === 403 &&
        "requiresPasswordChange" in payload &&
        payload.requiresPasswordChange
      ) {
        const setupUrl = new URL("/set-password", window.location.origin);
        setupUrl.searchParams.set("account", payload.accountType);
        setupUrl.searchParams.set("email", payload.email);
        setupUrl.searchParams.set("token", payload.setupToken);
        window.location.assign(setupUrl.toString());
        return;
      }

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Sign in failed.");
        return;
      }

      router.push("/driver");
      router.refresh();
    });
  }

  return (
    <div className="panel-strong max-w-xl">
      <div className="mb-6">
        <p className="section-label">Driver workspace</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Open your run, update stops, and keep dispatch informed
        </h1>
        <p className="copy mt-3">
          Drivers use a focused mobile-friendly workspace to see assigned stops,
          collect balances, and report delivery updates without opening the full
          admin system.
        </p>
      </div>

      {notice ? (
        <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      {demoHint ? (
        <div className="mb-5 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Demo driver access is prefilled.</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.22em]">
                {demoHint.email} / {demoHint.password}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="field-label">Driver email</span>
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
          {isPending ? "Signing in..." : "Open driver workspace"}
        </button>
      </form>

      {feedback ? <p className="mt-4 text-sm text-rose-200">{feedback}</p> : null}
    </div>
  );
}
