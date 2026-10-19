import { STATUS_LABEL, type SourceStatus } from "@/lib/schema";

/**
 * Every status is a shape and a word, so it never depends on colour alone:
 * live ● · cached ○ · user supplied ■ · stale ◐ · conflicting ●● · unavailable —
 */
export function StatusMark({
  status,
  detail,
  compact = false,
}: {
  status: SourceStatus;
  detail?: string;
  compact?: boolean;
}) {
  return (
    <span className={`status status-${status}`} aria-label={compact ? STATUS_LABEL[status] : undefined}>
      <span className="status-shape" aria-hidden="true">
        {status === "conflicting" ? (
          <>
            <i />
            <i />
          </>
        ) : (
          <i />
        )}
      </span>
      {!compact && <span className="status-word">{STATUS_LABEL[status]}</span>}
      {detail && !compact && <span className="status-detail">{detail}</span>}
    </span>
  );
}
