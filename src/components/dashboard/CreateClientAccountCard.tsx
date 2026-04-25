"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, ChevronDown, KeyRound, MailPlus } from "lucide-react";

import type { ClientAccountStatus } from "@/lib/types";

const initialForm = {
  contactName: "",
  businessName: "",
  email: "",
  phone: "",
  businessAddress: "",
  status: "active" as ClientAccountStatus,
};

export function CreateClientAccountCard() {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null,
  );
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "temporary_password" | "setup_email" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function updateField(name: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const onboardingMethod =
      submitter?.value === "temporary_password"
        ? "temporary_password"
        : "setup_email";

    startTransition(async () => {
      setPendingAction(onboardingMethod);
      setFeedback(null);
      setFeedbackTone(null);
      setTemporaryPassword(null);
      setCreatedEmail(null);

      try {
        const response = await fetch("/api/admin/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            onboardingMethod,
          }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          account?: {
            email: string;
            businessName: string;
          };
          temporaryPassword?: string | null;
          setupEmailSent?: boolean;
          setupEmailFallback?: boolean;
        };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Client creation failed.");
          return;
        }

        const email = payload.account?.email ?? form.email;
        const businessName = payload.account?.businessName ?? "Client account";

        if (payload.setupEmailSent) {
          setFeedback(`Setup email sent to ${email}.`);
        } else if (payload.setupEmailFallback) {
          setFeedback(
            `Setup email is unavailable in demo mode, so a temporary password was generated for ${email}.`,
          );
        } else {
          setFeedback(`Temporary password generated for ${businessName}.`);
        }

        setFeedbackTone("success");
        setTemporaryPassword(payload.temporaryPassword ?? null);
        setCreatedEmail(payload.account?.email ?? null);
        setIsExpanded(true);
        resetForm();
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <section className="panel">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-label">Direct create</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Add a client without a public inquiry
              </h2>
              <p className="copy mt-3 max-w-3xl">
                Use this when onboarding happened by phone, in person, or through an
                internal handoff. Choose whether to send a secure setup email or
                give the client a temporary password right away.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="button-secondary shrink-0"
              aria-expanded={isExpanded}
              aria-controls="create-client-account-form"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              />
              {isExpanded ? "Hide form" : "Show form"}
            </button>
          </div>

          {!isExpanded ? (
            <p className="mt-4 text-sm text-[var(--muted)]">
              Expand this section to create portal access directly for a client.
            </p>
          ) : null}
        </div>

        <div className="metric-card max-xl:w-full xl:min-w-[16rem]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-orange-200">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Manual onboarding</p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Creates portal access without using the public form.
              </p>
            </div>
          </div>
        </div>
      </div>

      {isExpanded ? (
        <>
          <form
            id="create-client-account-form"
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 lg:grid-cols-2"
          >
            <label className="block">
              <span className="field-label">Primary contact</span>
              <input
                value={form.contactName}
                onChange={(event) => updateField("contactName", event.target.value)}
                className="field"
                placeholder="Full name"
                required
              />
            </label>

            <label className="block">
              <span className="field-label">Business name</span>
              <input
                value={form.businessName}
                onChange={(event) => updateField("businessName", event.target.value)}
                className="field"
                placeholder="Registered or trading name"
                required
              />
            </label>

            <label className="block">
              <span className="field-label">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                className="field"
                placeholder="Portal sign-in email"
                required
              />
            </label>

            <label className="block">
              <span className="field-label">Phone</span>
              <input
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="field"
                placeholder="Primary contact number"
                required
              />
            </label>

            <label className="block lg:col-span-2">
              <span className="field-label">Business address</span>
              <input
                value={form.businessAddress}
                onChange={(event) => updateField("businessAddress", event.target.value)}
                className="field"
                placeholder="Main pickup, office, or warehouse location"
                required
              />
            </label>

            <label className="block">
              <span className="field-label">Portal access</span>
              <select
                value={form.status}
                onChange={(event) => updateField("status", event.target.value)}
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </label>

            <div className="flex flex-wrap items-end justify-end gap-2 lg:col-span-1">
              <button
                type="submit"
                name="onboardingMethod"
                value="temporary_password"
                className="button-secondary w-full sm:w-auto"
                disabled={isPending}
              >
                <KeyRound className="h-4 w-4" />
                {isPending && pendingAction === "temporary_password"
                  ? "Generating..."
                  : "Generate temp password"}
              </button>
              <button
                type="submit"
                name="onboardingMethod"
                value="setup_email"
                className="button-primary w-full sm:w-auto"
                disabled={isPending}
              >
                <MailPlus className="h-4 w-4" />
                {isPending && pendingAction === "setup_email"
                  ? "Sending..."
                  : "Send setup email"}
              </button>
            </div>
          </form>

          {temporaryPassword ? (
            <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <p className="font-semibold text-white">Temporary password</p>
              <p className="mt-2 text-[var(--foreground)]">
                {createdEmail ? `${createdEmail} can sign in with this temporary password.` : null}
              </p>
              <p className="mt-3 font-mono text-xs tracking-[0.24em]">
                {temporaryPassword}
              </p>
            </div>
          ) : null}
        </>
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
    </section>
  );
}
