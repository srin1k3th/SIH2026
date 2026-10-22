# How to work with the agent

## Session loop
1. Open your branch. Pull main.
2. Planning mode. Paste the Starter prompt from your brief.
3. READ THE PLAN before approving. Check: edits only your folders; uses contract names and interfaces from AGENTS.md; includes tests (planted and clean); no new dependencies beyond the stack; no invented clause numbers or metrics. Reject and re-prompt if any fails.
4. Let it run. Read the walkthrough artifact, then verify it yourself: run the tests, run the code on a clean doc and a planted doc, open the result in the UI or via curl.
5. Read the code you own. You must be able to explain every file in your folder to an evaluator without saying "the AI wrote it".
6. Try to break it (see "Human verification" in your brief). Record what fails in the walkthrough or docs/DECISIONS.md.
7. Open a PR. Update STUBS.md, FEATURES.md and HANDOFFS.md.

## Prompts you will reuse
Continue: "Continue from where the last task stopped. Read AGENTS.md, your brief, STUBS.md and the existing code first. Do not rewrite finished files. Next unfinished item in the brief's Build list is: <item>."
Review: "Review backend/<folder> against AGENTS.md and my brief. List: hardcoded results, STUBs not in STUBS.md, missing tests (planted and clean), unhandled errors, anything that would crash on an unseen PDF. Do not change code, only report."
Break: "Write 10 adversarial test documents or inputs for <module> that the current tests do not cover (messy formatting, missing fields, rotated scans, re-saved PDFs, empty files). Run them and report which fail."
Explain: "Explain <module> in 5 minutes for a judge: what problem, what technique, why this approach, what it cannot detect. Be honest about limits."

## Common agent failure modes (watch for them)
- Invents field names or endpoint shapes. Fix: point it at docs/FRONTEND_CONTRACT.md.
- Fake-working code: hardcoded outputs, fixed bboxes, results keyed by filename. Run a clean doc and an unseen doc.
- Library API guessed (pyHanko, pyzbar, PaddleOCR). Tell it to read the docs first and show the call it found.
- Edits outside its folder. Reject the plan.
- Confident invented clause numbers or accuracy numbers. Search the output for "clause" and "%" and check each.
- Tests that only assert the code runs. Require assertions on finding type, bbox overlap and zero findings on clean docs.

## Rhythm
Daily 10-minute sync, one question each: what is blocking you? Post blockers in HANDOFFS.md and the group chat. Tag `main` nightly if tests pass.

## Timeline
23 Oct: contract, base.py, schemas, first slices. 24 Oct: all modules v1. 25 Oct: integration and bug fixing, human verification. 26 Oct: real numbers from eval, screenshots, backup demo video. 27 Oct: code freeze, PPT PDF ready, rehearse. 28 Oct: submit.
