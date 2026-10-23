import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ApplicationDetail, Document as DocType } from '@/types';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/Button';
import { ReplaceDocModal } from './ReplaceDocModal';
import {
  FileText,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';

interface DocumentsTabProps {
  application: ApplicationDetail;
  isOfficer: boolean;
  onReplaceDocument: (docId: string, newFilename: string) => Promise<void>;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  application,
  isOfficer,
  onReplaceDocument,
}) => {
  const [replaceModal, setReplaceModal] = useState<{
    open: boolean;
    docId: string;
    docLabel: string;
    filename?: string;
  }>({
    open: false,
    docId: '',
    docLabel: '',
  });

  const docsMap = new Map<string, DocType>();
  application.documents.forEach((d) => docsMap.set(d.id, d));

  // Determine deficiencies for institution mode
  const deficiencies: {
    type: string;
    title: string;
    description: string;
    docId?: string;
    docLabel?: string;
    canReplace: boolean;
  }[] = [];

  application.checklist.forEach((item) => {
    if (!item.document_id) {
      deficiencies.push({
        type: 'missing',
        title: `Missing Required Document: ${item.label}`,
        description: item.description || 'This mandatory document has not been uploaded yet.',
        canReplace: false,
      });
    } else {
      const doc = docsMap.get(item.document_id);
      if (doc) {
        if (doc.status === 'expired') {
          deficiencies.push({
            type: 'expired',
            title: `Expired Certificate: ${doc.label}`,
            description: 'The validity period for this document has lapsed. An updated certificate is required.',
            docId: doc.id,
            docLabel: doc.label,
            canReplace: true,
          });
        } else if (doc.status === 'mismatch_detected') {
          deficiencies.push({
            type: 'mismatch',
            title: `Data Mismatch Detected: ${doc.label}`,
            description: doc.verification?.message || 'Details on this document do not match authority records.',
            docId: doc.id,
            docLabel: doc.label,
            canReplace: true,
          });
        } else if (doc.status === 'manual_review_required') {
          deficiencies.push({
            type: 'manual_review',
            title: `Under Regulatory Review: ${doc.label}`,
            description: 'Reviewing officer has flagged inconsistencies requiring document replacement or clarification.',
            docId: doc.id,
            docLabel: doc.label,
            canReplace: true,
          });
        } else if (doc.status === 'source_unavailable') {
          deficiencies.push({
            type: 'source_unavailable',
            title: `Verification Pending: ${doc.label}`,
            description: 'The verification portal was temporarily unreachable. Uploading an attested copy may expedite review.',
            docId: doc.id,
            docLabel: doc.label,
            canReplace: true,
          });
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* Institution Deficiencies Section */}
      {!isOfficer && deficiencies.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-950 text-base">
              Action Required: {deficiencies.length} Document Deficienc{deficiencies.length === 1 ? 'y' : 'ies'} Found
            </h3>
          </div>
          <p className="text-xs text-amber-900/80 mb-4">
            Please review the following items flagged during automated regulatory checks. You can replace affected documents with updated copies.
          </p>

          <div className="space-y-3">
            {deficiencies.map((def, idx) => (
              <div
                key={idx}
                className="bg-surface rounded-lg p-3.5 border border-amber-200 flex items-center justify-between gap-4 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-text">{def.title}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      {def.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{def.description}</p>
                </div>

                {def.canReplace && def.docId && def.docLabel && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setReplaceModal({
                        open: true,
                        docId: def.docId!,
                        docLabel: def.docLabel!,
                        filename: docsMap.get(def.docId!)?.filename,
                      })
                    }
                    className="shrink-0 text-accent border-accent/30 hover:bg-accent/10"
                  >
                    <UploadCloud className="w-3.5 h-3.5 mr-1" />
                    Replace document
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist Table */}
      <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-text text-sm md:text-base">Document Checklist</h3>
            <p className="text-xs text-muted">
              Regulatory documents required for {application.category_label}
            </p>
          </div>
          <span className="text-xs font-medium text-muted bg-bg px-2.5 py-1 rounded-md border border-border">
            {application.checklist.filter((r) => r.document_id).length} of {application.checklist.length} submitted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/60 text-muted border-b border-border font-medium">
              <tr>
                <th className="px-5 py-3">Document</th>
                <th className="px-4 py-3">Requirement</th>
                <th className="px-4 py-3">Status</th>
                {isOfficer && <th className="px-4 py-3">Flags</th>}
                <th className="px-4 py-3">Uploaded / Verified</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {application.checklist.map((row) => {
                const doc = row.document_id ? docsMap.get(row.document_id) : null;
                const isMissing = !row.document_id || !doc;

                // Severity counts for this doc
                const sevCounts = { high: 0, medium: 0, low: 0 };
                if (doc) {
                  doc.findings.forEach((f) => {
                    sevCounts[f.severity]++;
                  });
                }
                const totalFlags = sevCounts.high + sevCounts.medium + sevCounts.low;

                return (
                  <tr
                    key={row.doc_type}
                    className={`transition-colors ${
                      isMissing ? 'bg-slate-50/50 opacity-70' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-text text-sm flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${isMissing ? 'text-muted' : 'text-accent'}`} />
                        <span>{row.label}</span>
                      </div>
                      <div className="text-[11px] text-muted font-mono mt-0.5">
                        {doc ? doc.filename : 'No file attached'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {row.required ? (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-slate-100 text-muted">
                          Optional
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {isMissing ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          Missing
                        </span>
                      ) : (
                        <StatusChip status={doc.status} size="sm" />
                      )}
                    </td>

                    {isOfficer && (
                      <td className="px-4 py-3.5">
                        {isMissing ? (
                          <span className="text-muted font-mono">—</span>
                        ) : totalFlags === 0 ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            0 flags
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            {sevCounts.high > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-800">
                                {sevCounts.high}H
                              </span>
                            )}
                            {sevCounts.medium > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                                {sevCounts.medium}M
                              </span>
                            )}
                            {sevCounts.low > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                                {sevCounts.low}L
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-3.5 text-muted font-mono">
                      {doc ? (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{doc.uploaded_at.split('T')[0]}</span>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {isMissing ? (
                        <span className="text-xs text-muted italic">Unavailable</span>
                      ) : isOfficer ? (
                        <Link
                          to={`/documents/${doc.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border text-text hover:bg-bg hover:border-accent transition-colors shadow-xs"
                        >
                          <span>Review</span>
                          <ExternalLink className="w-3 h-3 text-muted" />
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setReplaceModal({
                              open: true,
                              docId: doc.id,
                              docLabel: doc.label,
                              filename: doc.filename,
                            })
                          }
                          className="text-xs text-accent hover:bg-accent/10"
                        >
                          <UploadCloud className="w-3.5 h-3.5 mr-1" />
                          Replace
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Replace Document Modal */}
      {replaceModal.open && (
        <ReplaceDocModal
          open={replaceModal.open}
          onOpenChange={(open) => setReplaceModal((prev) => ({ ...prev, open }))}
          documentId={replaceModal.docId}
          documentLabel={replaceModal.docLabel}
          currentFilename={replaceModal.filename}
          onReplace={onReplaceDocument}
        />
      )}
    </div>
  );
};
