"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, MailPlus, RotateCcw, Save, Trash2 } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { DriverRecord, DriverRunSnapshot } from "@/lib/types";
import {
  formatCurrency,
  formatDateTime,
  getAccountTone,
  getDriverTone,
  getStatusLabel,
} from "@/lib/utils";

interface DriverManagementCardProps {
  driver: DriverRecord;
  run: DriverRunSnapshot;
}

export function DriverManagementCard({
  driver,
  run,
}: DriverManagementCardProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: driver.name,
    phone: driver.phone,
    email: driver.email,
    zone: driver.zone,
    status: driver.status,
    accessStatus: driver.accessStatus,
    currentRun: driver.currentRun,
    cashOnHand: String(driver.cashOnHand),
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null,
  );
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "save" | "reset_password" | "setup_email" | "delete" | null
  >(null);
  const [isPending, startTransition] = useTransition();
  const hasChanges =
    form.name !== driver.name ||
    form.phone !== driver.phone ||
    form.email !== driver.email ||
    form.zone !== driver.zone ||
    form.status !== driver.status ||
    form.accessStatus !== driver.accessStatus ||
    form.currentRun !== driver.currentRun ||
    Number(form.cashOnHand || 0) !== driver.cashOnHand;

  function updateField(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      zone: driver.zone,
      status: driver.status,
      accessStatus: driver.accessStatus,
      currentRun: driver.currentRun,
      cashOnHand: String(driver.cashOnHand),
    });
    setFeedback(null);
  }

  function handleSave() {
    if (!hasChanges) {
      setFeedback("Nothing changed yet.");
      return;
    }

    startTransition(async () => {
      setPendingAction("save");
      setFeedback(null);
      setFeedbackTone(null);

      try {
        const response = await fetch(`/api/admin/drivers/${driver.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            cashOnHand: Number(form.cashOnHand || 0),
          }),
        });

        const payload = (await response.json()) as { ok: boolean; message?: string };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Driver update failed.");
          return;
        }

        setFeedbackTone("success");
        setFeedback("Driver updated.");
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleResetPassword() {
    startTransition(async () => {
      setPendingAction("reset_password");
      setFeedback(null);
      setFeedbackTone(null);
      setTemporaryPassword(null);

      try {
        const response = await fetch(`/api/admin/drivers/${driver.id}/reset-password`, {
          method: "POST",
        });

        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          temporaryPassword?: string;
        };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Password reset failed.");
          return;
        }

        setFeedbackTone("success");
        setTemporaryPassword(payload.temporaryPassword ?? null);
        setFeedback("Temporary password generated.");
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleSendSetupEmail() {
    startTransition(async () => {
      setPendingAction("setup_email");
      setFeedback(null);
      setFeedbackTone(null);
      setTemporaryPassword(null);

      try {
        const response = await fetch(
          `/api/admin/drivers/${driver.id}/send-setup-email`,
          {
            method: "POST",
          },
        );

        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          temporaryPassword?: string | null;
          setupEmailSent?: boolean;
          setupEmailFallback?: boolean;
        };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Setup email failed.");
          return;
        }

        setFeedbackTone("success");
        setTemporaryPassword(payload.temporaryPassword ?? null);

        if (payload.setupEmailSent) {
          setFeedback(`Setup email sent to ${driver.email}.`);
        } else if (payload.setupEmailFallback) {
          setFeedback(
            `Setup email is unavailable in demo mode, so a temporary password was generated for ${driver.email}.`,
          );
        } else {
          setFeedback(`Setup email sent to ${driver.email}.`);
        }

        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove ${driver.name} from the driver roster?`)
    ) {
      return;
    }

    startTransition(async () => {
      setPendingAction("delete");
      setFeedback(null);
      setFeedbackTone(null);
      setTemporaryPassword(null);

      try {
        const response = await fetch(`/api/admin/drivers/${driver.id}`, {
          method: "DELETE",
        });

        const payload = (await response.json()) as { ok: boolean; message?: string };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Driver delete failed.");
          return;
        }

        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xl font-semibold text-white">{driver.name}</p>
            <StatusPill
              label={getStatusLabel(run.effectiveStatus)}
              tone={getDriverTone(run.effectiveStatus)}
            />
            <StatusPill
              label={driver.accessStatus}
              tone={getAccountTone(driver.accessStatus)}
            />
          </div>

          <div className="mt-4 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-4">
            <p className="metric-card">
              <span className="block section-label">Active stops</span>
              <span className="mt-2 block text-2xl font-semibold text-white">
                {run.activeStops}
              </span>
            </p>
            <p className="metric-card">
              <span className="block section-label">Delivered</span>
              <span className="mt-2 block text-2xl font-semibold text-white">
                {run.deliveredStops}
              </span>
            </p>
            <p className="metric-card">
              <span className="block section-label">Payments received</span>
              <span className="mt-2 block text-white">
                {formatCurrency(run.cashCollected)}
              </span>
            </p>
            <p className="metric-card">
              <span className="block section-label">Last login</span>
              <span className="mt-2 block text-white">
                {driver.lastLoginAt ? formatDateTime(driver.lastLoginAt) : "No login yet"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/dashboard/drivers/${driver.id}`} className="button-secondary">
            Open detail
          </Link>
          <button
            type="button"
            onClick={handleSendSetupEmail}
            className="button-secondary"
            disabled={isPending}
          >
            <MailPlus className="h-4 w-4" />
            {isPending && pendingAction === "setup_email"
              ? "Sending..."
              : "Send setup email"}
          </button>
          <button
            type="button"
            onClick={handleResetPassword}
            className="button-secondary"
            disabled={isPending}
          >
            <KeyRound className="h-4 w-4" />
            {isPending && pendingAction === "reset_password"
              ? "Generating..."
              : "Generate temp password"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="button-danger"
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            {isPending && pendingAction === "delete" ? "Removing..." : "Remove driver"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="block xl:col-span-2">
          <span className="field-label">Driver name</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="field"
          />
        </label>

        <label className="block">
          <span className="field-label">Phone</span>
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            className="field"
          />
        </label>

        <label className="block">
          <span className="field-label">Email</span>
          <input
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="field"
          />
        </label>

        <label className="block">
          <span className="field-label">Zone</span>
          <select
            value={form.zone}
            onChange={(event) => updateField("zone", event.target.value)}
            className="select-field"
          >
            <option value="east">East</option>
            <option value="west">West</option>
            <option value="north">North</option>
            <option value="south">South</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Operational status</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="select-field"
          >
            <option value="available">Available</option>
            <option value="on_run">On run</option>
            <option value="off_duty">Off duty</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Access</span>
          <select
            value={form.accessStatus}
            onChange={(event) => updateField("accessStatus", event.target.value)}
            className="select-field"
          >
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Cash on hand</span>
          <input
            value={form.cashOnHand}
            onChange={(event) => updateField("cashOnHand", event.target.value)}
            type="number"
            min="0"
            className="field"
          />
        </label>

        <label className="block sm:col-span-2 xl:col-span-4">
          <span className="field-label">Current run label</span>
          <input
            value={form.currentRun}
            onChange={(event) => updateField("currentRun", event.target.value)}
            className="field"
          />
        </label>
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
          {isPending && pendingAction === "save" ? "Saving..." : "Save driver"}
        </button>
      </div>

      {temporaryPassword ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-white">Temporary password</p>
          <p className="mt-2 font-mono text-xs tracking-[0.24em]">
            {temporaryPassword}
          </p>
        </div>
      ) : null}

      {feedback ? (
        <p
          className={`mt-3 text-xs ${
            feedbackTone === "error" ? "text-rose-200" : "text-emerald-100"
          }`}
        >
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
