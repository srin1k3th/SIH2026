# Brief P1: UI, crosscheck, risk, explain, report, deck

## Mission
You own everything an officer sees, plus the logic behind the consistency matrix, the risk score, the explainer and the report export.

## You own
frontend/, docs/FRONTEND_CONTRACT.md, backend/intelligence/{crosscheck,risk,explain,report}/.

## Build list (in order)
1. Frontend Task A (already specified separately): all 7 pages on mock data. Output: types.ts, docs/FRONTEND_CONTRACT.md, mock data. P2 needs these first.
2. crosscheck(app) -> (CrosscheckMatrix, findings). Normalise area units (acres, hectares, sq ft, sq m) to sq m; fuzzy-match trust names (rapidfuzz, documented threshold, e.g. 0.90); normalise survey numbers (strip punctuation/spacing); date logic (lease dates vs certificate validity). Majority-value logic for which cells mismatch. Findings use source "crosscheck", rule_id like XDOC-AREA-01, bbox from the document's word boxes when available, else null.
3. risk: score(findings) with weights.yaml (default min(100, 15H+7M+2L)); build_alerts(app) (expired, expiring within 60 days of AS_OF date, pending verification, missing required doc, anomaly); build_dashboard(apps).
4. explain(finding, doc): load handbook PDF from data/handbook/ if present, chunk, embed (sentence-transformers) and index (FAISS); retrieve clauses; LLM (through backend/core/llm.py) writes an explanation citing retrieved clauses only. If no handbook: status handbook_not_loaded. If no LLM: llm_unavailable. It must never output a status or change a finding. Mask PII via backend/security.mask_pii before the LLM call.
5. build_report(app) -> PDF (reportlab): header, summary, checklist, statuses, findings with decisions, disclaimer.
6. Switch the frontend to the real API and fix wiring bugs (Task D).
7. Deck: assemble the 6-slide PPT in the SIH template. Collect one section from each teammate by 26 Oct.

## Acceptance tests
- Messy variants: "4.2 acres" / "4.20 ac" / "17,000 sq m" normalise correctly; "Sri Ram Trust" vs "Shri Ram Educational Trust" behaviour is tested and documented.
- Application B crosscheck returns ZERO findings; Application A returns the land-area mismatch only.
- explain never returns clause text that is not in the retrieved chunks.

## Human verification (you)
- Document Review at 150% zoom: overlays sit exactly on the text. Resize the window.
- Put the real APH PDF in data/handbook/ and spot-check 5 explanations against the PDF.
- Read crosscheck line by line. Try inputs the agent never saw.

## Starter prompt
"Read AGENTS.md, docs/FRONTEND_CONTRACT.md, docs/briefs/P1-ui-intelligence.md and docs/DEMO_SCRIPT.md. Implement the Build list items 2 to 5 in order, following the hard rules and the interfaces in AGENTS.md. Edit only the folders I own. Write tests including messy inputs and the clean Application B. End with a walkthrough artifact."
