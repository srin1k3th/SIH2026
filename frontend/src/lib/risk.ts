import { Severity } from '@/types';

export const RISK_WEIGHTS: Record<Severity, number> = {
  high: 15,
  medium: 7,
  low: 2,
};

export const RISK_FORMULA_EXPLANATION =
  'Risk Score = min(100, 15 × High + 7 × Medium + 2 × Low flags)';

export function calculateRiskScore(counts: Record<Severity, number>): number {
  const raw =
    counts.high * RISK_WEIGHTS.high +
    counts.medium * RISK_WEIGHTS.medium +
    counts.low * RISK_WEIGHTS.low;
  return Math.min(100, Math.max(0, raw));
}

export type RiskBand = 'High' | 'Medium' | 'Low';

export function getRiskBand(score: number): RiskBand {
  if (score >= 60) return 'High';
  if (score >= 30) return 'Medium';
  return 'Low';
}

export function getRiskColor(score: number): string {
  if (score >= 60) return '#D92D20'; // severity.high
  if (score >= 30) return '#F79009'; // severity.medium
  return '#12B76A'; // safe / low
}
