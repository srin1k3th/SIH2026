import { getRiskBand, getRiskColor, RISK_FORMULA_EXPLANATION } from '@/lib/risk';
import { Tooltip } from './Tooltip';
import clsx from 'clsx';

export interface ProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showBand?: boolean;
  className?: string;
}

export function ProgressRing({
  score,
  size = 56,
  strokeWidth = 5,
  showBand = true,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;
  const color = getRiskColor(clampedScore);
  const band = getRiskBand(clampedScore);

  return (
    <Tooltip
      content={
        <div className="space-y-1">
          <div className="font-semibold">Risk: {clampedScore}/100 ({band})</div>
          <div className="text-[11px] opacity-90">{RISK_FORMULA_EXPLANATION}</div>
        </div>
      }
    >
      <div className={clsx('inline-flex items-center gap-3 shrink-0 cursor-help', className)}>
        <div className="relative inline-flex items-center justify-center">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Active Progress */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <span className="absolute font-mono font-bold text-sm text-primary">
            {clampedScore}
          </span>
        </div>
        {showBand && (
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold" style={{ color }}>
              {band} Risk
            </span>
            <span className="text-[11px] text-primary-muted font-mono">{clampedScore}/100</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
}
