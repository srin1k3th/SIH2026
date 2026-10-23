import React from 'react';
import clsx from 'clsx';
import { Card } from './Card';

export interface StatProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Stat({
  label,
  value,
  subtext,
  icon,
  active = false,
  onClick,
  className,
}: StatProps) {
  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className={clsx(
        'p-5 transition-all duration-150',
        active && 'ring-2 ring-accent border-accent/40 bg-blue-50/20',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-primary-muted uppercase tracking-wider">
            {label}
          </p>
          <div className="text-2xl font-bold text-primary mt-1">{value}</div>
          {subtext && <p className="text-xs text-primary-muted mt-1">{subtext}</p>}
        </div>
        {icon && (
          <div className="p-2.5 rounded-input bg-slate-100 text-primary-muted shrink-0">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
