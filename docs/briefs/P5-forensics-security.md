# Brief P5: forensics, audit trail, upload security

## Mission
You own the hero feature: proving a PDF was edited, and where. You also own the audit chain and the security of everything uploaded.

## You own
backend/checkers/forensics/, backend/audit/, backend/security/, data/tampered/, data/generate_tampered.py.

## Build list (in order)
1. Revision splitter: split bytes at each %%EOF, open each prefix as its own document (PyMuPDF). Build Revision list (rev, label, saved_at from metadata, producer, is_current).
2. Word-level diff between consecutive revisions with page bboxes (PyMuPDF words). Changed or added words become TEXT_EDITED_AFTER_CREATION findings with evidence {before, after, revision}. Group adjacent words into one bbox per edited phrase.
3. Metadata and structure checks: Producer/Creator change between revisions (PRODUCER_MISMATCH, doc-level, bbox null), ModDate after CreationDate, new fonts appearing in a later revision (FONT_INCONSISTENCY with bbox on the spans), hidden/overlay text (white text, text under images or rectangles) as HIDDEN_OVERLAY_TEXT.
4. Digital signatures with pyHanko (read its docs first, show the calls you found): validate each signature, report intact, valid, trusted, modification level (none / form_filling / annotations / other) into SignatureInfo; MODIFIED_AFTER_SIGNING finding when the modification level is beyond form-filling/annotations or the document changed after the signed revision. Create a demo CA and use it as trust root so valid demo signatures show trusted. Also check shadow-attack style patterns where feasible (hidden/replaced content after signing) and document what you could not cover.
5. render(path, rev, page) -> PNG at 2x of that revision (PyMuPDF get_pixmap), page 1-based.
6. analyze(path) -> ForensicsResult and a DocumentChecker wrapper (register one line in registry.py).
7. data/generate_tampered.py: from the clean docs, produce (a) the lease deed with land area edited via incremental update (new revision, different font and producer), (b) the NOC signed with pyHanko then edited after signing, (c) a fully re-saved edited PDF with no incremental history (document the limitation: forensics should NOT claim to detect it, and must report it as undetected in DECISIONS.md), (d) 10+ random variants for P4's eval. Add the forensic ground truth to data/planted_issues.yaml.
8. audit: SQLite table with seq, timestamp, actor, role, action, target, detail, prev_hash, hash = sha256(prev_hash + canonical JSON of the other fields); genesis prev_hash is 64 zeros. log(), list_events(), verify_chain() returning the first broken seq.
9. security: validate_upload (magic number %PDF, size limit 10 MB, reject encrypted/malformed PDFs with a clear reason, sanitise through qpdf or PyMuPDF), mask_pii (Aadhaar-like and phone numbers, emails, PAN) with tests.

## Acceptance tests
- Each planted tamper triggers the right finding and the bbox overlaps the edited text (assert intersection area). Every clean document yields zero forensic findings.
- Signed-then-edited NOC -> MODIFIED_AFTER_SIGNING; untouched signed doc -> no finding and trusted signature.
- Editing any audit row in the DB makes verify_chain() fail at that seq.
- Upload tests: truncated file, JS-laden PDF, encrypted PDF, 200 MB file, non-PDF with .pdf extension.

## Human verification (you)
- Attack your own detector with tampers the agent did not plan: redaction overlays, metadata scrubbing, copy-pasted signature image, re-saved PDF. Record what is caught and what is not in docs/DECISIONS.md. Put the honest limits on the security slide.
- Verify pyHanko results independently (Adobe Acrobat or another validator) on the demo NOC.

## Starter prompt
"Read AGENTS.md, docs/FRONTEND_CONTRACT.md, docs/briefs/P5-forensics-security.md and docs/DEMO_SCRIPT.md. Implement the Build list in order following the hard rules and the interfaces in AGENTS.md. Read the pyHanko docs before writing signature code. Edit only the folders I own. Tests with planted and clean docs and the bbox-overlap assertion. End with a walkthrough artifact."
