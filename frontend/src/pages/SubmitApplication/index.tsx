import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Category, ChecklistRow, PrecheckResult } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropzone } from '@/components/ui/Dropzone';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/Dialog';
import { Skeleton, ErrorBanner } from '@/components/ui/Feedback';
import { useToast } from '@/components/ui/Toast';
import {
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

type Step = 1 | 2 | 3;

export const SubmitApplication: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Stepper State
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_eoa');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [precheckResult, setPrecheckResult] = useState<PrecheckResult | null>(null);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);

  // Queries
  const {
    data: categories = [],
    isLoading: loadingCategories,
    isError: errorCategories,
  } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.getCategories(),
  });

  const {
    data: checklist = [],
    isLoading: loadingChecklist,
  } = useQuery<ChecklistRow[]>({
    queryKey: ['checklist', selectedCategoryId],
    queryFn: () => api.getChecklist(selectedCategoryId),
    enabled: Boolean(selectedCategoryId),
  });

  // Precheck Mutation
  const precheckMutation = useMutation({
    mutationFn: () => api.precheckApplication(),
    onSuccess: (result) => {
      setPrecheckResult(result);
      if (result.ok) {
        toast('Pre-check passed! All documents clear for submission.', 'success');
      } else {
        toast(`Pre-check completed with ${result.issues.length} potential issues identified.`, 'info');
      }
    },
    onError: (err: any) => {
      toast(err?.message || 'Pre-check failed', 'error');
    },
  });

  // Create Application Mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const filesPayload = Object.entries(uploadedFiles).map(([docType, file]) => ({
        docType,
        filename: file.name,
      }));
      return api.createApplication(selectedCategoryId, filesPayload);
    },
    onSuccess: (newApp) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      toast(`Application ${newApp.id} submitted successfully!`, 'success');
      navigate(`/applications/${newApp.id}`);
    },
    onError: (err: any) => {
      toast(err?.message || 'Failed to submit application', 'error');
    },
  });

  // Validation: are all required documents uploaded?
  const requiredSlots = checklist.filter((item) => item.required);
  const uploadedRequiredSlots = requiredSlots.filter((item) => Boolean(uploadedFiles[item.doc_type]));
  const allRequiredUploaded = requiredSlots.length > 0 && uploadedRequiredSlots.length === requiredSlots.length;

  const handleFileSelect = (docType: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const handleFileRemove = (docType: string) => {
    setUploadedFiles((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
  };

  const handleRunPrecheck = async () => {
    await precheckMutation.mutateAsync();
  };

  const handleFinalSubmit = () => {
    const hasIssues = precheckResult && !precheckResult.ok && precheckResult.issues.length > 0;
    if (hasIssues) {
      setConfirmSubmitOpen(true);
    } else {
      submitMutation.mutate();
    }
  };

  if (loadingCategories) {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (errorCategories) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Failed to Load Categories"
          message="Could not load AICTE approval categories. Please try again."
        />
      </div>
    );
  }

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-text transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </Link>
        <h1 className="text-2xl font-bold text-text">New AICTE Approval Application</h1>
        <p className="text-xs text-muted mt-0.5">
          Follow the 3-step regulatory compliance and document verification submission workflow.
        </p>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-surface rounded-xl border border-border p-4 shadow-xs">
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 */}
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer',
              currentStep === 1
                ? 'bg-accent/10 border border-accent/30'
                : 'hover:bg-bg'
            )}
          >
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                currentStep > 1
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 1
                  ? 'bg-accent text-white'
                  : 'bg-slate-200 text-muted'
              )}
            >
              {currentStep > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="text-xs font-semibold text-text">1. Category</div>
              <div className="text-[11px] text-muted truncate">Choose approval type</div>
            </div>
          </button>

          {/* Step 2 */}
          <button
            type="button"
            onClick={() => setCurrentStep(2)}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer',
              currentStep === 2
                ? 'bg-accent/10 border border-accent/30'
                : 'hover:bg-bg'
            )}
          >
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                currentStep > 2
                  ? 'bg-emerald-600 text-white'
                  : currentStep === 2
                  ? 'bg-accent text-white'
                  : 'bg-slate-200 text-muted'
              )}
            >
              {currentStep > 2 ? <CheckCircle2 className="w-4 h-4" /> : '2'}
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="text-xs font-semibold text-text">2. Documents</div>
              <div className="text-[11px] text-muted truncate">
                {uploadedRequiredSlots.length}/{requiredSlots.length} required
              </div>
            </div>
          </button>

          {/* Step 3 */}
          <button
            type="button"
            onClick={() => setCurrentStep(3)}
            disabled={!allRequiredUploaded && currentStep < 3}
            className={clsx(
              'flex items-center gap-3 p-3 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
              currentStep === 3
                ? 'bg-accent/10 border border-accent/30'
                : 'hover:bg-bg'
            )}
          >
            <div
              className={clsx(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                currentStep === 3
                  ? 'bg-accent text-white'
                  : 'bg-slate-200 text-muted'
              )}
            >
              3
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="text-xs font-semibold text-text">3. Pre-check & Submit</div>
              <div className="text-[11px] text-muted truncate">Automated verification</div>
            </div>
          </button>
        </div>
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-text">Step 1: Select AICTE Approval Category</h2>
            <p className="text-xs text-muted">
              Choose the statutory application category you are applying for. The required document checklist updates dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <Card
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={clsx(
                    'p-5 cursor-pointer transition-all duration-150 select-none relative',
                    isSelected
                      ? 'ring-2 ring-accent border-accent bg-accent/[0.03] shadow-md'
                      : 'hover:border-slate-300 hover:shadow-xs'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-bg text-muted border border-border">
                      {cat.id}
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-accent" />}
                  </div>
                  <h3 className="font-bold text-text text-sm mb-1">{cat.label}</h3>
                  <p className="text-xs text-muted leading-relaxed">{cat.description}</p>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <Button
              variant="primary"
              onClick={() => setCurrentStep(2)}
              className="px-6"
            >
              <span>Continue to Documents</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: DOCUMENTS CHECKLIST UPLOAD */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-text">
                Step 2: Upload Documents for {selectedCategory?.label}
              </h2>
              <p className="text-xs text-muted">
                PDF format only. Maximum 10 MB per file. All mandatory slots must be uploaded before submission.
              </p>
            </div>
            <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-bg border border-border text-text shrink-0">
              {uploadedRequiredSlots.length} of {requiredSlots.length} mandatory documents uploaded
            </div>
          </div>

          {loadingChecklist ? (
            <div className="space-y-4">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {checklist.map((item) => {
                const uploadedFile = uploadedFiles[item.doc_type];

                return (
                  <div
                    key={item.doc_type}
                    className="bg-surface rounded-xl border border-border p-4 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-text">{item.label}</span>
                          {item.required ? (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Mandatory
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-slate-100 text-muted">
                              Optional
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-0.5">{item.description}</p>
                      </div>

                      {uploadedFile && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Attached
                        </span>
                      )}
                    </div>

                    <Dropzone
                      label={`Upload ${item.label}`}
                      description="Click or drag PDF file here"
                      required={item.required}
                      file={uploadedFile}
                      onFileSelect={(file) => handleFileSelect(item.doc_type, file)}
                      onFileRemove={() => handleFileRemove(item.doc_type)}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Category
            </Button>
            <Button
              variant="primary"
              onClick={() => setCurrentStep(3)}
              disabled={!allRequiredUploaded}
            >
              <span>Continue to Pre-check</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: PRE-CHECK & SUBMIT */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-text">Step 3: Automated Regulatory Pre-Check</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                (sample result)
              </span>
            </div>
            <p className="text-xs text-muted">
              Run automated AICTE heuristics and document sanity tests before official dispatch to the scrutiny bureau.
            </p>
          </div>

          {/* Pre-check trigger card */}
          <div className="bg-surface rounded-xl border border-border p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-semibold text-sm text-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>Pre-flight Document Inspection</span>
              </div>
              <p className="text-xs text-muted">
                Validates readability, dates, signature integrity, and document completeness.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={handleRunPrecheck}
              loading={precheckMutation.isPending}
              disabled={precheckMutation.isPending}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {precheckMutation.isPending ? 'Inspecting files...' : 'Run Pre-Check'}
            </Button>
          </div>

          {/* Pre-check Results */}
          {precheckResult && (
            <div className="space-y-4 animate-in fade-in-50">
              {precheckResult.ok ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 shadow-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-emerald-950 text-sm">
                      All Pre-Check Validations Passed
                    </h3>
                    <p className="text-xs text-emerald-900/80 mt-1">
                      No expired certificates, format discrepancies, or missing pages detected. Ready for official officer review.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <h3 className="font-semibold text-amber-950 text-sm">
                      {precheckResult.issues.length} Potential Issues Flagged During Pre-Check
                    </h3>
                  </div>

                  <div className="space-y-2 pt-1">
                    {precheckResult.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="bg-surface rounded-lg p-3 border border-amber-200 text-xs flex items-start justify-between gap-3 shadow-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-text capitalize">
                              {issue.doc_type.replace(/_/g, ' ')}
                            </span>
                            <span
                              className={clsx(
                                'text-[10px] uppercase font-bold px-1.5 py-0.5 rounded',
                                issue.kind === 'expired'
                                  ? 'bg-red-100 text-red-800'
                                  : issue.kind === 'missing'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              )}
                            >
                              {issue.kind}
                            </span>
                          </div>
                          <p className="text-muted">{issue.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submission Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>

            <Button
              variant="primary"
              onClick={handleFinalSubmit}
              loading={submitMutation.isPending}
              disabled={!allRequiredUploaded || submitMutation.isPending}
            >
              <FileCheck className="w-4 h-4 mr-2" />
              Submit Application
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog if submitting with unresolved precheck issues */}
      <Dialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              Submit with Unresolved Issues?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted">
              Pre-check identified {precheckResult?.issues.length} potential regulatory issues with your uploaded documents.
              These will be highlighted as deficiencies for the AICTE review officer.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-bg p-3 rounded-lg border border-border text-xs text-muted space-y-1 my-2">
            <div>• Deficiencies may delay application approval processing.</div>
            <div>• You may replace flagged documents after submission in your application dashboard.</div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmSubmitOpen(false)}
            >
              Review Documents
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setConfirmSubmitOpen(false);
                submitMutation.mutate();
              }}
              loading={submitMutation.isPending}
            >
              Proceed and Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
