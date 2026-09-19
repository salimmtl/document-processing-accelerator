import { useMemo } from 'react';
import type { DocumentKind, ProcessedDocument } from '../domain';
import { METHOD_LABELS } from '../domain';
import { IconInvoice, IconSearch } from '../icons';
import { EmptyState, KindAvatar, StatusPill, formatAmount, formatDate, statusKey } from './Shared';

export type SortKey = 'created' | 'documentDate' | 'total';

interface Props {
  documents: ProcessedDocument[];
  kindFilter: DocumentKind | 'all';
  statusFilter: number | 'all';
  methodFilter: number | 'all';
  search: string;
  onSearch: (v: string) => void;
  sortKey: SortKey;
  onSort: (v: SortKey) => void;
  selectedId: string | null;
  onSelect: (doc: ProcessedDocument) => void;
}

/** The master pane: a dense, independently scrolling list of documents. */
export function DocumentListPane({
  documents,
  kindFilter,
  statusFilter,
  methodFilter,
  search,
  onSearch,
  sortKey,
  onSort,
  selectedId,
  onSelect,
}: Props) {
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = documents.filter((doc) => {
      if (kindFilter !== 'all' && doc.kind !== kindFilter) return false;
      if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
      if (methodFilter !== 'all' && doc.method !== methodFilter) return false;
      if (!term) return true;
      return (
        doc.name.toLowerCase().includes(term) ||
        (doc.party ?? '').toLowerCase().includes(term) ||
        (doc.errorCode ?? '').toLowerCase().includes(term)
      );
    });

    return filtered.sort((a, b) => {
      if (sortKey === 'total') return (b.totalAmount ?? -1) - (a.totalAmount ?? -1);
      if (sortKey === 'documentDate') return (b.documentDate ?? '').localeCompare(a.documentDate ?? '');
      return (b.createdOn ?? '').localeCompare(a.createdOn ?? '');
    });
  }, [documents, kindFilter, statusFilter, methodFilter, search, sortKey]);

  return (
    <div className="listpane">
      <div className="listpane__head">
        <div className="searchbox">
          <IconSearch size={16} />
          <input
            type="search"
            placeholder="Search name or vendor…"
            aria-label="Search documents"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="listpane__meta">
          <span className="count">
            {visible.length} of {documents.length}
          </span>
          <label className="inlinefield">
            <span className="sr-only">Sort by</span>
            <select className="select select--sm" value={sortKey} onChange={(e) => onSort(e.target.value as SortKey)}>
              <option value="created">Newest</option>
              <option value="documentDate">Document date</option>
              <option value="total">Amount</option>
            </select>
          </label>
        </div>
      </div>

      <div className="listpane__scroll">
        {visible.length === 0 ? (
          <EmptyState
            title="No matches"
            hint="Clear the search box or pick another status."
            icon={<IconInvoice size={26} />}
          />
        ) : (
          <ul className="doclist">
            {visible.map((doc) => (
              <li key={`${doc.kind}-${doc.id}`}>
                <button
                  type="button"
                  className={`doc doc--${statusKey(doc.status)} ${selectedId === doc.id ? 'doc--on' : ''}`}
                  onClick={() => onSelect(doc)}
                  aria-current={selectedId === doc.id}
                >
                  <KindAvatar kind={doc.kind} size={36} />
                  <span className="doc__body">
                    <span className="doc__top">
                      <span className="doc__name">{doc.name}</span>
                      <span className="doc__amount">{formatAmount(doc)}</span>
                    </span>
                    <span className="doc__bottom">
                      <span className="doc__party">{doc.party ?? 'Not extracted yet'}</span>
                      <span className="doc__date">{formatDate(doc.documentDate)}</span>
                    </span>
                    <span className="doc__tags">
                      <StatusPill status={doc.status} />
                      <span className="doc__method">
                        {doc.method !== null ? METHOD_LABELS[doc.method] : 'No method'}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
