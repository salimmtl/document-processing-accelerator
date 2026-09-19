import { useState } from 'react';
import type { DocumentKind } from '../domain';
import { ExtractionMethod, METHOD_LABELS, defaultName, defaultNameFromFile } from '../domain';
import { IconInvoice, IconPlus, IconReceipt } from '../icons';
import { FileDropZone } from './FileDropZone';

interface Props {
  busy: boolean;
  initialFile?: File | null;
  onCancel: () => void;
  onCreate: (kind: DocumentKind, name: string, method: number, file: File | null) => void;
}

export function NewDocumentDialog({ busy, initialFile = null, onCancel, onCreate }: Props) {
  const [kind, setKind] = useState<DocumentKind>('invoice');
  const [name, setName] = useState('');
  const [touchedName, setTouchedName] = useState(false);
  const [method, setMethod] = useState<number>(ExtractionMethod.NativeModel);
  const [file, setFile] = useState<File | null>(initialFile);

  // The placeholder follows the dropped file until the user types their own name.
  const suggested = file ? defaultNameFromFile(kind, file.name) : defaultName(kind);
  const finalName = (touchedName && name.trim()) || suggested;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="New document">
      <div className="modal__card">
        <h3 className="modal__title">New document</h3>

        <div className="kindpick">
          {(['invoice', 'receipt'] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={`kindopt ${kind === k ? 'kindopt--on' : ''} kindopt--${k}`}
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
            >
              {k === 'invoice' ? <IconInvoice size={22} /> : <IconReceipt size={22} />}
              {k === 'invoice' ? 'Invoice' : 'Receipt'}
            </button>
          ))}
        </div>

        <FileDropZone
          onFile={(f) => setFile(f)}
          disabled={busy}
          label={file ? file.name : 'Drag a document here, or click to browse'}
          hint={file ? `${(file.size / 1024).toFixed(0)} KB — drop another to replace` : 'PDF, PNG, JPG, TIFF or BMP'}
        />

        <label className="field field--grow">
          <span className="field__label">Name</span>
          <input
            className="input"
            value={touchedName ? name : suggested}
            onChange={(e) => {
              setTouchedName(true);
              setName(e.target.value);
            }}
            disabled={busy}
          />
        </label>

        <label className="field field--grow">
          <span className="field__label">Extraction method</span>
          <select
            className="select"
            value={method}
            onChange={(e) => setMethod(Number(e.target.value))}
            disabled={busy}
          >
            {Object.entries(METHOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <p className="hint">
          {file
            ? 'The record is created as a Draft with this file attached. Processing renames it from the extracted vendor, date and amount.'
            : 'The record is created as a Draft. You can attach the document from its detail page.'}
        </p>

        <div className="modal__actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={busy}
            onClick={() => onCreate(kind, finalName, method, file)}
          >
            <IconPlus size={16} /> {file ? 'Create and attach' : 'Create draft'}
          </button>
        </div>
      </div>
    </div>
  );
}
