"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, KeyRound, MailPlus } from "lucide-react";

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
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null,
  );
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [createdEmail, setCreatedEmail] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "temporary_password" | "setup_email" | null
  >(null);
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
        const response = await fetch("/api/admin/drivers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...form,
            cashOnHand: Number(form.cashOnHand || 0),
            onboardingMethod,
          }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          driver?: {
            email: string;
            name: string;
          };
          temporaryPassword?: string | null;
          setupEmailSent?: boolean;
          setupEmailFallback?: boolean;
        };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Driver creation failed.");
          return;
        }

        const email = payload.driver?.email ?? form.email;
        const driverName = payload.driver?.name ?? "Driver";

        if (payload.setupEmailSent) {
          setFeedback(`Setup email sent to ${email}.`);
        } else if (payload.setupEmailFallback) {
          setFeedback(
            `Setup email is unavailable in demo mode, so a temporary password was generated for ${email}.`,
          );
        } else {
          setFeedback(`Temporary password generated for ${driverName}.`);
        }

        resetForm();
        setIsExpanded(true);
        setFeedbackTone("success");
        setCreatedEmail(payload.driver?.email ?? null);
        setTemporaryPassword(payload.temporaryPassword ?? null);
        router.refresh();
      } finally {
        setPendingAction(null);
      }
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
              <p className="copy mt-3 max-w-3xl">
                Choose whether to send a secure setup email or issue a
                temporary password for the driver&apos;s first sign-in.
              </p>
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
          <form id="driver-create-form" onSubmit={handleSubmit} className="mt-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <label className="block xl:col-span-2">
                <span className="field-label">Driver name</span>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  className="field"
                  placeholder="Asha Khan"
                  required
                />
              </label>

              <label className="block">
                <span className="field-label">Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  className="field"
                  placeholder="(868) 785-9930"
                  required
                />
              </label>

              <label className="block">
                <span className="field-label">Email</span>
                <input
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  className="field"
                  placeholder="asha@routegrid.local"
                  type="email"
                  required
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
                  required
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="submit"
                name="onboardingMethod"
                value="temporary_password"
                className="button-secondary"
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
                className="button-primary"
                disabled={isPending}
              >
                <MailPlus className="h-4 w-4" />
                {isPending && pendingAction === "setup_email"
                  ? "Sending..."
                  : "Send setup email"}
              </button>
            </div>
          </form>
        </>
      ) : null}

      {temporaryPassword ? (
        <div className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="inline-flex items-center gap-2 font-semibold text-white">
            <KeyRound className="h-4 w-4" />
            Temporary password
          </p>
          <p className="mt-2 text-[var(--foreground)]">
            {createdEmail ? `${createdEmail} can sign in with this temporary password.` : null}
          </p>
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
