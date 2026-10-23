import {
  ApplicationDetail,
  ApplicationSummary,
  AuditEvent,
  AuditVerifyResult,
  Category,
  ChecklistRow,
  DashboardResponse,
  Decision,
  Explanation,
  Metrics,
  PrecheckResult,
  Rule,
} from '@/types';
import { calculateRiskScore } from '@/lib/risk';
import { resolveDocStatusPrecedence } from '@/lib/statusMap';

import categoriesData from '@/mock/categories.json';
import appSummariesData from '@/mock/applications.json';
import appDetailsData from '@/mock/application_details.json';
import rulesData from '@/mock/rules.json';
import auditData from '@/mock/audit.json';
import auditVerifyData from '@/mock/audit_verify.json';
import metricsData from '@/mock/metrics.json';
import dashboardData from '@/mock/dashboard.json';
import explanationsData from '@/mock/explanations.json';

class MockStore {
  private categories: Category[] = [];
  private applications: ApplicationSummary[] = [];
  private applicationDetails: Record<string, ApplicationDetail> = {};
  private baseApplicationDetails: Record<string, ApplicationDetail> = {};
  private rules: Rule[] = [];
  private auditEvents: AuditEvent[] = [];
  private auditVerify: AuditVerifyResult = { valid: true, checked: 0, first_broken_seq: null };
  private metrics: Metrics = {} as Metrics;
  private dashboard: DashboardResponse = {} as DashboardResponse;
  private explanations: Record<string, Explanation> = {};

  // Dev Flags
  public simulateErrorNextCall = false;
  public simulateSlowNetwork = false;

  constructor() {
    this.reset();
  }

  public reset() {
    this.categories = JSON.parse(JSON.stringify(categoriesData));
    this.applications = JSON.parse(JSON.stringify(appSummariesData));
    this.applicationDetails = JSON.parse(JSON.stringify(appDetailsData));
    this.baseApplicationDetails = JSON.parse(JSON.stringify(appDetailsData));
    this.rules = JSON.parse(JSON.stringify(rulesData));
    this.auditEvents = JSON.parse(JSON.stringify(auditData));
    this.auditVerify = JSON.parse(JSON.stringify(auditVerifyData));
    this.metrics = JSON.parse(JSON.stringify(metricsData));
    this.dashboard = JSON.parse(JSON.stringify(dashboardData));
    this.explanations = JSON.parse(JSON.stringify(explanationsData));
    this.simulateErrorNextCall = false;
    this.simulateSlowNetwork = false;
  }

  public getDashboard(): DashboardResponse {
    this.recomputeDashboard();
    return JSON.parse(JSON.stringify(this.dashboard));
  }

  public getApplications(): ApplicationSummary[] {
    return JSON.parse(JSON.stringify(this.applications));
  }

  public getApplication(id: string): ApplicationDetail | null {
    const detail = this.applicationDetails[id];
    return detail ? JSON.parse(JSON.stringify(detail)) : null;
  }

  public createApplication(
    categoryId: string,
    files: { docType: string; filename: string }[]
  ): ApplicationDetail {
    const category = this.categories.find((c) => c.id === categoryId) || this.categories[0];
    const newId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAppDetail: ApplicationDetail = {
      id: newId,
      institution: 'Newly Submitted Institution',
      category_id: category.id,
      category_label: category.label,
      submitted_at: new Date().toISOString(),
      risk_score: 0,
      doc_count: files.length,
      status_counts: { verified: files.length },
      flag_counts: { high: 0, medium: 0, low: 0 },
      has_missing: false,
      checklist: files.map((f) => ({
        doc_type: f.docType,
        label: f.docType.replace(/_/g, ' '),
        required: true,
        description: 'Uploaded document',
        document_id: `doc-${Math.random().toString(36).substring(7)}`,
      })),
      documents: [],
      crosscheck: { fields: [], sources: [], cells: {} },
      verification_log: [],
      alerts: [],
    };

    this.applicationDetails[newId] = newAppDetail;

    const summary: ApplicationSummary = {
      id: newAppDetail.id,
      institution: newAppDetail.institution,
      category_id: newAppDetail.category_id,
      category_label: newAppDetail.category_label,
      submitted_at: newAppDetail.submitted_at,
      risk_score: newAppDetail.risk_score,
      doc_count: newAppDetail.doc_count,
      status_counts: newAppDetail.status_counts,
      flag_counts: newAppDetail.flag_counts,
      has_missing: newAppDetail.has_missing,
    };
    this.applications.unshift(summary);

    this.logAuditEvent(
      'APPLICATION_SUBMITTED',
      newId,
      `Submitted ${files.length} documents for ${category.label}.`
    );

    return JSON.parse(JSON.stringify(newAppDetail));
  }

  public precheck(): PrecheckResult {
    return {
      ok: false,
      issues: [
        {
          doc_type: 'affidavit',
          kind: 'missing',
          message: 'Mandatory non-judicial stamp paper affidavit is missing.',
        },
        {
          doc_type: 'registration_cert',
          kind: 'expired',
          message: 'Trust registration certificate expired on 31-12-2023.',
        },
      ],
    };
  }

  public validateApplication(id: string): ApplicationDetail {
    const app = this.applicationDetails[id];
    if (!app) throw new Error(`Application ${id} not found`);

    // Recompute findings and status based on enabled rules
    const disabledRuleIds = new Set(this.rules.filter((r) => !r.enabled).map((r) => r.id));

    let totalHigh = 0;
    let totalMed = 0;
    let totalLow = 0;
    const statusCounts: Record<string, number> = {};

    app.documents.forEach((doc) => {
      // Filter out findings from disabled rules
      const activeFindings = doc.findings.filter((f) => !disabledRuleIds.has(f.rule_id));

      // Recompute document status if findings changed
      if (activeFindings.length === 0) {
        doc.status = 'verified';
      } else {
        // Collect statuses associated with remaining findings
        const statuses = activeFindings.map((f) => {
          if (f.source === 'issuer') return 'mismatch_detected';
          if (f.type === 'DOC_EXPIRED') return 'expired';
          if (f.source === 'forensics') return 'manual_review_required';
          return 'manual_review_required';
        });
        doc.status = resolveDocStatusPrecedence(statuses as any);
      }

      statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;

      activeFindings.forEach((f) => {
        if (f.severity === 'high') totalHigh++;
        if (f.severity === 'medium') totalMed++;
        if (f.severity === 'low') totalLow++;
      });
    });

    const newRisk = calculateRiskScore({
      high: totalHigh,
      medium: totalMed,
      low: totalLow,
    });

    app.risk_score = newRisk;
    app.flag_counts = { high: totalHigh, medium: totalMed, low: totalLow };
    app.status_counts = statusCounts as any;

    // Update summary
    const summary = this.applications.find((a) => a.id === id);
    if (summary) {
      summary.risk_score = newRisk;
      summary.flag_counts = app.flag_counts;
      summary.status_counts = app.status_counts;
    }

    this.logAuditEvent(
      'PIPELINE_VALIDATE',
      id,
      `Validation re-executed. Risk score updated to ${newRisk}.`
    );

    return JSON.parse(JSON.stringify(app));
  }

  public recordDecision(findingId: string, action: 'accept' | 'override' | 'clarify', reason: string): Decision {
    const decision: Decision = {
      finding_id: findingId,
      action,
      reason,
      officer: 'Demo Officer',
      timestamp: new Date().toISOString(),
    };

    // Locate finding across all applications and documents
    for (const app of Object.values(this.applicationDetails)) {
      for (const doc of app.documents) {
        const f = doc.findings.find((item) => item.id === findingId);
        if (f) {
          f.decision = decision;
        }
      }
    }

    this.logAuditEvent(
      'FINDING_DECISION',
      findingId,
      `Decision recorded: ${action.toUpperCase()}. Reason: ${reason}`
    );

    return decision;
  }

  public getDocument(id: string) {
    for (const app of Object.values(this.applicationDetails)) {
      const doc = app.documents.find((d) => d.id === id);
      if (doc) return JSON.parse(JSON.stringify(doc));
    }
    return null;
  }

  public replaceDocument(docId: string, newFilename: string) {
    for (const app of Object.values(this.applicationDetails)) {
      const doc = app.documents.find((d) => d.id === docId);
      if (doc) {
        doc.filename = newFilename;
        doc.uploaded_at = new Date().toISOString();
        return JSON.parse(JSON.stringify(doc));
      }
    }
    return null;
  }

  public getExplanation(findingId: string): Explanation {
    const exp = this.explanations[findingId];
    if (exp) return JSON.parse(JSON.stringify(exp));
    return {
      finding_id: findingId,
      status: 'ok',
      text: 'Automated verification check flagged an evidence-linked anomaly.',
      citations: [],
    };
  }

  public getCategories(): Category[] {
    return JSON.parse(JSON.stringify(this.categories));
  }

  public getChecklist(categoryId: string): ChecklistRow[] {
    if (categoryId === 'cat-eoa') {
      return JSON.parse(
        JSON.stringify(this.applicationDetails['APP-2026-0412']?.checklist || [])
      );
    }
    return [
      {
        doc_type: 'land_lease_deed',
        label: 'Land lease deed',
        required: true,
        description: 'Land deed',
        document_id: null,
      },
      {
        doc_type: 'state_noc',
        label: 'State NOC',
        required: true,
        description: 'NOC from State Higher Education Department',
        document_id: null,
      },
    ];
  }

  public getRules(_year?: string): Rule[] {
    return JSON.parse(JSON.stringify(this.rules));
  }

  public patchRule(id: string, enabled?: boolean, thresholdValue?: number): Rule {
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) throw new Error(`Rule ${id} not found`);

    if (enabled !== undefined) rule.enabled = enabled;
    if (thresholdValue !== undefined && rule.threshold) {
      rule.threshold.value = thresholdValue;
    }

    this.recomputeAllApplications();

    this.logAuditEvent(
      'RULE_MODIFIED',
      id,
      `Rule ${id} updated: enabled=${rule.enabled}, threshold=${rule.threshold?.value ?? 'N/A'}`
    );

    return JSON.parse(JSON.stringify(rule));
  }

  public recomputeAllApplications() {
    const disabledRuleIds = new Set(this.rules.filter((r) => !r.enabled).map((r) => r.id));

    for (const [appId, baseApp] of Object.entries(this.baseApplicationDetails)) {
      const app = JSON.parse(JSON.stringify(baseApp)) as ApplicationDetail;
      let totalHigh = 0;
      let totalMed = 0;
      let totalLow = 0;
      const statusCounts: Record<string, number> = {};

      app.documents.forEach((doc) => {
        doc.findings = doc.findings.filter((f) => !disabledRuleIds.has(f.rule_id));

        if (doc.findings.length === 0) {
          doc.status = 'verified';
        } else {
          const statuses = doc.findings.map((f) => {
            if (f.source === 'issuer') return 'mismatch_detected';
            if (f.type === 'DOC_EXPIRED') return 'expired';
            return 'manual_review_required';
          });
          doc.status = resolveDocStatusPrecedence(statuses as any);
        }

        statusCounts[doc.status] = (statusCounts[doc.status] || 0) + 1;

        doc.findings.forEach((f) => {
          if (f.severity === 'high') totalHigh++;
          if (f.severity === 'medium') totalMed++;
          if (f.severity === 'low') totalLow++;
        });
      });

      const newRisk = calculateRiskScore({
        high: totalHigh,
        medium: totalMed,
        low: totalLow,
      });

      app.risk_score = newRisk;
      app.flag_counts = { high: totalHigh, medium: totalMed, low: totalLow };
      app.status_counts = statusCounts as any;

      this.applicationDetails[appId] = app;

      const summary = this.applications.find((a) => a.id === appId);
      if (summary) {
        summary.risk_score = newRisk;
        summary.flag_counts = app.flag_counts;
        summary.status_counts = app.status_counts;
      }
    }

    this.recomputeDashboard();
  }

  public getAudit(): AuditEvent[] {
    return JSON.parse(JSON.stringify(this.auditEvents));
  }

  public verifyAuditChain(): AuditVerifyResult {
    return JSON.parse(JSON.stringify(this.auditVerify));
  }

  public corruptAuditEvent7() {
    if (this.auditEvents.length >= 7) {
      this.auditEvents[6].hash = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      this.auditVerify = {
        valid: false,
        checked: 7,
        first_broken_seq: 7,
      };
    }
  }

  public repairAuditChain() {
    this.auditEvents = JSON.parse(JSON.stringify(auditData));
    this.auditVerify = {
      valid: true,
      checked: this.auditEvents.length,
      first_broken_seq: null,
    };
  }

  public getMetrics(): Metrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }

  private recomputeDashboard() {
    const flagged = this.applications.filter((a) => a.risk_score > 0).length;
    this.dashboard.kpis.applications = this.applications.length;
    this.dashboard.kpis.flagged = flagged;
    this.dashboard.queue = this.applications;
  }

  private logAuditEvent(action: string, target: string, detail: string) {
    const lastEvent = this.auditEvents[this.auditEvents.length - 1];
    const prevHash = lastEvent ? lastEvent.hash : '0'.repeat(64);
    const seq = (lastEvent ? lastEvent.seq : 0) + 1;

    const newEvent: AuditEvent = {
      seq,
      timestamp: new Date().toISOString(),
      actor: 'Demo Officer',
      role: 'officer',
      action,
      target,
      detail,
      prev_hash: prevHash,
      hash: Math.random().toString(16).substring(2).padEnd(64, '0'),
    };
    this.auditEvents.push(newEvent);
    this.auditVerify.checked = this.auditEvents.length;
  }
}

export const mockStore = new MockStore();
