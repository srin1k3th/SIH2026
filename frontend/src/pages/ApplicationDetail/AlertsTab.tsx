import React from 'react';
import { Link } from 'react-router-dom';
import type { Alert } from '@/types';
import { SeverityBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/Feedback';
import {
  Clock,
  CalendarX,
  FileQuestion,
  ExternalLink,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

interface AlertsTabProps {
  alerts: Alert[];
}

export const AlertsTab: React.FC<AlertsTabProps> = ({ alerts }) => {
  const getKindIcon = (kind: Alert['kind']) => {
    switch (kind) {
      case 'expired':
        return <CalendarX className="w-4 h-4 text-red-600" />;
      case 'expiring':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'pending_verification':
        return <Clock className="w-4 h-4 text-slate-500" />;
      case 'missing':
        return <FileQuestion className="w-4 h-4 text-amber-600" />;
      case 'anomaly':
      default:
        return <ShieldAlert className="w-4 h-4 text-red-600" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-8 h-8 text-emerald-500" />}
        title="No Active Alerts"
        description="All automated regulatory verification and expiration checks are currently in good standing."
      />
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-surface rounded-xl border border-border p-4 flex items-start justify-between gap-4 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-bg border border-border shrink-0 mt-0.5">
              {getKindIcon(alert.kind)}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-text">{alert.message}</span>
                <SeverityBadge severity={alert.severity} />
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-bg text-muted border border-border">
                  {alert.kind.replace('_', ' ')}
                </span>
              </div>

              {alert.due_date && (
                <div className="text-xs text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Due / Expiration: </span>
                  <span className="font-mono font-medium text-text">{alert.due_date}</span>
                </div>
              )}
            </div>
          </div>

          {alert.doc_id && (
            <Link
              to={`/documents/${alert.doc_id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border text-text hover:bg-bg hover:border-accent transition-colors shrink-0 shadow-xs"
            >
              <span>View Document</span>
              <ExternalLink className="w-3 h-3 text-muted" />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
};
