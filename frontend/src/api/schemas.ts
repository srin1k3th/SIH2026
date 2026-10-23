import { z } from 'zod';

export const SeveritySchema = z.enum(['high', 'medium', 'low']);
export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);
export const FindingSourceSchema = z.enum(['forensics', 'crosscheck', 'rules', 'issuer']);
export const DocStatusSchema = z.enum([
  'verified',
  'mismatch_detected',
  'expired',
  'verification_pending',
  'source_unavailable',
  'manual_review_required',
]);
export const RoleSchema = z.enum(['institution', 'officer']);

export const BBoxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

export const DecisionSchema = z.object({
  finding_id: z.string(),
  action: z.enum(['accept', 'override', 'clarify']),
  reason: z.string(),
  officer: z.string(),
  timestamp: z.string(),
});

export const FindingSchema = z.object({
  id: z.string(),
  doc_id: z.string(),
  source: FindingSourceSchema,
  type: z.string(),
  severity: SeveritySchema,
  page: z.number(),
  bbox: BBoxSchema.nullable(),
  rule_id: z.string(),
  reason: z.string(),
  evidence: z.object({
    before: z.string().optional(),
    after: z.string().optional(),
    revision: z.number().optional(),
    note: z.string().optional(),
  }),
  confidence: ConfidenceSchema,
  decision: DecisionSchema.nullable().optional(),
});

export const PageSizeSchema = z.object({
  width: z.number(),
  height: z.number(),
});

export const RevisionSchema = z.object({
  rev: z.number(),
  label: z.string(),
  saved_at: z.string(),
  producer: z.string().nullable(),
  is_current: z.boolean(),
});

export const SignatureInfoSchema = z.object({
  present: z.boolean(),
  intact: z.boolean(),
  valid: z.boolean(),
  trusted: z.boolean(),
  modification_level: z.enum(['none', 'form_filling', 'annotations', 'other']),
  signer: z.string().nullable(),
  signed_at: z.string().nullable(),
});

export const VerificationInfoSchema = z.object({
  source: z.string(),
  reference: z.string().nullable(),
  requested_at: z.string().nullable(),
  result: DocStatusSchema,
  message: z.string(),
  submitted_fields: z.record(z.string()),
  source_fields: z.record(z.string()).nullable(),
});

export const ExtractedFieldSchema = z.object({
  name: z.string(),
  value: z.string(),
  confidence: ConfidenceSchema,
});

export const DocumentSchema = z.object({
  id: z.string(),
  application_id: z.string(),
  doc_type: z.string(),
  label: z.string(),
  filename: z.string(),
  status: DocStatusSchema,
  uploaded_at: z.string(),
  is_scanned: z.boolean(),
  page_sizes: z.array(PageSizeSchema),
  revisions: z.array(RevisionSchema),
  signature: SignatureInfoSchema.nullable(),
  verification: VerificationInfoSchema.nullable(),
  fields: z.array(ExtractedFieldSchema),
  findings: z.array(FindingSchema),
});

export const ChecklistRowSchema = z.object({
  doc_type: z.string(),
  label: z.string(),
  required: z.boolean(),
  description: z.string(),
  document_id: z.string().nullable(),
});

export const MatrixCellSchema = z.object({
  value: z.string().nullable(),
  normalized: z.string().nullable(),
  match: z.boolean(),
  note: z.string().optional(),
  finding_id: z.string().optional(),
});

export const CrosscheckMatrixSchema = z.object({
  fields: z.array(z.object({ id: z.string(), label: z.string() })),
  sources: z.array(z.object({ id: z.string(), label: z.string() })),
  cells: z.record(z.record(MatrixCellSchema)),
});

export const VerificationEntrySchema = z.object({
  id: z.string(),
  doc_id: z.string(),
  doc_label: z.string(),
  source: z.string(),
  reference: z.string().nullable(),
  requested_at: z.string(),
  status: DocStatusSchema,
  message: z.string(),
});

export const AlertSchema = z.object({
  id: z.string(),
  application_id: z.string(),
  doc_id: z.string().nullable(),
  kind: z.enum(['expiring', 'expired', 'pending_verification', 'anomaly', 'missing']),
  message: z.string(),
  due_date: z.string().nullable(),
  severity: SeveritySchema,
});

export const ApplicationSummarySchema = z.object({
  id: z.string(),
  institution: z.string(),
  category_id: z.string(),
  category_label: z.string(),
  submitted_at: z.string(),
  risk_score: z.number(),
  doc_count: z.number(),
  status_counts: z.record(DocStatusSchema, z.number()),
  flag_counts: z.object({
    high: z.number(),
    medium: z.number(),
    low: z.number(),
  }),
  has_missing: z.boolean(),
});

export const ApplicationDetailSchema = ApplicationSummarySchema.extend({
  documents: z.array(DocumentSchema),
  checklist: z.array(ChecklistRowSchema),
  crosscheck: CrosscheckMatrixSchema,
  verification_log: z.array(VerificationEntrySchema),
  alerts: z.array(AlertSchema),
});

export const CategorySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
});

export const PrecheckIssueSchema = z.object({
  doc_type: z.string(),
  kind: z.enum(['missing', 'expired', 'inconsistent', 'unreadable']),
  message: z.string(),
});

export const PrecheckResultSchema = z.object({
  ok: z.boolean(),
  issues: z.array(PrecheckIssueSchema),
});

export const ExplanationSchema = z.object({
  finding_id: z.string(),
  status: z.enum(['ok', 'handbook_not_loaded', 'llm_unavailable']),
  text: z.string().nullable(),
  citations: z.array(
    z.object({
      clause_ref: z.string(),
      snippet: z.string(),
    })
  ),
});

export const RuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  clause_ref: z.string(),
  severity: SeveritySchema,
  category_ids: z.array(z.string()),
  enabled: z.boolean(),
  threshold: z
    .object({
      label: z.string(),
      value: z.number(),
      unit: z.string(),
    })
    .nullable(),
  last_run_hits: z.number(),
});

export const AuditEventSchema = z.object({
  seq: z.number(),
  timestamp: z.string(),
  actor: z.string(),
  role: RoleSchema,
  action: z.string(),
  target: z.string(),
  detail: z.string(),
  prev_hash: z.string(),
  hash: z.string(),
});

export const AuditVerifyResultSchema = z.object({
  valid: z.boolean(),
  checked: z.number(),
  first_broken_seq: z.number().nullable(),
});

export const MetricsSchema = z.object({
  detection_by_type: z.array(
    z.object({
      type: z.string(),
      n: z.number(),
      detected: z.number(),
    })
  ),
  clean_docs: z.number(),
  false_positives: z.number(),
  avg_seconds_per_doc: z.number(),
  n_docs: z.number(),
  generated_at: z.string().nullable(),
  is_sample: z.boolean().optional(),
});

export const DashboardResponseSchema = z.object({
  kpis: z.object({
    applications: z.number(),
    flagged: z.number(),
    pending_verification: z.number(),
    expiring: z.number(),
  }),
  queue: z.array(ApplicationSummarySchema),
  alerts: z.array(AlertSchema),
});
