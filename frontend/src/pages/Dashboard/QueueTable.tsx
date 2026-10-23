import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApplicationSummary, DocStatus } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { getRiskBand, RISK_FORMULA_EXPLANATION } from '@/lib/risk';
import { formatRelative, formatDate } from '@/lib/format';
import { STATUS_MAP } from '@/lib/statusMap';
import {
  ChevronRight,
  ChevronLeft,
  Building2,
  Bell,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

interface QueueTableProps {
  applications: ApplicationSummary[];
}

const STATUS_BAR_COLORS: Record<DocStatus, string> = {
  verified: 'bg-emerald-500',
  mismatch_detected: 'bg-red-500',
  expired: 'bg-amber-600',
  verification_pending: 'bg-slate-400',
  source_unavailable: 'bg-purple-500',
  manual_review_required: 'bg-amber-500',
};

export const QueueTable: React.FC<QueueTableProps> = ({ applications }) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.ceil(applications.length / pageSize) || 1;
  const paginatedApps = applications.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getRiskColor = (score: number) => {
    if (score >= 60) return 'bg-red-500';
    if (score >= 30) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg/60 text-muted border-b border-border font-medium">
            <tr>
              <th className="px-5 py-3 w-44">Risk Score</th>
              <th className="px-4 py-3 min-w-[240px]">Application & Institution</th>
              <th className="px-4 py-3 w-32">Submitted</th>
              <th className="px-4 py-3 w-40">Documents</th>
              <th className="px-4 py-3 w-32">Active Flags</th>
              <th className="px-3 py-3 w-20 text-center">Alerts</th>
              <th className="w-10 px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedApps.map((app) => {
              const riskBand = getRiskBand(app.risk_score);
              const totalFlags =
                app.flag_counts.high + app.flag_counts.medium + app.flag_counts.low;

              return (
                <tr
                  key={app.id}
                  onClick={() => navigate(`/applications/${app.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/applications/${app.id}`);
                    }
                  }}
                  tabIndex={0}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors focus:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {/* Risk Score Column */}
                  <td className="px-5 py-3.5">
                    <Tooltip
                      content={
                        <div className="space-y-1 text-xs p-1">
                          <div className="font-semibold">Risk Score: {app.risk_score}/100</div>
                          <div className="font-mono text-[10px] text-slate-300">
                            {RISK_FORMULA_EXPLANATION}
                          </div>
                          <div>Band: {riskBand} Risk</div>
                        </div>
                      }
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-text text-sm">{app.risk_score}</span>
                          <span
                            className={clsx(
                              'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                              app.risk_score >= 60
                                ? 'bg-red-100 text-red-800'
                                : app.risk_score >= 30
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            )}
                          >
                            {riskBand}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={clsx('h-full rounded-full transition-all', getRiskColor(app.risk_score))}
                            style={{ width: `${Math.min(100, Math.max(5, app.risk_score))}%` }}
                          />
                        </div>
                      </div>
                    </Tooltip>
                  </td>

                  {/* Application Info Column */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-text text-sm flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="truncate">{app.institution}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-muted text-[11px]">{app.id}</span>
                      <span className="text-muted">•</span>
                      <span className="text-muted text-[11px] truncate max-w-[160px]">
                        {app.category_label}
                      </span>
                    </div>
                  </td>

                  {/* Submitted Date Column */}
                  <td className="px-4 py-3.5 text-muted">
                    <Tooltip
                      content={
                        <div className="text-xs p-1">
                          Full timestamp: {formatDate(app.submitted_at)}
                        </div>
                      }
                    >
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted shrink-0" />
                        <span>{formatRelative(app.submitted_at)}</span>
                      </div>
                    </Tooltip>
                  </td>

                  {/* Documents Stacked Mini Status Bar Column */}
                  <td className="px-4 py-3.5">
                    <Tooltip
                      content={
                        <div className="text-xs space-y-1 p-1">
                          <div className="font-semibold border-b border-slate-700 pb-1">
                            {app.doc_count} Documents:
                          </div>
                          {Object.entries(app.status_counts || {}).map(([st, cnt]) => (
                            <div key={st} className="flex justify-between gap-4">
                              <span>{STATUS_MAP[st as DocStatus]?.label || st}:</span>
                              <span className="font-mono font-bold">{cnt}</span>
                            </div>
                          ))}
                        </div>
                      }
                    >
                      <div className="space-y-1">
                        <div className="text-xs text-muted flex justify-between font-mono">
                          <span>{app.doc_count} docs</span>
                          {app.has_missing && (
                            <span className="text-amber-600 font-semibold text-[10px]">Missing</span>
                          )}
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full flex overflow-hidden">
                          {Object.entries(app.status_counts || {}).map(([st, cnt]) => {
                            if (!cnt || app.doc_count === 0) return null;
                            const pct = (cnt / app.doc_count) * 100;
                            return (
                              <div
                                key={st}
                                style={{ width: `${pct}%` }}
                                className={STATUS_BAR_COLORS[st as DocStatus] || 'bg-slate-300'}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </Tooltip>
                  </td>

                  {/* Flags (H/M/L) Column */}
                  <td className="px-4 py-3.5">
                    {totalFlags === 0 ? (
                      <span className="text-emerald-700 font-medium">0 flags</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {app.flag_counts.high > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                            {app.flag_counts.high}H
                          </span>
                        )}
                        {app.flag_counts.medium > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            {app.flag_counts.medium}M
                          </span>
                        )}
                        {app.flag_counts.low > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                            {app.flag_counts.low}L
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Alerts Count Column */}
                  <td className="px-3 py-3.5 text-center">
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-text">
                      <Bell className="w-3 h-3 text-muted" />
                      {app.flag_counts.high > 0 ? 1 : 0}
                    </span>
                  </td>

                  {/* Action Chevron */}
                  <td className="px-3 py-3.5 text-right text-muted">
                    <ChevronRight className="w-4 h-4 inline" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-5 py-3 border-t border-border flex items-center justify-between bg-bg/50 text-xs text-muted">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, applications.length)} of {applications.length} applications
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-border bg-surface hover:bg-bg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-medium text-text">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-border bg-surface hover:bg-bg disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
