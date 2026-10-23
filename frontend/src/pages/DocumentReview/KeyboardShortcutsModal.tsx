import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
  { key: 'j / k', desc: 'Jump to Next / Previous finding' },
  { key: '[ / ]', desc: 'Jump to Previous / Next page' },
  { key: '+ / -', desc: 'Zoom In / Zoom Out' },
  { key: '0', desc: 'Reset zoom to Fit Width' },
  { key: 'o', desc: 'Toggle overlay bounding boxes on/off' },
  { key: 'e', desc: 'Toggle "Why flagged?" explanation for selected finding' },
  { key: '?', desc: 'Show this keyboard shortcuts guide' },
  { key: 'Esc', desc: 'Close dialogs or clear selection' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-accent" />
            Document Review Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 divide-y divide-border">
          {SHORTCUTS.map((sc) => (
            <div key={sc.key} className="py-2.5 flex items-center justify-between text-sm">
              <span className="text-muted">{sc.desc}</span>
              <kbd className="px-2 py-1 bg-bg border border-border rounded text-xs font-mono font-semibold text-text shadow-xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-bg rounded-lg border border-border text-xs text-muted text-center">
          Shortcuts are active while viewing the document and navigating findings.
        </div>
      </DialogContent>
    </Dialog>
  );
};
