"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowRight, CircleCheckBig } from "lucide-react";

interface DeliveryIntakeFormProps {
  demoMode: boolean;
  clientAccount?: {
    contactName: string;
    businessName: string;
    phone: string;
    email: string;
    businessAddress: string;
  };
}

export function DeliveryIntakeForm({
  demoMode,
  clientAccount,
}: DeliveryIntakeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const raw = Object.fromEntries(formData.entries());
    const scheduled = new Date(String(raw.scheduledFor));

    if (Number.isNaN(scheduled.valueOf())) {
      setFeedback({
        kind: "error",
        message: "Please choose a valid scheduled time.",
      });
      setTrackingCode(null);
      return;
    }

    startTransition(async () => {
      setFeedback(null);
      setTrackingCode(null);

      const response = await fetch("/api/intake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...raw,
          scheduledFor: scheduled.toISOString(),
        }),
      });

      const result = (await response.json()) as {
        ok: boolean;
        message: string;
        trackingCode?: string;
      };

      if (!response.ok || !result.ok) {
        setFeedback({
          kind: "error",
          message: result.message,
        });
        return;
      }

      formRef.current?.reset();
      setTrackingCode(result.trackingCode ?? null);
      setFeedback({
        kind: "success",
        message: result.message,
      });
    });
  }

  return (
    <div className="panel-strong">
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="section-label">Client Intake</p>
          {demoMode ? (
            <span className="chip tone-warning">
              Demo mode
            </span>
          ) : (
            <span className="chip tone-success">
              Live database
            </span>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-white">
            {clientAccount
              ? "Submit a delivery for dispatch"
              : "Book a package without the back-and-forth"}
          </h2>
          <p className="copy mt-2">
            {clientAccount
              ? "Your business account is already attached. Just add the delivery details and the dispatch desk receives the request immediately with a tracking code."
              : "Clients can submit the package details, delivery fee, and preferred route. The dispatch desk receives each request immediately with a tracking code."}
          </p>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {clientAccount ? (
          <>
            <input type="hidden" name="clientName" value={clientAccount.businessName} />
            <input type="hidden" name="clientPhone" value={clientAccount.phone} />
            <input type="hidden" name="clientEmail" value={clientAccount.email} />

            <div className="rounded-[24px] border border-white/8 bg-black/15 p-4">
              <p className="section-label">Submitting as</p>
              <div className="mt-3 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                <p>
                  <span className="block section-label">Business</span>
                  {clientAccount.businessName}
                </p>
                <p>
                  <span className="block section-label">Primary contact</span>
                  {clientAccount.contactName}
                </p>
                <p>
                  <span className="block section-label">Phone</span>
                  {clientAccount.phone}
                </p>
                <p>
                  <span className="block section-label">Email</span>
                  {clientAccount.email}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="field-label">Client name</span>
              <input
                name="clientName"
                required
                className="field"
                placeholder="Business or sender"
              />
            </label>
            <label>
              <span className="field-label">Client phone</span>
              <input
                name="clientPhone"
                required
                className="field"
                placeholder="Primary contact"
              />
            </label>
            <label>
              <span className="field-label">Client email</span>
              <input
                name="clientEmail"
                type="email"
                className="field"
                placeholder="Optional"
              />
            </label>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Recipient name</span>
            <input
              name="recipientName"
              required
              className="field"
              placeholder="Who receives it"
            />
          </label>
          <label>
            <span className="field-label">Recipient phone</span>
            <input
              name="recipientPhone"
              required
              className="field"
              placeholder="Dropoff contact"
            />
          </label>
          <label>
            <span className="field-label">Dispatch zone</span>
            <select name="zone" defaultValue="east" className="select-field">
              <option value="east">East</option>
              <option value="west">West</option>
              <option value="north">North</option>
              <option value="south">South</option>
            </select>
          </label>
        </div>

        <label>
          <span className="field-label">Pickup address</span>
          <input
            name="pickupAddress"
            required
            className="field"
            defaultValue={clientAccount?.businessAddress}
            placeholder="Where the parcel is collected"
          />
        </label>

        <label>
          <span className="field-label">Dropoff address</span>
          <input
            name="dropoffAddress"
            required
            className="field"
            placeholder="Where the parcel goes"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2 lg:col-span-2">
            <span className="field-label">Parcel description</span>
            <input
              name="parcelDescription"
              required
              className="field"
              placeholder="What is being shipped"
            />
          </label>
          <label>
            <span className="field-label">Item count</span>
            <input
              name="itemCount"
              required
              defaultValue="1"
              type="number"
              min="1"
              className="field"
            />
          </label>
          <label>
            <span className="field-label">Package value</span>
            <input
              name="declaredValue"
              required
              defaultValue="0"
              type="number"
              min="0"
              className="field"
              placeholder="Value of the contents"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label>
            <span className="field-label">Delivery fee</span>
            <input
              name="quotedPrice"
              required
              type="number"
              min="0"
              defaultValue="0"
              className="field"
              placeholder="What we charge for delivery"
            />
          </label>
          <label>
            <span className="field-label">Payment method</span>
            <select name="paymentMethod" defaultValue="cash" className="select-field">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank transfer</option>
            </select>
          </label>
          <label>
            <span className="field-label">Priority</span>
            <select name="priority" defaultValue="standard" className="select-field">
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="fragile">Fragile</option>
            </select>
          </label>
          <label>
            <span className="field-label">Schedule</span>
            <input
              name="scheduledFor"
              required
              type="datetime-local"
              className="field"
            />
          </label>
        </div>

        <label>
          <span className="field-label">Notes for dispatch</span>
          <textarea
            name="notes"
            className="textarea-field"
            placeholder="Gate code, pay-on-delivery instructions, fragile handling, or delivery window"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" className="button-primary" disabled={isPending}>
            {isPending ? "Submitting..." : "Submit request"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-xs text-[var(--muted)]">
            Every submission is converted into an internal dispatch ticket.
          </p>
        </div>
      </form>

      {feedback ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            feedback.kind === "success"
              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
              : "border-rose-400/20 bg-rose-500/10 text-rose-100"
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.kind === "success" ? (
              <CircleCheckBig className="mt-0.5 h-4 w-4 shrink-0" />
            ) : null}
            <div>
              <p>{feedback.message}</p>
              {trackingCode ? (
                <p className="mt-1 font-mono text-xs uppercase tracking-[0.24em]">
                  Tracking code: {trackingCode}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
