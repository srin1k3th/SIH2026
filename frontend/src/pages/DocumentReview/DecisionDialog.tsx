import React, { useState } from 'react';
import { Finding } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { SeverityBadge } from '@/components/ui/Badge';
import { getFindingTypeInfo } from '@/lib/findingTypes';
import { CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';
import clsx from 'clsx';

export interface DecisionDialogProps {
  finding: Finding | null;
  initialAction?: 'accept' | 'override' | 'clarify';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (findingId: string, action: 'accept' | 'override' | 'clarify', reason: string) => Promise<void>;
}

export function DecisionDialog({
  finding,
  initialAction = 'accept',
  open,
  onOpenChange,
  onSubmit,
}: DecisionDialogProps) {
  const [action, setAction] = useState<'accept' | 'override' | 'clarify'>(initialAction);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open && finding) {
      setAction(initialAction);
      setReason(finding.decision?.reason || '');
      setError(null);
    }
  }, [open, finding, initialAction]);

  if (!finding) return null;

  const typeInfo = getFindingTypeInfo(finding.type);
  const minChars = 10;
  const isReasonValid = reason.trim().length >= minChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReasonValid) {
      setError(`Officer justification must be at least ${minChars} characters.`);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(finding.id, action, reason.trim());
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to record officer decision.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record Scrutiny Decision</DialogTitle>
            <DialogDescription>
              Authoritative decision on verification finding #{finding.id}.
            </DialogDescription>
          </DialogHeader>

          {/* Finding Summary Preview */}
          <div className="p-3.5 rounded-input bg-slate-50 border border-border mb-4 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-primary">{typeInfo.title}</span>
              <SeverityBadge severity={finding.severity} />
            </div>
            <p className="text-primary-muted line-clamp-2">{finding.reason}</p>
            <div className="text-[11px] font-mono text-primary-muted">
              Rule: {finding.rule_id} | Page {finding.page}
            </div>
          </div>

          {/* Action Choice Segmented Control */}
          <div className="space-y-1.5 mb-4">
            <label className="text-xs font-semibold text-primary">Decision Action</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAction('accept')}
                className={clsx(
                  'flex flex-col items-center justify-center p-2.5 rounded-input border text-xs font-medium transition-all select-none',
                  action === 'accept'
                    ? 'border-red-600 bg-red-50 text-red-900 font-semibold ring-1 ring-red-600'
                    : 'border-border bg-white text-primary hover:bg-slate-50'
                )}
              >
                <AlertOctagon className="w-4 h-4 mb-1 text-red-600" />
                <span>Accept finding</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('override')}
                className={clsx(
                  'flex flex-col items-center justify-center p-2.5 rounded-input border text-xs font-medium transition-all select-none',
                  action === 'override'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-600'
                    : 'border-border bg-white text-primary hover:bg-slate-50'
                )}
              >
                <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-600" />
                <span>Override flag</span>
              </button>

              <button
                type="button"
                onClick={() => setAction('clarify')}
                className={clsx(
                  'flex flex-col items-center justify-center p-2.5 rounded-input border text-xs font-medium transition-all select-none',
                  action === 'clarify'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 font-semibold ring-1 ring-amber-600'
                    : 'border-border bg-white text-primary hover:bg-slate-50'
                )}
              >
                <HelpCircle className="w-4 h-4 mb-1 text-amber-600" />
                <span>Ask clarify</span>
              </button>
            </div>
          </div>

          {/* Officer Justification Reason */}
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center justify-between">
              <label htmlFor="decision-reason" className="text-xs font-semibold text-primary">
                Officer Justification Reason <span className="text-red-600">*</span>
              </label>
              <span
                className={clsx(
                  'text-[11px] font-mono',
                  reason.length >= minChars ? 'text-emerald-600 font-medium' : 'text-slate-400'
                )}
              >
                {reason.length}/{minChars} min chars
              </span>
            </div>
            <textarea
              id="decision-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the official rationale, supporting document references, or physical inspection notes..."
              className="w-full text-xs p-2.5 rounded-input border border-border focus:outline-none focus:ring-2 focus:ring-accent/40 placeholder:text-slate-400 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!isReasonValid || submitting}
            >
              Confirm Decision
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
