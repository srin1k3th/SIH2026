import React from 'react';
import type { Document as DocType } from '@/types';
import { StatusChip } from '@/components/StatusChip';
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck, FileClock, Database, FileText } from 'lucide-react';

interface DocumentInfoTabProps {
  document: DocType;
}

export const DocumentInfoTab: React.FC<DocumentInfoTabProps> = ({ document: doc }) => {
  const { signature, verification, revisions, fields } = doc;

  return (
    <div className="space-y-6 text-sm">
      {/* 1. Signature Block */}
      {signature && signature.present && (
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-accent" />
              Digital Signature
            </h3>
            <span className="text-xs font-mono text-muted bg-bg px-2 py-0.5 rounded border border-border">
              Level: {signature.modification_level}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              signature.intact ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {signature.intact ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
              Intact
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              signature.valid ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {signature.valid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-red-600" />}
              Valid
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              signature.trusted ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {signature.trusted ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
              Trusted
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
              signature.modification_level === 'none' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
            }`}>
              {signature.modification_level === 'none' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-red-600" />}
              {signature.modification_level === 'none' ? 'Unmodified' : 'Modified post-sign'}
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-muted border-t border-border pt-2.5">
            {signature.signer && (
              <div className="flex justify-between">
                <span>Signer:</span>
                <span className="font-medium text-text">{signature.signer}</span>
              </div>
            )}
            {signature.signed_at && (
              <div className="flex justify-between">
                <span>Signed at:</span>
                <span className="font-mono text-text">{signature.signed_at}</span>
              </div>
            )}
            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
              <span className="font-semibold">Verdict: </span>
              {signature.modification_level !== 'none'
                ? 'Valid signature, but content was changed after signing'
                : 'Cryptographically valid signature with no post-signing changes'}
            </div>
          </div>
        </div>
      )}

      {/* 2. Verification Block */}
      {verification && (
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text flex items-center gap-2">
              <Database className="w-4 h-4 text-accent" />
              Source Verification
            </h3>
            <StatusChip status={verification.result} size="sm" />
          </div>

          <div className="space-y-1.5 text-xs text-muted mb-3">
            <div className="flex justify-between">
              <span>Source:</span>
              <span className="font-medium text-text">{verification.source}</span>
            </div>
            {verification.reference && (
              <div className="flex justify-between">
                <span>Reference:</span>
                <span className="font-mono text-text">{verification.reference}</span>
              </div>
            )}
            {verification.requested_at && (
              <div className="flex justify-between">
                <span>Requested:</span>
                <span className="font-mono text-text">{verification.requested_at}</span>
              </div>
            )}
            {verification.message && (
              <div className="p-2 bg-bg rounded border border-border text-muted">
                {verification.message}
              </div>
            )}
          </div>

          {/* Submitted vs Source comparison table */}
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 bg-bg px-3 py-2 text-xs font-semibold text-muted border-b border-border">
              <span>Submitted by institution</span>
              <span>Confirmed by source</span>
            </div>
            <div className="divide-y divide-border text-xs">
              {Object.entries(verification.submitted_fields).map(([key, subVal]) => {
                const srcVal = verification.source_fields ? verification.source_fields[key] : null;
                const isMismatch = verification.source_fields !== null && srcVal !== subVal;

                return (
                  <div key={key} className={`grid grid-cols-2 px-3 py-2 ${isMismatch ? 'bg-red-50/70' : ''}`}>
                    <div>
                      <div className="text-[10px] text-muted uppercase tracking-wider">{key.replace(/_/g, ' ')}</div>
                      <div className="font-medium text-text">{subVal}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted uppercase tracking-wider">&nbsp;</div>
                      {verification.source_fields === null ? (
                        <div className="italic text-muted">Not confirmed</div>
                      ) : isMismatch ? (
                        <div className="font-semibold text-red-700 flex items-center gap-1">
                          {srcVal ?? 'Missing'}
                          <XCircle className="w-3.5 h-3.5 inline text-red-600" />
                        </div>
                      ) : (
                        <div className="text-text flex items-center gap-1">
                          {srcVal}
                          <CheckCircle2 className="w-3.5 h-3.5 inline text-emerald-600" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. Revisions Timeline */}
      {revisions && revisions.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <h3 className="font-semibold text-text flex items-center gap-2 mb-3">
            <FileClock className="w-4 h-4 text-accent" />
            PDF Revision History ({revisions.length})
          </h3>
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {revisions.map((rev) => (
              <div key={rev.rev} className="relative">
                <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 bg-surface ${
                  rev.is_current ? 'border-accent bg-accent' : 'border-muted'
                }`} />
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs text-text">
                    Revision {rev.rev}: {rev.label}
                  </span>
                  {rev.is_current && (
                    <span className="text-[10px] uppercase font-semibold text-accent bg-accent/10 px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                  <span className="font-mono">{rev.saved_at}</span>
                  {rev.producer && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[180px]" title={rev.producer}>
                        {rev.producer}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Extracted Fields Table */}
      {fields && fields.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
          <h3 className="font-semibold text-text flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-accent" />
            Extracted Document Fields ({fields.length})
          </h3>
          <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
            {fields.map((f) => (
              <div key={f.name} className="flex items-center justify-between px-3 py-2 text-xs">
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-wider">{f.name.replace(/_/g, ' ')}</div>
                  <div className="font-medium text-text">{f.value}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                  f.confidence === 'high' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {f.confidence} confidence
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
