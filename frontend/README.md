# VeriAPH Frontend

AICTE Application Approval Verification & Regulatory Compliance Inspection Portal.

This frontend is designed for AICTE scrutiny officers and applicant institutions to inspect approval applications, audit evidence-linked document forensics, cross-check multi-source records, and enforce APH rules.

## Tech Stack
- **Framework:** React 18, Vite, TypeScript (strict mode)
- **Styling:** Tailwind CSS, Radix UI primitives (`@radix-ui/react-*`), Lucide React icons
- **State & Data:** `@tanstack/react-query`, Zod schema runtime validation
- **PDF & Rendering:** `react-pdf` with offline bundled `pdfjs-dist` worker
- **Visualization:** `recharts` (bar charts), SVG progress rings
- **Typography:** Self-hosted `@fontsource/inter` and `@fontsource/jetbrains-mono` (no CDN dependencies)

---

## Getting Started

### 1. Installation
```bash
cd frontend
npm install
```

### 2. Environment Configuration
Create a `.env` file in `frontend/` (or rely on defaults):
```bash
# Set to "true" to run with the comprehensive offline mock adapter (default: true)
VITE_USE_MOCK=true

# When VITE_USE_MOCK is "false", requests are dispatched to the FastAPI backend:
VITE_API_URL=http://localhost:8000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Launch local Vite dev server with HMR |
| `npm run build` | Typecheck and create production bundle in `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run typecheck` | Run `tsc --noEmit` to verify type safety |
| `npm run lint` | Run ESLint across codebase |
| `npm run test` | Run Vitest unit & contract validation test suites |
| `npm run mock:assets` | Re-generate mock PDFs, 2x PNG page renders, exact computed bboxes, and mock JSON data |

---

## Regenerating Mock Assets & Bounding Boxes
The mock scenario is fully reproducible and mathematically aligned:
1. Python environment requirements: `reportlab`, `PyMuPDF`, `pillow`, `qrcode`.
2. To run both mock generation scripts:
   ```bash
   npm run mock:assets
   ```
   - `scripts/make_mock_assets.py`: Generates PDFs and renders 2x PNGs to `public/mock/render/{doc_id}/{rev}/page{n}.png`. Computes exact text bounding boxes using PyMuPDF `page.search_for()` (expanded by 2pt) into `scripts/computed_bboxes.json`.
   - `scripts/build_mock_data.py`: Assembles all mock application files, sets up realistic mock issuers, and computes a valid SHA-256 hash chain for the audit log.

---

## Interactive Dev Panel
When running in mock mode, append `?dev=1` to the URL (e.g. `http://localhost:5173/?dev=1`) to display the floating engineering dev panel in the bottom-right corner:
- **Reset Mock Data:** Restores all applications, rule toggles, and audit events to factory state.
- **Simulate API Error:** Causes the next API call to reject with a simulated network error.
- **Simulate Slow Network:** Injects a 3-second latency to test skeleton loading states.
- **Corrupt Audit Event #7 / Repair Chain:** Modifies event #7 hash to demonstrate cryptographic broken-chain detection on the `/audit` page.

---

## Persona & Role Switching
The top header includes an interactive role segmented toggle:
- **Officer (Demo Officer):** Full access to Scrutiny Review Queue (`/`), All Applications (`/applications`), Application Detail with risk ring and matrix (`/applications/:id`), Document Review hero page with overlay inspection and decisions (`/documents/:id`), APH Rules Engine (`/rules`), Audit Trail (`/audit`), and Benchmarks (`/eval`).
- **Institution (Kaveri College of Engineering):** Applicant institution view. Access to My Applications (`/applications`), New Submission Stepper (`/applications/new`), and read-mostly Application Detail (`/applications/:id`) with actionable deficiency list and document replacement modal. Internal forensic findings, risk scores, bboxes, and regulatory rules are securely hidden.
