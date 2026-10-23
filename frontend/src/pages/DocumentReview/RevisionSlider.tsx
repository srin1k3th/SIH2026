import React from 'react';
import type { Revision } from '@/types';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { Columns, History, Layers } from 'lucide-react';

interface RevisionSliderProps {
  revisions: Revision[];
  selectedRev: number;
  onSelectRev: (rev: number) => void;
  isCompareMode: boolean;
  onToggleCompare: (compare: boolean) => void;
}

export const RevisionSlider: React.FC<RevisionSliderProps> = ({
  revisions,
  selectedRev,
  onSelectRev,
  isCompareMode,
  onToggleCompare,
}) => {
  if (revisions.length <= 1) return null;

  const minRev = 1;
  const maxRev = revisions.length;

  return (
    <div className="bg-surface/95 backdrop-blur border-b border-border px-4 py-2.5 flex items-center justify-between gap-6 shadow-xs select-none">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-text">
          <History className="w-4 h-4 text-accent" />
          <span>Document Revisions</span>
        </div>
        <span className="text-xs text-muted">
          (Viewing Rev {selectedRev} of {maxRev})
        </span>
      </div>

      {/* Discrete Slider */}
      <div className="flex-1 max-w-md flex flex-col gap-1">
        <SliderPrimitive.Root
          className="relative flex items-center select-none touch-none w-full h-5"
          value={[selectedRev]}
          min={minRev}
          max={maxRev}
          step={1}
          onValueChange={([val]) => onSelectRev(val)}
        >
          <SliderPrimitive.Track className="bg-slate-200 relative grow rounded-full h-1.5 cursor-pointer">
            <SliderPrimitive.Range className="absolute bg-accent rounded-full h-full" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className="block w-4 h-4 bg-surface border-2 border-accent rounded-full shadow transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-grab active:cursor-grabbing"
            aria-label="Document revision"
          />
        </SliderPrimitive.Root>

        {/* Labels below tick marks */}
        <div className="flex justify-between items-center text-[10px] text-muted font-mono px-1">
          {revisions.map((rev) => (
            <button
              key={rev.rev}
              type="button"
              onClick={() => onSelectRev(rev.rev)}
              className={`hover:text-text transition-colors flex flex-col items-center cursor-pointer ${
                selectedRev === rev.rev ? 'text-accent font-semibold' : ''
              }`}
              title={rev.producer ? `Producer: ${rev.producer}` : undefined}
            >
              <span>Rev {rev.rev}: {rev.label}</span>
              <span className="text-[9px] text-muted">{rev.saved_at}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls: Compare Mode */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleCompare(!isCompareMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            isCompareMode
              ? 'bg-accent text-white border-accent shadow-xs'
              : 'bg-surface text-text border-border hover:bg-bg'
          }`}
          title="Toggle side-by-side comparison"
        >
          <Columns className="w-3.5 h-3.5" />
          <span>Compare Side-by-Side</span>
        </button>

        {selectedRev < maxRev && !isCompareMode && (
          <button
            type="button"
            onClick={() => onSelectRev(maxRev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-accent hover:bg-accent/10 transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Reset to Current</span>
          </button>
        )}
      </div>
    </div>
  );
};
