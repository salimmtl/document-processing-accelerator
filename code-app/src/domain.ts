/**
 * Domain model for the Document Processing Accelerator.
 *
 * Choice values are the Dataverse option-set integers created by the `dpa` publisher.
 * They are declared once here so no component ever hardcodes a magic number.
 */

export const ProcessingStatus = {
  Draft: 100000000,
  ReadyToProcess: 100000001,
  Processing: 100000002,
  Completed: 100000003,
  Failed: 100000004,
} as const;

export type ProcessingStatusValue = (typeof ProcessingStatus)[keyof typeof ProcessingStatus];

export const ExtractionMethod = {
  NativeModel: 100000000,
  CustomPrompt: 100000001,
} as const;

export type ExtractionMethodValue = (typeof ExtractionMethod)[keyof typeof ExtractionMethod];

export const STATUS_LABELS: Record<number, string> = {
  [ProcessingStatus.Draft]: 'Draft',
  [ProcessingStatus.ReadyToProcess]: 'Ready to Process',
  [ProcessingStatus.Processing]: 'Processing',
  [ProcessingStatus.Completed]: 'Completed',
  [ProcessingStatus.Failed]: 'Failed',
};

export const METHOD_LABELS: Record<number, string> = {
  [ExtractionMethod.NativeModel]: 'Native AI Builder Model',
  [ExtractionMethod.CustomPrompt]: 'AI Builder Custom Prompt',
};

/** Status order used for the overview breakdown, matching the lifecycle. */
export const STATUS_ORDER: ProcessingStatusValue[] = [
  ProcessingStatus.Draft,
  ProcessingStatus.ReadyToProcess,
  ProcessingStatus.Processing,
  ProcessingStatus.Completed,
  ProcessingStatus.Failed,
];

export type DocumentKind = 'invoice' | 'receipt';

/**
 * A single processed document, projected from either table into one shape so the
 * list and detail surfaces can treat invoices and receipts uniformly.
 */
export interface ProcessedDocument {
  kind: DocumentKind;
  id: string;
  name: string;
  status: number | null;
  method: number | null;
  /** Vendor for an invoice, merchant for a receipt. */
  party: string | null;
  /** Invoice date for an invoice, transaction date for a receipt. */
  documentDate: string | null;
  totalAmount: number | null;
  currencyCode: string | null;
  createdOn: string | null;
  modifiedOn: string | null;
  processedBy: string | null;
  processingStartedOn: string | null;
  processingCompletedOn: string | null;
  attemptCount: number | null;
  lastRunId: string | null;
  confidence: number | null;
  errorCode: string | null;
  errorMessage: string | null;
  rawExtractionResult: string | null;
  extractedLineItems: string | null;
  reprocessRequested: boolean;
  /** File name of the uploaded source document, null when nothing is attached. */
  documentFileName: string | null;
  /** True when the record has a file in the Source Document column. */
  hasDocument: boolean;
  /** Type-specific extracted values, rendered as a labelled grid on the detail page. */
  details: { label: string; value: string | null }[];
}

/** Accepted upload types, shared by the drop zones and the file picker. */
export const ACCEPTED_FILE_TYPES = '.pdf,.png,.jpg,.jpeg,.tif,.tiff,.bmp';

/** Build a sensible default record name from an uploaded file name. */
export function defaultNameFromFile(kind: DocumentKind, fileName: string): string {
  const stem = fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim();
  if (stem.length > 0) return stem.slice(0, 100);
  return defaultName(kind);
}

/** Fallback name when there is no file to derive one from. */
export function defaultName(kind: DocumentKind): string {
  const label = kind === 'invoice' ? 'Invoice' : 'Receipt';
  return `${label} ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}`;
}

export const ENTITY_SETS: Record<DocumentKind, string> = {
  invoice: 'dpa_invoices',
  receipt: 'dpa_receipts',
};

export const ID_FIELDS: Record<DocumentKind, string> = {
  invoice: 'dpa_invoiceid',
  receipt: 'dpa_receiptid',
};
