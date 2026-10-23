import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document as PdfDocument, Page as PdfPage } from 'react-pdf';
import '@/lib/pdfWorker';

import type { Finding, Severity, FindingSource } from '@/types';
import { api } from '@/api/client';
import { StatusChip } from '@/components/StatusChip';
import { Skeleton, EmptyState, ErrorBanner } from '@/components/ui/Feedback';
import { TooltipProvider } from '@/components/ui/Tooltip';
import { useToast } from '@/components/ui/Toast';
import { useRole } from '@/context/RoleContext';

import { OverlayLayer } from './OverlayLayer';
import { FindingCard } from './FindingCard';
import { DocumentInfoTab } from './DocumentInfoTab';
import { RevisionSlider } from './RevisionSlider';
import { DecisionDialog } from './DecisionDialog';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';

import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  SidebarClose,
  SidebarOpen,
  AlertTriangle,
  Info,
  CheckCircle,
} from 'lucide-react';

export const DocumentReview: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isOfficer } = useRole();

  // Queries
  const {
    data: doc,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['document', id],
    queryFn: () => api.getDocument(id),
    enabled: Boolean(id),
  });

  // State
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(
    searchParams.get('finding')
  );
  const [activeTab, setActiveTab] = useState<'findings' | 'info'>('findings');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<FindingSource | 'all'>('all');
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1.0); // 1.0 = 100%
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  // Revision & Compare State
  const [selectedRev, setSelectedRev] = useState<number>(1);
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    finding: Finding | null;
    action: 'accept' | 'override' | 'clarify';
  }>({
    open: false,
    finding: null,
    action: 'accept',
  });

  // Refs for scrolling
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const compareLeftViewerRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Sync revision when doc loads
  useEffect(() => {
    if (doc?.revisions && doc.revisions.length > 0) {
      const current = doc.revisions.find((r) => r.is_current)?.rev || doc.revisions.length;
      setSelectedRev(current);
    }
  }, [doc]);

  // Keep URL query param in sync with selected finding
  useEffect(() => {
    const findingInUrl = searchParams.get('finding');
    if (findingInUrl && findingInUrl !== selectedFindingId) {
      setSelectedFindingId(findingInUrl);
    }
  }, [searchParams, selectedFindingId]);

  const handleSelectFinding = useCallback(
    (findingId: string) => {
      setSelectedFindingId(findingId);
      setSearchParams(
        (prev) => {
          prev.set('finding', findingId);
          return prev;
        },
        { replace: true }
      );

      // Scroll card in right panel into view
      setTimeout(() => {
        const cardElem = document.getElementById(`finding-card-${findingId}`);
        if (cardElem) {
          cardElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);

      // Scroll viewer to box
      const targetFinding = doc?.findings.find((f) => f.id === findingId);
      if (targetFinding && targetFinding.bbox) {
        setCurrentPage(targetFinding.page);
        const overlayBox = document.getElementById(`overlay-box-${findingId}`);
        if (overlayBox) {
          overlayBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    },
    [doc, setSearchParams]
  );

  // Finding number mapping (order by severity then page)
  const findingNumberMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!doc?.findings) return map;
    const sorted = [...doc.findings].sort((a, b) => {
      const sevOrder = { high: 0, medium: 1, low: 2 };
      if (sevOrder[a.severity] !== sevOrder[b.severity]) {
        return sevOrder[a.severity] - sevOrder[b.severity];
      }
      return a.page - b.page;
    });
    sorted.forEach((f, idx) => {
      map[f.id] = idx + 1;
    });
    return map;
  }, [doc?.findings]);

  // Filtered findings
  const filteredFindings = useMemo(() => {
    if (!doc?.findings) return [];
    return doc.findings.filter((f) => {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
      if (sourceFilter !== 'all' && f.source !== sourceFilter) return false;
      return true;
    });
  }, [doc?.findings, severityFilter, sourceFilter]);

  // Total findings by severity
  const severityCounts = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    doc?.findings.forEach((f) => {
      counts[f.severity] = (counts[f.severity] || 0) + 1;
    });
    return counts;
  }, [doc?.findings]);

  // Decision Mutation
  const decisionMutation = useMutation({
    mutationFn: ({
      findingId,
      action,
      reason,
    }: {
      findingId: string;
      action: 'accept' | 'override' | 'clarify';
      reason: string;
    }) => api.recordDecision(findingId, action, reason),
    onSuccess: (data) => {
      toast(`Finding marked as ${data.action}ed`, 'success');
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['application', doc?.application_id] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      setDecisionModal((prev) => ({ ...prev, open: false }));
    },
    onError: (err: any) => {
      toast(err?.message || 'Could not record decision', 'error');
    },
  });

  // Synchronize scrolling in compare mode
  const handleScrollSync = (source: 'left' | 'right') => {
    if (!isCompareMode) return;
    const left = compareLeftViewerRef.current;
    const right = viewerContainerRef.current;
    if (!left || !right) return;

    if (source === 'left') {
      right.scrollTop = left.scrollTop;
    } else {
      left.scrollTop = right.scrollTop;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      } else if (e.key === 'o' || e.key === 'O') {
        e.preventDefault();
        setShowOverlays((prev) => !prev);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))));
      } else if (e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))));
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      } else if (e.key === ']') {
        e.preventDefault();
        if (doc && currentPage < doc.page_sizes.length) {
          setCurrentPage((p) => p + 1);
        }
      } else if (e.key === '[') {
        e.preventDefault();
        if (currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      } else if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        if (!filteredFindings.length) return;
        const currentIndex = filteredFindings.findIndex((f) => f.id === selectedFindingId);
        let nextIndex = 0;
        if (e.key === 'j') {
          nextIndex = currentIndex < filteredFindings.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : filteredFindings.length - 1;
        }
        handleSelectFinding(filteredFindings[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredFindings, selectedFindingId, doc, currentPage, handleSelectFinding]);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex-1 flex gap-4">
          <Skeleton className="flex-1 h-full rounded-xl" />
          <Skeleton className="w-[420px] h-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <ErrorBanner
          title="Failed to load document review data"
          message={error?.toString() || 'The requested document could not be found.'}
          onRetry={() => refetch()}
        />
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentRevNum = doc.revisions.find((r) => r.is_current)?.rev || doc.revisions.length;
  const isCurrentRev = selectedRev === currentRevNum;
  const pdfFileUrl = `/mock/pdfs/${doc.filename}`;

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-4rem)] flex flex-col bg-bg overflow-hidden">
        {/* Sticky Header Toolbar */}
        <header className="bg-surface border-b border-border px-4 py-2 flex items-center justify-between gap-4 shrink-0 shadow-xs z-20">
          {/* Left: Breadcrumbs & Info */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to={`/applications/${doc.application_id}`}
              className="p-1.5 text-muted hover:text-text rounded-md hover:bg-bg transition-colors"
              title="Back to Application"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-semibold text-text truncate text-sm md:text-base">
                  {doc.label}
                </h1>
                <StatusChip status={doc.status} size="sm" />
                {doc.is_scanned && (
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono border border-slate-300">
                    Scanned (OCR)
                  </span>
                )}
              </div>
              <div className="text-xs text-muted font-mono truncate">{doc.filename}</div>
            </div>
          </div>

          {/* Center: Controls (Zoom, Pages, Overlays) */}
          <div className="flex items-center gap-2">
            {/* Page navigation */}
            <div className="flex items-center bg-bg border border-border rounded-lg p-0.5 text-xs text-muted">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="p-1 hover:text-text disabled:opacity-30 cursor-pointer"
                title="Previous page ([)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono font-medium text-text">
                {currentPage} / {doc.page_sizes.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(doc.page_sizes.length, p + 1))}
                disabled={currentPage >= doc.page_sizes.length}
                className="p-1 hover:text-text disabled:opacity-30 cursor-pointer"
                title="Next page (])"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-bg border border-border rounded-lg p-0.5 text-xs text-muted">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.15).toFixed(2))))}
                disabled={zoom <= 0.5}
                className="p-1 hover:text-text disabled:opacity-30 cursor-pointer"
                title="Zoom Out (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-mono font-medium text-text">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.0, Number((z + 0.15).toFixed(2))))}
                disabled={zoom >= 2.0}
                className="p-1 hover:text-text disabled:opacity-30 cursor-pointer"
                title="Zoom In (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-border mx-0.5" />
              <button
                type="button"
                onClick={() => setZoom(1.0)}
                className="p-1 hover:text-text cursor-pointer"
                title="Fit Width / Reset (0)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Overlays Toggle */}
            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                showOverlays
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-bg text-muted border-border hover:text-text'
              }`}
              title="Toggle overlay boxes (o)"
            >
              {showOverlays ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Overlays</span>
            </button>
          </div>

          {/* Right: Shortcuts & Panel Toggle */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className="p-1.5 text-muted hover:text-text rounded-md hover:bg-bg transition-colors"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="p-1.5 text-muted hover:text-text rounded-md hover:bg-bg transition-colors"
              title={isPanelCollapsed ? 'Open side panel' : 'Collapse side panel'}
            >
              {isPanelCollapsed ? (
                <SidebarOpen className="w-4 h-4" />
              ) : (
                <SidebarClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* Revision Slider (when document has revisions) */}
        {doc.revisions && doc.revisions.length > 1 && (
          <RevisionSlider
            revisions={doc.revisions}
            selectedRev={selectedRev}
            onSelectRev={(rev) => setSelectedRev(rev)}
            isCompareMode={isCompareMode}
            onToggleCompare={(val) => setIsCompareMode(val)}
          />
        )}

        {/* Past Revision Warning Banner */}
        {!isCurrentRev && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="font-semibold">
                Viewing revision {selectedRev} of {doc.revisions.length} (not the current file).
              </span>
              <span>Dashed outlines indicate content changed in later revisions.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedRev(currentRevNum);
              }}
              className="underline font-semibold hover:text-amber-800"
            >
              View current
            </button>
          </div>
        )}

        {/* Main Work Area: Viewer + Side Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document Viewer Container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Compare Left Side: Past Revision (Image) */}
            {isCompareMode && (
              <div
                ref={compareLeftViewerRef}
                onScroll={() => handleScrollSync('left')}
                className="flex-1 overflow-auto p-6 bg-slate-100 flex flex-col items-center border-r border-border"
              >
                <div className="sticky top-0 bg-surface/90 backdrop-blur px-3 py-1 rounded-full border border-border text-xs font-semibold text-text shadow-xs mb-4 z-10">
                  Revision {selectedRev} (Historical Render)
                </div>
                {doc.page_sizes.map((pageSize, idx) => {
                  const pageNum = idx + 1;
                  const pageWidth = pageSize.width * zoom;
                  const pageHeight = pageSize.height * zoom;

                  return (
                    <div
                      key={`compare-page-${pageNum}`}
                      style={{ width: pageWidth, height: pageHeight }}
                      className="relative bg-surface rounded shadow-md border border-border mb-6 overflow-hidden select-none"
                    >
                      <img
                        src={api.getDocumentRenderUrl(doc.id, selectedRev, pageNum)}
                        alt={`Revision ${selectedRev} Page ${pageNum}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main Viewer: Current or Selected PDF Page Render */}
            <div
              ref={viewerContainerRef}
              onScroll={() => handleScrollSync('right')}
              className="flex-1 overflow-auto p-6 bg-slate-100 flex flex-col items-center"
            >
              {isCompareMode && (
                <div className="sticky top-0 bg-surface/90 backdrop-blur px-3 py-1 rounded-full border border-border text-xs font-semibold text-text shadow-xs mb-4 z-10">
                  Current Document (With Findings)
                </div>
              )}

              {/* PDF Document Container */}
              <PdfDocument
                file={pdfFileUrl}
                loading={
                  <div className="space-y-4">
                    {doc.page_sizes.map((ps, idx) => (
                      <Skeleton
                        key={idx}
                        style={{ width: ps.width * zoom, height: ps.height * zoom }}
                        className="rounded-lg shadow"
                      />
                    ))}
                  </div>
                }
                error={
                  <div className="p-8 max-w-md bg-surface rounded-xl border border-border text-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                    <p className="text-sm font-semibold text-text">PDF Preview Unavailable</p>
                    <p className="text-xs text-muted">
                      Failed to render PDF bytes with the local worker. Showing historical image renders.
                    </p>
                  </div>
                }
              >
                {doc.page_sizes.map((pageSize, idx) => {
                  const pageNum = idx + 1;
                  const displayedWidth = pageSize.width * zoom;
                  const displayedHeight = pageSize.height * zoom;

                  return (
                    <div
                      key={`page-${pageNum}`}
                      id={`doc-page-container-${pageNum}`}
                      style={{ width: displayedWidth, height: displayedHeight }}
                      className="relative bg-surface rounded shadow-md border border-border mb-6 overflow-hidden select-none"
                    >
                      {/* Render: Either Current PDF Page or Past Revision Image */}
                      {isCurrentRev ? (
                        <PdfPage
                          pageNumber={pageNum}
                          width={displayedWidth}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      ) : (
                        <img
                          src={api.getDocumentRenderUrl(doc.id, selectedRev, pageNum)}
                          alt={`Rev ${selectedRev} Page ${pageNum}`}
                          className="w-full h-full object-contain"
                        />
                      )}

                      {/* Overlay Layer for Bounding Boxes */}
                      <OverlayLayer
                        pageNumber={pageNum}
                        pageSize={pageSize}
                        displayedWidth={displayedWidth}
                        findings={doc.findings}
                        selectedFindingId={selectedFindingId}
                        onSelectFinding={handleSelectFinding}
                        findingNumberMap={findingNumberMap}
                        viewedRev={selectedRev}
                        currentRev={currentRevNum}
                        overlaysEnabled={showOverlays}
                        severityFilter={severityFilter}
                      />
                    </div>
                  );
                })}
              </PdfDocument>
            </div>
          </div>

          {/* Right Panel: Findings & Document Info */}
          {!isPanelCollapsed && (
            <aside
              ref={rightPanelRef}
              className="w-[420px] bg-surface border-l border-border flex flex-col shrink-0 overflow-hidden shadow-xs"
            >
              {/* Tabs */}
              <div className="flex border-b border-border bg-bg/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('findings')}
                  className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'findings'
                      ? 'border-accent text-accent bg-surface'
                      : 'border-transparent text-muted hover:text-text'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Findings ({doc.findings.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                    activeTab === 'info'
                      ? 'border-accent text-accent bg-surface'
                      : 'border-transparent text-muted hover:text-text'
                  }`}
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Document Info</span>
                </button>
              </div>

              {/* Tab 1: Findings Content */}
              {activeTab === 'findings' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Filters Header */}
                  <div className="p-3 border-b border-border space-y-2 bg-surface">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text">Severity filter:</span>
                      <div className="flex items-center gap-1">
                        {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
                          <button
                            key={sev}
                            type="button"
                            onClick={() => setSeverityFilter(sev)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize border transition-colors ${
                              severityFilter === sev
                                ? 'bg-accent text-white border-accent'
                                : 'bg-bg text-muted border-border hover:text-text'
                            }`}
                          >
                            {sev === 'all'
                              ? `All (${doc.findings.length})`
                              : `${sev} (${severityCounts[sev]})`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text">Source filter:</span>
                      <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value as any)}
                        className="bg-bg border border-border rounded px-2 py-1 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
                      >
                        <option value="all">All Sources</option>
                        <option value="forensics">Forensics</option>
                        <option value="crosscheck">Crosscheck</option>
                        <option value="rules">Rules</option>
                        <option value="issuer">Issuer</option>
                      </select>
                    </div>
                  </div>

                  {/* Findings Cards List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {filteredFindings.length === 0 ? (
                      <EmptyState
                        icon={<CheckCircle className="w-8 h-8 text-emerald-500" />}
                        title="No findings match filter"
                        description={
                          doc.findings.length === 0
                            ? 'No findings. All automated checks passed for this document.'
                            : 'Try adjusting your severity or source filter.'
                        }
                      />
                    ) : (
                      filteredFindings.map((finding) => (
                        <div key={finding.id} id={`finding-card-${finding.id}`}>
                          <FindingCard
                            finding={finding}
                            findingNumber={findingNumberMap[finding.id] || 1}
                            isSelected={selectedFindingId === finding.id}
                            onSelect={() => handleSelectFinding(finding.id)}
                            onJumpToPage={(p) => {
                              setCurrentPage(p);
                              const pageElem = document.getElementById(
                                `doc-page-container-${p}`
                              );
                              if (pageElem) {
                                pageElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }}
                            onOpenDecision={(f, action) =>
                              setDecisionModal({ open: true, finding: f, action })
                            }
                            isOfficer={isOfficer}
                          />
                        </div>
                      ))
                    )}
                  </div>

                  {/* Legal / Policy Disclaimer Footer */}
                  <div className="p-3 bg-bg border-t border-border text-[11px] text-muted text-center leading-relaxed">
                    Findings are preliminary indicators for officer review, not proof of forgery or misconduct.
                  </div>
                </div>
              )}

              {/* Tab 2: Document Info Content */}
              {activeTab === 'info' && (
                <div className="flex-1 overflow-y-auto p-4">
                  <DocumentInfoTab document={doc} />
                </div>
              )}
            </aside>
          )}
        </div>

        {/* Decision Dialog */}
        <DecisionDialog
          open={decisionModal.open}
          finding={decisionModal.finding}
          initialAction={decisionModal.action}
          onOpenChange={(open) => setDecisionModal((prev) => ({ ...prev, open }))}
          onSubmit={async (findingId, action, reason) => {
            await decisionMutation.mutateAsync({ findingId, action, reason });
          }}
        />

        {/* Keyboard Shortcuts Modal */}
        <KeyboardShortcutsModal
          open={showShortcuts}
          onOpenChange={(val) => setShowShortcuts(val)}
        />
      </div>
    </TooltipProvider>
  );
};
