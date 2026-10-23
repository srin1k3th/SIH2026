import React, { useState } from 'react';
import { Finding, Explanation } from '@/types';
import { SeverityBadge, Chip } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Feedback';
import { getFindingTypeInfo } from '@/lib/findingTypes';
import { formatDate } from '@/lib/format';
import { api } from '@/api/client';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Info,
} from 'lucide-react';
import clsx from 'clsx';

export interface FindingCardProps {
  finding: Finding;
  findingNumber: number;
  isSelected: boolean;
  onSelect: () => void;
  onJumpToPage: (page: number) => void;
  onOpenDecision: (finding: Finding, action: 'accept' | 'override' | 'clarify') => void;
  isOfficer: boolean;
  autoExpandWhyFlagged?: boolean;
}

export function FindingCard({
  finding,
  findingNumber,
  isSelected,
  onSelect,
  onJumpToPage,
  onOpenDecision,
  isOfficer,
  autoExpandWhyFlagged = false,
}: FindingCardProps) {
  const [whyExpanded, setWhyExpanded] = useState(autoExpandWhyFlagged);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explanation, setExplanation] = useState<Explanation | null>(null);

  React.useEffect(() => {
    if (autoExpandWhyFlagged) {
      setWhyExpanded(true);
    }
  }, [autoExpandWhyFlagged]);

  const typeInfo = getFindingTypeInfo(finding.type);
  const Icon = typeInfo.icon;

  const handleToggleWhy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !whyExpanded;
    setWhyExpanded(nextState);

    if (nextState && !explanation && !loadingExplain) {
      try {
        setLoadingExplain(true);
        const data = await api.getExplanation(finding.id);
        setExplanation(data);
      } catch (err) {
        setExplanation({
          finding_id: finding.id,
          status: 'llm_unavailable',
          text: null,
          citations: [],
        });
      } finally {
        setLoadingExplain(false);
      }
    }
  };

  const decision = finding.decision;

  return (
    <div
      onClick={onSelect}
      className={clsx(
        'p-4 rounded-card border transition-all duration-150 cursor-pointer text-left select-none relative',
        isSelected
          ? 'bg-blue-50/30 border-accent shadow-sm ring-1 ring-accent'
          : 'bg-surface border-border hover:border-slate-300'
      )}
    >
      {/* Top Header: Badge, Title, Severity, Confidence */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            {findingNumber}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-primary">
              <Icon className="w-4 h-4 text-primary-muted shrink-0" />
              <span className="truncate">{typeInfo.title}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <SeverityBadge severity={finding.severity} />
        </div>
      </div>

      {/* Meta Chips: Page, Rule ID, Source, Confidence */}
      <div className="flex items-center flex-wrap gap-1.5 mt-2.5 text-[11px]">
        {finding.page > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onJumpToPage(finding.page);
            }}
            className="px-2 py-0.5 rounded-chip bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 font-mono font-medium"
            title="Click to jump to this page"
          >
            p.{finding.page}
          </button>
        )}
        <Chip variant="mono">Rule: {finding.rule_id}</Chip>
        <Chip variant="neutral" className="capitalize">
          {finding.source}
        </Chip>
        <span className="text-primary-muted text-[11px]">
          Confidence: <strong className="capitalize text-primary">{finding.confidence}</strong>
        </span>
      </div>

      {/* Reason Description */}
      <p className="text-xs text-primary mt-2.5 leading-relaxed">{finding.reason}</p>

      {/* Evidence Block (Compact Diff / Note) */}
      {(finding.evidence.before || finding.evidence.after || finding.evidence.note) && (
        <div className="mt-3 p-2.5 rounded-input bg-slate-50 border border-slate-200 text-xs space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-muted">
            Verification Evidence
          </div>

          {finding.evidence.before && finding.evidence.after && (
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="line-through bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                {finding.evidence.before}
              </span>
              <span className="text-slate-400">→</span>
              <span className="bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                {finding.evidence.after}
              </span>
            </div>
          )}

          {finding.evidence.note && (
            <div className="text-[11px] text-primary-muted italic">
              {finding.evidence.note}
            </div>
          )}
        </div>
      )}

      {/* Inline "Why flagged?" AI Explainer Button & Expansion */}
      <div className="mt-3 pt-2.5 border-t border-border/60">
        <button
          type="button"
          onClick={handleToggleWhy}
          className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>Why flagged?</span>
          {whyExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {whyExpanded && (
          <div className="mt-2.5 p-3 rounded-input bg-blue-50/40 border border-blue-200/80 text-xs space-y-2 animate-in fade-in duration-150">
            {loadingExplain ? (
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ) : explanation?.status === 'handbook_not_loaded' ? (
              <div className="text-amber-800 text-[11px]">
                Handbook not loaded: no clause citations available.
              </div>
            ) : explanation?.status === 'llm_unavailable' ? (
              <div className="text-slate-600 text-[11px]">
                Explanation unavailable right now.
              </div>
            ) : (
              <>
                <p className="text-primary leading-relaxed">
                  {explanation?.text || 'Automated verification check flagged an evidence-linked anomaly.'}
                </p>

                {explanation?.citations && explanation.citations.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <div className="text-[10px] font-semibold text-primary-muted uppercase">
                      Regulatory Handbook Citations
                    </div>
                    {explanation.citations.map((c, i) => (
                      <div key={i} className="p-2 rounded bg-white border border-blue-100 text-[11px]">
                        <span className="font-mono font-semibold text-accent mr-1.5">
                          [{c.clause_ref}]
                        </span>
                        <span className="text-primary-muted">{c.snippet}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Mandatory AI Explainer Disclaimer */}
            <div className="flex items-center gap-1.5 text-[10px] text-primary-muted pt-1 border-t border-blue-200/60">
              <Info className="w-3 h-3 text-primary-muted shrink-0" />
              <span>Explanation only. Statuses come from rules and checks, not from AI.</span>
            </div>
          </div>
        )}
      </div>

      {/* Decision Area (Officer Only) */}
      {isOfficer && (
        <div className="mt-3 pt-2.5 border-t border-border/60">
          {decision ? (
            <div className="flex items-start justify-between gap-2 p-2.5 rounded-input bg-slate-50 border border-border text-xs">
              <div>
                <div className="flex items-center gap-1.5 font-semibold">
                  {decision.action === 'accept' && (
                    <span className="text-red-700 flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5" /> Finding Accepted
                    </span>
                  )}
                  {decision.action === 'override' && (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Flag Overridden
                    </span>
                  )}
                  {decision.action === 'clarify' && (
                    <span className="text-amber-700 flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" /> Clarification Requested
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-primary mt-1 italic">&ldquo;{decision.reason}&rdquo;</p>
                <div className="text-[10px] text-primary-muted mt-1">
                  By {decision.officer} • {formatDate(decision.timestamp)}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDecision(finding, decision.action);
                }}
                className="text-[11px] font-medium text-accent hover:underline shrink-0"
              >
                Change decision
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-[11px] py-1 h-7 border-slate-300 hover:border-red-300 hover:text-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDecision(finding, 'accept');
                }}
              >
                Accept finding
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-[11px] py-1 h-7 border-slate-300 hover:border-emerald-300 hover:text-emerald-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDecision(finding, 'override');
                }}
              >
                Override flag
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-[11px] py-1 h-7 border-slate-300 hover:border-amber-300 hover:text-amber-700"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDecision(finding, 'clarify');
                }}
              >
                Ask clarify
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
