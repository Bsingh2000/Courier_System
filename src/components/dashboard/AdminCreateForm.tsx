"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, KeyRound, UserPlus } from "lucide-react";

import type { AdminAccountStatus, AdminRole } from "@/lib/types";

const initialForm = {
  name: "",
  email: "",
  role: "admin" as AdminRole,
  status: "active" as AdminAccountStatus,
};

export function AdminCreateForm() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);
      setCreatedEmail(null);

      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        account?: {
          email: string;
          name: string;
        };
        temporaryPassword?: string;
      };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Admin creation failed.");
        return;
      }

      setFeedback(`${payload.account?.name ?? "Admin user"} created.`);
      setTemporaryPassword(payload.temporaryPassword ?? null);
      setCreatedEmail(payload.account?.email ?? null);
      setIsExpanded(true);
      resetForm();
      router.refresh();
    });
  }

  return (
    <section className="panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-label">Admin access</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Add company admins and dispatch roles
              </h2>
              <p className="copy mt-3 max-w-3xl">
                Create internal users for your company workspace, assign their role,
                and hand them a temporary password for their first sign-in.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="button-secondary shrink-0"
              aria-expanded={isExpanded}
              aria-controls="create-admin-form"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
              {isExpanded ? "Hide form" : "Show form"}
            </button>
          </div>

          {!isExpanded ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Expand this section to create owner, admin, dispatcher, or viewer access.
            </p>
          ) : null}
        </div>
      </div>

      {isExpanded ? (
        <>
          <form
            id="create-admin-form"
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4"
          >
            <label className="block xl:col-span-2">
              <span className="field-label">Admin name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="field"
                placeholder="Nadia Ramdial"
                required
              />
            </label>

            <label className="block xl:col-span-2">
              <span className="field-label">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="field"
                placeholder="dispatch@northshoremedics.com"
                required
              />
            </label>

            <label className="block">
              <span className="field-label">Role</span>
              <select
                value={form.role}
                onChange={(event) => updateField("role", event.target.value)}
                className="select-field"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>

            <label className="block">
              <span className="field-label">Access</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </label>

            <div className="flex items-end justify-end xl:col-span-2">
              <button
                type="submit"
                className="button-primary w-full sm:w-auto"
                disabled={isPending}
              >
                <UserPlus className="h-4 w-4" />
                {isPending ? "Creating..." : "Create admin user"}
              </button>
            </div>
          </form>

          {temporaryPassword ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="inline-flex items-center gap-2 font-semibold text-white">
                <KeyRound className="h-4 w-4" />
                Temporary password
              </p>
              <p className="mt-2 text-[var(--foreground)]">
                {createdEmail ? `${createdEmail} can sign in with this password.` : null}
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.24em]">
                {temporaryPassword}
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
    </section>
  );
}
