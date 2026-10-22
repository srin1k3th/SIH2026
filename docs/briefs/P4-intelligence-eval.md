# Brief P4: extraction, OCR, classification, duplicates, evaluation

## Mission
You turn PDFs and scans into structured fields, and you produce the only numbers the team is allowed to claim (the eval harness).

## You own
backend/intelligence/extract/, backend/eval/.

## Build list (in order)
1. extract: PyMuPDF text with word boxes. classify(path) -> (doc_type, confidence) using keyword/layout rules first (doc types: lease_deed, noc, fire_safety, accreditation, registration, building_plan, affidavit). is_scanned(path) (no text layer / image-only).
2. extract(path, doc_type) -> list[ExtractedField] with confidence. Regex and layout rules first for: trust_name, survey_no, land_area, lease_start, lease_end, cert_valid_from, cert_valid_to, signatories. LLM fallback ONLY for low-confidence fields via backend/core/llm.py with strict JSON schema, temperature 0, after backend.security.mask_pii. Without an LLM key it must still work (regex only).
3. OCR for scanned documents with PaddleOCR (read its docs; fall back to Tesseract if install fails). Low OCR confidence -> field confidence low and the document is flagged LOW_OCR_CONFIDENCE (rule OCR-CONF-01, threshold from rules). Never silently guess.
4. near_duplicates(doc, corpus): text simhash plus image perceptual hash; DUPLICATE_DOCUMENT finding when above threshold. Document the threshold.
5. eval: backend/eval/run_eval.py runs the real pipeline (via backend.core orchestrator functions) over every document in data/ and compares with data/planted_issues.yaml. Report: detection_by_type [{type, n, detected}], clean_docs, false_positives, avg_seconds_per_doc, n_docs, generated_at. Generate ~40 synthetic variants with ground truth by calling P5's generator and P3's clean generator (different values, fonts, producers). Write results to backend/eval/results.json and expose via run_eval(). is_sample must be false and values must come from a run.
6. Error analysis: backend/eval/ERRORS.md listing each miss and false positive with a one-line reason.

## Acceptance tests
- Extraction on the 6 clean Application A docs returns the exact planted values with confidence high.
- Messy inputs: extra whitespace, "Sy.No 214/3B", rotated scan, missing field -> no crash, confidence low, field absent rather than invented.
- Eval on clean docs: false positives reported honestly even if non-zero.

## Human verification (you)
- Run the eval yourself and check the numbers against ERRORS.md. Give the team the real figures for the deck. Nothing in the deck may be a number you did not measure.
- Feed 10 documents the agent never saw. Record what breaks in docs/DECISIONS.md.

## Starter prompt
"Read AGENTS.md, docs/FRONTEND_CONTRACT.md, docs/briefs/P4-intelligence-eval.md and docs/DEMO_SCRIPT.md. Implement the Build list in order following the hard rules and the interfaces in AGENTS.md. Edit only the folders I own. Tests with messy inputs. Never print metrics that were not computed by a run. End with a walkthrough artifact."
