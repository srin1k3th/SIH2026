import React, { useState } from 'react';
import type { ApplicationDetail } from '@/types';
import { StatusChip } from '@/components/StatusChip';
import {
  ChevronDown,
  ChevronRight,
  Database,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
} from 'lucide-react';

interface VerificationLogTabProps {
  application: ApplicationDetail;
}

export const VerificationLogTab: React.FC<VerificationLogTabProps> = ({ application }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-text text-sm md:text-base">
            External Issuer Verification Log
          </h3>
          <p className="text-xs text-muted">
            Direct registry and issuing authority verification records for uploaded statutory certificates.
          </p>
        </div>
        <span className="text-xs font-mono text-muted bg-bg px-2.5 py-1 rounded-md border border-border">
          {application.verification_log.length} entries
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-bg/60 text-muted border-b border-border font-medium">
            <tr>
              <th className="w-8 px-3 py-3"></th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Verification Source</th>
              <th className="px-4 py-3">Reference / Token</th>
              <th className="px-4 py-3">Requested At</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-5 py-3">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {application.verification_log.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const doc = application.documents.find((d) => d.id === entry.doc_id);
              const verification = doc?.verification;

              return (
                <React.Fragment key={entry.id}>
                  <tr
                    onClick={() => toggleRow(entry.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-3.5 text-center text-muted">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 inline text-accent" />
                      ) : (
                        <ChevronRight className="w-4 h-4 inline" />
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-text flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-muted" />
                        <span>{entry.doc_label}</span>
                      </div>
                      <div className="text-[10px] text-muted font-mono">{entry.doc_id}</div>
                    </td>

                    <td className="px-4 py-3.5 text-text font-medium flex items-center gap-1.5 mt-2">
                      <Database className="w-3.5 h-3.5 text-accent" />
                      <span>{entry.source}</span>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-muted">
                      {entry.reference || '—'}
                    </td>

                    <td className="px-4 py-3.5 text-muted font-mono">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{entry.requested_at}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <StatusChip status={entry.status} size="sm" />
                    </td>

                    <td className="px-5 py-3.5 text-muted max-w-xs truncate" title={entry.message}>
                      {entry.message}
                    </td>
                  </tr>

                  {/* Expanded Submitted vs Confirmed comparison */}
                  {isExpanded && (
                    <tr className="bg-slate-50/50">
                      <td colSpan={7} className="px-8 py-4 border-b border-border">
                        <div className="max-w-3xl bg-surface rounded-lg border border-border p-4 shadow-xs">
                          <h4 className="text-xs font-semibold text-text mb-2.5 flex items-center gap-2">
                            <span>Submitted Fields vs Confirmed Registry Record</span>
                            <span className="text-[10px] text-muted font-normal">
                              ({entry.doc_label})
                            </span>
                          </h4>

                          {verification?.submitted_fields ? (
                            <div className="border border-border rounded-md overflow-hidden text-xs">
                              <div className="grid grid-cols-2 bg-bg px-3 py-2 font-semibold text-muted border-b border-border">
                                <span>Submitted by Institution</span>
                                <span>Confirmed by Source Registry</span>
                              </div>
                              <div className="divide-y divide-border">
                                {Object.entries(verification.submitted_fields).map(
                                  ([key, subVal]) => {
                                    const srcVal = verification.source_fields
                                      ? verification.source_fields[key]
                                      : null;
                                    const isMismatch =
                                      verification.source_fields !== null && srcVal !== subVal;

                                    return (
                                      <div
                                        key={key}
                                        className={`grid grid-cols-2 px-3 py-2 ${
                                          isMismatch ? 'bg-red-500/10' : ''
                                        }`}
                                      >
                                        <div>
                                          <div className="text-[10px] text-muted uppercase font-mono">
                                            {key.replace(/_/g, ' ')}
                                          </div>
                                          <div className="font-medium text-text">{subVal}</div>
                                        </div>
                                        <div>
                                          <div className="text-[10px] text-muted uppercase font-mono">
                                            &nbsp;
                                          </div>
                                          {verification.source_fields === null ? (
                                            <span className="italic text-muted">Not confirmed</span>
                                          ) : isMismatch ? (
                                            <span className="font-semibold text-red-700 flex items-center gap-1">
                                              {srcVal ?? 'Missing in authority database'}
                                              <XCircle className="w-3.5 h-3.5 inline text-red-600" />
                                            </span>
                                          ) : (
                                            <span className="text-text flex items-center gap-1">
                                              {srcVal}
                                              <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600" />
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted italic">
                              No structured field comparison available for this document entry.
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
