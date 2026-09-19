import { useCallback, useEffect, useState } from 'react';
import './App.css';
import type { DocumentKind, ProcessedDocument } from './domain';
import { METHOD_LABELS, STATUS_LABELS, STATUS_ORDER } from './domain';
import {
  createDocument,
  createDocumentWithFile,
  loadAllDocuments,
  renameDocument,
  requestReprocessing,
  setExtractionMethod,
  submitForProcessing,
  uploadSourceDocument,
} from './dataverse';
import { OverviewPage } from './components/OverviewPage';
import { DocumentListPane, type SortKey } from './components/DocumentListPane';
import { DocumentDetailPage } from './components/DocumentDetailPage';
import { NewDocumentDialog } from './components/NewDocumentDialog';
import { EmptyState, Spinner, StatusIcon } from './components/Shared';
import {
  IconAlert,
  IconCheck,
  IconHome,
  IconInvoice,
  IconList,
  IconMoon,
  IconPlus,
  IconReceipt,
  IconRefresh,
  IconSun,
  IconUpload,
  MicrosoftLogo,
  MicrosoftWordmark,
} from './icons';
import { useTheme } from './theme';

type View = 'overview' | 'documents';

export default function App() {
  const { theme, toggle } = useTheme();

  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [view, setView] = useState<View>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<DocumentKind | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('created');
  const [showNew, setShowNew] = useState(false);
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setDocuments(await loadAllDocuments());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load documents from Dataverse.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const selected = documents.find((d) => d.id === selectedId) ?? null;

  const open = (doc: ProcessedDocument) => {
    setSelectedId(doc.id);
    setView('documents');
  };

  const browseStatus = (status: number) => {
    setStatusFilter(status);
    setKindFilter('all');
    setView('documents');
  };

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true);
    try {
      await action();
      await refresh();
      setToast(success);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The update could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  const counts = {
    all: documents.length,
    invoice: documents.filter((d) => d.kind === 'invoice').length,
    receipt: documents.filter((d) => d.kind === 'receipt').length,
  };

  return (
    <div
      className="shell"
      onDragEnter={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) setDragging(true);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) e.preventDefault();
      }}
      onDragLeave={(e) => {
        // Only clear when the pointer actually leaves the window.
        if (e.relatedTarget === null) setDragging(false);
      }}
      onDrop={(e) => {
        const file = e.dataTransfer?.files?.[0];
        setDragging(false);
        if (!file || showNew) return;
        e.preventDefault();
        setDroppedFile(file);
        setShowNew(true);
      }}
    >
      {dragging && !showNew ? (
        <div className="dropveil" aria-hidden="true">
          <div className="dropveil__card">
            <IconUpload size={30} />
            <p>Drop to create a new document</p>
          </div>
        </div>
      ) : null}

      {/* ---------- floating left panel ---------- */}
      <aside className="side">
        <div className="side__brand">
          <span className="side__mark">
            <MicrosoftLogo size={20} />
          </span>
          <div className="side__brandtext">
            <p className="side__title">Document Processing</p>
            <p className="side__sub">AI Builder extraction</p>
          </div>
        </div>
        <span className="brandrule" aria-hidden="true" />

        <button type="button" className="btn btn--primary side__new" onClick={() => setShowNew(true)}>
          <IconPlus size={16} /> New document
        </button>

        <nav className="side__nav" aria-label="Primary">
          <button
            type="button"
            className={`sidebtn ${view === 'overview' ? 'sidebtn--on' : ''}`}
            onClick={() => setView('overview')}
          >
            <IconHome size={17} /> Overview
          </button>
          <button
            type="button"
            className={`sidebtn ${view === 'documents' ? 'sidebtn--on' : ''}`}
            onClick={() => setView('documents')}
          >
            <IconList size={17} /> All documents <span className="sidebtn__n">{counts.all}</span>
          </button>
        </nav>

        <p className="side__heading">Type</p>
        <nav className="side__nav" aria-label="Document type">
          {(
            [
              ['all', 'Everything', null],
              ['invoice', 'Invoices', <IconInvoice key="i" size={16} />],
              ['receipt', 'Receipts', <IconReceipt key="r" size={16} />],
            ] as const
          ).map(([k, label, icon]) => (
            <button
              key={k}
              type="button"
              className={`sidebtn ${view === 'documents' && kindFilter === k ? 'sidebtn--on' : ''}`}
              onClick={() => {
                setKindFilter(k as DocumentKind | 'all');
                setView('documents');
              }}
            >
              {icon ?? <IconList size={16} />} {label}
              <span className="sidebtn__n">{counts[k as keyof typeof counts]}</span>
            </button>
          ))}
        </nav>

        <p className="side__heading">Status</p>
        <nav className="side__nav side__nav--scroll" aria-label="Processing status">
          <button
            type="button"
            className={`sidebtn ${view === 'documents' && statusFilter === 'all' ? 'sidebtn--on' : ''}`}
            onClick={() => {
              setStatusFilter('all');
              setView('documents');
            }}
          >
            <IconList size={16} /> Any status
          </button>
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className={`sidebtn sidebtn--${s} ${view === 'documents' && statusFilter === s ? 'sidebtn--on' : ''}`}
              onClick={() => browseStatus(s)}
            >
              <StatusIcon status={s} size={16} /> {STATUS_LABELS[s]}
              <span className="sidebtn__n">{documents.filter((d) => d.status === s).length}</span>
            </button>
          ))}
        </nav>

        <div className="side__foot">
          <button
            type="button"
            className="sidebtn"
            onClick={() => void refresh()}
            disabled={loading || busy}
          >
            <IconRefresh size={16} /> Refresh
          </button>
          <button type="button" className="sidebtn" onClick={toggle}>
            {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
          <MicrosoftWordmark size={17} />
        </div>
      </aside>

      {/* ---------- main region ---------- */}
      <div className="main">
        <header className="topline">
          <div>
            <h1 className="topline__title">{view === 'overview' ? 'Overview' : 'Documents'}</h1>
            <p className="topline__sub">
              {view === 'overview'
                ? 'Processing health across invoices and receipts'
                : [
                    kindFilter === 'all' ? 'All types' : kindFilter === 'invoice' ? 'Invoices' : 'Receipts',
                    statusFilter === 'all' ? 'any status' : STATUS_LABELS[statusFilter as number],
                    methodFilter === 'all' ? 'any method' : METHOD_LABELS[methodFilter as number],
                  ].join(' · ')}
            </p>
          </div>

          {view === 'documents' ? (
            <label className="inlinefield">
              <span className="field__label">Method</span>
              <select
                className="select select--sm"
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              >
                <option value="all">All methods</option>
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
        </header>

        {error ? (
          <div className="banner banner--error banner--strip" role="alert">
            <IconAlert size={17} />
            <div>
              <p className="banner__title">Something went wrong</p>
              <p className="banner__body">{error}</p>
            </div>
            <button type="button" className="btn" onClick={() => void refresh()}>
              Try again
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="main__fill">
            <Spinner label="Loading documents from Dataverse…" />
          </div>
        ) : view === 'overview' ? (
          <div className="main__scroll">
            <OverviewPage documents={documents} onOpen={open} onBrowseStatus={browseStatus} />
          </div>
        ) : (
          <div className="split">
            <DocumentListPane
              documents={documents}
              kindFilter={kindFilter}
              statusFilter={statusFilter}
              methodFilter={methodFilter}
              search={search}
              onSearch={setSearch}
              sortKey={sortKey}
              onSort={setSortKey}
              selectedId={selectedId}
              onSelect={(d) => setSelectedId(d.id)}
            />
            <div className="detailpane">
              {selected ? (
                <DocumentDetailPage
                  doc={selected}
                  busy={busy}
                  onBack={() => setSelectedId(null)}
                  onSubmit={(d) => void run(() => submitForProcessing(d), 'Document submitted for processing.')}
                  onReprocess={(d) => void run(() => requestReprocessing(d), 'Reprocessing requested.')}
                  onChangeMethod={(d, m) => void run(() => setExtractionMethod(d, m), 'Extraction method updated.')}
                  onRename={(d, n) => void run(() => renameDocument(d, n), 'Name updated.')}
                  onUpload={(d, f) => void run(() => uploadSourceDocument(d, f), `Uploaded ${f.name}.`)}
                />
              ) : (
                <div className="detailpane__empty">
                  <EmptyState
                    title="Select a document"
                    hint="Pick one from the list to see its extracted fields, processing timeline and errors."
                    icon={<IconInvoice size={30} />}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showNew ? (
        <NewDocumentDialog
          busy={busy}
          initialFile={droppedFile}
          onCancel={() => {
            setShowNew(false);
            setDroppedFile(null);
          }}
          onCreate={(kind, name, method, file) => {
            setShowNew(false);
            setDroppedFile(null);
            void run(
              async () => {
                if (file) await createDocumentWithFile(kind, name, method, file);
                else await createDocument(kind, name, method);
              },
              file ? `Created ${name} and attached ${file.name}.` : `Created ${name}.`,
            );
          }}
        />
      ) : null}

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          <IconCheck size={16} /> {toast}
        </div>
      ) : null}
    </div>
  );
}
