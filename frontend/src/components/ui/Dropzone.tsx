import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertTriangle } from 'lucide-react';
import { formatFileSize } from '@/lib/format';
import clsx from 'clsx';

export interface DropzoneProps {
  label: string;
  description: string;
  required?: boolean;
  file?: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  className?: string;
}

export function Dropzone({
  label,
  description,
  required = false,
  file,
  onFileSelect,
  onFileRemove,
  className,
}: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleValidateAndSelect = (selectedFile: File) => {
    setError(null);
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setError('Only PDF documents are accepted.');
      return;
    }
    const maxBytes = 10 * 1024 * 1024; // 10 MB
    if (selectedFile.size > maxBytes) {
      setError(`File size (${formatFileSize(selectedFile.size)}) exceeds maximum allowed 10 MB.`);
      return;
    }
    onFileSelect(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleValidateAndSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-primary">{label}</span>
          <span
            className={clsx(
              'text-[11px] font-medium px-2 py-0.5 rounded-chip border',
              required
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            )}
          >
            {required ? 'Required' : 'Optional'}
          </span>
        </div>
      </div>
      <p className="text-xs text-primary-muted">{description}</p>

      {file ? (
        <div className="flex items-center justify-between p-3.5 rounded-input bg-slate-50 border border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 rounded bg-red-100 text-red-700 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-primary truncate">{file.name}</p>
              <p className="text-xs text-primary-muted">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClick}
              className="text-xs font-medium text-accent hover:underline px-2 py-1"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={onFileRemove}
              className="p-1 rounded text-primary-muted hover:text-red-700 hover:bg-red-50"
              title="Remove document"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={clsx(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-input cursor-pointer transition-colors',
            isDragging
              ? 'border-accent bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-white'
          )}
        >
          <UploadCloud className="w-8 h-8 text-primary-muted mb-2" />
          <p className="text-xs font-medium text-primary">
            Click to upload or drag & drop PDF
          </p>
          <p className="text-[11px] text-primary-muted mt-0.5">Maximum file size: 10 MB</p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleValidateAndSelect(e.target.files[0]);
          }
        }}
      />
    </div>
  );
}
