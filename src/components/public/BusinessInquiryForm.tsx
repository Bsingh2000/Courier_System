"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowRight, CircleCheckBig } from "lucide-react";

export function BusinessInquiryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [feedback, setFeedback] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      setFeedback(null);

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });

      const payload = (await response.json()) as { ok: boolean; message: string };

      if (!response.ok || !payload.ok) {
        setFeedback({
          kind: "error",
          message: payload.message,
        });
        return;
      }

      formRef.current?.reset();
      setFeedback({
        kind: "success",
        message: payload.message,
      });
    });
  }

  return (
    <div className="panel-strong">
      <div className="mb-6">
        <p className="section-label">Become a client</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">
          Tell us about your business and delivery needs
        </h2>
        <p className="copy mt-3">
          This goes straight into the admin workspace so we can review the
          request, call you, agree the workflow, and invite you into the client
          portal.
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="field-label">Full name</span>
            <input
              name="contactName"
              required
              className="field"
              placeholder="Primary contact"
            />
          </label>
          <label>
            <span className="field-label">Business name</span>
            <input
              name="businessName"
              required
              className="field"
              placeholder="Registered or trading name"
            />
          </label>
          <label>
            <span className="field-label">Phone number</span>
            <input
              name="phone"
              required
              className="field"
              placeholder="Best number to reach you"
            />
          </label>
          <label>
            <span className="field-label">Email address</span>
            <input
              name="email"
              type="email"
              required
              className="field"
              placeholder="For onboarding and portal access"
            />
          </label>
        </div>

        <label>
          <span className="field-label">Business address</span>
          <input
            name="businessAddress"
            required
            className="field"
            placeholder="Main pickup or office location"
          />
        </label>

        <label>
          <span className="field-label">What do you need help with?</span>
          <textarea
            name="notes"
            className="textarea-field"
            placeholder="Delivery volume, service areas, pay-on-delivery requirements, operating hours, or industry specifics"
          />
        </label>

        <button type="submit" className="button-primary w-full" disabled={isPending}>
          {isPending ? "Sending..." : "Send inquiry"}
          <ArrowRight className="h-4 w-4" />
        </button>
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
            <p>{feedback.message}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
