import React from 'react';
import { Link } from 'react-router-dom';
import type { CrosscheckMatrix, ApplicationDetail } from '@/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { AlertOctagon, CheckCircle2, Info, ExternalLink } from 'lucide-react';

interface CrosscheckTabProps {
  matrix: CrosscheckMatrix;
  application: ApplicationDetail;
}

export const CrosscheckTab: React.FC<CrosscheckTabProps> = ({ matrix, application }) => {
  const { fields, sources, cells } = matrix;

  // Resolve document ID for linking: if source id matches a doc id, or find doc where id === sourceId
  const getDocIdForSource = (sourceId: string): string => {
    const doc = application.documents.find((d) => d.id === sourceId);
    if (doc) return doc.id;
    // Default to first document or sourceId
    return application.documents[0]?.id || sourceId;
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text text-sm md:text-base">
              Cross-Document Consistency Matrix
            </h3>
            <p className="text-xs text-muted">
              Automatic field reconciliation across submitted application data, leases, NOCs, and registration deeds.
            </p>
          </div>
          <span className="text-xs text-muted">
            {fields.length} reconciled fields across {sources.length} sources
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/60 text-muted border-b border-border font-medium">
              <tr>
                <th className="px-4 py-3 w-40">Field</th>
                <th className="px-3 py-3 w-28 text-center">Consistency</th>
                {sources.map((src) => (
                  <th key={src.id} className="px-4 py-3 min-w-[180px]">
                    <div className="font-semibold text-text">{src.label}</div>
                    <div className="text-[10px] font-mono text-muted">{src.id}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fields.map((field) => {
                const fieldCells = cells[field.id] || {};

                // Determine row consistency: false if any source has match=false
                const hasMismatch = sources.some((src) => fieldCells[src.id]?.match === false);

                return (
                  <tr key={field.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Field Name */}
                    <td className="px-4 py-3.5 font-semibold text-text">
                      <div>{field.label}</div>
                      <div className="text-[10px] font-mono text-muted">{field.id}</div>
                    </td>

                    {/* Consistency Badge */}
                    <td className="px-3 py-3.5 text-center">
                      {hasMismatch ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800 border border-red-200">
                          <AlertOctagon className="w-3 h-3 text-red-600" />
                          Mismatch
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Consistent
                        </span>
                      )}
                    </td>

                    {/* Source Values */}
                    {sources.map((src) => {
                      const cell = fieldCells[src.id];
                      if (!cell || cell.value === null) {
                        return (
                          <td key={src.id} className="px-4 py-3.5 text-muted font-mono">
                            —
                          </td>
                        );
                      }

                      const showNormalized =
                        cell.normalized &&
                        cell.normalized.toLowerCase() !== cell.value.toLowerCase();
                      const docId = getDocIdForSource(src.id);

                      return (
                        <td
                          key={src.id}
                          className={`px-4 py-3.5 transition-colors ${
                            !cell.match
                              ? 'bg-red-500/10 border-l border-r border-red-300'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="min-w-0">
                              <div
                                className={`font-medium text-xs truncate ${
                                  !cell.match ? 'text-red-900 font-bold' : 'text-text'
                                }`}
                              >
                                {cell.value}
                              </div>
                              {showNormalized && (
                                <div className="text-[10px] text-muted font-mono mt-0.5">
                                  Norm: {cell.normalized}
                                </div>
                              )}
                            </div>

                            {/* Note / Mismatch / Link Indicators */}
                            <div className="flex items-center gap-1 shrink-0">
                              {cell.note && (
                                <Tooltip content={<div className="max-w-xs text-xs p-1">{cell.note}</div>}>
                                  <button
                                    type="button"
                                    className="p-0.5 rounded text-muted hover:text-text focus:outline-none"
                                  >
                                    {cell.match ? (
                                      <Info className="w-3.5 h-3.5 text-blue-500" />
                                    ) : (
                                      <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
                                    )}
                                  </button>
                                </Tooltip>
                              )}

                              {cell.finding_id && (
                                <Link
                                  to={`/documents/${docId}?finding=${cell.finding_id}`}
                                  className="p-1 rounded text-red-700 hover:text-red-900 hover:bg-red-100 transition-colors"
                                  title="View evidence finding overlay in Document Review"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
  );
};
