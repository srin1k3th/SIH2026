# Demo script and planted-issue truth table

Application A "Sample Institute of Technology" (EoA). Every module builds toward this story. Planted issue must be the ONLY difference between a document and its clean version.

| Doc id | Document | Planted issue | Expected finding(s) | Expected status |
|---|---|---|---|---|
| d_lease | Land lease deed (2 pages) | Land area "4.2 acres" edited to "9.2 acres" in a later revision, different font, different producer | TEXT_EDITED_AFTER_CREATION (high, bbox on the edit), FONT_INCONSISTENCY (medium), PRODUCER_MISMATCH (low, doc-level), CROSSDOC_FIELD_MISMATCH (high) | manual_review_required |
| d_noc | NOC (signed) | Signed with a valid demo CA, then text edited after signing | MODIFIED_AFTER_SIGNING (high) | verification_pending (issuer returns 202) |
| d_fire | Fire safety certificate (QR) | none | none | verified |
| d_accr | Accreditation certificate (QR) | Issuer record has a different validity date than the document | ISSUER_MISMATCH (high, bbox on the date) | mismatch_detected |
| d_reg | Registration certificate | Validity already ended | DOC_EXPIRED (medium) | expired |
| d_plan | Building plan approval (scanned, no machine-readable QR) | Scan with a stamp, issuer returns 503 | LOW_OCR_CONFIDENCE (low) | source_unavailable |
| (missing) | Affidavit / Undertaking | Required document not uploaded | MISSING_DOCUMENT | n/a |

Cross-document fields: land area is 4.2 acres in the NOC and registration certificate, 9.2 acres in the lease and the application. Trust name "Shri Ram Educational Trust" vs "Sri Ram Educational Trust" must be a fuzzy MATCH. Survey no "SY 214/3B" vs "SY-214/3B" must be a MATCH.
Application B "Clean Valley Polytechnic": fully consistent, all verified, zero findings, risk 0.
Metrics: only from backend/eval runs. Clause refs: "TODO-VERIFY" until a human checks the Approval Process Handbook.

2-minute flow: 1) Dashboard, flagged app on top (10s). 2) Application A: six statuses, missing affidavit, cross-document mismatch (30s). 3) Lease deed: red box on the edit, revision slider before/after (30s). 4) Signed NOC: valid signature, modified after signing (20s). 5) Rules page: disable RUL-EXP-01, re-run, finding disappears and risk drops (20s). 6) Officer override with a reason, show it in the Audit chain, Verify chain (10s).
