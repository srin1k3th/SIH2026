import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Metrics } from '@/types';
import { Card } from '@/components/ui/Card';
import { Stat } from '@/components/ui/Stat';
import { Skeleton, EmptyState, ErrorBanner } from '@/components/ui/Feedback';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';
import {
  BarChart3,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Clock,
} from 'lucide-react';

export const Eval: React.FC = () => {
  const {
    data: metrics,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<Metrics>({
    queryKey: ['metrics'],
    queryFn: () => api.getMetrics(),
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (isError || !metrics) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Failed to Load Evaluation Metrics"
          message={error?.toString() || 'Could not fetch evaluation results.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  // Empty state when generated_at is null
  if (!metrics.generated_at) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <EmptyState
          icon={<BarChart3 className="w-10 h-10 text-muted" />}
          title="No Evaluation Has Been Run Yet"
          description="Run the evaluation harness on the backend to populate this page with detection metrics and benchmark figures."
        />
      </div>
    );
  }

  const falsePositiveRate =
    metrics.clean_docs > 0
      ? ((metrics.false_positives / metrics.clean_docs) * 100).toFixed(1)
      : '0.0';

  // Prepare chart data with percentage rate
  const chartData = metrics.detection_by_type.map((item) => ({
    type: item.type.replace(/_/g, ' '),
    rawType: item.type,
    n: item.n,
    detected: item.detected,
    rate: item.n > 0 ? Math.round((item.detected / item.n) * 100) : 0,
    label: `${item.detected}/${item.n}`,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Sample numbers banner */}
      {metrics.is_sample && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 px-4 py-3 rounded-xl flex items-center gap-3 text-xs shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-semibold">
            Sample numbers for layout only. Real figures come from the evaluation harness.
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-accent" />
            <span>Forensics & Detection Evaluation Harness</span>
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Benchmark performance metrics across planted tampering test cases and clean statutory documents.
          </p>
        </div>

        <div className="text-xs text-muted font-mono bg-bg border border-border px-3 py-1.5 rounded-lg self-start sm:self-auto">
          Generated: {metrics.generated_at}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          label="Documents Evaluated"
          value={metrics.n_docs}
          subtext="Total benchmark dataset"
          icon={<FileCheck className="w-5 h-5 text-accent" />}
        />
        <Stat
          label="Clean Documents"
          value={metrics.clean_docs}
          subtext="Authentic un-tampered baseline"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
        />
        <Stat
          label="False Positives"
          value={`${metrics.false_positives} (${falsePositiveRate}%)`}
          subtext="Flags on authentic clean docs"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
        />
        <Stat
          label="Average Processing Speed"
          value={`${metrics.avg_seconds_per_doc}s`}
          subtext="Per document inspection time"
          icon={<Clock className="w-5 h-5 text-blue-600" />}
        />
      </div>

      {/* Detection Rate Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-text text-sm">Detection Rate by Tampering Type</h3>
            <p className="text-xs text-muted">
              Percentage of synthetic and planted modifications successfully identified by VeriAPH checkers
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent/10 text-accent">
            Target: &gt; 90%
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E6EB" />
              <XAxis
                dataKey="type"
                tick={{ fontSize: 11, fill: '#5B6472' }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#5B6472' }}
              />
              <RechartsTooltip
                formatter={(value: any, _name: any, item: any) => [
                  `${value}% (${item.payload.label})`,
                  'Detection Rate',
                ]}
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#E3E6EB',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.rate >= 90 ? '#2347C5' : entry.rate >= 75 ? '#F79009' : '#D92D20'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Detailed Benchmark Table */}
      <div className="bg-surface rounded-xl border border-border shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-text text-sm">Benchmark Breakdown Table</h3>
          <p className="text-xs text-muted">Raw counts and detection rate per test category</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-bg/60 text-muted border-b border-border font-medium">
              <tr>
                <th className="px-5 py-3">Tamper / Check Type</th>
                <th className="px-4 py-3 text-right">Planted Test Cases (N)</th>
                <th className="px-4 py-3 text-right">Identified (Detected)</th>
                <th className="px-5 py-3 text-right">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.detection_by_type.map((row) => {
                const pct = row.n > 0 ? Math.round((row.detected / row.n) * 100) : 0;
                return (
                  <tr key={row.type} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-semibold text-text font-mono">
                      {row.type}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted">{row.n}</td>
                    <td className="px-4 py-3 text-right font-mono text-text font-bold">
                      {row.detected}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          pct >= 90
                            ? 'bg-emerald-50 text-emerald-700'
                            : pct >= 75
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {pct}%
                      </span>
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
