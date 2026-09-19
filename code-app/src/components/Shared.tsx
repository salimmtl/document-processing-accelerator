import type { ReactNode } from 'react';
import type { ProcessedDocument } from '../domain';
import { ProcessingStatus, STATUS_LABELS, STATUS_ORDER } from '../domain';
import { IconAlert, IconCheck, IconClock, IconDraft, IconInvoice, IconReceipt, IconSend } from '../icons';

const STATUS_KEY: Record<number, string> = {
  [ProcessingStatus.Draft]: 'draft',
  [ProcessingStatus.ReadyToProcess]: 'ready',
  [ProcessingStatus.Processing]: 'processing',
  [ProcessingStatus.Completed]: 'completed',
  [ProcessingStatus.Failed]: 'failed',
};

export function statusKey(status: number | null): string {
  return status === null ? 'draft' : (STATUS_KEY[status] ?? 'draft');
}

export function StatusIcon({ status, size = 16 }: { status: number | null; size?: number }) {
  switch (status) {
    case ProcessingStatus.Completed:
      return <IconCheck size={size} />;
    case ProcessingStatus.Failed:
      return <IconAlert size={size} />;
    case ProcessingStatus.Processing:
      return <IconClock size={size} />;
    case ProcessingStatus.ReadyToProcess:
      return <IconSend size={size} />;
    default:
      return <IconDraft size={size} />;
  }
}

export function StatusPill({ status }: { status: number | null }) {
  return (
    <span className={`pill pill--${statusKey(status)}`}>
      <StatusIcon status={status} size={13} />
      {status === null ? 'Unknown' : (STATUS_LABELS[status] ?? 'Unknown')}
    </span>
  );
}

export function KindAvatar({ kind, size = 42 }: { kind: 'invoice' | 'receipt'; size?: number }) {
  const Icon = kind === 'invoice' ? IconInvoice : IconReceipt;
  return (
    <span className={`avatar avatar--${kind}`} style={{ width: size, height: size }}>
      <Icon size={Math.round(size * 0.5)} />
    </span>
  );
}

export function formatDate(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatAmount(doc: ProcessedDocument): string {
  if (doc.totalAmount === null) return '—';
  const amount = doc.totalAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return doc.currencyCode ? `${amount} ${doc.currencyCode}` : amount;
}

export function StatusBreakdown({
  documents,
  onSelectStatus,
}: {
  documents: ProcessedDocument[];
  onSelectStatus: (status: number) => void;
}) {
  const total = documents.length || 1;
  return (
    <div className="breakdown">
      {STATUS_ORDER.map((status) => {
        const count = documents.filter((d) => d.status === status).length;
        const pct = Math.round((count / total) * 100);
        return (
          <button
            key={status}
            type="button"
            className={`bd bd--${STATUS_KEY[status]}`}
            onClick={() => onSelectStatus(status)}
            aria-label={`Show ${STATUS_LABELS[status]} documents (${count})`}
          >
            <span className="bd__head">
              <StatusIcon status={status} size={15} />
              <span className="bd__label">{STATUS_LABELS[status]}</span>
            </span>
            <span className="bd__count">{count}</span>
            <span className="bd__bar">
              <span className="bd__fill" style={{ width: `${pct}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="empty">
      {icon ? <span className="empty__icon">{icon}</span> : null}
      <p className="empty__title">{title}</p>
      {hint ? <p className="empty__hint">{hint}</p> : null}
    </div>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="loading__ring" />
      <span>{label}</span>
    </div>
  );
}
