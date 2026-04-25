"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, Plus } from "lucide-react";

export function InventoryCreateForm() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState({
    name: "",
    availableUnits: "0",
    reservedUnits: "0",
    reorderPoint: "0",
    location: "",
    health: "healthy",
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit() {
    startTransition(async () => {
      setFeedback(null);

      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          availableUnits: Number(form.availableUnits || 0),
          reservedUnits: Number(form.reservedUnits || 0),
          reorderPoint: Number(form.reorderPoint || 0),
        }),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Inventory create failed.");
        return;
      }

      setForm({
        name: "",
        availableUnits: "0",
        reservedUnits: "0",
        reorderPoint: "0",
        location: "",
        health: "healthy",
      });
      setIsExpanded(true);
      setFeedback("Inventory item added.");
      router.refresh();
    });
  }

  return (
    <div className="panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="section-label">Add inventory</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Create a new stock item
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="button-secondary shrink-0"
              aria-expanded={isExpanded}
              aria-controls="inventory-create-form"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
              {isExpanded ? "Hide form" : "Show form"}
            </button>
          </div>

          {!isExpanded ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Expand this section to add a new stock item and its reorder settings.
            </p>
          ) : null}
        </div>
      </div>

      {isExpanded ? (
        <>
          <div
            id="inventory-create-form"
            className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            <label className="block xl:col-span-2">
              <span className="field-label">Item name</span>
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                className="field"
                placeholder="Thermal mailers"
              />
            </label>

            <label className="block">
              <span className="field-label">Location</span>
              <input
                value={form.location}
                onChange={(event) => updateField("location", event.target.value)}
                className="field"
                placeholder="Warehouse A"
              />
            </label>

            <label className="block">
              <span className="field-label">Available units</span>
              <input
                value={form.availableUnits}
                onChange={(event) => updateField("availableUnits", event.target.value)}
                type="number"
                min="0"
                className="field"
              />
            </label>

            <label className="block">
              <span className="field-label">Reserved units</span>
              <input
                value={form.reservedUnits}
                onChange={(event) => updateField("reservedUnits", event.target.value)}
                type="number"
                min="0"
                className="field"
              />
            </label>

            <label className="block">
              <span className="field-label">Reorder point</span>
              <input
                value={form.reorderPoint}
                onChange={(event) => updateField("reorderPoint", event.target.value)}
                type="number"
                min="0"
                className="field"
              />
            </label>

            <label className="block">
              <span className="field-label">Health</span>
              <select
                value={form.health}
                onChange={(event) => updateField("health", event.target.value)}
                className="select-field"
              >
                <option value="healthy">Healthy</option>
                <option value="low">Low</option>
                <option value="critical">Critical</option>
              </select>
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
              {isPending ? "Adding..." : "Add item"}
            </button>
          </div>
        </>
      ) : null}

      {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
    </div>
  );
}
