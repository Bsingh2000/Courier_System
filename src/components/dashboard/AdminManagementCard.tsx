"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, RotateCcw, Save, Trash2 } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { AdminAccountRecord } from "@/lib/types";
import {
  formatDateTime,
  getAccountTone,
  getAdminRoleTone,
  getStatusLabel,
} from "@/lib/utils";

interface AdminManagementCardProps {
  account: AdminAccountRecord;
  currentAdminId?: string;
}

export function AdminManagementCard({
  account,
  currentAdminId,
}: AdminManagementCardProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: account.name,
    email: account.email,
    role: account.role,
    status: account.status,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasChanges =
    form.name !== account.name ||
    form.email !== account.email ||
    form.role !== account.role ||
    form.status !== account.status;

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: account.name,
      email: account.email,
      role: account.role,
      status: account.status,
    });
    setFeedback(null);
  }

  function handleSave() {
    if (!hasChanges) {
      setFeedback("Nothing changed yet.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch(`/api/admin/admins/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Admin update failed.");
        return;
      }

      setFeedback("Admin user updated.");
      router.refresh();
    });
  }

  function handleResetPassword() {
    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);

      const response = await fetch(`/api/admin/admins/${account.id}/reset-password`, {
        method: "POST",
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        temporaryPassword?: string;
      };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Password reset failed.");
        return;
      }

      setTemporaryPassword(payload.temporaryPassword ?? null);
      setFeedback("Temporary password generated.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove ${account.name} from the admin workspace?`)
    ) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);

      const response = await fetch(`/api/admin/admins/${account.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Admin delete failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-semibold text-white">{account.name}</p>
            <StatusPill
              label={getStatusLabel(account.role)}
              tone={getAdminRoleTone(account.role)}
            />
            <StatusPill
              label={account.status}
              tone={getAccountTone(account.status)}
            />
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{account.email}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleResetPassword}
            className="button-secondary"
            disabled={isPending}
          >
            <KeyRound className="h-4 w-4" />
            Reset password
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="button-danger"
            disabled={isPending || currentAdminId === account.id}
          >
            <Trash2 className="h-4 w-4" />
            Remove admin
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block xl:col-span-2">
          <span className="field-label">Admin name</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="field"
          />
        </label>

        <label className="block xl:col-span-2">
          <span className="field-label">Email</span>
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="field"
            type="email"
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

        <p>
          <span className="block section-label">Last login</span>
          <span className="mt-2 block text-sm text-[var(--muted)]">
            {account.lastLoginAt ? formatDateTime(account.lastLoginAt) : "No login yet"}
          </span>
        </p>

        <p>
          <span className="block section-label">Created by</span>
          <span className="mt-2 block text-sm text-[var(--muted)]">
            {account.createdByLabel ?? "Bootstrap / system"}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={resetForm}
          className="button-ghost"
          disabled={isPending}
        >
          <RotateCcw className="h-4 w-4" />
          Reset form
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="button-primary"
          disabled={isPending || !hasChanges}
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save admin"}
        </button>
      </div>

      {temporaryPassword ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-white">Temporary password</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.24em]">
            {temporaryPassword}
          </p>
        </div>
      ) : null}

      {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
    </div>
  );
}
