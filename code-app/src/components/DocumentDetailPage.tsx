import { useState } from 'react';
import type { ProcessedDocument } from '../domain';
import { ExtractionMethod, METHOD_LABELS, ProcessingStatus } from '../domain';
import { IconAlert, IconBack, IconChevron, IconSend, IconSparkle } from '../icons';
import { KindAvatar, StatusPill, formatDateTime } from './Shared';
import { DocumentPreview } from './DocumentPreview';
import { FileDropZone } from './FileDropZone';

interface Props {
  doc: ProcessedDocument;
  busy: boolean;
  onBack: () => void;
  onSubmit: (doc: ProcessedDocument) => void;
  onReprocess: (doc: ProcessedDocument) => void;
  onChangeMethod: (doc: ProcessedDocument, method: number) => void;
  onRename: (doc: ProcessedDocument, name: string) => void;
  onUpload: (doc: ProcessedDocument, file: File) => void;
}

export function DocumentDetailPage({
  doc,
  busy,
  onBack,
  onSubmit,
  onReprocess,
  onChangeMethod,
  onRename,
  onUpload,
}: Props) {
  const [showRaw, setShowRaw] = useState(false);
  const [name, setName] = useState(doc.name);
  const [tab, setTab] = useState<'fields' | 'document'>('fields');

  const isDraft = doc.status === ProcessingStatus.Draft;
  const isFailed = doc.status === ProcessingStatus.Failed;
  const isCompleted = doc.status === ProcessingStatus.Completed;
  const inFlight = doc.status === ProcessingStatus.Processing || doc.status === ProcessingStatus.ReadyToProcess;

  const filled = doc.details.filter((d) => d.value !== null);
  const canSubmit = isDraft && doc.hasDocument;

  return (
    <div className="page">
      <button type="button" className="link" onClick={onBack}>
        <IconBack size={16} /> All documents
      </button>

      <header className="detail">
        <KindAvatar kind={doc.kind} size={54} />
        <div className="detail__text">
          <p className="detail__kind">{doc.kind === 'invoice' ? 'Invoice' : 'Receipt'}</p>
          <h2 className="detail__title">{doc.name}</h2>
          {doc.party ? <p className="detail__party">{doc.party}</p> : null}
        </div>
        <div className="detail__right">
          <StatusPill status={doc.status} />
          {doc.totalAmount !== null ? (
            <p className="detail__amount">
              {doc.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {doc.currencyCode ? <span className="detail__cur"> {doc.currencyCode}</span> : null}
            </p>
          ) : null}
        </div>
      </header>

      {isFailed && doc.errorMessage ? (
        <section className="banner banner--error" role="alert">
          <IconAlert size={18} />
          <div>
            <p className="banner__title">Processing failed{doc.errorCode ? ` — ${doc.errorCode}` : ''}</p>
            <p className="banner__body">{doc.errorMessage}</p>
          </div>
        </section>
      ) : null}

      {inFlight ? (
        <section className="banner banner--info">
          <IconSend size={18} />
          <div>
            <p className="banner__body">
              This document is with the processing flow. The automation owns its status until it completes or fails.
            </p>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h3 className="panel__title">Document</h3>

        <FileDropZone
          onFile={(f) => onUpload(doc, f)}
          disabled={!isDraft || busy}
          compact
          label={
            !isDraft
              ? 'Document locked while processing'
              : doc.hasDocument
                ? 'Drop a file to replace'
                : 'Drop a file, or click to browse'
          }
          hint={doc.documentFileName ?? 'PDF, PNG, JPG, TIFF or BMP'}
        />

        <div className="formrow">
          <label className="field field--grow">
            <span className="field__label">Name</span>
            <input
              className="input"
              value={name}
              disabled={!isDraft || busy}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (isDraft && name.trim() && name !== doc.name) onRename(doc, name.trim());
              }}
            />
          </label>

          <label className="field">
            <span className="field__label">Extraction method</span>
            <select
              className="select"
              value={doc.method ?? ExtractionMethod.NativeModel}
              disabled={!isDraft || busy}
              onChange={(e) => onChangeMethod(doc, Number(e.target.value))}
            >
              {Object.entries(METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="formrow">
          {isDraft ? (
            <button
              type="button"
              className="btn btn--primary"
              disabled={busy || !canSubmit}
              onClick={() => onSubmit(doc)}
            >
              <IconSend size={16} /> Set Ready to Process
            </button>
          ) : null}

          {isFailed || isCompleted ? (
            <button type="button" className="btn" disabled={busy} onClick={() => onReprocess(doc)}>
              <IconSparkle size={16} /> Request reprocessing
            </button>
          ) : null}

          {doc.reprocessRequested ? <span className="note">Reprocessing requested</span> : null}
        </div>

        {isDraft && !doc.hasDocument ? (
          <p className="hint">Attach a document before setting this record to Ready to Process.</p>
        ) : null}
      </section>

      <section className="panel">
        <div className="tabs" role="tablist" aria-label="Detail view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'fields'}
            className={`tab ${tab === 'fields' ? 'tab--on' : ''}`}
            onClick={() => setTab('fields')}
          >
            Extracted fields
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'document'}
            className={`tab ${tab === 'document' ? 'tab--on' : ''}`}
            onClick={() => setTab('document')}
          >
            Document preview
          </button>
        </div>

        {tab === 'fields' ? (
          filled.length === 0 ? (
            <p className="hint">Nothing extracted yet. Values appear here once processing completes.</p>
          ) : (
            <dl className="grid">
              {doc.details.map((d) => (
                <div key={d.label} className={`cell ${d.value === null ? 'cell--empty' : ''}`}>
                  <dt className="cell__label">{d.label}</dt>
                  <dd className="cell__value">{d.value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          )
        ) : (
          <DocumentPreview doc={doc} />
        )}
      </section>

      <section className="panel">
        <h3 className="panel__title">Processing timeline</h3>
        <dl className="grid">
          <div className="cell">
            <dt className="cell__label">Processed by</dt>
            <dd className="cell__value">{doc.processedBy ?? '—'}</dd>
          </div>
          <div className="cell">
            <dt className="cell__label">Started</dt>
            <dd className="cell__value">{formatDateTime(doc.processingStartedOn)}</dd>
          </div>
          <div className="cell">
            <dt className="cell__label">Completed</dt>
            <dd className="cell__value">{formatDateTime(doc.processingCompletedOn)}</dd>
          </div>
          <div className="cell">
            <dt className="cell__label">Attempts</dt>
            <dd className="cell__value">{doc.attemptCount ?? 0}</dd>
          </div>
          <div className="cell">
            <dt className="cell__label">Confidence</dt>
            <dd className="cell__value">{doc.confidence === null ? '—' : doc.confidence.toFixed(2)}</dd>
          </div>
          <div className="cell">
            <dt className="cell__label">Last run id</dt>
            <dd className="cell__value cell__value--mono">{doc.lastRunId ?? '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="panel">
        <button type="button" className="disclosure" aria-expanded={showRaw} onClick={() => setShowRaw((v) => !v)}>
          <span className={`disclosure__chev ${showRaw ? 'disclosure__chev--open' : ''}`}>
            <IconChevron size={14} />
          </span>
          Technical extraction output
        </button>
        {showRaw ? (
          <div className="raw">
            <h4 className="raw__title">Raw extraction result</h4>
            <pre className="raw__pre">{doc.rawExtractionResult ?? 'No raw result stored.'}</pre>
            <h4 className="raw__title">Extracted line items</h4>
            <pre className="raw__pre">{doc.extractedLineItems ?? 'No line items stored.'}</pre>
          </div>
        ) : null}
      </section>
    </div>
  );
}
