"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, KeyRound, Plus } from "lucide-react";

export function DriverCreateForm() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    zone: "east",
    status: "available",
    accessStatus: "active",
    currentRun: "New route",
    cashOnHand: "0",
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: "",
      phone: "",
      email: "",
      zone: "east",
      status: "available",
      accessStatus: "active",
      currentRun: "New route",
      cashOnHand: "0",
    });
  }

  function handleSubmit() {
    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);

      const response = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          cashOnHand: Number(form.cashOnHand || 0),
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        temporaryPassword?: string;
      };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Driver creation failed.");
        return;
      }

      resetForm();
      setIsExpanded(true);
      setTemporaryPassword(payload.temporaryPassword ?? null);
      setFeedback("Driver added.");
      router.refresh();
    });
  }

  return (
    <div className="panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="section-label">Add driver</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Create a driver login and route profile
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="button-secondary shrink-0"
              aria-expanded={isExpanded}
              aria-controls="driver-create-form"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
              {isExpanded ? "Hide form" : "Show form"}
            </button>
          </div>

          {!isExpanded ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Expand this section to create a new driver login and route profile.
            </p>
          ) : null}
        </div>
      </div>

      {isExpanded ? (
        <>
          <div
            id="driver-create-form"
            className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <label className="block xl:col-span-2">
              <span className="field-label">Driver name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="field"
                placeholder="Asha Khan"
              />
            </label>

            <label className="block">
              <span className="field-label">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="field"
                placeholder="(868) 785-9930"
              />
            </label>

            <label className="block">
              <span className="field-label">Email</span>
              <input
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="field"
                placeholder="asha@routegrid.local"
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
                placeholder="South Corridor PM"
              />
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              className="button-primary"
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
              {isPending ? "Creating..." : "Create driver"}
            </button>
          </div>
        </>
      ) : null}

      {temporaryPassword ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="inline-flex items-center gap-2 font-semibold text-white">
            <KeyRound className="h-4 w-4" />
            Temporary password
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.24em]">
            {temporaryPassword}
          </p>
        </div>
      ) : null}

      {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
    </div>
  );
}
