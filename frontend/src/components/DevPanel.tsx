import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { mockStore } from '@/api/mockStore';
import { api } from '@/api/client';
import { Button } from './ui/Button';
import { useToast } from './ui/Toast';
import { Wrench, ChevronUp, ChevronDown, RefreshCcw, Bug, Clock, ShieldAlert } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function DevPanel() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isChainCorrupted, setIsChainCorrupted] = useState(false);
  const { success, info } = useToast();
  const queryClient = useQueryClient();

  // Active only when ?dev=1 is in URL and mock mode is on
  const isDevMode =
    new URLSearchParams(location.search).get('dev') === '1' && api.isMock;

  useEffect(() => {
    // Check initial chain state
    const verify = mockStore.verifyAuditChain();
    setIsChainCorrupted(!verify.valid);
  }, []);

  if (!isDevMode) return null;

  const handleReset = () => {
    mockStore.reset();
    setIsChainCorrupted(false);
    queryClient.invalidateQueries();
    success('Mock data restored to initial demo state.');
  };

  const handleSimulateError = () => {
    mockStore.simulateErrorNextCall = true;
    info('Next API call will fail with a simulated network error.');
  };

  const handleToggleSlow = () => {
    mockStore.simulateSlowNetwork = !mockStore.simulateSlowNetwork;
    info(
      mockStore.simulateSlowNetwork
        ? 'Slow network simulated (3000ms delay).'
        : 'Network speed restored to normal.'
    );
  };

  const handleToggleCorruptChain = () => {
    if (isChainCorrupted) {
      mockStore.repairAuditChain();
      setIsChainCorrupted(false);
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      success('Audit hash chain repaired.');
    } else {
      mockStore.corruptAuditEvent7();
      setIsChainCorrupted(true);
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      info('Corrupted hash of audit event #7 to test verification failure.');
    }
  };

  return (
    <aside
      aria-label="Developer Testing Panel"
      className="fixed bottom-4 left-4 z-50 bg-slate-900 text-white rounded-card shadow-elevated border border-slate-700 w-72 overflow-hidden text-xs"
    >
      <header
        className="px-3.5 py-2.5 bg-slate-800 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 font-mono font-medium text-amber-400">
          <Wrench className="w-3.5 h-3.5" />
          <span>DEV PANEL (?dev=1)</span>
        </div>
        <button
          className="text-slate-400 hover:text-white"
          aria-label={isOpen ? 'Collapse developer panel' : 'Expand developer panel'}
        >
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </header>

      {isOpen && (
        <div className="p-3 space-y-2 bg-slate-900">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            icon={<RefreshCcw className="w-3.5 h-3.5" />}
            className="w-full justify-start text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-700"
          >
            Reset mock data
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleSimulateError}
            icon={<Bug className="w-3.5 h-3.5" />}
            className="w-full justify-start text-red-300 hover:bg-slate-800 hover:text-red-200 border border-slate-700"
          >
            Simulate API error on next call
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleSlow}
            icon={<Clock className="w-3.5 h-3.5" />}
            className="w-full justify-start text-amber-300 hover:bg-slate-800 hover:text-amber-200 border border-slate-700"
          >
            {mockStore.simulateSlowNetwork ? 'Disable slow network' : 'Simulate slow network (3s)'}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleCorruptChain}
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
            className="w-full justify-start text-purple-300 hover:bg-slate-800 hover:text-purple-200 border border-slate-700"
          >
            {isChainCorrupted ? 'Repair audit chain' : 'Corrupt audit event #7'}
          </Button>
        </div>
      )}
    </aside>
  );
}
