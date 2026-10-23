import React from 'react';
import { Link } from 'react-router-dom';
import type { Alert, Severity } from '@/types';
import { SeverityBadge } from '@/components/ui/Badge';
import {
  CalendarX,
  Clock,
  FileQuestion,
  ShieldAlert,
  Bell,
  ExternalLink,
} from 'lucide-react';

interface AlertsPanelProps {
  alerts: Alert[];
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts }) => {
  const getKindIcon = (kind: Alert['kind']) => {
    switch (kind) {
      case 'expired':
        return <CalendarX className="w-3.5 h-3.5 text-red-600" />;
      case 'expiring':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'pending_verification':
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
      case 'missing':
        return <FileQuestion className="w-3.5 h-3.5 text-amber-600" />;
      case 'anomaly':
      default:
        return <ShieldAlert className="w-3.5 h-3.5 text-red-600" />;
    }
  };

  // Sort by severity (high > medium > low) then due date
  const sortedAlerts = [...alerts].sort((a, b) => {
    const sevOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 };
    if (sevOrder[a.severity] !== sevOrder[b.severity]) {
      return sevOrder[a.severity] - sevOrder[b.severity];
    }
    if (a.due_date && b.due_date) {
      return a.due_date.localeCompare(b.due_date);
    }
    return 0;
  });

  return (
    <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden flex flex-col">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-text text-sm">Regulatory Alerts</h3>
        </div>
        <span className="text-xs font-mono text-muted bg-bg px-2 py-0.5 rounded border border-border">
          {alerts.length} active
        </span>
      </div>

      <div className="divide-y divide-border overflow-y-auto max-h-[640px]">
        {sortedAlerts.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted">
            No active compliance alerts.
          </div>
        ) : (
          sortedAlerts.map((alert) => (
            <div key={alert.id} className="p-3.5 hover:bg-slate-50 transition-colors space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="p-1 rounded bg-bg border border-border mt-0.5 shrink-0">
                    {getKindIcon(alert.kind)}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-text leading-snug">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <SeverityBadge severity={alert.severity} />
                      {alert.due_date && (
                        <span className="text-[10px] text-muted font-mono">
                          Due: {alert.due_date}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  {alert.doc_id ? (
                    <Link
                      to={`/documents/${alert.doc_id}`}
                      className="p-1 text-muted hover:text-accent rounded hover:bg-bg transition-colors"
                      title="Inspect document"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/applications/${alert.application_id}`}
                      className="p-1 text-muted hover:text-accent rounded hover:bg-bg transition-colors"
                      title="Inspect application"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
