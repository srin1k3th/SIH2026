import { DocStatus } from '@/types';
import {
  CheckCircle2,
  AlertOctagon,
  CalendarX,
  Clock,
  CloudOff,
  UserCheck,
  LucideIcon,
} from 'lucide-react';

export interface StatusConfig {
  label: string;
  icon: LucideIcon;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

export const STATUS_MAP: Record<DocStatus, StatusConfig> = {
  verified: {
    label: 'Verified',
    icon: CheckCircle2,
    textColor: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
  },
  mismatch_detected: {
    label: 'Mismatch detected',
    icon: AlertOctagon,
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  expired: {
    label: 'Expired',
    icon: CalendarX,
    textColor: 'text-amber-800',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  verification_pending: {
    label: 'Verification pending',
    icon: Clock,
    textColor: 'text-slate-700',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
  },
  source_unavailable: {
    label: 'Source unavailable',
    icon: CloudOff,
    textColor: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  manual_review_required: {
    label: 'Manual review required',
    icon: UserCheck,
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-300',
  },
};

export const DOC_STATUS_PRECEDENCE: DocStatus[] = [
  'mismatch_detected',
  'expired',
  'source_unavailable',
  'verification_pending',
  'manual_review_required',
  'verified',
];

export function resolveDocStatusPrecedence(statuses: DocStatus[]): DocStatus {
  for (const status of DOC_STATUS_PRECEDENCE) {
    if (statuses.includes(status)) {
      return status;
    }
  }
  return 'verified';
}
