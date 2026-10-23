import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Category } from '@/types';
import { KpiCard, KpiFilter } from './KpiCard';
import { QueueTable } from './QueueTable';
import { AlertsPanel } from './AlertsPanel';
import { Skeleton, EmptyState, ErrorBanner } from '@/components/ui/Feedback';
import { Switch } from '@/components/ui/Switch';
import {
  FileText,
  AlertTriangle,
  Clock,
  CalendarX,
  Search,
  Filter,
  X,
  ArrowUpDown,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [activeKpiFilter, setActiveKpiFilter] = useState<KpiFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [sortBy, setSortBy] = useState<'risk_desc' | 'newest' | 'institution'>('risk_desc');

  // Queries
  const {
    data: dashboardData,
    isLoading: loadingDashboard,
    isError: errorDashboard,
    error: dashError,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.getDashboard(),
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const handleKpiClick = (filter: KpiFilter) => {
    setActiveKpiFilter((prev) => (prev === filter ? 'all' : filter));
  };

  const clearAllFilters = () => {
    setActiveKpiFilter('all');
    setSearchQuery('');
    setSelectedCategory('all');
    setOnlyFlagged(false);
  };

  // Filter & Sort Queue
  const filteredQueue = useMemo(() => {
    if (!dashboardData?.queue) return [];

    return dashboardData.queue.filter((app) => {
      // KPI Filter
      if (activeKpiFilter === 'flagged') {
        const hasFlags =
          app.flag_counts.high > 0 || app.flag_counts.medium > 0 || app.flag_counts.low > 0;
        if (!hasFlags && app.risk_score === 0) return false;
      } else if (activeKpiFilter === 'pending') {
        if (!app.status_counts?.verification_pending) return false;
      } else if (activeKpiFilter === 'expiring') {
        if (!app.status_counts?.expired) return false;
      }

      // Search query filter (institution or application id)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesInst = app.institution.toLowerCase().includes(q);
        const matchesId = app.id.toLowerCase().includes(q);
        if (!matchesInst && !matchesId) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (app.category_id !== selectedCategory) return false;
      }

      // Only flagged switch
      if (onlyFlagged) {
        if (app.risk_score === 0 && app.flag_counts.high === 0 && app.flag_counts.medium === 0) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'risk_desc') {
        return b.risk_score - a.risk_score;
      }
      if (sortBy === 'newest') {
        return b.submitted_at.localeCompare(a.submitted_at);
      }
      if (sortBy === 'institution') {
        return a.institution.localeCompare(b.institution);
      }
      return 0;
    });
  }, [
    dashboardData?.queue,
    activeKpiFilter,
    searchQuery,
    selectedCategory,
    onlyFlagged,
    sortBy,
  ]);

  if (loadingDashboard) {
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (errorDashboard || !dashboardData) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Failed to Load Dashboard"
          message={dashError?.toString() || 'Could not connect to verification server.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const hasActiveFilters =
    activeKpiFilter !== 'all' ||
    Boolean(searchQuery.trim()) ||
    selectedCategory !== 'all' ||
    onlyFlagged;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Review Queue</h1>
          <p className="text-xs text-muted mt-0.5">
            AICTE Application Approval Verification & Regulatory Compliance Dashboard
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-accent bg-accent/10 hover:bg-accent/20 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear active filters
          </button>
        )}
      </div>

      {/* KPI Cards Row (Clickable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Applications Under Review"
          value={dashboardData.kpis.applications}
          description="Total active queue items"
          icon={FileText}
          filterKey="all"
          isActive={activeKpiFilter === 'all'}
          onClick={() => handleKpiClick('all')}
        />
        <KpiCard
          title="Flagged for Scrutiny"
          value={dashboardData.kpis.flagged}
          description="High risk / forensic findings"
          icon={AlertTriangle}
          filterKey="flagged"
          isActive={activeKpiFilter === 'flagged'}
          onClick={() => handleKpiClick('flagged')}
        />
        <KpiCard
          title="Pending Verification"
          value={dashboardData.kpis.pending_verification}
          description="Awaiting issuer / registry responses"
          icon={Clock}
          filterKey="pending"
          isActive={activeKpiFilter === 'pending'}
          onClick={() => handleKpiClick('pending')}
        />
        <KpiCard
          title="Expiring Certificates"
          value={dashboardData.kpis.expiring}
          description="Expired or expiring in 60 days"
          icon={CalendarX}
          filterKey="expiring"
          isActive={activeKpiFilter === 'expiring'}
          onClick={() => handleKpiClick('expiring')}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by institution name or application ID..."
            className="w-full bg-bg border border-border rounded-lg pl-9 pr-8 py-2 text-xs text-text placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls: Category, Only Flagged, Sort */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Only Flagged Switch */}
          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <Switch
              checked={onlyFlagged}
              onCheckedChange={setOnlyFlagged}
              id="flagged-switch"
            />
            <label htmlFor="flagged-switch" className="text-muted cursor-pointer font-medium select-none">
              Only flagged
            </label>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-border">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="risk_desc">Highest Risk First</option>
              <option value="newest">Newest First</option>
              <option value="institution">Institution Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area: Queue Table (Left) + Alerts Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-4">
          {filteredQueue.length === 0 ? (
            <EmptyState
              icon={<Filter className="w-8 h-8 text-muted" />}
              title="No applications match these filters"
              description="Try resetting your search query, category selection, or KPI card filter."
              action={
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent-hover transition-colors"
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <QueueTable applications={filteredQueue} />
          )}
        </div>

        <div className="lg:col-span-1">
          <AlertsPanel alerts={dashboardData.alerts} />
        </div>
      </div>
    </div>
  );
};
