# FEATURES.md - VeriAPH Feature Matrix & Implementation Status

| Feature ID | Category | Description | Owner | Status | Tests | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `FEAT-SKEL-01` | Architecture | Repository skeleton, folder layout, package init files | P2 | Done | `tests/test_endpoints.py` | Initial repo setup |
| `FEAT-SKEL-02` | Contract | Shared schema definitions (`backend/schemas.py`, `frontend/src/types.ts`) | P2 | Done | `tests/test_endpoints.py` | 8 standard fields, 6 DocStatuses |
| `FEAT-API-01` | Endpoints | Application CRUD & pipeline validation stubs (`/applications`, `/applications/{id}`, `/validate`) | P2 | Done | `tests/test_endpoints.py` | Serves realistic mock data |
| `FEAT-API-02` | Endpoints | Document findings and page rendering endpoints (`/documents/{id}/findings`, `/render`) | P2 | Done | `tests/test_endpoints.py` | Supports SVG visual render & JSON |
| `FEAT-API-03` | Endpoints | Scrutiny officer decision recording endpoint (`/findings/{id}/decision`) | P2 | Done | `tests/test_endpoints.py` | Persists accept, override, clarify |
| `FEAT-API-04` | Endpoints | Rules, Audit, Metrics & Dashboard endpoints (`/rules`, `/audit`, `/metrics`, `/dashboard`) | P2 | Done | `tests/test_endpoints.py` | Regulatory rule updates & hash chain |
| `FEAT-MOCK-01` | Test Data | Mock data for Application A (6 statuses, 6 findings with bboxes) & Application B (clean) | P2 | Done | `tests/test_endpoints.py` | Covers all 6 DocStatus values |
| `FEAT-LLM-01` | Intelligence | Centralized LLM client with graceful degradation (`backend/core/llm.py`) | P2 | Done | Unit testable | Implements Rule 10 graceful fallback |
| `FEAT-EXTR-01` | Extraction | PyMuPDF extraction of standard fields | P4 | Planned | - | Assigned to P4 |
| `FEAT-CRSS-01` | Crosscheck | Inter-document consistency crosschecking | P1 | Planned | - | Assigned to P1 |
| `FEAT-FORE-01` | Forensics | Font alteration, revision analysis, tamper detection | P5 | Planned | - | Assigned to P5 |
| `FEAT-ISSU-01` | Issuer | QR code & digital signature verification | P3 | Planned | - | Assigned to P3 |
| `FEAT-AUDT-01` | Audit | Cryptographic SHA-256 hash-chained audit trail | P5 | Planned | - | Assigned to P5 |
| `FEAT-UI-01` | Frontend | React + Vite + Tailwind document review interface | Team | Planned | - | Frontend shell |
