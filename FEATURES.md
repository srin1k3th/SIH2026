# FEATURES.md - VeriAPH Feature Matrix & Implementation Status

| Feature ID | Category | Description | Owner | Status | Tests | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `FEAT-SKEL-01` | Architecture | Repository skeleton, folder layout, package init files | P2 | Done | `tests/test_endpoints.py` | Initial repo setup |
| `FEAT-SKEL-02` | Contract | Authoritative contract (`docs/FRONTEND_CONTRACT.md`, `types.ts`, Zod schemas) | P1 | Done | `src/__tests__/schemas.test.ts` | 8 standard fields, 6 DocStatuses, strict runtime Zod validation |
| `FEAT-API-01` | Endpoints | Application CRUD & pipeline validation stubs (`/applications`, `/applications/{id}`, `/validate`) | P2/P1 | Done | `tests/test_endpoints.py` | Serves realistic mock data with simulated latency |
| `FEAT-API-02` | Endpoints | Document findings and page rendering endpoints (`/documents/{id}/findings`, `/render`) | P2/P1 | Done | `src/__tests__/units.test.ts` | Continuous react-pdf scroll, 2x PNG renders, exact bboxes |
| `FEAT-API-03` | Endpoints | Scrutiny officer decision recording endpoint (`/findings/{id}/decision`) | P2/P1 | Done | `src/__tests__/units.test.ts` | Modal with 10+ char reason validation, optimistic state |
| `FEAT-API-04` | Endpoints | Rules, Audit, Metrics & Dashboard endpoints (`/rules`, `/audit`, `/metrics`, `/dashboard`) | P2/P1 | Done | `src/__tests__/units.test.ts` | Dynamic rule toggles, threshold steppers, SHA-256 chain verification |
| `FEAT-MOCK-01` | Test Data | Mock data for Application A (6 statuses, 6 findings with computed bboxes) & B (clean) | P1 | Done | `npm run mock:assets` | PyMuPDF computed text bboxes, 14-block SHA-256 hash chain |
| `FEAT-LLM-01` | Intelligence | Centralized LLM client with graceful degradation (`backend/core/llm.py`) | P2 | Done | Unit testable | Implements Rule 10 graceful fallback |
| `FEAT-EXTR-01` | Extraction | PyMuPDF extraction of standard fields | P4 | Planned | - | Assigned to P4 |
| `FEAT-CRSS-01` | Crosscheck | Inter-document consistency matrix UI display | P1 | Done (UI) | `src/__tests__/units.test.ts` | Rows=fields, cols=sources, mismatch highlights & links |
| `FEAT-FORE-01` | Forensics | Font alteration, revision analysis, tamper detection UI | P1 | Done (UI) | `src/__tests__/units.test.ts` | Exact scaled overlays, revision slider, compare side-by-side |
| `FEAT-ISSU-01` | Issuer | QR code & digital signature verification UI | P1 | Done (UI) | `src/__tests__/schemas.test.ts` | Signature block (4 pills, verdict), submitted vs source diff |
| `FEAT-AUDT-01` | Audit | Cryptographic SHA-256 hash-chained audit trail UI | P1 | Done (UI) | `src/__tests__/schemas.test.ts` | Chain rail, copy hash, verify chain banner & corrupt simulation |
| `FEAT-UI-01` | Frontend | Complete VeriAPH frontend (all 7 pages, role switching, dev panel) | P1 | Done | `npm run test`, `build`, `typecheck`, `lint` | 100% offline, self-hosted fonts & pdf.js worker |
