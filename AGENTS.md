# VeriAPH: Agent Guide (read this first, every task)

SIH 2026 problem SIH26261: AI-powered application validation, document authentication and regulatory compliance verification for AICTE. We are building a demo prototype for round 1 (PPT + working demo). Submission deadline is 28 Oct 2026. Code freeze is 27 Oct.

## Principles (non-negotiable)
1. Rules, forensics and issuer checks decide statuses and flags. An LLM may only extract fields or explain findings. It never decides pass/fail.
2. Every finding is evidence-linked: page, bbox, rule_id, reason, evidence, confidence.
3. Findings are preliminary indicators for officer review, not proof of forgery. Officers decide.
4. Information submitted by an institution and information confirmed by a source are always shown as different things.
5. Honesty: never hardcode results by filename, doc name or fixed bbox. Never invent regulatory clause numbers (use clause_ref "TODO-VERIFY"). Never invent metrics (numbers come only from a run of backend/eval). Anything placeholder is marked `# STUB` and listed in STUBS.md.

## Read order for every task
1. This file. 2. docs/FRONTEND_CONTRACT.md (source of truth for types and endpoints). 3. Your brief in docs/briefs/. 4. docs/DEMO_SCRIPT.md. 5. STUBS.md and docs/HANDOFFS.md. 6. Your rows in FEATURES.md.

## Stack and commands
- Backend: Python 3.11+, FastAPI, SQLModel, SQLite, venv at backend/.venv. Run: `uvicorn backend.core.main:app --reload --port 8000`. Mock issuer: `uvicorn backend.checkers.issuer.mock_issuer:app --port 8001`. Tests: `pytest backend -q`.
- Frontend: `cd frontend && npm i && npm run dev` (VITE_USE_MOCK=false and VITE_API_URL=http://localhost:8000 to use the real backend).
- No Postgres, Celery, auth libraries or extra frameworks. Synchronous processing. LLM calls only through backend/core/llm.py (env LLM_PROVIDER, LLM_API_KEY; must degrade gracefully with no key).

## Ownership (edit only your folders)
| Folder | Owner |
|---|---|
| frontend/, docs/FRONTEND_CONTRACT.md | P1 |
| backend/intelligence/crosscheck/, risk/, explain/, report/ | P1 |
| backend/core/, backend/schemas.py, backend/checkers/base.py, registry.py, docker-compose.yml, Dockerfiles | P2 |
| backend/checkers/issuer/, backend/rules/, data/clean/, data/generate_clean.py, data/planted_issues.yaml | P3 |
| backend/intelligence/extract/, backend/eval/ | P4 |
| backend/checkers/forensics/, backend/audit/, backend/security/, data/tampered/, data/generate_tampered.py | P5 |
| AGENTS.md, docs/*, STUBS.md | everyone appends; only P2 restructures |

If you need a change in someone else's folder: write a row in docs/HANDOFFS.md and continue with a local `# STUB`. Do not edit their files.

## Contract conventions (binding)
- backend/schemas.py mirrors frontend/src/types.ts field for field, same names. Only P2 edits schemas.py, after a row in docs/HANDOFFS.md and agreement from the owners affected.
- Page numbers are 1-based everywhere. BBox = [x0,y0,x1,y1] in PDF points, origin top-left of the page. bbox is null for document-level findings.
- Statuses are exactly: verified, mismatch_detected, expired, verification_pending, source_unavailable, manual_review_required.
- Document status precedence (P2 implements): mismatch_detected > expired > source_unavailable > verification_pending > manual_review_required > verified.
- Uploaded or generated PDFs are resolved only through `backend.core.storage.doc_path(doc_id) -> Path`.

## Module interfaces (implement exactly these signatures; models come from backend.schemas)
| Module | Owner | Functions |
|---|---|---|
| checkers/base.py | P2 | `class DocumentChecker(Protocol): name: str; def check(self, doc: Document) -> list[Finding]`; `class ApplicationChecker(Protocol): name: str; def check(self, app: ApplicationDetail) -> list[Finding]` |
| checkers/registry.py | P2 | `register_document_checker(c)`, `register_application_checker(c)`; each owner adds ONE registration line |
| checkers/forensics | P5 | `analyze(path: Path) -> ForensicsResult(findings, revisions: list[Revision], signature: SignatureInfo|None, page_sizes: list[PageSize])`; `render(path: Path, rev: int, page: int) -> bytes` (PNG) |
| checkers/issuer | P3 | `verify(doc: Document, path: Path) -> VerificationInfo`; a DocumentChecker turning mismatches into Findings |
| rules | P3 | `categories() -> list[Category]`; `checklist(category_id) -> list[ChecklistRow]`; `list_rules(year) -> list[Rule]`; `patch_rule(id, enabled, threshold_value) -> Rule`; `run_document(doc) -> list[Finding]`; `run_application(app) -> list[Finding]` |
| intelligence/extract | P4 | `classify(path) -> (doc_type, confidence)`; `extract(path, doc_type) -> list[ExtractedField]`; `is_scanned(path) -> bool`; `near_duplicates(doc, corpus) -> list[Finding]` |
| intelligence/crosscheck | P1 | `crosscheck(app) -> (CrosscheckMatrix, list[Finding])` |
| intelligence/risk | P1 | `score(findings) -> int` (min(100, 15*high + 7*medium + 2*low), weights in weights.yaml); `build_alerts(app) -> list[Alert]`; `build_dashboard(apps) -> DashboardResponse` |
| intelligence/explain | P1 | `explain(finding, doc) -> Explanation` (explain-only; handbook_not_loaded / llm_unavailable statuses) |
| intelligence/report | P1 | `build_report(app) -> bytes` (PDF) |
| audit | P5 | `log(actor, role, action, target, detail) -> AuditEvent`; `list_events() -> list[AuditEvent]`; `verify_chain() -> AuditVerifyResult` |
| security | P5 | `validate_upload(filename: str, data: bytes) -> bytes` (sanitised; raises UploadRejected(reason)); `mask_pii(text: str) -> str` |
| eval | P4 | `run_eval() -> Metrics` |
| core | P2 | API routes, DB, orchestrator `validate_application(app_id)`, storage, llm wrapper, seed, docker |

## Definition of done (for any piece of work)
- Implements the interface above exactly; typed; no print debugging.
- pytest: at least one planted doc that triggers the expected finding AND one clean doc that produces ZERO findings from your checker.
- Registered in registry.py (one line) if it is a checker.
- STUBS.md and your FEATURES.md rows updated. No unlisted placeholders.
- Final walkthrough lists each feature as WORKING / PARTIAL / STUB with evidence (test name or screenshot).
- A human on the team has read the code and run it.

## Git
- One branch per person: p1/..., p2/core, p3/verification, p4/intelligence, p5/forensics. Small commits. Pull main before starting and before every PR.
- PRs go to main and P2 merges after tests pass. Never force-push. Never commit secrets (.env is git-ignored; .env.example is committed).
- Tag after each integration: scaffold-v0, scaffold-v1, demo-v1.

## If blocked
Add a row to docs/HANDOFFS.md (date, from, to, what, status). Continue with a `# STUB` that returns contract-valid data and is listed in STUBS.md. Never edit another owner's folder.
