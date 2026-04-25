"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MailPlus, Save } from "lucide-react";

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
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSaveStatus() {
    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);

      const response = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const payload = (await response.json()) as { ok: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Status update failed.");
        return;
      }

      setFeedback("Inquiry updated.");
      router.refresh();
    });
  }

  function handleInvite() {
    startTransition(async () => {
      setFeedback(null);
      setTemporaryPassword(null);

      const response = await fetch(`/api/admin/inquiries/${inquiry.id}/invite`, {
        method: "POST",
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        temporaryPassword?: string;
      };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Invitation failed.");
        return;
      }

      setTemporaryPassword(payload.temporaryPassword ?? null);
      setFeedback("Client portal invitation created.");
      router.refresh();
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

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleSaveStatus}
              className="button-secondary"
              disabled={isPending}
            >
              <Save className="h-4 w-4" />
              Save status
            </button>
            <button
              type="button"
              onClick={handleInvite}
              className="button-primary"
              disabled={isPending || Boolean(inquiry.invitedClientId)}
            >
              <MailPlus className="h-4 w-4" />
              {inquiry.invitedClientId ? "Already invited" : "Invite client"}
            </button>
          </div>

          {temporaryPassword ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
              Temporary password:
              <span className="ml-2 font-mono text-xs tracking-[0.2em]">
                {temporaryPassword}
              </span>
            </div>
          ) : null}

          {feedback ? <p className="text-xs text-orange-100">{feedback}</p> : null}
        </div>
      </div>
    </div>
  );
}
