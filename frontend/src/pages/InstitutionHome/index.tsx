import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useRole } from '@/context/RoleContext';
import { StatusChip } from '@/components/StatusChip';
import { Button } from '@/components/ui/Button';
import { Skeleton, EmptyState, ErrorBanner } from '@/components/ui/Feedback';
import { formatDate } from '@/lib/format';
import {
  Building2,
  PlusCircle,
  FileText,
  AlertTriangle,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const InstitutionHome: React.FC = () => {
  const { persona, isOfficer } = useRole();

  const {
    data: applications = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['applications'],
    queryFn: () => api.getApplications(),
  });

  // Filter for this institution if role is institution
  const institutionApps = isOfficer
    ? applications
    : applications.filter(
        (app) =>
          app.institution.toLowerCase().includes(persona.name.toLowerCase()) ||
          persona.name.toLowerCase().includes(app.institution.toLowerCase()) ||
          app.id === 'APP-2026-0155'
      );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Failed to Load Applications"
          message={error?.toString() || 'Could not fetch applications list.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">
            {isOfficer ? 'All Applications' : 'My AICTE Applications'}
          </h1>
          <p className="text-xs text-muted mt-0.5">
            {isOfficer
              ? 'Complete registry of submitted institution approval applications'
              : `Approval portal dashboard for ${persona.name}`}
          </p>
        </div>

        <Link to="/applications/new">
          <Button variant="primary">
            <PlusCircle className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      {/* Applications Cards List */}
      {institutionApps.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-muted" />}
          title="No Applications Found"
          description="You haven't submitted any approval applications yet. Start a new application to request AICTE extension or approval."
          action={
            <Link to="/applications/new">
              <Button variant="primary">
                <PlusCircle className="w-4 h-4 mr-2" />
                Start First Application
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {institutionApps.map((app) => {
            // Action needed count: sum of mismatch, expired, manual review, or missing
            const actionNeededCount =
              (app.status_counts?.mismatch_detected || 0) +
              (app.status_counts?.expired || 0) +
              (app.status_counts?.manual_review_required || 0) +
              (app.has_missing ? 1 : 0);

            return (
              <div
                key={app.id}
                className="bg-surface rounded-xl border border-border p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-text bg-bg px-2.5 py-0.5 rounded border border-border">
                      {app.id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {app.category_label}
                    </span>
                    {actionNeededCount > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Action needed: {actionNeededCount}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-text text-base flex items-center gap-2 truncate">
                    <Building2 className="w-4 h-4 text-accent shrink-0" />
                    <span>{app.institution}</span>
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Submitted: {formatDate(app.submitted_at)}</span>
                    </div>
                    <span>•</span>
                    <div>
                      <span>Documents: </span>
                      <span className="font-semibold text-text">{app.doc_count} total</span>
                    </div>
                  </div>

                  {/* Document Status Breakdown */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {Object.entries(app.status_counts || {}).map(([status, count]) => {
                      if (!count) return null;
                      return (
                        <div
                          key={status}
                          className="flex items-center gap-1 bg-bg border border-border px-2 py-0.5 rounded-full text-[11px]"
                        >
                          <StatusChip status={status as any} size="sm" />
                          <span className="font-bold text-text">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-end">
                  <Link to={`/applications/${app.id}`}>
                    <Button variant="outline" className="group">
                      <span>View Application</span>
                      <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
