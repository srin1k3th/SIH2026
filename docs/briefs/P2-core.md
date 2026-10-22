# Brief P2: backend core and integration (owns main)

## Mission
You own the spine: the API, database, orchestrator and the shared Python contract. Everyone else plugs into what you define in the first hour.

## You own
backend/core/, backend/schemas.py, backend/checkers/base.py, backend/checkers/registry.py, docker-compose.yml, Dockerfiles.

## First hour (blocks everyone, push to main immediately)
1. backend/checkers/base.py with the two Protocols from AGENTS.md.
2. backend/checkers/registry.py with register_* functions and ordered lists.
3. backend/schemas.py: Pydantic models generated field for field from frontend/src/types.ts (wait for docs/FRONTEND_CONTRACT.md and types.ts from P1's frontend task, milestone M0). Add a test that loads every frontend/src/mock/*.json into these models.
4. backend/core/storage.py with doc_path(doc_id). backend/core/llm.py wrapper.
5. Empty module stubs matching the AGENTS.md interface table so imports resolve (each marked # STUB and listed in STUBS.md).

## Build list
1. SQLModel models + SQLite; seed script that registers the demo applications (from data/clean, data/tampered and data/planted_issues.yaml when they exist; until then from frontend/src/mock and frontend/public/mock/pdfs). Reset script.
2. Upload route: call backend.security.validate_upload, store, create Document.
3. Orchestrator validate_application(app_id): for each document run classify/extract (P4), forensics.analyze (P5), issuer.verify (P3), run all registered DocumentCheckers; run ApplicationCheckers (P1 crosscheck, P3 rules for application-level rules such as required documents); apply disabled rules; derive each document status using the precedence in AGENTS.md; compute risk_score via P1; build alerts via P1. Idempotent: re-running replaces findings but keeps officer decisions on the same finding ids.
4. All endpoints in docs/FRONTEND_CONTRACT.md (dashboard, applications, precheck, validate, report, documents, file, render, explain, decision, categories, checklist, rules, audit, audit/verify, metrics). Response shapes must validate against schemas.py. Enable CORS for http://localhost:5173.
5. POST /findings/{id}/decision: reason required (>=10 chars), persists, calls audit.log.
6. Rule changes call audit.log.
7. docker-compose (backend, mock issuer, frontend), .env.example, README with one-command run, exported openapi.json.

## Acceptance tests
- End to end: seed -> validate Application A -> statuses and findings match docs/DEMO_SCRIPT.md (once all modules exist; before that, with stubs).
- Decision with a short reason is rejected; valid decision survives re-validation.
- One checker raising an exception does not fail the whole validation: it is caught, logged, and the document gets a manual_review_required status with a note.
- Every response validates against schemas.py.

## Human verification (you)
- Kill the issuer service mid-run and confirm source_unavailable. Upload a corrupt PDF and an encrypted PDF. Run validate twice and confirm decisions persist.
- Read the orchestrator and status-derivation code until you can explain it.

## Starter prompt
"Read AGENTS.md, docs/FRONTEND_CONTRACT.md, docs/briefs/P2-core.md and docs/DEMO_SCRIPT.md. First do the 'First hour' list and stop for my review of the plan. Then implement the Build list in order. Edit only the folders I own. Tests for everything. End with a walkthrough artifact."
