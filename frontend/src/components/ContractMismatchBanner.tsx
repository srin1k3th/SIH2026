import { useState, useEffect } from 'react';
import { AlertOctagon, X } from 'lucide-react';

interface MismatchDetails {
  endpoint: string;
  issues: string;
}

export function ContractMismatchBanner() {
  const [mismatches, setMismatches] = useState<MismatchDetails[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<MismatchDetails>;
      if (custom.detail) {
        setMismatches((prev) => [...prev, custom.detail]);
      }
    };

    window.addEventListener('contract-mismatch', handler);
    return () => window.removeEventListener('contract-mismatch', handler);
  }, []);

  if (mismatches.length === 0) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-red-600 text-white px-4 py-2 text-xs flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2 overflow-hidden">
        <AlertOctagon className="w-4 h-4 shrink-0 text-white animate-pulse" />
        <span className="font-semibold shrink-0">Contract mismatch:</span>
        <span className="truncate">
          {mismatches[mismatches.length - 1].endpoint}: {mismatches[mismatches.length - 1].issues}
        </span>
      </div>
      <button
        onClick={() => setMismatches([])}
        className="text-white/80 hover:text-white p-1 ml-2"
        title="Dismiss contract warnings"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
