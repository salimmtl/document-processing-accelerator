/**
 * Dataverse access for the Document Processing Experience.
 *
 * Uses the generated per-table services (native Dataverse data sources) — never fetch/axios.
 * Choice columns are numeric; virtual `*name` columns are never selected because Dataverse
 * rejects them in `$select`. Every row is projected into one shared shape so invoices and
 * receipts can share the list and detail surfaces.
 */

import { Dpa_invoicesService } from './generated/services/Dpa_invoicesService';
import { Dpa_receiptsService } from './generated/services/Dpa_receiptsService';
import type { Dpa_invoices } from './generated/models/Dpa_invoicesModel';
import type { Dpa_receipts } from './generated/models/Dpa_receiptsModel';
import { dataSourcesInfo } from '../.power/schemas/appschemas/dataSourcesInfo';
import { getClient } from '@microsoft/power-apps/data';
import { ProcessingStatus, type DocumentKind, type ProcessedDocument } from './domain';

/**
 * The generator emits `upload` but no download helper for File columns, so the
 * shared data client is used directly for the preview.
 */
const client = getClient(dataSourcesInfo);
const DATA_SOURCE: Record<DocumentKind, string> = { invoice: 'dpa_invoices', receipt: 'dpa_receipts' };

const INVOICE_SELECT = [
  'dpa_invoiceid',
  'dpa_invoicename',
  'dpa_invoicenumber',
  'dpa_purchaseordernumber',
  'dpa_vendorname',
  'dpa_vendoraddress',
  'dpa_vendortaxnumber',
  'dpa_billtoname',
  'dpa_billtoaddress',
  'dpa_invoicedate',
  'dpa_duedate',
  'dpa_subtotal',
  'dpa_taxamount',
  'dpa_totalamount',
  'dpa_amountdue',
  'dpa_currencycode',
  'dpa_processingstatus',
  'dpa_extractionmethod',
  'dpa_reprocessrequested',
  'dpa_processingstartedon',
  'dpa_processingcompletedon',
  'dpa_processingattemptcount',
  'dpa_lastprocessingrunid',
  'dpa_extractionconfidence',
  'dpa_rawextractionresult',
  'dpa_extractedlineitems',
  'dpa_processingerrorcode',
  'dpa_processingerrormessage',
  'dpa_processedby',
  'dpa_sourcedocument',
  'dpa_sourcedocument_name',
  'createdon',
  'modifiedon',
];

const RECEIPT_SELECT = [
  'dpa_receiptid',
  'dpa_receiptname',
  'dpa_receiptnumber',
  'dpa_merchantname',
  'dpa_merchantaddress',
  'dpa_merchantphone',
  'dpa_merchanttaxnumber',
  'dpa_transactiondate',
  'dpa_transactiontime',
  'dpa_paymentmethod',
  'dpa_subtotal',
  'dpa_taxamount',
  'dpa_tipamount',
  'dpa_totalamount',
  'dpa_currencycode',
  'dpa_processingstatus',
  'dpa_extractionmethod',
  'dpa_reprocessrequested',
  'dpa_processingstartedon',
  'dpa_processingcompletedon',
  'dpa_processingattemptcount',
  'dpa_lastprocessingrunid',
  'dpa_extractionconfidence',
  'dpa_rawextractionresult',
  'dpa_extractedlineitems',
  'dpa_processingerrorcode',
  'dpa_processingerrormessage',
  'dpa_processedby',
  'dpa_sourcedocument',
  'dpa_sourcedocument_name',
  'createdon',
  'modifiedon',
];

const text = (v: string | undefined): string | null => (v && v.length > 0 ? v : null);
const numOr = (v: number | undefined): number | null => (typeof v === 'number' ? v : null);
const money = (v: number | undefined): string | null => (typeof v === 'number' ? v.toFixed(2) : null);

/** Date-only columns come back as full ISO timestamps; show just the date. */
const dateOnly = (v: string | undefined): string | null => {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

function toInvoice(r: Dpa_invoices): ProcessedDocument {
  return {
    kind: 'invoice',
    id: r.dpa_invoiceid,
    name: text(r.dpa_invoicename) ?? 'Untitled invoice',
    status: numOr(r.dpa_processingstatus as unknown as number),
    method: numOr(r.dpa_extractionmethod as unknown as number),
    party: text(r.dpa_vendorname),
    documentDate: text(r.dpa_invoicedate),
    totalAmount: numOr(r.dpa_totalamount),
    currencyCode: text(r.dpa_currencycode),
    createdOn: text(r.createdon),
    modifiedOn: text(r.modifiedon),
    processedBy: text(r.dpa_processedby),
    processingStartedOn: text(r.dpa_processingstartedon),
    processingCompletedOn: text(r.dpa_processingcompletedon),
    attemptCount: numOr(r.dpa_processingattemptcount),
    lastRunId: text(r.dpa_lastprocessingrunid),
    confidence: numOr(r.dpa_extractionconfidence),
    errorCode: text(r.dpa_processingerrorcode),
    errorMessage: text(r.dpa_processingerrormessage),
    rawExtractionResult: text(r.dpa_rawextractionresult),
    extractedLineItems: text(r.dpa_extractedlineitems),
    reprocessRequested: r.dpa_reprocessrequested === true,
    documentFileName: text((r as { dpa_sourcedocument_name?: string }).dpa_sourcedocument_name),
    hasDocument: Boolean(r.dpa_sourcedocument),
    details: [
      { label: 'Invoice Number', value: text(r.dpa_invoicenumber) },
      { label: 'Purchase Order', value: text(r.dpa_purchaseordernumber) },
      { label: 'Invoice Date', value: dateOnly(r.dpa_invoicedate) },
      { label: 'Due Date', value: dateOnly(r.dpa_duedate) },
      { label: 'Vendor Name', value: text(r.dpa_vendorname) },
      { label: 'Vendor Tax Number', value: text(r.dpa_vendortaxnumber) },
      { label: 'Vendor Address', value: text(r.dpa_vendoraddress) },
      { label: 'Bill To Name', value: text(r.dpa_billtoname) },
      { label: 'Bill To Address', value: text(r.dpa_billtoaddress) },
      { label: 'Subtotal', value: money(r.dpa_subtotal) },
      { label: 'Tax Amount', value: money(r.dpa_taxamount) },
      { label: 'Total Amount', value: money(r.dpa_totalamount) },
      { label: 'Amount Due', value: money(r.dpa_amountdue) },
      { label: 'Currency', value: text(r.dpa_currencycode) },
    ],
  };
}

function toReceipt(r: Dpa_receipts): ProcessedDocument {
  return {
    kind: 'receipt',
    id: r.dpa_receiptid,
    name: text(r.dpa_receiptname) ?? 'Untitled receipt',
    status: numOr(r.dpa_processingstatus as unknown as number),
    method: numOr(r.dpa_extractionmethod as unknown as number),
    party: text(r.dpa_merchantname),
    documentDate: text(r.dpa_transactiondate),
    totalAmount: numOr(r.dpa_totalamount),
    currencyCode: text(r.dpa_currencycode),
    createdOn: text(r.createdon),
    modifiedOn: text(r.modifiedon),
    processedBy: text(r.dpa_processedby),
    processingStartedOn: text(r.dpa_processingstartedon),
    processingCompletedOn: text(r.dpa_processingcompletedon),
    attemptCount: numOr(r.dpa_processingattemptcount),
    lastRunId: text(r.dpa_lastprocessingrunid),
    confidence: numOr(r.dpa_extractionconfidence),
    errorCode: text(r.dpa_processingerrorcode),
    errorMessage: text(r.dpa_processingerrormessage),
    rawExtractionResult: text(r.dpa_rawextractionresult),
    extractedLineItems: text(r.dpa_extractedlineitems),
    reprocessRequested: r.dpa_reprocessrequested === true,
    documentFileName: text((r as { dpa_sourcedocument_name?: string }).dpa_sourcedocument_name),
    hasDocument: Boolean(r.dpa_sourcedocument),
    details: [
      { label: 'Receipt Number', value: text(r.dpa_receiptnumber) },
      { label: 'Transaction Date', value: dateOnly(r.dpa_transactiondate) },
      { label: 'Transaction Time', value: text(r.dpa_transactiontime) },
      { label: 'Payment Method', value: text(r.dpa_paymentmethod) },
      { label: 'Merchant Name', value: text(r.dpa_merchantname) },
      { label: 'Merchant Phone', value: text(r.dpa_merchantphone) },
      { label: 'Merchant Tax Number', value: text(r.dpa_merchanttaxnumber) },
      { label: 'Merchant Address', value: text(r.dpa_merchantaddress) },
      { label: 'Subtotal', value: money(r.dpa_subtotal) },
      { label: 'Tax Amount', value: money(r.dpa_taxamount) },
      { label: 'Tip Amount', value: money(r.dpa_tipamount) },
      { label: 'Total Amount', value: money(r.dpa_totalamount) },
      { label: 'Currency', value: text(r.dpa_currencycode) },
    ],
  };
}

/** Load every invoice and receipt, projected into one list. */
export async function loadAllDocuments(): Promise<ProcessedDocument[]> {
  const [inv, rec] = await Promise.all([
    Dpa_invoicesService.getAll({ select: INVOICE_SELECT, orderBy: ['modifiedon desc'] }),
    Dpa_receiptsService.getAll({ select: RECEIPT_SELECT, orderBy: ['modifiedon desc'] }),
  ]);

  if (!inv.success) throw new Error(inv.error?.message ?? 'Could not load invoices from Dataverse.');
  if (!rec.success) throw new Error(rec.error?.message ?? 'Could not load receipts from Dataverse.');

  return [...(inv.data ?? []).map(toInvoice), ...(rec.data ?? []).map(toReceipt)];
}

async function patch(doc: ProcessedDocument, changes: Record<string, unknown>): Promise<void> {
  const result =
    doc.kind === 'invoice'
      ? await Dpa_invoicesService.update(doc.id, changes)
      : await Dpa_receiptsService.update(doc.id, changes);
  if (!result.success) throw new Error(result.error?.message ?? 'Dataverse rejected the update.');
}

/**
 * Submit an eligible document for processing. The flow picks it up from Ready to Process —
 * the client never sets Processing, Completed or Failed itself.
 */
export async function submitForProcessing(doc: ProcessedDocument): Promise<void> {
  await patch(doc, { dpa_processingstatus: ProcessingStatus.ReadyToProcess });
}

/**
 * Explicitly request reprocessing of a Failed or Completed document. The flow resets the
 * Reprocess Requested flag once the new attempt starts.
 */
export async function requestReprocessing(doc: ProcessedDocument): Promise<void> {
  await patch(doc, {
    dpa_reprocessrequested: true,
    dpa_processingstatus: ProcessingStatus.ReadyToProcess,
  });
}

export async function setExtractionMethod(doc: ProcessedDocument, method: number): Promise<void> {
  await patch(doc, { dpa_extractionmethod: method });
}

export async function renameDocument(doc: ProcessedDocument, name: string): Promise<void> {
  const field = doc.kind === 'invoice' ? 'dpa_invoicename' : 'dpa_receiptname';
  await patch(doc, { [field]: name });
}

/** Upload or replace the source document on a record that has not been submitted yet. */
export async function uploadSourceDocument(doc: ProcessedDocument, file: File): Promise<void> {
  const result =
    doc.kind === 'invoice'
      ? await Dpa_invoicesService.upload(doc.id, 'dpa_sourcedocument', file, file.name)
      : await Dpa_receiptsService.upload(doc.id, 'dpa_sourcedocument', file, file.name);
  if (!result.success) throw new Error(result.error?.message ?? 'The document could not be uploaded.');
}

/**
 * Fetch the stored document bytes for the in-app preview.
 * Returns the raw bytes plus a best-effort MIME type sniffed from the magic number,
 * because the stored file name is not always a reliable indicator.
 */
export async function downloadSourceDocument(
  doc: ProcessedDocument,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  const result = await client.downloadFileFromRecord(DATA_SOURCE[doc.kind], doc.id, 'dpa_sourcedocument');
  if (!result.success || !result.data) {
    throw new Error(result.error?.message ?? 'The document could not be downloaded.');
  }
  return { bytes: result.data, mimeType: sniffMimeType(result.data, doc.documentFileName) };
}

function sniffMimeType(bytes: Uint8Array, fileName: string | null): string {
  const b = bytes;
  if (b.length >= 4 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'application/pdf';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 2 && b[0] === 0x42 && b[1] === 0x4d) return 'image/bmp';
  if (b.length >= 4 && ((b[0] === 0x49 && b[1] === 0x49) || (b[0] === 0x4d && b[1] === 0x4d))) return 'image/tiff';

  const ext = (fileName ?? '').toLowerCase().split('.').pop() ?? '';
  const byExt: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    bmp: 'image/bmp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
  };
  return byExt[ext] ?? 'application/octet-stream';
}

/** Create a new draft document of either kind, returning its id. */
export async function createDocument(kind: DocumentKind, name: string, method: number): Promise<string> {
  const common = {
    dpa_processingstatus: ProcessingStatus.Draft,
    dpa_extractionmethod: method,
    dpa_reprocessrequested: false,
    dpa_processingattemptcount: 0,
  };
  const result =
    kind === 'invoice'
      ? await Dpa_invoicesService.create({ dpa_invoicename: name, ...common } as never)
      : await Dpa_receiptsService.create({ dpa_receiptname: name, ...common } as never);
  if (!result.success || !result.data) {
    throw new Error(result.error?.message ?? 'The document could not be created.');
  }
  return kind === 'invoice'
    ? (result.data as Dpa_invoices).dpa_invoiceid
    : (result.data as Dpa_receipts).dpa_receiptid;
}

/**
 * Create a draft and attach the dropped file in one step. The name defaults from the
 * file name; the processing flow renames the record from the extracted values later.
 */
export async function createDocumentWithFile(
  kind: DocumentKind,
  name: string,
  method: number,
  file: File,
): Promise<string> {
  const id = await createDocument(kind, name, method);
  const stub = { kind, id } as ProcessedDocument;
  await uploadSourceDocument(stub, file);
  return id;
}
