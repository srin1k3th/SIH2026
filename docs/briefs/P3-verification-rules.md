# Brief P3: issuer verification, rules engine, clean demo data

## Mission
You own everything that decides "is this document confirmed by its source" and "does this application satisfy the rules", plus the clean synthetic documents the whole team demos on.

## You own
backend/checkers/issuer/, backend/rules/, data/clean/, data/generate_clean.py, data/planted_issues.yaml.

## Build list (in order)
1. data/generate_clean.py (reportlab, qrcode): Application A's 6 documents CLEAN, real text layer, A4, using exactly the values in docs/DEMO_SCRIPT.md (trust "Shri Ram Educational Trust", land 4.2 acres in NOC/registration, survey "SY 214/3B", etc. Decide the exact values once and record them in docs/DECISIONS.md so P4 and P5 use the same). QR codes on the fire and accreditation certificates encoding a mock issuer reference (e.g. FSC/2025/88213). Also Application B (fully consistent). Planted differences are NOT in the clean docs.
2. data/planted_issues.yaml: ground truth per DEMO_SCRIPT (doc, issue, expected finding type, expected bbox text, expected status). P5 adds the forensic entries.
3. backend/checkers/issuer/mock_issuer.py: separate FastAPI app on port 8001. GET /verify?ref=...: matching record; a record whose validity date differs; a 202 pending case; a 503 case. Records live in a JSON file, not in code branches by filename.
4. backend/checkers/issuer/connector.py: verify(doc, path) -> VerificationInfo with source, reference, requested_at, result (one of the six statuses), message, submitted_fields, source_fields (null when not confirmed). Decode QR with pyzbar (read its docs first; rasterise the page with PyMuPDF). No QR -> manual_review_required. Timeouts and errors -> source_unavailable. A DocumentChecker converts mismatches into findings (ISSUER_MISMATCH with bbox on the mismatching text found via word boxes).
5. backend/rules: YAML rule files per APH year (2024-25, 2025-26, 2026-27; 2026-27 notes the 2 Dec 2025 corrigendum), rule schema {id, title, description, clause_ref, severity, category_ids, enabled, threshold}. 10 rules including LEASE-MIN-TERM (30 years), RUL-EXP-01, XDOC-AREA-01 (owned by P1 logic, listed here for toggling), FOR-INCR-01, FOR-FONT-02, FOR-META-03, FOR-SIG-04, ISS-MISMATCH-01, OCR-CONF-01 (70%), REQ-DOC-01. clause_ref is "TODO-VERIFY" for all until a human fills them from the real handbook.
6. Evaluator: run_document(doc) and run_application(app) (required documents present, expiry vs AS_OF date, lease term). AS_OF date comes from env (default today) so the demo is reproducible. Disabled rules produce no findings. list_rules, patch_rule, categories, checklist per category (EoA has 7 rows incl. Affidavit/Undertaking).
7. Persist rule enabled/threshold state so PATCH survives restart.

## Acceptance tests
- Fire certificate -> verified; accreditation -> mismatch_detected with a bbox on the date; 202 -> verification_pending; 503/timeouts -> source_unavailable; doc without QR -> manual_review_required.
- Disable RUL-EXP-01 -> expired finding disappears. Clean Application B -> zero rule findings and zero issuer findings.
- Rule evaluation uses no LLM.

## Human verification (you)
- Replace every TODO-VERIFY with the real clause from the AICTE Approval Process Handbook, and fix any rule whose threshold does not match the handbook. Delete rules you cannot source.
- Read the API Setu requester spec and write 3 lines in docs/DECISIONS.md on what real integration would need (registration, consent, signed responses).
- Kill the mock issuer and confirm graceful source_unavailable.

## Starter prompt
"Read AGENTS.md, docs/FRONTEND_CONTRACT.md, docs/briefs/P3-verification-rules.md and docs/DEMO_SCRIPT.md. Implement the Build list in order following the hard rules and the interfaces in AGENTS.md. Edit only the folders I own. Tests with planted and clean inputs. End with a walkthrough artifact."
