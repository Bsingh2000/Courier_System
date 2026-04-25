"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, MailPlus, Save } from "lucide-react";

import type { BusinessInquiryRecord } from "@/lib/types";
import { getInquiryTone, getStatusLabel } from "@/lib/utils";
import { StatusPill } from "@/components/dashboard/StatusPill";

interface InquiryActionCardProps {
  inquiry: BusinessInquiryRecord;
}

export function InquiryActionCard({ inquiry }: InquiryActionCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(inquiry.status);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<"success" | "error" | null>(
    null,
  );
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "save" | "temporary_password" | "setup_email" | null
  >(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveStatus() {
    startTransition(async () => {
      setPendingAction("save");
      setFeedback(null);
      setFeedbackTone(null);
      setTemporaryPassword(null);
      setInvitedEmail(null);

      try {
        const response = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        });

        const payload = (await response.json()) as { ok: boolean; message?: string };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Status update failed.");
          return;
        }

        setFeedbackTone("success");
        setFeedback("Inquiry updated.");
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  function handleInvite(onboardingMethod: "temporary_password" | "setup_email") {
    startTransition(async () => {
      setPendingAction(onboardingMethod);
      setFeedback(null);
      setFeedbackTone(null);
      setTemporaryPassword(null);
      setInvitedEmail(null);

      try {
        const response = await fetch(`/api/admin/inquiries/${inquiry.id}/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ onboardingMethod }),
        });

        const payload = (await response.json()) as {
          ok: boolean;
          message?: string;
          account?: {
            email: string;
          };
          temporaryPassword?: string | null;
          setupEmailSent?: boolean;
          setupEmailFallback?: boolean;
        };

        if (!response.ok || !payload.ok) {
          setFeedbackTone("error");
          setFeedback(payload.message ?? "Invitation failed.");
          return;
        }

        const email = payload.account?.email ?? inquiry.email;

        if (payload.setupEmailSent) {
          setFeedback(`Setup email sent to ${email}.`);
        } else if (payload.setupEmailFallback) {
          setFeedback(
            `Setup email is unavailable in demo mode, so a temporary password was generated for ${email}.`,
          );
        } else {
          setFeedback("Client portal invitation created with a temporary password.");
        }

        setFeedbackTone("success");
        setTemporaryPassword(payload.temporaryPassword ?? null);
        setInvitedEmail(email);
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className="rounded-[24px] border border-white/8 bg-black/15 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-semibold text-white">{inquiry.businessName}</p>
            <StatusPill
              label={getStatusLabel(inquiry.status)}
              tone={getInquiryTone(inquiry.status)}
            />
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {inquiry.contactName} / {inquiry.phone} / {inquiry.email}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">{inquiry.businessAddress}</p>
          <p className="mt-3 text-sm text-slate-100">
            {inquiry.notes || "No onboarding notes supplied."}
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <label className="block">
            <span className="field-label">Status</span>
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as BusinessInquiryRecord["status"])
              }
              className="select-field"
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="invited">Invited</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSaveStatus}
              className="button-secondary"
              disabled={isPending}
            >
              <Save className="h-4 w-4" />
              {isPending && pendingAction === "save" ? "Saving..." : "Save status"}
            </button>
            <button
              type="button"
              onClick={() => handleInvite("temporary_password")}
              className="button-secondary"
              disabled={isPending || Boolean(inquiry.invitedClientId)}
            >
              <KeyRound className="h-4 w-4" />
              {isPending && pendingAction === "temporary_password"
                ? "Generating..."
                : inquiry.invitedClientId
                  ? "Already invited"
                  : "Generate temp password"}
            </button>
            <button
              type="button"
              onClick={() => handleInvite("setup_email")}
              className="button-primary"
              disabled={isPending || Boolean(inquiry.invitedClientId)}
            >
              <MailPlus className="h-4 w-4" />
              {isPending && pendingAction === "setup_email"
                ? "Sending..."
                : inquiry.invitedClientId
                  ? "Already invited"
                  : "Send setup email"}
            </button>
          </div>

          {temporaryPassword ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              {invitedEmail ? `${invitedEmail} can sign in with this temporary password.` : "Temporary password:"}
              <span className="ml-2 font-mono text-xs tracking-[0.2em]">
                {temporaryPassword}
              </span>
            </div>
          ) : null}

          {feedback ? (
            <p
              className={`text-xs ${
                feedbackTone === "error" ? "text-rose-200" : "text-emerald-100"
              }`}
            >
              {feedback}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
