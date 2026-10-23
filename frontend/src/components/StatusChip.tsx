import clsx from 'clsx';
import { DocStatus } from '@/types';
import { STATUS_MAP } from '@/lib/statusMap';

export interface StatusChipProps {
  status: DocStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export function StatusChip({ status, className, size = 'sm' }: StatusChipProps) {
  const config = STATUS_MAP[status] || STATUS_MAP.verified;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-sm px-3 py-1 gap-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-chip border shrink-0 select-none',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={clsx('shrink-0', iconSizes[size])} />
      <span>{config.label}</span>
    </span>
  );
}
