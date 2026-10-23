import React from 'react';
import { Card } from '@/components/ui/Card';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

export type KpiFilter = 'all' | 'flagged' | 'pending' | 'expiring';

interface KpiCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  filterKey: KpiFilter;
  isActive: boolean;
  onClick: () => void;
  accentColor?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  description,
  icon: Icon,
  isActive,
  onClick,
}) => {
  return (
    <Card
      onClick={onClick}
      className={clsx(
        'cursor-pointer transition-all duration-150 p-5 select-none relative overflow-hidden',
        isActive
          ? 'ring-2 ring-accent border-accent bg-accent/[0.03] shadow-md'
          : 'hover:border-slate-300 hover:shadow-xs'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted tracking-wide uppercase">{title}</p>
          <div className="text-3xl font-bold text-text tracking-tight">{value}</div>
          <p className="text-xs text-muted mt-1">{description}</p>
        </div>
        <div
          className={clsx(
            'p-2.5 rounded-xl border',
            isActive
              ? 'bg-accent text-white border-accent'
              : 'bg-bg text-muted border-border'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent" />
      )}
    </Card>
  );
};
