"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { InventoryItem } from "@/lib/types";
import { getInventoryTone } from "@/lib/utils";

interface InventoryItemEditorProps {
  item: InventoryItem;
}

export function InventoryItemEditor({ item }: InventoryItemEditorProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: item.name,
    availableUnits: String(item.availableUnits),
    reservedUnits: String(item.reservedUnits),
    reorderPoint: String(item.reorderPoint),
    location: item.location,
    health: item.health,
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasChanges =
    form.name !== item.name ||
    Number(form.availableUnits || 0) !== item.availableUnits ||
    Number(form.reservedUnits || 0) !== item.reservedUnits ||
    Number(form.reorderPoint || 0) !== item.reorderPoint ||
    form.location !== item.location ||
    form.health !== item.health;

  function updateField(name: string, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: item.name,
      availableUnits: String(item.availableUnits),
      reservedUnits: String(item.reservedUnits),
      reorderPoint: String(item.reorderPoint),
      location: item.location,
      health: item.health,
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

      const response = await fetch(`/api/admin/inventory/${item.id}`, {
        method: "PATCH",
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
        setFeedback(payload.message ?? "Inventory update failed.");
        return;
      }

      setFeedback("Inventory item updated.");
      router.refresh();
    });
  }

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      !window.confirm(`Remove ${item.name} from inventory?`)
    ) {
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch(`/api/admin/inventory/${item.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Inventory delete failed.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-white">{item.name}</p>
            <StatusPill label={item.health} tone={getInventoryTone(item.health)} />
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{item.location}</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetForm}
            className="button-ghost"
            disabled={isPending}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="button-primary"
            disabled={isPending || !hasChanges}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save item"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="button-danger"
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4" />
            Remove item
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <label className="block xl:col-span-2">
          <span className="field-label">Item name</span>
          <input
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="field"
          />
        </label>

        <label className="block">
          <span className="field-label">Location</span>
          <input
            value={form.location}
            onChange={(event) => updateField("location", event.target.value)}
            className="field"
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

      {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
    </div>
  );
}
