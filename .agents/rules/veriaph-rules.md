---
trigger: always_on
---

PROJECT: VeriAPH (SIH26261), AI document verification for AICTE applications. Demo prototype, 5-person team, deadline 28 Oct 2026.

HARD RULES
1. Follow AGENTS.md and docs/FRONTEND_CONTRACT.md exactly: data shapes, enums, endpoint names, folder layout. If something is missing or ambiguous, add a "SPEC GAP" row to docs/HANDOFFS.md and ask. Do not invent your own shapes.
2. Implement real logic, not placeholders. Use "# STUB" (listed in STUBS.md with its future owner) only for things impossible offline, such as real issuer or bank APIs. Never hardcode results by filename, document name or fixed bbox. Every real checker must pass tests on planted docs AND produce zero findings on clean docs.
3. Rules, forensics and issuer verification decide pass/fail. An LLM may only extract fields or explain findings. Never let an LLM decide a status or a flag.
4. Only edit inside the folders your task or brief names. Never change backend/schemas.py or docs/FRONTEND_CONTRACT.md unless the task says to.
5. Stack is fixed: FastAPI + SQLModel + SQLite, React + Vite + TypeScript + Tailwind, react-pdf, PyMuPDF, reportlab, plus only the libraries named in AGENTS.md, your brief or your task's allowed-dependencies list. No auth libraries, no Postgres, no Celery, no extra frameworks. Process synchronously.
6. Every checker needs pytest tests: at least one planted doc that triggers findings, and one clean doc that produces ZERO findings.
7. Read library docs before using a library. Do not guess APIs for pyHanko, pyzbar or PaddleOCR.
8. Finish each task with a walkthrough artifact: what works, what is STUB, known limitations, how to run it, which FEATURES.md rows it touched.
9. Never invent regulatory clause numbers. Unless the handbook text is in data/handbook/, set clause_ref to "TODO-VERIFY". Never fabricate accuracy numbers: metrics come only from running the eval harness.
10. LLM calls go only through backend/core/llm.py, which reads LLM_PROVIDER and LLM_API_KEY from env. If no key is set, degrade gracefully (regex-only extraction, explainer returns "LLM unavailable"). Never crash.
11. At the start of every task, read AGENTS.md and the brief or prompt named in the task. They override anything else except this rule file.