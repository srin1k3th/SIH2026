import React from 'react';
import clsx from 'clsx';
import { Severity } from '@/types';

export interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
  showDot?: boolean;
}

export function SeverityBadge({ severity, className, showDot = true }: SeverityBadgeProps) {
  const styles = {
    high: 'text-severity-high bg-severity-high-bg border-severity-high/20',
    medium: 'text-severity-medium bg-severity-medium-bg border-severity-medium/20',
    low: 'text-severity-low bg-severity-low-bg border-severity-low/20',
  };

  const dots = {
    high: 'bg-severity-high',
    medium: 'bg-severity-medium',
    low: 'bg-severity-low',
  };

  const labels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-chip border',
        styles[severity],
        className
      )}
    >
      {showDot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dots[severity])} />}
      {labels[severity]}
    </span>
  );
}

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'accent' | 'warning' | 'mono';
  icon?: React.ReactNode;
}

export function Chip({ className, variant = 'neutral', icon, children, ...props }: ChipProps) {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: 'bg-blue-50 text-accent border-blue-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-300',
    mono: 'bg-slate-100 text-slate-800 border-slate-200 font-mono',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-chip border',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
