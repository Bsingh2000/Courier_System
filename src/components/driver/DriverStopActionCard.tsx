"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CircleDollarSign,
  MapPinned,
  PhoneCall,
  Save,
} from "lucide-react";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { DeliveryRecord } from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatDateTime,
  getPaymentTone,
  getPriorityTone,
  getStatusLabel,
  getStatusTone,
} from "@/lib/utils";

const statusOptions: Array<{
  label: string;
  value: DeliveryRecord["status"];
}> = [
  { label: "Picked up", value: "dispatched" },
  { label: "On route", value: "in_transit" },
  { label: "Delivered", value: "delivered" },
  { label: "Issue", value: "issue" },
];

interface DriverStopActionCardProps {
  delivery: DeliveryRecord;
  highlight?: boolean;
}

export function DriverStopActionCard({
  delivery,
  highlight = false,
}: DriverStopActionCardProps) {
  const router = useRouter();
  const initialDriverNotes = delivery.driverNotes ?? "";
  const [status, setStatus] = useState<DeliveryRecord["status"]>(delivery.status);
  const [amountPaid, setAmountPaid] = useState(String(delivery.amountPaid));
  const [driverNotes, setDriverNotes] = useState(initialDriverNotes);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const amountValue = Number(amountPaid || 0);
  const outstandingBalance = Math.max(delivery.quotedPrice - amountValue, 0);
  const hasChanges =
    status !== delivery.status ||
    amountValue !== delivery.amountPaid ||
    driverNotes !== initialDriverNotes;
  const recipientNumber = delivery.recipientPhone.replaceAll(/\D/g, "");
  const directionsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    delivery.dropoffAddress,
  )}`;

  function handleSave() {
    if (!hasChanges) {
      setFeedback("Nothing changed yet.");
      return;
    }

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch(`/api/driver/deliveries/${delivery.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          amountPaid: amountValue,
          driverNotes,
        }),
      });

      const result = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !result.ok) {
        setFeedback(result.message ?? "Update failed.");
        return;
      }

      setFeedback("Update sent to dispatch.");
      router.refresh();
    });
  }

  return (
    <article
      className={cn(
        "panel",
        highlight && "border-orange-400/30 shadow-orange-500/10",
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange-200/90">
              {delivery.trackingCode}
            </p>
            {highlight ? (
              <span className="chip tone-orange">
                Next stop
              </span>
            ) : null}
            <StatusPill
              label={getStatusLabel(delivery.status)}
              tone={getStatusTone(delivery.status)}
            />
            <StatusPill
              label={delivery.paymentStatus}
              tone={getPaymentTone(delivery.paymentStatus)}
            />
            <StatusPill
              label={delivery.priority}
              tone={getPriorityTone(delivery.priority)}
            />
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white">
              {delivery.recipientName}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {delivery.clientName} / {delivery.parcelDescription}
            </p>
          </div>
        </div>

        <div className="grid gap-4 text-sm text-[var(--muted)] sm:grid-cols-3 lg:min-w-[24rem]">
          <p>
            <span className="block section-label">ETA</span>
            {formatDateTime(delivery.eta)}
          </p>
          <p>
            <span className="block section-label">Amount due</span>
            {formatCurrency(outstandingBalance)}
          </p>
          <p>
            <span className="block section-label">Received</span>
            {formatCurrency(amountValue)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-[var(--muted)] md:grid-cols-2">
        <p>
          <span className="block section-label">Dropoff</span>
          {delivery.dropoffAddress}
        </p>
        <p>
          <span className="block section-label">Pickup</span>
          {delivery.pickupAddress}
        </p>
        <p>
          <span className="block section-label">Dispatch note</span>
          {delivery.notes || "No dispatch note attached."}
        </p>
        <p>
          <span className="block section-label">Driver note</span>
          {delivery.driverNotes || "No driver note recorded yet."}
        </p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <a href={`tel:${recipientNumber}`} className="button-secondary">
          <PhoneCall className="h-4 w-4" />
          Call recipient
        </a>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="button-secondary"
        >
          <MapPinned className="h-4 w-4" />
          Open maps
        </a>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/8 bg-black/15 p-4">
        <p className="text-sm font-semibold text-white">Stop update</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Keep the stop status current, record what you received, and leave a
          short note for dispatch if anything changed on the road.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition",
                status === option.value
                  ? "border-orange-400/30 bg-orange-500/15 text-white"
                  : "border-white/10 bg-white/4 text-[var(--muted)] hover:bg-white/8 hover:text-white",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block">
            <span className="field-label">Amount received on this order</span>
            <input
              type="number"
              min="0"
              step="1"
              value={amountPaid}
              onChange={(event) => setAmountPaid(event.target.value)}
              className="field"
            />
          </label>
          <button
            type="button"
            onClick={() => setAmountPaid(String(delivery.quotedPrice))}
            className="button-secondary self-end"
          >
            <CircleDollarSign className="h-4 w-4" />
            Record full payment
          </button>
        </div>

        <label className="mt-4 block">
          <span className="field-label">Update for dispatch</span>
          <textarea
            value={driverNotes}
            onChange={(event) => setDriverNotes(event.target.value)}
            className="textarea-field"
            placeholder="Recipient asked for a callback, gate delay, exact handoff point, or redelivery note"
          />
        </label>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted)]">
            Payment status updates automatically from the amount received.
          </p>
          <button
            type="button"
            onClick={handleSave}
            className="button-primary"
            disabled={isPending || !hasChanges}
          >
            <Save className="h-4 w-4" />
            {isPending ? "Saving..." : "Save update"}
          </button>
        </div>

        {feedback ? <p className="mt-3 text-xs text-orange-100">{feedback}</p> : null}
      </div>
    </article>
  );
}
