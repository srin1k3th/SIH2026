# VeriAPH: Frontend-Backend Contract (Source of Truth)

**Project:** VeriAPH (SIH26261) - AI Document Verification for AICTE Applications  
**Version:** 1.0.0 (Milestone M0)  
**Author:** Frontend Lead (P1)  
**Consumers:** Backend Lead (P2), Verification Lead (P3), Intelligence Lead (P4), Forensics Lead (P5)  

---

## 1. Principles & Architectural Contract

1. **Deterministic Authority:**
   Rules, forensics, and issuer verification decide pass/fail statuses and flags. An LLM may ONLY extract fields or explain findings. It NEVER decides a status or flag.
2. **Evidence-Linked Findings:**
   Every finding includes: `id`, `doc_id`, `source`, `type`, `severity`, `page` (1-based), `bbox` (`[x0, y0, x1, y1]` in PDF points, origin top-left; `null` for document-level findings), `rule_id`, `reason`, `evidence` (`{before, after, revision, note}`), and `confidence`.
3. **Review Indicators:**
   Findings are preliminary indicators for scrutiny officer review, not proof of forgery. Scrutiny officers record authoritative decisions (`accept`, `override`, `clarify`).
4. **Data Provenance:**
   Information submitted by an institution and information confirmed by an external source are always separate data structures (`submitted_fields` vs `source_fields`).
5. **No Hallucinated Rules:**
   Unless handbook clause text is verified from `data/handbook/`, `clause_ref` must be `"TODO-VERIFY"`.

---

## 2. Core Conventions & Data Geometry

- **Page Numbering:** Strictly 1-based everywhere in API requests, responses, and UI display.
- **Bounding Boxes:** `[x0, y0, x1, y1]` in PDF points (72 DPI points), measured from the **TOP-LEFT** origin of the PDF page.
  - `x0`: Left coordinate
  - `y0`: Top coordinate
  - `x1`: Right coordinate
  - `y1`: Bottom coordinate
  - When `bbox: null`, the finding is a document-level finding (e.g. metadata mismatch or missing file).
- **Document Status Precedence (Binding for Orchestrator):**
  When multiple findings or statuses occur on a single document, the overall document status is resolved strictly by this precedence:
  ```
  mismatch_detected > expired > source_unavailable > verification_pending > manual_review_required > verified
  ```
- **Risk Score Formula (Standard):**
  ```
  risk_score = min(100, 15 * count(high) + 7 * count(medium) + 2 * count(low))
  ```

---

## 3. TypeScript Definitions (Mirrored in `frontend/src/types.ts`)

```typescript
export type Severity = 'high' | 'medium' | 'low';
export type Confidence = 'high' | 'medium' | 'low';
export type FindingSource = 'forensics' | 'crosscheck' | 'rules' | 'issuer';
export type DocStatus =
  | 'verified'
  | 'mismatch_detected'
  | 'expired'
  | 'verification_pending'
  | 'source_unavailable'
  | 'manual_review_required';
export type Role = 'institution' | 'officer';
export type BBox = [number, number, number, number]; // [x0, y0, x1, y1] PDF points, top-left origin

export interface Decision {
  finding_id: string;
  action: 'accept' | 'override' | 'clarify';
  reason: string;
  officer: string;
  timestamp: string; // ISO 8601
}

export interface Finding {
  id: string;
  doc_id: string;
  source: FindingSource;
  type: string;
  severity: Severity;
  page: number; // 1-based
  bbox: BBox | null; // null for document-level findings
  rule_id: string;
  reason: string;
  evidence: {
    before?: string;
    after?: string;
    revision?: number;
    note?: string;
  };
  confidence: Confidence;
  decision?: Decision | null;
}

export interface PageSize {
  width: number;
  height: number;
} // PDF points (A4 = 595.28 x 841.89)

export interface Revision {
  rev: number;
  label: string;
  saved_at: string;
  producer: string | null;
  is_current: boolean;
}

export interface SignatureInfo {
  present: boolean;
  intact: boolean;
  valid: boolean;
  trusted: boolean;
  modification_level: 'none' | 'form_filling' | 'annotations' | 'other';
  signer: string | null;
  signed_at: string | null;
}

export interface VerificationInfo {
  source: string;
  reference: string | null;
  requested_at: string | null;
  result: DocStatus;
  message: string;
  submitted_fields: Record<string, string>;
  source_fields: Record<string, string> | null;
}

export interface ExtractedField {
  name: string;
  value: string;
  confidence: Confidence;
}

export interface Document {
  id: string;
  application_id: string;
  doc_type: string;
  label: string;
  filename: string;
  status: DocStatus;
  uploaded_at: string;
  is_scanned: boolean;
  page_sizes: PageSize[];
  revisions: Revision[];
  signature: SignatureInfo | null;
  verification: VerificationInfo | null;
  fields: ExtractedField[];
  findings: Finding[];
}

export interface ChecklistRow {
  doc_type: string;
  label: string;
  required: boolean;
  description: string;
  document_id: string | null; // null = required document is missing
}

export interface MatrixCell {
  value: string | null;
  normalized: string | null;
  match: boolean;
  note?: string;
  finding_id?: string;
}

export interface CrosscheckMatrix {
  fields: { id: string; label: string }[];
  sources: { id: string; label: string }[];
  cells: Record<string, Record<string, MatrixCell>>; // cells[fieldId][sourceId]
}

export interface VerificationEntry {
  id: string;
  doc_id: string;
  doc_label: string;
  source: string;
  reference: string | null;
  requested_at: string;
  status: DocStatus;
  message: string;
}

export interface Alert {
  id: string;
  application_id: string;
  doc_id: string | null;
  kind: 'expiring' | 'expired' | 'pending_verification' | 'anomaly' | 'missing';
  message: string;
  due_date: string | null;
  severity: Severity;
}

export interface ApplicationSummary {
  id: string;
  institution: string;
  category_id: string;
  category_label: string;
  submitted_at: string;
  risk_score: number;
  doc_count: number;
  status_counts: Partial<Record<DocStatus, number>>;
  flag_counts: Record<Severity, number>;
  has_missing: boolean;
}

export interface ApplicationDetail extends ApplicationSummary {
  documents: Document[];
  checklist: ChecklistRow[];
  crosscheck: CrosscheckMatrix;
  verification_log: VerificationEntry[];
  alerts: Alert[];
}

export interface Category {
  id: string;
  label: string;
  description: string;
}

export interface PrecheckIssue {
  doc_type: string;
  kind: 'missing' | 'expired' | 'inconsistent' | 'unreadable';
  message: string;
}

export interface PrecheckResult {
  ok: boolean;
  issues: PrecheckIssue[];
}

export interface Explanation {
  finding_id: string;
  status: 'ok' | 'handbook_not_loaded' | 'llm_unavailable';
  text: string | null;
  citations: { clause_ref: string; snippet: string }[];
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  clause_ref: string;
  severity: Severity;
  category_ids: string[];
  enabled: boolean;
  threshold: { label: string; value: number; unit: string } | null;
  last_run_hits: number;
}

export interface AuditEvent {
  seq: number;
  timestamp: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  detail: string;
  prev_hash: string;
  hash: string;
}

export interface AuditVerifyResult {
  valid: boolean;
  checked: number;
  first_broken_seq: number | null;
}

export interface Metrics {
  detection_by_type: { type: string; n: number; detected: number }[];
  clean_docs: number;
  false_positives: number;
  avg_seconds_per_doc: number;
  n_docs: number;
  generated_at: string | null;
  is_sample?: boolean;
}

export interface DashboardResponse {
  kpis: {
    applications: number;
    flagged: number;
    pending_verification: number;
    expiring: number;
  };
  queue: ApplicationSummary[];
  alerts: Alert[];
}
```

---

## 4. API Endpoint Specifications

| Method | Endpoint | Request Body / Params | Response Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/dashboard` | - | `DashboardResponse` | Aggregated scrutiny KPIs, queue summaries, and global alerts. |
| `GET` | `/applications` | - | `ApplicationSummary[]` | Full scrutiny queue for officer review. |
| `GET` | `/applications/{id}` | - | `ApplicationDetail` | Complete application data with checklist, documents, crosscheck matrix, and verification log. |
| `POST` | `/applications` | `multipart/form-data`: `category_id`, `files[]`, `doc_types[]` | `ApplicationDetail` | Submit new application with documents. |
| `POST` | `/applications/precheck` | `multipart/form-data`: `category_id`, `files[]`, `doc_types[]` | `PrecheckResult` | Fast pre-submission client validation. |
| `POST` | `/applications/{id}/validate` | - | `ApplicationDetail` | Re-run validation pipeline synchronously. Recomputes findings & risk while preserving officer decisions. |
| `GET` | `/applications/{id}/report` | - | `application/pdf` | PDF executive summary report download. |
| `GET` | `/documents/{id}` | - | `Document` | Single document metadata, fields, findings, and revisions. |
| `GET` | `/documents/{id}/file` | - | `application/pdf` | Raw PDF byte stream of current document revision. |
| `GET` | `/documents/{id}/render` | `?rev={int}&page={int}` (page 1-based) | `image/png` | High-res 2x rasterized image of the requested revision page. |
| `GET` | `/findings/{id}/explain` | - | `Explanation` | AI natural language explanation with retrieved handbook citations. |
| `POST` | `/findings/{id}/decision` | `{ action: 'accept' \| 'override' \| 'clarify', reason: string }` | `Decision` | Record scrutiny officer decision with required explanation (min 10 chars). |
| `GET` | `/categories` | - | `Category[]` | List application approval categories. |
| `GET` | `/categories/{id}/checklist` | - | `ChecklistRow[]` | Expected document checklist for a category. |
| `GET` | `/rules` | `?year={string}` | `Rule[]` | Regulatory and forensic rules for specified APH year. |
| `PATCH` | `/rules/{id}` | `{ enabled?: boolean, threshold_value?: number }` | `Rule` | Toggle rule activation or edit numeric threshold. |
| `GET` | `/audit` | - | `AuditEvent[]` | Tamper-evident audit trail entries. |
| `GET` | `/audit/verify` | - | `AuditVerifyResult` | Cryptographic verification of audit hash chain. |
| `GET` | `/metrics` | - | `Metrics` | Ground-truth detection and accuracy benchmarks. |

---

## 5. Standard Finding Type Enum & Plain-English Labels

| Finding Type String | Category | Default Severity | Plain-English Label |
| :--- | :--- | :--- | :--- |
| `MODIFIED_AFTER_SIGNING` | Forensics | high | Modified After Signing |
| `TEXT_EDITED_AFTER_CREATION` | Forensics | high | Text Alteration Detected |
| `PRODUCER_MISMATCH` | Forensics | low | Document Producer Inconsistency |
| `FONT_INCONSISTENCY` | Forensics | medium | Embedded Font Inconsistency |
| `HIDDEN_OVERLAY_TEXT` | Forensics | medium | Hidden or Obscured Text Layer |
| `CROSSDOC_FIELD_MISMATCH` | Crosscheck | high | Cross-Document Field Discrepancy |
| `DOC_EXPIRED` | Rules | medium | Regulatory Clearance Expired |
| `ISSUER_MISMATCH` | Issuer | high | Authority Record Discrepancy |
| `MISSING_DOCUMENT` | Rules | high | Mandatory Statutory Document Missing |
| `DUPLICATE_DOCUMENT` | Intelligence | medium | Duplicate Document Detected |
| `LOW_OCR_CONFIDENCE` | Intelligence | low | Low OCR Extraction Confidence |
| `RULE_VIOLATION` | Rules | medium | Regulatory Rule Violation |

---

## 6. SPEC Gaps / Decisions Backend Must Honour

1. **Idempotent Decision Preservation:**
   When `POST /applications/{id}/validate` is invoked, existing officer `Decision` objects mapped to finding IDs must persist unless the underlying condition has completely cleared.
2. **Standard Document Fields (8 fields):**
   `trust_name`, `survey_no`, `land_area`, `lease_start`, `lease_end`, `cert_valid_from`, `cert_valid_to`, `signatories`.
3. **Crosscheck Matrix Cells:**
   The `cells` mapping in `CrosscheckMatrix` MUST be keyed by `cells[fieldId][sourceId]`. Cell `match: false` is set for sources that diverge from the majority value.
4. **Audit Hash Chaining:**
   `hash = sha256(prev_hash + canonical_json_of_other_fields)`. The genesis event (#1) uses 64 zeros as `prev_hash`:
   `0000000000000000000000000000000000000000000000000000000000000000`.

---

## 7. Mock-Only Behaviour (Isolated in `src/api/mock.ts` & `mockStore.ts`)

- **In-Memory Store:** Mutations (decisions, rule toggles, thresholds, uploads) are maintained in session memory.
- **Rule Toggle Recomputation:** Disabling a rule in the mock store dynamically filters out findings referencing that `rule_id`, recomputes document statuses using the precedence order, and recalculates the application risk score.
- **Precheck Simulation:** `POST /applications/precheck` returns canned sample results labeled `(sample result)`.
- **Dev Panel (`?dev=1`):** Provides buttons to reset mock store, simulate API errors, simulate 3s network latency, and corrupt audit event #7 to test chain integrity validation.
