# Document Processing Accelerator

A reusable document-processing accelerator for Microsoft Power Platform. Upload an invoice or a
receipt, and AI Builder extracts its contents into Microsoft Dataverse through a status-driven
processing pipeline.

Built as a demonstration accelerator: the architecture is deliberately small, portable and easy to
read rather than a production accounting system.

---

## What it does

1. **Capture** — create an Invoice or Receipt record and attach a PDF or image.
2. **Submit** — move the record to *Ready to Process*.
3. **Extract** — a cloud flow picks it up and runs one of two AI Builder paths, chosen per record:
   - a **prebuilt model** (Invoice Processing / Receipt Scanning), or
   - a **custom prompt** returning strict structured JSON.
4. **Write back** — extracted values, processing metadata and any error land on the originating
   record, which is renamed from what was extracted, e.g. `Contoso Supplies Ltd · 2026-03-11 · 1073.50 CAD`.

Every document moves through one shared lifecycle:

```
Draft → Ready to Process → Processing → Completed
                                      ↘ Failed → (retry) → Ready to Process
```

Users own *Draft* and *Ready to Process*. The automation owns everything after that, and a record is
never left stranded in *Processing* — every branch, including failures, writes a terminal state with
a readable error.

## What's in the box

| Piece | Description |
| --- | --- |
| **Dataverse** | `Invoice` and `Receipt` tables with a file column, shared lifecycle choices, and full processing diagnostics |
| **Model-driven app** | *Document Processing Hub* — administration and testing: forms, status views, security roles |
| **Cloud flows** | *Process Invoice Document* and *Process Receipt Document* — trigger filtering, idempotency guard, try/catch scopes, and a switch across the two extraction methods |
| **Code app** | *Document Processing Experience* — a tailored React + TypeScript UI over the same tables |

### The code app

A full-height app shell rather than a long scrolling page: a left panel for navigation and filters,
and a master–detail documents view.

- Drag and drop a file anywhere to create a document, or onto a record to attach or replace one
- Names default from the file name, then get rewritten from the extracted values
- In-app preview of the stored PDF or image
- Search, status and method filters, and sorting
- Light and dark themes, in the Microsoft brand palette

## Repository layout

```
code-app/           React + TypeScript + Vite source for the code app
solution/           Unpacked Dataverse solution source
packages/           Managed and unmanaged solution zips
flows/              The two cloud flow definitions
docs/               App spec and the custom prompt text
sample-documents/   Synthetic invoice and receipt for testing
```

## Getting started

### Prerequisites

- A Power Platform environment with Dataverse
- **AI Builder** licence and capacity — the extraction step needs it
- Power Apps Code Apps enabled in the environment
- [Power Platform CLI](https://aka.ms/pac/install), Node.js 22+

### Import the solution

Grab the zips from the [latest release](../../releases/latest) or `packages/`:

```powershell
pac auth create --name target
pac env select --environment https://<your-env>.crm.dynamics.com/
pac solution import --path DocumentProcessingAccelerator_managed.zip --activate-plugins
pac solution publish
```

Use the unmanaged package for a development environment.

### Deploy the code app

```powershell
cd code-app
npm install
cp power.config.example.json power.config.json      # then set your environment id
pac code init -n "Document Processing Experience" -env https://<your-env>.crm.dynamics.com/ -b dist
pac code add-data-source -a dataverse -t dpa_invoice
pac code add-data-source -a dataverse -t dpa_receipt
npm run build
pac code push
```

### After importing

A few identifiers are environment-specific and need re-pointing:

1. **Create the two AI Builder custom prompts** using the text in
   [`docs/custom-prompts.md`](docs/custom-prompts.md), then set the `recordId` of `Run_a_prompt` in
   each flow.
2. **Re-resolve the prebuilt AI model ids** and update the `recordId` of the *Process invoices* /
   *Process receipts* actions.
3. **Assign the security roles** — *Document Processing User* and *Document Processing Administrator*.
4. **Turn both flows on** if they import stopped.

## Notes and limitations

- **AI Builder is required.** Without licence and capacity the flows run their full lifecycle but end
  in *Failed* with an actionable error, by design — nothing is fabricated.
- **Custom prompts are created in the maker UI.** They can't be created end to end through the API;
  the prompt text and wiring are documented so it's a copy-and-publish step.
- **Business rules** are skipped where the environment doesn't support authoring them through the
  API; the equivalent validation runs as a form script instead.
- **Line items** are stored as JSON rather than in a normalized child table, deliberately, for the
  first version.
- The sample documents are **synthetic** — generated for testing, containing no real data.

Out of scope by design: approvals, ERP integration, vendor matching, duplicate detection,
purchase-order matching, payments, and email ingestion. The data model leaves room for them later.

## License

[MIT](LICENSE)
