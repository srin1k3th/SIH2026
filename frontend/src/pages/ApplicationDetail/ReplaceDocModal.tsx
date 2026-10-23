import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Dropzone } from '@/components/ui/Dropzone';
import { UploadCloud, FileCheck } from 'lucide-react';

interface ReplaceDocModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentLabel: string;
  currentFilename?: string;
  onReplace: (docId: string, newFilename: string) => Promise<void>;
}

export const ReplaceDocModal: React.FC<ReplaceDocModalProps> = ({
  open,
  onOpenChange,
  documentId,
  documentLabel,
  currentFilename,
  onReplace,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setSubmitting(true);
    try {
      await onReplace(documentId, selectedFile.name);
      setSelectedFile(null);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-accent" />
            Replace Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-bg p-3 rounded-lg border border-border text-xs space-y-1">
            <div className="font-semibold text-text">{documentLabel}</div>
            {currentFilename && (
              <div className="text-muted font-mono">Current file: {currentFilename}</div>
            )}
          </div>

          <div>
            <Dropzone
              label="Upload New PDF Document"
              description="Max 10 MB. PDF format only."
              required
              file={selectedFile}
              onFileSelect={(file) => setSelectedFile(file)}
              onFileRemove={() => setSelectedFile(null)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedFile || submitting}
            loading={submitting}
          >
            <FileCheck className="w-4 h-4 mr-1.5" />
            Upload and Replace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
