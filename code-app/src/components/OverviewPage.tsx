import type { ProcessedDocument } from '../domain';
import { ProcessingStatus } from '../domain';
import { IconAlert, IconChevron, IconInvoice, IconReceipt, IconSparkle, MicrosoftLogo } from '../icons';
import { EmptyState, KindAvatar, StatusBreakdown, StatusPill, formatAmount, formatDateTime } from './Shared';

interface Props {
  documents: ProcessedDocument[];
  onOpen: (doc: ProcessedDocument) => void;
  onBrowseStatus: (status: number) => void;
}

function sumOf(docs: ProcessedDocument[]): string {
  const withAmount = docs.filter((d) => d.totalAmount !== null);
  if (withAmount.length === 0) return '—';
  const total = withAmount.reduce((acc, d) => acc + (d.totalAmount ?? 0), 0);
  const currency = withAmount.find((d) => d.currencyCode)?.currencyCode ?? '';
  return `${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${currency ? ` ${currency}` : ''}`;
}

export function OverviewPage({ documents, onOpen, onBrowseStatus }: Props) {
  const invoices = documents.filter((d) => d.kind === 'invoice');
  const receipts = documents.filter((d) => d.kind === 'receipt');
  const failed = documents.filter((d) => d.status === ProcessingStatus.Failed);
  const completed = documents.filter((d) => d.status === ProcessingStatus.Completed);

  const recent = [...documents]
    .sort((a, b) => (b.modifiedOn ?? '').localeCompare(a.modifiedOn ?? ''))
    .slice(0, 8);

  return (
    <div className="dash">
      <section className="dash__hero hero">
        <div className="hero__text">
          <p className="hero__eyebrow">
            <IconSparkle size={14} /> Extracted with AI Builder
          </p>
          <h2 className="hero__total">{sumOf(completed)}</h2>
          <p className="hero__sub">
            across {completed.length} processed document{completed.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="hero__art" aria-hidden="true">
          <MicrosoftLogo size={64} />
        </div>
      </section>

      <article className="dash__t1 tile tile--invoice">
        <span className="tile__icon">
          <IconInvoice size={18} />
        </span>
        <div>
          <p className="tile__label">Invoices</p>
          <p className="tile__value">{invoices.length}</p>
        </div>
      </article>

      <article className="dash__t2 tile tile--receipt">
        <span className="tile__icon">
          <IconReceipt size={18} />
        </span>
        <div>
          <p className="tile__label">Receipts</p>
          <p className="tile__value">{receipts.length}</p>
        </div>
      </article>

      <article className={`dash__t3 tile ${failed.length > 0 ? 'tile--alert' : 'tile--ok'}`}>
        <span className="tile__icon">
          <IconAlert size={18} />
        </span>
        <div>
          <p className="tile__label">Needs attention</p>
          <p className="tile__value">{failed.length}</p>
        </div>
      </article>

      <section className="dash__status panel">
        <h3 className="panel__title">By processing status</h3>
        <StatusBreakdown documents={documents} onSelectStatus={onBrowseStatus} />
      </section>

      <section className={`dash__failed panel ${failed.length > 0 ? 'panel--alert' : ''}`}>
        <h3 className="panel__title">
          <IconAlert size={15} /> Needs attention
        </h3>
        {failed.length === 0 ? (
          <EmptyState title="Nothing failed" hint="Every processed document succeeded." />
        ) : (
          <ul className="rows rows--scroll">
            {failed.map((doc) => (
              <li key={`${doc.kind}-${doc.id}`}>
                <button type="button" className="row" onClick={() => onOpen(doc)}>
                  <KindAvatar kind={doc.kind} size={34} />
                  <span className="row__body">
                    <span className="row__name">{doc.name}</span>
                    <span className="row__err">{doc.errorCode ?? 'Failed'}</span>
                  </span>
                  <IconChevron size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="dash__recent panel">
        <h3 className="panel__title">Recent activity</h3>
        {recent.length === 0 ? (
          <EmptyState
            title="No documents yet"
            hint="Create an invoice or receipt to get started."
            icon={<IconInvoice size={28} />}
          />
        ) : (
          <ul className="rows rows--scroll">
            {recent.map((doc) => (
              <li key={`${doc.kind}-${doc.id}`}>
                <button type="button" className="row" onClick={() => onOpen(doc)}>
                  <KindAvatar kind={doc.kind} size={34} />
                  <span className="row__body">
                    <span className="row__name">{doc.name}</span>
                    <span className="row__meta">{doc.party ?? formatDateTime(doc.modifiedOn)}</span>
                  </span>
                  <span className="row__right">
                    <span className="row__amount">{formatAmount(doc)}</span>
                    <StatusPill status={doc.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
