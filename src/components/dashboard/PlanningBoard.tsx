"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowUpRight, CheckSquare, ClipboardList, Square } from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { DeliveryRecord, DriverRecord, ZoneSummary } from "@/lib/types";
import {
  formatCompactCurrency,
  formatCurrency,
  formatDateTime,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

interface PlanningBoardProps {
  deliveries: DeliveryRecord[];
  drivers: DriverRecord[];
  zones: ZoneSummary[];
}

export function PlanningBoard({
  deliveries,
  drivers,
  zones,
}: PlanningBoardProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState("queued");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const queueDeliveries = deliveries.filter((delivery) => delivery.status !== "delivered");
  const availableDays = Array.from(
    new Set(queueDeliveries.map((delivery) => delivery.scheduledFor.slice(0, 10))),
  ).sort();
  const filteredDeliveries = queueDeliveries.filter((delivery) => {
    if (selectedZone && delivery.zone !== selectedZone) {
      return false;
    }

    if (selectedDay && !delivery.scheduledFor.startsWith(selectedDay)) {
      return false;
    }

    return true;
  });
  const visibleIds = filteredDeliveries.map((delivery) => delivery.id);
  const availableDrivers = selectedZone
    ? drivers.filter((driver) => driver.zone === selectedZone)
    : drivers;
  const selectedCount = selectedIds.filter((id) => visibleIds.includes(id)).length;

  function toggleDelivery(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  function selectVisible() {
    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])));
  }

  function clearVisible() {
    setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)));
  }

  function handleBulkAssign() {
    const deliveryIds = selectedIds.filter((id) => visibleIds.includes(id));

    if (deliveryIds.length === 0) {
      setFeedback("Select at least one visible job.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch("/api/admin/planning/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deliveryIds,
          driverId,
          status,
        }),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Bulk assignment failed.");
        return;
      }

      setSelectedIds((current) => current.filter((id) => !deliveryIds.includes(id)));
      setFeedback(`Updated ${deliveryIds.length} deliveries.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {zones.map((zone) => (
          <div key={zone.zone} className="metric-card">
            <p className="section-label">{zone.zone}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{zone.total}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {zone.moving} moving / {zone.pending} pending
            </p>
            <p className="mt-2 text-sm text-white">
              Revenue {formatCompactCurrency(zone.revenue)}
            </p>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="section-label">Bulk assignment</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Filter the queue, select orders, then assign
            </h2>
          </div>
          <div className="text-sm text-[var(--muted)]">
            {selectedCount} visible job{selectedCount === 1 ? "" : "s"} selected
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="block">
            <span className="field-label">Zone</span>
            <select
              value={selectedZone}
              onChange={(event) => setSelectedZone(event.target.value)}
              className="select-field"
            >
              <option value="">All zones</option>
              <option value="east">East</option>
              <option value="west">West</option>
              <option value="north">North</option>
              <option value="south">South</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Scheduled day</span>
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(event.target.value)}
              className="select-field"
            >
              <option value="">All upcoming days</option>
              {availableDays.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Assign driver</span>
            <select
              value={driverId}
              onChange={(event) => setDriverId(event.target.value)}
              className="select-field"
            >
              <option value="">Unassigned</option>
              {availableDrivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name} ({driver.zone.toUpperCase()})
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="field-label">Resulting status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="select-field"
            >
              <option value="queued">Queued</option>
              <option value="dispatched">Dispatched</option>
              <option value="in_transit">In transit</option>
              <option value="issue">Issue</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleBulkAssign}
            className="button-primary self-end"
            disabled={isPending}
          >
            <ClipboardList className="h-4 w-4" />
            {isPending ? "Updating..." : "Apply to selected"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={selectVisible} className="button-secondary">
            <CheckSquare className="h-4 w-4" />
            Select visible
          </button>
          <button type="button" onClick={clearVisible} className="button-ghost">
            <Square className="h-4 w-4" />
            Clear visible
          </button>
        </div>

        {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
      </section>

      <section className="space-y-3">
        {filteredDeliveries.map((delivery) => {
          const selected = selectedIds.includes(delivery.id);

          return (
            <article key={delivery.id} className="panel">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => toggleDelivery(delivery.id)}
                    className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full border ${
                      selected
                        ? "border-orange-300 bg-orange-500/20 text-orange-100"
                        : "border-white/15 bg-white/5 text-slate-400"
                    }`}
                    aria-label={`Select ${delivery.trackingCode}`}
                  >
                    {selected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-orange-200/90">
                        {delivery.trackingCode}
                      </p>
                      <StatusPill
                        label={getStatusLabel(delivery.status)}
                        tone={getStatusTone(delivery.status)}
                      />
                      <StatusPill
                        label={delivery.priority}
                        tone={getPriorityTone(delivery.priority)}
                      />
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {delivery.clientName}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {delivery.recipientName} / {delivery.parcelDescription}
                    </p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {delivery.pickupAddress} to {delivery.dropoffAddress}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2 xl:min-w-[26rem]">
                  <p>
                    <span className="block section-label">Route</span>
                    {delivery.zone.toUpperCase()} / {delivery.driverName ?? "Unassigned"}
                  </p>
                  <p>
                    <span className="block section-label">Scheduled</span>
                    {formatDateTime(delivery.scheduledFor)}
                  </p>
                  <p>
                    <span className="block section-label">Fee</span>
                    {formatCurrency(delivery.quotedPrice)}
                  </p>
                  <p>
                    <span className="block section-label">Amount due</span>
                    {formatCurrency(
                      Math.max(delivery.quotedPrice - delivery.amountPaid, 0),
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Link href={`/dashboard/deliveries/${delivery.id}`} className="button-secondary">
                  <ArrowUpRight className="h-4 w-4" />
                  Open order
                </Link>
              </div>
            </article>
          );
        })}

        {filteredDeliveries.length === 0 ? (
          <div className="panel text-sm text-[var(--muted)]">
            No queued deliveries matched these planning filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
