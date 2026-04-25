"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { RefreshCcw, Save, Truck } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { DeliveryRecord, DriverRecord } from "@/lib/types";
import { getDriverTone, getStatusLabel } from "@/lib/utils";

interface DeliveryActionMenuProps {
  delivery: DeliveryRecord;
  drivers: DriverRecord[];
}

export function DeliveryActionMenu({
  delivery,
  drivers,
}: DeliveryActionMenuProps) {
  const router = useRouter();
  const initialDriverId = delivery.driverId ?? "";
  const initialNotes = delivery.notes ?? "";
  const [status, setStatus] = useState(delivery.status);
  const [zone, setZone] = useState(delivery.zone);
  const [driverId, setDriverId] = useState(initialDriverId);
  const [paymentStatus, setPaymentStatus] = useState(delivery.paymentStatus);
  const [amountPaid, setAmountPaid] = useState(String(delivery.amountPaid));
  const [notes, setNotes] = useState(initialNotes);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const zoneDrivers = drivers.filter((driver) => driver.zone === zone);
  const selectedDriver = zoneDrivers.find((driver) => driver.id === driverId);
  const hasChanges =
    status !== delivery.status ||
    zone !== delivery.zone ||
    driverId !== initialDriverId ||
    paymentStatus !== delivery.paymentStatus ||
    Number(amountPaid || 0) !== delivery.amountPaid ||
    notes !== initialNotes;

  function resetFields() {
    setStatus(delivery.status);
    setZone(delivery.zone);
    setDriverId(initialDriverId);
    setPaymentStatus(delivery.paymentStatus);
    setAmountPaid(String(delivery.amountPaid));
    setNotes(initialNotes);
    setFeedback(null);
  }

  function handleSave() {
    if (!hasChanges) {
      setFeedback("Nothing changed yet.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch(`/api/admin/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          zone,
          driverId,
          paymentStatus,
          amountPaid: Number(amountPaid),
          notes,
        }),
      });

      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setFeedback(result.message ?? "Update failed.");
        return;
      }

      setFeedback("Saved.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-[24px] border border-white/8 bg-black/15 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-white">Dispatch controls</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={resetFields} className="button-ghost">
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="button-primary"
            disabled={isPending || !hasChanges}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm text-[var(--muted)]">
        <div className="flex items-start gap-3">
          <Truck className="mt-0.5 h-4 w-4 shrink-0 text-orange-200" />
          <div className="space-y-2">
            <p>
              Pick the zone, assign the driver, then save once. Selecting{" "}
              <span className="text-white">Unassigned</span> puts the order back in
              the dispatch queue.
            </p>
            {selectedDriver ? (
              <p className="text-white">
                Ready for {selectedDriver.name} in the {zone.toUpperCase()} route.
              </p>
            ) : (
              <p>No driver selected yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Dispatch status</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as DeliveryRecord["status"])}
            className="select-field"
          >
            <option value="new">New</option>
            <option value="queued">Queued</option>
            <option value="dispatched">Dispatched</option>
            <option value="in_transit">In transit</option>
            <option value="delivered">Delivered</option>
            <option value="issue">Issue</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Zone</span>
          <select
            value={zone}
            onChange={(event) => {
              setZone(event.target.value as DeliveryRecord["zone"]);
              setDriverId("");
            }}
            className="select-field"
          >
            <option value="east">East</option>
            <option value="west">West</option>
            <option value="north">North</option>
            <option value="south">South</option>
          </select>
        </label>

        <label className="block">
          <span className="field-label">Driver assignment</span>
          <select
            value={driverId}
            onChange={(event) => setDriverId(event.target.value)}
            className="select-field"
          >
            <option value="">Unassigned</option>
            {zoneDrivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="field-label">Payment</span>
          <select
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(event.target.value as DeliveryRecord["paymentStatus"])
            }
            className="select-field"
          >
            <option value="unpaid">Unpaid</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
          </select>
        </label>

        <label className="block sm:col-span-2">
          <span className="field-label">Amount paid</span>
          <input
            value={amountPaid}
            onChange={(event) => setAmountPaid(event.target.value)}
            type="number"
            min="0"
            step="1"
            className="field"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="field-label">Internal dispatch note</span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="textarea-field"
            placeholder="Pickup delay, gate code, payment reminder, or reason for holding the order"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {zoneDrivers.length > 0 ? (
          zoneDrivers.map((driver) => (
            <StatusPill
              key={driver.id}
              label={`${driver.name} | ${getStatusLabel(driver.status)}`}
              tone={getDriverTone(driver.status)}
            />
          ))
        ) : (
          <p className="text-xs text-rose-200">
            No drivers are listed in this zone yet.
          </p>
        )}
      </div>

      {feedback ? (
        <p className="mt-3 text-xs text-orange-100">{feedback}</p>
      ) : null}
    </div>
  );
}
