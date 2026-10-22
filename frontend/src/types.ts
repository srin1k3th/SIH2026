export type Severity = 'high' | 'medium' | 'low';
export type Confidence = 'high' | 'medium' | 'low';
export type FindingSource = 'forensics' | 'crosscheck' | 'rules' | 'issuer';
export type DocStatus = 'verified' | 'mismatch_detected' | 'expired' | 'verification_pending' | 'source_unavailable' | 'manual_review_required';
export type Role = 'institution' | 'officer';
export type BBox = [number, number, number, number]; // x0,y0,x1,y1 in PDF points, origin TOP-LEFT of the page
// ALL page numbers in the API are 1-based.

export interface Decision { finding_id: string; action: 'accept' | 'override' | 'clarify'; reason: string; officer: string; timestamp: string }
export interface Finding {
  id: string; doc_id: string; source: FindingSource; type: string; severity: Severity;
  page: number; bbox: BBox | null;            // null = document-level finding (no overlay)
  rule_id: string; reason: string;
  evidence: { before?: string; after?: string; revision?: number; note?: string };
  confidence: Confidence; decision?: Decision | null;
}
export interface PageSize { width: number; height: number }   // PDF points
export interface Revision { rev: number; label: string; saved_at: string; producer: string | null; is_current: boolean }
export interface SignatureInfo { present: boolean; intact: boolean; valid: boolean; trusted: boolean; modification_level: 'none' | 'form_filling' | 'annotations' | 'other'; signer: string | null; signed_at: string | null }
export interface VerificationInfo { source: string; reference: string | null; requested_at: string | null; result: DocStatus; message: string; submitted_fields: Record<string, string>; source_fields: Record<string, string> | null }
export interface ExtractedField { name: string; value: string; confidence: Confidence }
export interface Document {
  id: string; application_id: string; doc_type: string; label: string; filename: string; status: DocStatus;
  uploaded_at: string; is_scanned: boolean; page_sizes: PageSize[]; revisions: Revision[];
  signature: SignatureInfo | null; verification: VerificationInfo | null; fields: ExtractedField[]; findings: Finding[];
}
export interface ChecklistRow { doc_type: string; label: string; required: boolean; description: string; document_id: string | null } // null = missing
export interface MatrixCell { value: string | null; normalized: string | null; match: boolean; note?: string; finding_id?: string }
export interface CrosscheckMatrix { fields: { id: string; label: string }[]; sources: { id: string; label: string }[]; cells: Record<string, Record<string, MatrixCell>> } // cells[fieldId][sourceId]
export interface VerificationEntry { id: string; doc_id: string; doc_label: string; source: string; reference: string | null; requested_at: string; status: DocStatus; message: string }
export interface Alert { id: string; application_id: string; doc_id: string | null; kind: 'expiring' | 'expired' | 'pending_verification' | 'anomaly' | 'missing'; message: string; due_date: string | null; severity: Severity }
export interface ApplicationSummary { id: string; institution: string; category_id: string; category_label: string; submitted_at: string; risk_score: number; doc_count: number; status_counts: Partial<Record<DocStatus, number>>; flag_counts: Record<Severity, number>; has_missing: boolean }
export interface ApplicationDetail extends ApplicationSummary { documents: Document[]; checklist: ChecklistRow[]; crosscheck: CrosscheckMatrix; verification_log: VerificationEntry[]; alerts: Alert[] }
export interface Category { id: string; label: string; description: string }
export interface PrecheckIssue { doc_type: string; kind: 'missing' | 'expired' | 'inconsistent' | 'unreadable'; message: string }
export interface PrecheckResult { ok: boolean; issues: PrecheckIssue[] }
export interface Explanation { finding_id: string; status: 'ok' | 'handbook_not_loaded' | 'llm_unavailable'; text: string | null; citations: { clause_ref: string; snippet: string }[] }
export interface Rule { id: string; title: string; description: string; clause_ref: string; severity: Severity; category_ids: string[]; enabled: boolean; threshold: { label: string; value: number; unit: string } | null; last_run_hits: number }
export interface AuditEvent { seq: number; timestamp: string; actor: string; role: Role; action: string; target: string; detail: string; prev_hash: string; hash: string }
export interface AuditVerifyResult { valid: boolean; checked: number; first_broken_seq: number | null }
export interface Metrics { detection_by_type: { type: string; n: number; detected: number }[]; clean_docs: number; false_positives: number; avg_seconds_per_doc: number; n_docs: number; generated_at: string | null; is_sample?: boolean }
export interface DashboardResponse { kpis: { applications: number; flagged: number; pending_verification: number; expiring: number }; queue: ApplicationSummary[]; alerts: Alert[] }
