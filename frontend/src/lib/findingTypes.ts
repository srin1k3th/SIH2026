import {
  FileSignature,
  FileEdit,
  Binary,
  Type,
  EyeOff,
  GitCompare,
  CalendarX2,
  Building2,
  FileQuestion,
  Copy,
  ScanLine,
  AlertTriangle,
  LucideIcon,
} from 'lucide-react';

export interface FindingTypeInfo {
  title: string;
  description: string;
  icon: LucideIcon;
}

export const FINDING_TYPE_INFO: Record<string, FindingTypeInfo> = {
  MODIFIED_AFTER_SIGNING: {
    title: 'Modified After Signing',
    description: 'Document content was altered after digital signature was applied.',
    icon: FileSignature,
  },
  TEXT_EDITED_AFTER_CREATION: {
    title: 'Text Alteration Detected',
    description: 'Text or numeric values were modified in a subsequent revision.',
    icon: FileEdit,
  },
  PRODUCER_MISMATCH: {
    title: 'Producer Mismatch',
    description: 'PDF generator software metadata changed between revisions.',
    icon: Binary,
  },
  FONT_INCONSISTENCY: {
    title: 'Font Inconsistency',
    description: 'Discrepant embedded font subset detected in specific text spans.',
    icon: Type,
  },
  HIDDEN_OVERLAY_TEXT: {
    title: 'Hidden Overlay Text',
    description: 'Obscured or layered text detected beneath surface elements.',
    icon: EyeOff,
  },
  CROSSDOC_FIELD_MISMATCH: {
    title: 'Cross-Document Mismatch',
    description: 'Field values conflict between multiple submitted documents.',
    icon: GitCompare,
  },
  DOC_EXPIRED: {
    title: 'Document Expired',
    description: 'Statutory certificate validity expired prior to application submission.',
    icon: CalendarX2,
  },
  ISSUER_MISMATCH: {
    title: 'Issuer Record Discrepancy',
    description: 'Submitted values conflict with live issuing authority records.',
    icon: Building2,
  },
  MISSING_DOCUMENT: {
    title: 'Mandatory Document Missing',
    description: 'Required statutory compliance document was not submitted.',
    icon: FileQuestion,
  },
  DUPLICATE_DOCUMENT: {
    title: 'Duplicate Document',
    description: 'High perceptual similarity detected with an existing document.',
    icon: Copy,
  },
  LOW_OCR_CONFIDENCE: {
    title: 'Low OCR Confidence',
    description: 'Text recognition score falls below required clarity threshold.',
    icon: ScanLine,
  },
  RULE_VIOLATION: {
    title: 'Regulatory Rule Violation',
    description: 'Submission fails specific statutory AICTE norms.',
    icon: AlertTriangle,
  },
};

export function getFindingTypeInfo(type: string): FindingTypeInfo {
  if (type in FINDING_TYPE_INFO) {
    return FINDING_TYPE_INFO[type];
  }
  return {
    title: type.replace(/_/g, ' '),
    description: 'Automated verification check flagged an anomaly.',
    icon: AlertTriangle,
  };
}
