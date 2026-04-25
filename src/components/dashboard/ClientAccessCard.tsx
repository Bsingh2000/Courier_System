"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, Save, Trash2 } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { ClientAccountRecord } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  getAccountTone,
} from "@/lib/utils";

interface ClientAccessCardProps {
  account: ClientAccountRecord;
  totals: {
    deliveries: number;
    revenue: number;
  };
}

export function ClientAccessCard({
  account,
  totals,
}: ClientAccessCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(account.status);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasChanges = status !== account.status;

  function handleSave() {
    if (!hasChanges) {
      setFeedback("Nothing changed yet.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch(`/api/admin/clients/${account.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Client update failed.");
        return;
      }

      setFeedback("Client access updated.");
      router.refresh();
    });
  }

  function handleResetPassword() {
    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);

      const response = await fetch(
        `/api/admin/clients/${account.id}/reset-password`,
        {
          method: "POST",
        },
      );

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
      !window.confirm(`Remove portal access for ${account.businessName}?`)
    ) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);

      const response = await fetch(`/api/admin/clients/${account.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Client delete failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-white">{account.businessName}</p>
            <StatusPill
              label={account.status}
              tone={getAccountTone(account.status)}
            />
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {account.contactName} / {account.phone}
          </p>
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
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            Remove client
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="button-primary"
            disabled={isPending || !hasChanges}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save access"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-4">
        <p>
          <span className="block section-label">Email</span>
          {account.email}
        </p>
        <p>
          <span className="block section-label">Phone</span>
          {account.phone}
        </p>
        <p>
          <span className="block section-label">Last login</span>
          {account.lastLoginAt ? formatDateTime(account.lastLoginAt) : "No login yet"}
        </p>
        <label className="block">
          <span className="field-label">Portal access</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ClientAccountRecord["status"])
            }
            className="select-field"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>
        <p>
          <span className="block section-label">Business address</span>
          {account.businessAddress}
        </p>
        <p>
          <span className="block section-label">Deliveries</span>
          {totals.deliveries}
        </p>
        <p>
          <span className="block section-label">Booked value</span>
          {formatCurrency(totals.revenue)}
        </p>
      </div>

      {temporaryPassword ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-white">Temporary password</p>
          <p className="mt-2 font-mono text-xs tracking-[0.24em]">
            {temporaryPassword}
          </p>
        </div>
      ) : null}

      {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
    </div>
  );
}
