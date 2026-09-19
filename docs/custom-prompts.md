# AI Builder custom prompts — manual creation guide

The custom-prompt branch of both flows is still a documented placeholder. This file holds the exact
prompt text to paste, so wiring the branch up is a copy-and-publish job rather than an authoring job.

## Why these are created by hand

A prompt cannot be created end to end through the Dataverse Web API. The prompt model and its
training configuration can be created, but the service rejects the `statuscode`/`statecode` writes
that would mark it trained, and exposes no train/publish action — a server-side plug-in owns that
lifecycle. So the prompts are authored in the maker UI using the text below.
## Create the prompts

1. Go to **make.powerapps.com** → your environment → **AI hub** → **Prompts** → **New prompt**.
2. Name it exactly as below (the flow branch references it by name).
3. Add one input of type **Document** (this receives the uploaded file) and paste the prompt text.
4. **Save** and **Publish**.
5. Note the prompt's id, then follow *Wire the branch* below.

### Prompt 1 — `Extract Invoice Fields (DPA)`

```text
You extract structured data from an invoice document.

Read the attached invoice and return ONLY a single JSON object, with no prose, no explanation and no markdown fences.

Use exactly these keys. Use null for any value that is not present in the document. Do not invent values.

{
  "invoiceNumber": string|null,
  "purchaseOrderNumber": string|null,
  "vendorName": string|null,
  "vendorAddress": string|null,
  "vendorTaxNumber": string|null,
  "billToName": string|null,
  "billToAddress": string|null,
  "invoiceDate": "YYYY-MM-DD"|null,
  "dueDate": "YYYY-MM-DD"|null,
  "subTotal": number|null,
  "taxAmount": number|null,
  "totalAmount": number|null,
  "amountDue": number|null,
  "currencyCode": string|null,
  "lineItems": [ { "description": string|null, "quantity": number|null, "unitPrice": number|null, "amount": number|null } ]
}

Rules:
- Amounts must be plain numbers with no currency symbol or thousands separator.
- currencyCode must be the three-letter ISO code such as CAD, USD or EUR.
- Dates must use the YYYY-MM-DD format.
- If the document is not an invoice, return the same object with every value null and an empty lineItems array.
```

### Prompt 2 — `Extract Receipt Fields (DPA)`

```text
You extract structured data from a purchase receipt.

Read the attached receipt and return ONLY a single JSON object, with no prose, no explanation and no markdown fences.

Use exactly these keys. Use null for any value that is not present in the document. Do not invent values.

{
  "receiptNumber": string|null,
  "merchantName": string|null,
  "merchantAddress": string|null,
  "merchantPhone": string|null,
  "merchantTaxNumber": string|null,
  "transactionDate": "YYYY-MM-DD"|null,
  "transactionTime": string|null,
  "paymentMethod": string|null,
  "subTotal": number|null,
  "taxAmount": number|null,
  "tipAmount": number|null,
  "totalAmount": number|null,
  "currencyCode": string|null,
  "lineItems": [ { "description": string|null, "quantity": number|null, "amount": number|null } ]
}

Rules:
- Amounts must be plain numbers with no currency symbol or thousands separator.
- currencyCode must be the three-letter ISO code such as CAD, USD or EUR.
- transactionDate must use the YYYY-MM-DD format; transactionTime stays as printed, for example "14:32".
- If the document is not a receipt, return the same object with every value null and an empty lineItems array.
```

The keys deliberately match the `Parse_invoice_extraction` / `Parse_receipt_extraction` objects already
in the flows, so the mapping below is a straight rename rather than new logic.

## Wire the branch

Already done in both flows. For reference, the custom-prompt case contains:

1. **`Run_a_prompt`** (`aibuilderpredict_customprompt`) — `recordId` is the prompt id and the document
   is passed as `item/requestv2/<input name>/base64Encoded` = `@body('Download_source_document')`.
2. **`Set_processed_by_prompt`** — records which path produced the values.

Everything after the switch is shared with the native branch, so no per-branch mapping is needed.

> **Ordering matters.** As first authored the branch ran
> `Mark_custom_prompt_not_configured` → `Run_a_prompt` → `Terminate_custom_prompt_not_configured`,
> which marked the row **Failed** before the prompt ran and then terminated the run, discarding the
> output. The placeholders were removed and `Run_a_prompt` now runs first, falling through to the
> shared completion path.

## How the branch consumes the prompt

Each flow's custom-prompt branch calls `aibuilderpredict_customprompt` with:

- `recordId` — the prompt's model id **in your environment**
- `item/requestv2/<input name>/base64Encoded` — `@body('Download_source_document')`

The prompt returns its JSON as a string at
`body('Run_a_prompt')?['responsev2']?['predictionOutput']?['text']`. The flow parses it once in
`Parse_prompt_output`, and every column then resolves as `coalesce(native, prompt)` — so one
completion path serves both the prebuilt-model branch and the prompt branch.

Measured against the sample invoice, the prompt matched the prebuilt model on every field **and**
additionally returned `vendorTaxNumber`, which the prebuilt model does not extract.

> **Prompt ids are environment-specific.** After creating the prompts, update the `recordId`
> parameter of `Run_a_prompt` in each flow. Storing the id in an environment variable keeps the
> solution portable across environments.
