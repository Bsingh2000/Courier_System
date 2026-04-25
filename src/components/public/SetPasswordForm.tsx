"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, KeyRound, LoaderCircle } from "lucide-react";
import type { Session, User } from "@supabase/supabase-js";

import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type AccountType = "admin" | "client" | "driver";

const accountTargets: Record<
  AccountType,
  {
    loginPath: string;
    workspacePath: string;
    loginApiPath: string;
    workspaceLabel: string;
  }
> = {
  admin: {
    loginPath: "/admin",
    workspacePath: "/dashboard",
    loginApiPath: "/api/admin/login",
    workspaceLabel: "admin workspace",
  },
  client: {
    loginPath: "/sign-in",
    workspacePath: "/portal",
    loginApiPath: "/api/client/login",
    workspaceLabel: "client portal",
  },
  driver: {
    loginPath: "/driver-sign-in",
    workspacePath: "/driver",
    loginApiPath: "/api/driver/login",
    workspaceLabel: "driver workspace",
  },
};

function resolveAccountType(user: User | null | undefined, fallback?: string): AccountType | null {
  const rawType = user?.app_metadata?.routegrid_account_type ?? fallback;

  if (rawType === "admin" || rawType === "client" || rawType === "driver") {
    return rawType;
  }

  return null;
}

interface SetPasswordFormProps {
  fallbackAccountType?: string;
}

export function SetPasswordForm({ fallbackAccountType }: SetPasswordFormProps) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let active = true;

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      setSession(currentSession);
      setLoading(false);
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) {
        return;
      }

      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setFeedback(null);

      if (!session?.user?.email) {
        setFeedback("This setup link is missing a valid session. Request a new email.");
        return;
      }

      if (password.length < 8) {
        setFeedback("Use at least 8 characters for the new password.");
        return;
      }

      if (password !== confirmPassword) {
        setFeedback("The password confirmation does not match.");
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFeedback(error.message);
        return;
      }

      const accountType = resolveAccountType(session.user, fallbackAccountType);

      if (!accountType) {
        await supabase.auth.signOut().catch(() => undefined);
        setFeedback("Password updated. Sign in from the correct workspace.");
        return;
      }

      const target = accountTargets[accountType];
      const loginResponse = await fetch(target.loginApiPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: session.user.email,
          password,
        }),
      });

      await supabase.auth.signOut().catch(() => undefined);

      if (loginResponse.ok) {
        router.push(target.workspacePath);
        router.refresh();
        return;
      }

      const signInUrl = new URL(target.loginPath, window.location.origin);
      signInUrl.searchParams.set("email", session.user.email);
      signInUrl.searchParams.set("setup", "1");
      window.location.assign(signInUrl.toString());
    });
  }

  const accountType = resolveAccountType(session?.user, fallbackAccountType);
  const target = accountType ? accountTargets[accountType] : null;

  if (loading) {
    return (
      <div className="panel-strong max-w-xl">
        <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Validating your setup link...
        </div>
      </div>
    );
  }

  if (!session?.user?.email) {
    return (
      <div className="panel-strong max-w-xl space-y-5">
        <div>
          <p className="section-label">Password setup</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            This setup link is invalid or has expired
          </h1>
          <p className="copy mt-3">
            Ask your admin team to send a new setup email or temporary password.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/" className="button-secondary">
            Back to public site
          </Link>
          {target ? (
            <Link href={target.loginPath} className="button-primary">
              Open {target.workspaceLabel}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="panel-strong max-w-xl">
      <div className="mb-6">
        <p className="section-label">Password setup</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Create your password and open the system
        </h1>
        <p className="copy mt-3">
          Set a password for <span className="text-white">{session.user.email}</span>.
          Once saved, you will move into the correct workspace automatically when possible.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold text-white">Setup link accepted.</p>
            <p className="mt-1 text-[var(--foreground)]">
              Finish the password step below to continue.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="field-label">New password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field"
            autoComplete="new-password"
          />
        </label>

        <label className="block">
          <span className="field-label">Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="field"
            autoComplete="new-password"
          />
        </label>

        <button type="submit" className="button-primary w-full" disabled={isPending}>
          <KeyRound className="h-4 w-4" />
          {isPending ? "Saving password..." : "Save password and continue"}
        </button>
      </form>

      {feedback ? <p className="mt-4 text-sm text-rose-200">{feedback}</p> : null}
    </div>
  );
}
