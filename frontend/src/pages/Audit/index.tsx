import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { AuditEvent, AuditVerifyResult } from '@/types';
import { Button } from '@/components/ui/Button';
import { Skeleton, ErrorBanner } from '@/components/ui/Feedback';
import { Tooltip } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import {
  ShieldCheck,
  Search,
  Download,
  Copy,
  Check,
  Link as LinkIcon,
  CheckCircle2,
  AlertOctagon,
  User,
} from 'lucide-react';
import clsx from 'clsx';

export const Audit: React.FC = () => {
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActor, setSelectedActor] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<AuditVerifyResult | null>(null);

  // Queries
  const {
    data: auditEvents = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<AuditEvent[]>({
    queryKey: ['audit'],
    queryFn: () => api.getAudit(),
  });

  // Verify Chain Mutation
  const verifyMutation = useMutation({
    mutationFn: () => api.verifyAuditChain(),
    onSuccess: (res) => {
      setVerifyResult(res);
      if (res.valid) {
        toast(`Cryptographic audit chain intact: ${res.checked} events verified`, 'success');
      } else {
        toast(`Audit chain broken at event #${res.first_broken_seq}! Tampering detected.`, 'error');
      }
    },
    onError: (err: any) => {
      toast(err?.message || 'Verification failed', 'error');
    },
  });

  // Copy hash to clipboard
  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Seq', 'Timestamp', 'Actor', 'Role', 'Action', 'Target', 'Detail', 'PrevHash', 'Hash'];
    const rows = auditEvents.map((e) => [
      e.seq,
      `"${e.timestamp}"`,
      `"${e.actor}"`,
      `"${e.role}"`,
      `"${e.action}"`,
      `"${e.target}"`,
      `"${e.detail.replace(/"/g, '""')}"`,
      `"${e.prev_hash}"`,
      `"${e.hash}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `veriaph_audit_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Unique Actors and Actions for filters
  const uniqueActors = useMemo(() => {
    const set = new Set<string>();
    auditEvents.forEach((e) => set.add(e.actor));
    return Array.from(set);
  }, [auditEvents]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    auditEvents.forEach((e) => set.add(e.action));
    return Array.from(set);
  }, [auditEvents]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return auditEvents.filter((ev) => {
      if (selectedActor !== 'all' && ev.actor !== selectedActor) return false;
      if (selectedAction !== 'all' && ev.action !== selectedAction) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDetail = ev.detail.toLowerCase().includes(q);
        const matchesTarget = ev.target.toLowerCase().includes(q);
        const matchesHash = ev.hash.toLowerCase().includes(q);
        if (!matchesDetail && !matchesTarget && !matchesHash) return false;
      }
      return true;
    });
  }, [auditEvents, selectedActor, selectedAction, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Failed to Load Audit Trail"
          message={error?.toString() || 'Could not fetch audit log records.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isChainBroken = verifyResult && !verifyResult.valid;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-accent" />
            <span>Immutable Audit Trail</span>
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Cryptographic SHA-256 hash-chained log of every validation decision, rule edit, and document review action.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            disabled={auditEvents.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>

          <Button
            variant="primary"
            onClick={() => verifyMutation.mutate()}
            loading={verifyMutation.isPending}
            disabled={verifyMutation.isPending}
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Verify Chain
          </Button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verifyResult && (
        <div
          className={clsx(
            'p-4 rounded-xl border flex items-start gap-3 shadow-xs animate-in fade-in-50',
            verifyResult.valid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-950'
              : 'bg-red-500/10 border-red-500/30 text-red-950'
          )}
        >
          {verifyResult.valid ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertOctagon className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5">
            <div className="font-bold text-sm">
              {verifyResult.valid
                ? `Chain intact: ${verifyResult.checked} events cryptographically verified`
                : `Chain broken at event #${verifyResult.first_broken_seq}: recorded hash does not match recomputed hash`}
            </div>
            <div className="text-xs opacity-80">
              {verifyResult.valid
                ? 'All SHA-256 genesis and block link hashes match perfectly. No unauthorized record alteration or history rewriting has occurred.'
                : 'Tampering detected in the audit sequence! The audit trail integrity has been compromised from this event forward.'}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action details, target, or hash..."
            className="w-full bg-bg border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Actor Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Actor:</span>
            <select
              value={selectedActor}
              onChange={(e) => setSelectedActor(e.target.value)}
              className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Actors</option>
              {uniqueActors.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted">Action:</span>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Trail Table with Vertical Chain Rail */}
      <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/60 text-muted border-b border-border font-medium sticky top-0 z-10">
              <tr>
                <th className="w-12 px-3 py-3 text-center">#</th>
                <th className="px-4 py-3 w-40">Timestamp</th>
                <th className="px-4 py-3 w-44">Actor & Role</th>
                <th className="px-4 py-3 w-32">Action</th>
                <th className="px-4 py-3 w-36">Target</th>
                <th className="px-4 py-3 min-w-[200px]">Detail</th>
                <th className="px-4 py-3 w-32">Hash</th>
                <th className="px-4 py-3 w-32">Prev Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEvents.map((event) => {
                const isBrokenRow =
                  isChainBroken &&
                  verifyResult.first_broken_seq !== null &&
                  event.seq >= verifyResult.first_broken_seq;

                return (
                  <tr
                    key={event.seq}
                    className={clsx(
                      'transition-colors',
                      isBrokenRow
                        ? 'bg-red-500/10 hover:bg-red-500/15'
                        : 'hover:bg-slate-50/80'
                    )}
                  >
                    {/* Seq & Chain Icon */}
                    <td className="px-3 py-3.5 text-center font-mono font-bold text-text">
                      <div className="flex items-center justify-center gap-1">
                        <LinkIcon
                          className={clsx(
                            'w-3 h-3',
                            isBrokenRow ? 'text-red-600' : 'text-accent'
                          )}
                        />
                        <span>{event.seq}</span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-4 py-3.5 text-muted font-mono whitespace-nowrap">
                      {event.timestamp}
                    </td>

                    {/* Actor & Role */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-text flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate">{event.actor}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-muted bg-bg px-1.5 py-0.5 rounded border border-border inline-block mt-0.5">
                        {event.role}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3.5 font-semibold text-text">
                      <span className="px-2 py-0.5 rounded bg-bg border border-border font-mono text-[11px]">
                        {event.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="px-4 py-3.5 font-mono text-muted text-[11px] truncate max-w-[140px]" title={event.target}>
                      {event.target}
                    </td>

                    {/* Detail */}
                    <td className="px-4 py-3.5 text-text leading-relaxed">
                      {event.detail}
                    </td>

                    {/* Hash */}
                    <td className="px-4 py-3.5 font-mono text-[11px]">
                      <Tooltip content={<div className="font-mono text-[10px] break-all p-1">{event.hash}</div>}>
                        <div className="flex items-center gap-1.5">
                          <span className={clsx('font-bold', isBrokenRow ? 'text-red-700' : 'text-text')}>
                            {event.hash.substring(0, 8)}…
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyHash(event.hash)}
                            className="p-1 hover:text-accent text-muted rounded hover:bg-bg transition-colors"
                            title="Copy full hash"
                          >
                            {copiedHash === event.hash ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </Tooltip>
                    </td>

                    {/* Prev Hash */}
                    <td className="px-4 py-3.5 font-mono text-muted text-[11px]">
                      <Tooltip content={<div className="font-mono text-[10px] break-all p-1">{event.prev_hash}</div>}>
                        <span>{event.prev_hash.substring(0, 8)}…</span>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
