import React from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useRole } from '@/context/RoleContext';
import { StatusChip } from '@/components/StatusChip';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Button } from '@/components/ui/Button';
import { Skeleton, ErrorBanner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import { getRiskBand } from '@/lib/risk';
import { formatDate } from '@/lib/format';

import { DocumentsTab } from './DocumentsTab';
import { CrosscheckTab } from './CrosscheckTab';
import { VerificationLogTab } from './VerificationLogTab';
import { AlertsTab } from './AlertsTab';

import {
  ArrowLeft,
  RefreshCw,
  Download,
  FileText,
  GitCompare,
  Database,
  Bell,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export const ApplicationDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isOfficer } = useRole();

  const activeTab = searchParams.get('tab') || 'documents';

  const setTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        prev.set('tab', tab);
        return prev;
      },
      { replace: true }
    );
  };

  // Queries
  const {
    data: application,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.getApplication(id),
    enabled: Boolean(id),
  });

  // Re-run validation mutation
  const validateMutation = useMutation({
    mutationFn: () => api.validateApplication(id),
    onSuccess: (updatedApp) => {
      queryClient.setQueryData(['application', id], updatedApp);
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });

      const totalFlags =
        (updatedApp.flag_counts?.high || 0) +
        (updatedApp.flag_counts?.medium || 0) +
        (updatedApp.flag_counts?.low || 0);

      toast(
        `Validation complete. Risk score: ${updatedApp.risk_score} (${totalFlags} active flags).`,
        'success'
      );
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to re-run validation checks', 'error');
    },
  });

  // Replace document mutation
  const replaceDocMutation = useMutation({
    mutationFn: ({ docId, newFilename }: { docId: string; newFilename: string }) =>
      api.replaceDocument(docId, newFilename),
    onSuccess: (_updatedDoc, vars) => {
      toast(`Document replaced with ${vars.newFilename}. Ready for review.`, 'success');
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['document', vars.docId] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to replace document', 'error');
    },
  });

  // Export report
  const handleExportReport = async () => {
    try {
      await api.downloadReport(id);
      toast('Report export is available when connected to the backend.', 'info');
    } catch (err: any) {
      toast(err?.message || 'Report download initiated', 'info');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Application Not Found"
          message={error?.toString() || `Could not find application ${id}`}
          onRetry={() => refetch()}
        />
        <Link
          to={isOfficer ? '/' : '/applications'}
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>
      </div>
    );
  }

  const riskBand = getRiskBand(application.risk_score);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            to={isOfficer ? '/' : '/applications'}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isOfficer ? 'Back to Review Queue' : 'Back to My Applications'}</span>
          </Link>
        </div>

        {/* Application Header Card */}
        <div className="bg-surface rounded-xl border border-border p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-bg text-text font-bold border border-border">
                {application.id}
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {application.category_label}
              </span>
              {application.has_missing && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Missing mandatory docs
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <Building2 className="w-6 h-6 text-accent shrink-0" />
              <span>{application.institution}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Submitted: {formatDate(application.submitted_at)}</span>
              </div>
              <span>•</span>
              <div>
                <span>Total Documents: </span>
                <span className="font-semibold text-text">{application.doc_count}</span>
              </div>
            </div>

            {/* Status Summary Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {Object.entries(application.status_counts || {}).map(([status, count]) => {
                if (!count || count === 0) return null;
                return (
                  <div
                    key={status}
                    className="flex items-center gap-1.5 bg-bg border border-border px-2.5 py-1 rounded-full text-xs"
                  >
                    <StatusChip status={status as any} size="sm" />
                    <span className="font-bold text-text">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Header Area: Risk Ring (Officer Only) & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {isOfficer && (
              <div className="flex items-center gap-3 bg-bg border border-border rounded-xl p-3">
                <ProgressRing
                  score={application.risk_score}
                  size={64}
                  strokeWidth={6}
                />
                <div className="space-y-0.5">
                  <div className="text-[10px] uppercase font-bold text-muted tracking-wider">
                    Risk Score
                  </div>
                  <div className="text-lg font-bold text-text leading-none">
                    {application.risk_score} / 100
                  </div>
                  <div className="text-xs font-semibold text-text">
                    {riskBand} Risk
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              {isOfficer && (
                <Button
                  variant="primary"
                  onClick={() => validateMutation.mutate()}
                  loading={validateMutation.isPending}
                  disabled={validateMutation.isPending}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {validateMutation.isPending ? 'Running checks...' : 'Re-run validation'}
                </Button>
              )}

              <Button variant="outline" onClick={handleExportReport}>
                <Download className="w-4 h-4 mr-2" />
                Export report
              </Button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-border">
          <div className="flex gap-2 -mb-px">
            <button
              type="button"
              onClick={() => setTab('documents')}
              className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'documents'
                  ? 'border-accent text-accent bg-accent/5 rounded-t-lg'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Documents ({application.checklist.length})</span>
            </button>

            {isOfficer && (
              <>
                <button
                  type="button"
                  onClick={() => setTab('crosscheck')}
                  className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'crosscheck'
                      ? 'border-accent text-accent bg-accent/5 rounded-t-lg'
                      : 'border-transparent text-muted hover:text-text'
                  }`}
                >
                  <GitCompare className="w-4 h-4" />
                  <span>Consistency Matrix</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab('verification')}
                  className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                    activeTab === 'verification'
                      ? 'border-accent text-accent bg-accent/5 rounded-t-lg'
                      : 'border-transparent text-muted hover:text-text'
                  }`}
                >
                  <Database className="w-4 h-4" />
                  <span>Verification Log ({application.verification_log.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setTab('alerts')}
              className={`py-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'alerts'
                  ? 'border-accent text-accent bg-accent/5 rounded-t-lg'
                  : 'border-transparent text-muted hover:text-text'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Alerts ({application.alerts.length})</span>
            </button>
          </div>
        </div>

        {/* Tab Panels */}
        <div>
          {activeTab === 'documents' && (
            <DocumentsTab
              application={application}
              isOfficer={isOfficer}
              onReplaceDocument={async (docId, newFilename) => {
                await replaceDocMutation.mutateAsync({ docId, newFilename });
              }}
            />
          )}

          {activeTab === 'crosscheck' && isOfficer && (
            <CrosscheckTab
              matrix={application.crosscheck}
              application={application}
            />
          )}

          {activeTab === 'verification' && isOfficer && (
            <VerificationLogTab application={application} />
          )}

          {activeTab === 'alerts' && <AlertsTab alerts={application.alerts} />}
        </div>
      </div>
  );
};
