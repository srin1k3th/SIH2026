import React from 'react';
import clsx from 'clsx';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('animate-pulse rounded-input bg-slate-200/70', className)}
      {...props}
    />
  );
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 text-center bg-surface border border-dashed border-border rounded-card',
        className
      )}
    >
      {icon && <div className="text-primary-muted mb-3">{icon}</div>}
      <h3 className="text-base font-semibold text-primary">{title}</h3>
      <p className="text-sm text-primary-muted mt-1 max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface ErrorBannerProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorBanner({
  title = 'An error occurred',
  message,
  onRetry,
  className,
}: ErrorBannerProps) {
  return (
    <div
      className={clsx(
        'flex items-start justify-between gap-4 p-4 rounded-card bg-red-50 border border-red-200 text-red-900',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-semibold">{title}</h4>
          <p className="text-xs text-red-700 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-red-300 bg-white text-red-800 hover:bg-red-50 shrink-0"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
