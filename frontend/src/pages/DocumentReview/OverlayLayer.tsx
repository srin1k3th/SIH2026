import React from 'react';
import { Finding, PageSize } from '@/types';
import { bboxToPixelRect, bboxesOverlap } from '@/lib/geometry';
import { Tooltip } from '@/components/ui/Tooltip';
import { getFindingTypeInfo } from '@/lib/findingTypes';
import clsx from 'clsx';

export interface OverlayLayerProps {
  findings: Finding[];
  pageNumber: number;
  displayedWidth: number;
  pageSize: PageSize;
  selectedFindingId: string | null;
  onSelectFinding: (id: string) => void;
  findingNumberMap: Record<string, number>;
  viewedRev: number;
  currentRev: number;
  overlaysEnabled: boolean;
  severityFilter?: string;
}

export function OverlayLayer({
  findings,
  pageNumber,
  displayedWidth,
  pageSize,
  selectedFindingId,
  onSelectFinding,
  findingNumberMap,
  viewedRev,
  currentRev,
  overlaysEnabled,
  severityFilter = 'all',
}: OverlayLayerProps) {
  if (!overlaysEnabled) return null;

  // Filter findings for this page that have non-null bboxes
  const pageFindings = findings.filter((f) => {
    if (f.page !== pageNumber || !f.bbox) return false;
    if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    return true;
  });

  const isPastRev = viewedRev < currentRev;

  // Group overlapping findings so clicking cycles through them
  const handleOverlayClick = (clickedFinding: Finding, e: React.MouseEvent) => {
    e.stopPropagation();

    // Find all overlapping findings on this page
    const overlapping = pageFindings.filter(
      (f) => f.id === clickedFinding.id || bboxesOverlap(f.bbox, clickedFinding.bbox)
    );

    if (overlapping.length <= 1) {
      onSelectFinding(clickedFinding.id);
      return;
    }

    // Cycle through overlapping findings
    const currentIndex = overlapping.findIndex((f) => f.id === selectedFindingId);
    if (currentIndex === -1 || currentIndex === overlapping.length - 1) {
      onSelectFinding(overlapping[0].id);
    } else {
      onSelectFinding(overlapping[currentIndex + 1].id);
    }
  };

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: displayedWidth, height: (displayedWidth / pageSize.width) * pageSize.height }}
    >
      {pageFindings.map((finding) => {
        const rect = bboxToPixelRect(finding.bbox, displayedWidth, pageSize);
        if (!rect) return null;

        const isSelected = selectedFindingId === finding.id;
        const findingNum = findingNumberMap[finding.id] || 1;
        const typeInfo = getFindingTypeInfo(finding.type);

        // Check if this finding overlaps with others
        const overlappingCount = pageFindings.filter(
          (f) => f.id !== finding.id && bboxesOverlap(f.bbox, finding.bbox)
        ).length;

        // When viewing past revision, findings changed in future revisions get dashed styling
        const isChangedInFutureRev =
          isPastRev && (finding.evidence.revision ?? currentRev) > viewedRev;

        const severityColors = {
          high: {
            border: '#D92D20',
            bg: 'rgba(217, 45, 32, 0.12)',
            badge: 'bg-red-600',
          },
          medium: {
            border: '#F79009',
            bg: 'rgba(247, 144, 9, 0.12)',
            badge: 'bg-amber-600',
          },
          low: {
            border: '#2E90FA',
            bg: 'rgba(46, 144, 250, 0.12)',
            badge: 'bg-blue-600',
          },
        };

        const col = severityColors[finding.severity] || severityColors.high;

        return (
          <Tooltip
            key={finding.id}
            side="top"
            content={
              <div className="space-y-1 max-w-xs text-left">
                <div className="font-semibold flex items-center justify-between gap-2">
                  <span>#{findingNum} {typeInfo.title}</span>
                  {overlappingCount > 0 && (
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                      {overlappingCount + 1} findings here
                    </span>
                  )}
                </div>
                <div className="text-[11px] opacity-90 line-clamp-2">{finding.reason}</div>
                {overlappingCount > 0 && (
                  <div className="text-[10px] text-amber-200">
                    Click to cycle overlapping findings
                  </div>
                )}
              </div>
            }
          >
            <div
              onClick={(e) => handleOverlayClick(finding, e)}
              className={clsx(
                'absolute pointer-events-auto cursor-pointer transition-all duration-150 select-none group',
                isSelected && 'animate-pulse-select ring-2 ring-accent'
              )}
              style={{
                left: `${rect.left}px`,
                top: `${rect.top}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                borderWidth: isSelected ? '3px' : '2px',
                borderStyle: isChangedInFutureRev ? 'dashed' : 'solid',
                borderColor: col.border,
                backgroundColor: isChangedInFutureRev ? 'transparent' : col.bg,
              }}
            >
              {/* Finding Number Badge in corner */}
              <div
                className={clsx(
                  'absolute -top-3 -left-3 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shadow-xs',
                  col.badge
                )}
              >
                {findingNum}
              </div>

              {/* Overlapping Counter Indicator */}
              {overlappingCount > 0 && (
                <div className="absolute -top-3 -right-3 px-1.5 py-0.5 rounded-chip bg-slate-800 text-white text-[9px] font-mono shadow-xs border border-slate-600">
                  +{overlappingCount}
                </div>
              )}

              {/* Revision note label for past revision view */}
              {isChangedInFutureRev && (
                <div className="absolute inset-x-0 -bottom-4 text-[9px] font-mono font-medium text-amber-800 bg-amber-50 px-1 border border-amber-300 rounded whitespace-nowrap overflow-hidden text-center truncate">
                  Changed in rev {finding.evidence.revision}
                </div>
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
}
