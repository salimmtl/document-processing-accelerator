import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ACCEPTED_FILE_TYPES } from '../domain';
import { IconUpload } from '../icons';

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
  /** Compact variant for inline use next to other controls. */
  compact?: boolean;
  label?: string;
  hint?: string;
  children?: ReactNode;
}

/**
 * Drag-and-drop file target that is also a keyboard-accessible button.
 * Drop handling and the hidden file input share one callback so both routes behave
 * identically, and the drag counter avoids flicker when moving over child elements.
 */
export function FileDropZone({ onFile, disabled = false, compact = false, label, hint, children }: Props) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file && !disabled) onFile(file);
    },
    [disabled, onFile],
  );

  const reset = () => {
    depth.current = 0;
    setOver(false);
  };

  return (
    <div
      className={`drop ${compact ? 'drop--compact' : ''} ${over ? 'drop--over' : ''} ${disabled ? 'drop--off' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault();
        if (disabled) return;
        depth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) e.dataTransfer.dropEffect = 'copy';
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) reset();
      }}
      onDrop={(e) => {
        e.preventDefault();
        reset();
        accept(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden-file"
        accept={ACCEPTED_FILE_TYPES}
        disabled={disabled}
        onChange={(e) => {
          accept(e.target.files);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        className="drop__btn"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <span className="drop__icon">
          <IconUpload size={compact ? 16 : 22} />
        </span>
        <span className="drop__text">
          <span className="drop__label">{label ?? 'Drag a document here'}</span>
          {hint ? <span className="drop__hint">{hint}</span> : null}
        </span>
      </button>
      {children}
    </div>
  );
}
