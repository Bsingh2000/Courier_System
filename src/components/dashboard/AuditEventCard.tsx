import Link from "next/link";

import { StatusPill } from "@/components/dashboard/StatusPill";
import type { AuditEventRecord } from "@/lib/types";
import {
  formatDateTime,
  getAuditEntityTone,
  getAuditOutcomeTone,
  getStatusLabel,
} from "@/lib/utils";

interface AuditEventCardProps {
  event: AuditEventRecord;
}

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

function formatFieldLabel(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

export function AuditEventCard({ event }: AuditEventCardProps) {
  const changes =
    event.metadata &&
    typeof event.metadata === "object" &&
    "changes" in event.metadata &&
    event.metadata.changes &&
    typeof event.metadata.changes === "object"
      ? (event.metadata.changes as Record<string, { before: unknown; after: unknown }>)
      : null;

  const metadataEntries = Object.entries(event.metadata ?? {}).filter(
    ([key]) => key !== "changes",
  );

  return (
    <article className="panel">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill
              label={getStatusLabel(event.entityType)}
              tone={getAuditEntityTone(event.entityType)}
            />
            <StatusPill
              label={event.outcome}
              tone={getAuditOutcomeTone(event.outcome)}
            />
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-slate-400">
              {event.action}
            </p>
          </div>
          <p className="mt-3 text-lg font-semibold text-white">{event.summary}</p>
        </div>

        <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2 lg:min-w-[24rem]">
          <p>
            <span className="block section-label">Actor</span>
            {event.actorLabel ?? event.actorType}
          </p>
          <p>
            <span className="block section-label">When</span>
            {formatDateTime(event.occurredAt)}
          </p>
          <p>
            <span className="block section-label">Entity</span>
            {event.entityId ?? "System"}
          </p>
          <p>
            <span className="block section-label">Request</span>
            {event.requestId ?? "Not captured"}
          </p>
        </div>
      </div>

      {changes && Object.keys(changes).length > 0 ? (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-label">Field changes</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Before and after values captured for this action.
              </p>
            </div>
            {event.deliveryId ? (
              <Link
                href={`/dashboard/deliveries/${event.deliveryId}`}
                className="button-secondary"
              >
                Open order
              </Link>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {Object.entries(changes).map(([field, change]) => (
              <div key={field} className="metric-card">
                <p className="section-label">{formatFieldLabel(field)}</p>
                <div className="mt-3 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
                  <p>
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                      Before
                    </span>
                    <span className="mt-1 block text-white">
                      {formatMetadataValue(change.before)}
                    </span>
                  </p>
                  <p>
                    <span className="block text-xs uppercase tracking-[0.2em] text-slate-400">
                      After
                    </span>
                    <span className="mt-1 block text-white">
                      {formatMetadataValue(change.after)}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {metadataEntries.length > 0 ? (
        <div className="mt-5 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2 xl:grid-cols-3">
          {metadataEntries.map(([key, value]) => (
            <div key={key} className="metric-card">
              <p className="section-label">{formatFieldLabel(key)}</p>
              <p className="mt-3 break-words text-sm text-white">
                {formatMetadataValue(value)}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
