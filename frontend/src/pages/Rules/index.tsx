import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Rule, ApplicationSummary } from '@/types';
import { Switch } from '@/components/ui/Switch';
import { SeverityBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton, EmptyState, ErrorBanner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import {
  Scale,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  Sliders,
} from 'lucide-react';

const APH_YEARS = [
  { value: '2026-27', label: '2026-27 (corrigendum of 2 Dec 2025 applied)' },
  { value: '2025-26', label: '2025-26' },
  { value: '2024-25', label: '2024-25' },
];

export const Rules: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedYear, setSelectedYear] = useState('2026-27');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [rulesChanged, setRulesChanged] = useState(false);
  const [targetAppId, setTargetAppId] = useState('APP-2026-0412');

  // Queries
  const {
    data: rules = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Rule[]>({
    queryKey: ['rules', selectedYear],
    queryFn: () => api.getRules(selectedYear),
  });

  const { data: applications = [] } = useQuery<ApplicationSummary[]>({
    queryKey: ['applications'],
    queryFn: () => api.getApplications(),
  });

  // Patch Rule Mutation (Optimistic)
  const patchRuleMutation = useMutation({
    mutationFn: ({ id, update }: { id: string; update: { enabled?: boolean; threshold_value?: number } }) =>
      api.patchRule(id, update),
    onMutate: async ({ id, update }) => {
      await queryClient.cancelQueries({ queryKey: ['rules', selectedYear] });
      const previousRules = queryClient.getQueryData<Rule[]>(['rules', selectedYear]);

      queryClient.setQueryData<Rule[]>(['rules', selectedYear], (old = []) =>
        old.map((r) => {
          if (r.id !== id) return r;
          return {
            ...r,
            enabled: update.enabled !== undefined ? update.enabled : r.enabled,
            threshold:
              r.threshold && update.threshold_value !== undefined
                ? { ...r.threshold, value: update.threshold_value }
                : r.threshold,
          };
        })
      );

      setRulesChanged(true);
      return { previousRules };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousRules) {
        queryClient.setQueryData(['rules', selectedYear], context.previousRules);
      }
      toast('Failed to update rule settings', 'error');
    },
    onSuccess: (updatedRule) => {
      toast(`Rule ${updatedRule.id} updated`, 'success');
      queryClient.invalidateQueries({ queryKey: ['rules', selectedYear] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });

  // Re-run validation mutation
  const validateMutation = useMutation({
    mutationFn: (appId: string) => api.validateApplication(appId),
    onSuccess: (updatedApp) => {
      setRulesChanged(false);
      queryClient.invalidateQueries({ queryKey: ['application', targetAppId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });

      const totalFlags =
        (updatedApp.flag_counts?.high || 0) +
        (updatedApp.flag_counts?.medium || 0) +
        (updatedApp.flag_counts?.low || 0);

      toast(
        `Validation re-run on ${updatedApp.id}. Active flags: ${totalFlags}, Risk score: ${updatedApp.risk_score}`,
        'success'
      );
    },
    onError: (err: any) => {
      toast(err?.message || 'Re-run validation failed', 'error');
    },
  });

  // Filtered Rules
  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (selectedCategory !== 'all') {
        if (!rule.category_ids.includes(selectedCategory)) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = rule.title.toLowerCase().includes(q);
        const matchesId = rule.id.toLowerCase().includes(q);
        const matchesDesc = rule.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesId && !matchesDesc) return false;
      }
      return true;
    });
  }, [rules, selectedCategory, searchQuery]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Failed to Load Rules"
          message={error?.toString() || 'Could not fetch APH rules list.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Sticky Banner: Rules Changed since last run */}
      {rulesChanged && (
        <div className="sticky top-0 z-30 bg-amber-500 text-white px-5 py-3 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-bold text-xs uppercase tracking-wide">
                Rules changed since the last run
              </div>
              <div className="text-xs text-amber-100">
                Re-run validation to recompute application findings, statuses, and risk scores.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={targetAppId}
              onChange={(e) => setTargetAppId(e.target.value)}
              className="bg-white/20 text-white border border-white/30 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id} className="text-slate-900">
                  {app.id} - {app.institution} (Risk {app.risk_score})
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => validateMutation.mutate(targetAppId)}
              loading={validateMutation.isPending}
              disabled={validateMutation.isPending}
              className="bg-white text-slate-900 border-white hover:bg-slate-100 font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Re-run validation
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text flex items-center gap-2">
          <Scale className="w-6 h-6 text-accent" />
          <span>Regulatory Compliance Rules</span>
        </h1>
        <p className="text-xs text-muted mt-1">
          Rules, not AI, decide pass or fail. Each rule is versioned per APH year.
        </p>
      </div>

      {/* Controls Bar: Year, Category Filter, Search */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* APH Year Select */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-text shrink-0">APH Year:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-bg border border-border rounded-lg px-3 py-1.5 text-xs text-text font-medium focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {APH_YEARS.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Categories</option>
              <option value="cat_eoa">Extension of Approval (EoA)</option>
              <option value="cat_increase">Increase in Intake</option>
              <option value="cat_new">New Programme</option>
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rules..."
              className="bg-bg border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent w-48"
            />
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.length === 0 ? (
          <EmptyState
            icon={<Filter className="w-8 h-8 text-muted" />}
            title="No Rules Match Filter"
            description="Try clearing your search query or choosing All Categories."
          />
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`bg-surface rounded-xl border p-5 shadow-xs transition-all ${
                rule.enabled ? 'border-border' : 'border-border/60 bg-slate-50/50 opacity-70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-bg text-text border border-border">
                      {rule.id}
                    </span>
                    <SeverityBadge severity={rule.severity} />

                    {/* Clause Ref Chip */}
                    {rule.clause_ref === 'TODO-VERIFY' ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Clause not verified
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-bg text-muted border border-border">
                        Clause {rule.clause_ref}
                      </span>
                    )}

                    <span className="text-xs text-muted font-mono ml-auto sm:ml-0">
                      Last run: {rule.last_run_hits} hit{rule.last_run_hits === 1 ? '' : 's'}
                    </span>
                  </div>

                  <h3 className="font-bold text-text text-sm">{rule.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{rule.description}</p>

                  {/* Applies to Categories */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-muted">Applies to:</span>
                    {rule.category_ids.map((catId) => (
                      <span
                        key={catId}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg text-muted border border-border"
                      >
                        {catId}
                      </span>
                    ))}
                  </div>

                  {/* Threshold Stepper (if present) */}
                  {rule.threshold && (
                    <div className="flex items-center gap-3 pt-2 text-xs">
                      <span className="font-medium text-text flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-accent" />
                        <span>{rule.threshold.label}:</span>
                      </span>
                      <div className="flex items-center bg-bg border border-border rounded-lg overflow-hidden">
                        <input
                          type="number"
                          value={rule.threshold.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) {
                              patchRuleMutation.mutate({
                                id: rule.id,
                                update: { threshold_value: val },
                              });
                            }
                          }}
                          className="w-16 px-2 py-1 text-center font-mono font-bold text-xs bg-transparent focus:outline-none"
                        />
                        <span className="px-2 py-1 bg-slate-100 text-[11px] text-muted font-medium border-l border-border">
                          {rule.threshold.unit}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enable / Disable Switch */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text">
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        patchRuleMutation.mutate({
                          id: rule.id,
                          update: { enabled: checked },
                        })
                      }
                      aria-label={`Toggle ${rule.title}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
