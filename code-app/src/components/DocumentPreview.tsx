import { useEffect, useState } from 'react';
import type { ProcessedDocument } from '../domain';
import { downloadSourceDocument } from '../dataverse';
import { IconAlert, IconDownload, IconExpand, IconInvoice } from '../icons';
import { EmptyState, Spinner } from './Shared';

interface Props {
  doc: ProcessedDocument;
}

/**
 * In-app preview of the stored source document.
 *
 * The bytes are fetched once per record and held as an object URL; PDFs render in an
 * <object> (the browser's own viewer) and images in an <img>. The URL is revoked on
 * unmount and whenever the record changes, so previews don't leak between documents.
 */
export function DocumentPreview({ doc }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!doc.hasDocument) {
      setUrl(null);
      setError(null);
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;

    setLoading(true);
    setError(null);

    downloadSourceDocument(doc)
      .then(({ bytes, mimeType }) => {
        if (revoked) return;
        // Copy into a fresh buffer so the Blob owns memory the caller can't mutate.
        const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
        objectUrl = URL.createObjectURL(blob);
        setMime(mimeType);
        setUrl(objectUrl);
      })
      .catch((e: unknown) => {
        if (!revoked) setError(e instanceof Error ? e.message : 'The document could not be loaded.');
      })
      .finally(() => {
        if (!revoked) setLoading(false);
      });

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // Re-fetch when a different record is shown or its file is replaced.
  }, [doc.id, doc.kind, doc.hasDocument, doc.documentFileName]);

  if (!doc.hasDocument) {
    return (
      <div className="preview preview--empty">
        <EmptyState
          title="No document attached"
          hint="Drag a PDF or image onto the upload area to attach one."
          icon={<IconInvoice size={26} />}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="preview preview--empty">
        <Spinner label="Loading preview…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="preview preview--empty">
        <div className="previewerr">
          <IconAlert size={20} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const isPdf = mime === 'application/pdf';
  const isImage = mime.startsWith('image/');

  return (
    <div className="preview">
      <div className="preview__bar">
        <span className="preview__name" title={doc.documentFileName ?? undefined}>
          {doc.documentFileName ?? 'Source document'}
        </span>
        <span className="preview__actions">
          {url ? (
            <>
              <a className="btn btn--tiny" href={url} target="_blank" rel="noreferrer">
                <IconExpand size={14} /> Open
              </a>
              <a className="btn btn--tiny" href={url} download={doc.documentFileName ?? 'document'}>
                <IconDownload size={14} /> Download
              </a>
            </>
          ) : null}
        </span>
      </div>

      <div className="preview__body">
        {isImage && url ? (
          <img className="preview__img" src={url} alt={`Preview of ${doc.documentFileName ?? 'the source document'}`} />
        ) : isPdf && url ? (
          <object className="preview__pdf" data={url} type="application/pdf" aria-label="Document preview">
            <div className="previewerr">
              <IconAlert size={20} />
              <p>
                This browser can&apos;t display the PDF inline. Use <strong>Open</strong> or{' '}
                <strong>Download</strong> above.
              </p>
            </div>
          </object>
        ) : (
          <div className="previewerr">
            <IconAlert size={20} />
            <p>Preview isn&apos;t available for this file type. Use Download to view it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
