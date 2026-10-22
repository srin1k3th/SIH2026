import { mockApi } from './mock';
import { realApi } from './real';
import {
  ApplicationDetailSchema,
  ApplicationSummarySchema,
  AuditEventSchema,
  AuditVerifyResultSchema,
  CategorySchema,
  ChecklistRowSchema,
  DashboardResponseSchema,
  DecisionSchema,
  DocumentSchema,
  ExplanationSchema,
  MetricsSchema,
  PrecheckResultSchema,
  RuleSchema,
} from './schemas';
import { z } from 'zod';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'true') !== 'false';
const isDev = import.meta.env.DEV;

function validateWithSchema<T>(endpoint: string, schema: z.ZodType<T>, data: T): T {
  if (!isDev) return data;
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.error(`Contract mismatch on ${endpoint}:`, err.issues);
      // Create a global notification or event for UI banner
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('contract-mismatch', {
          detail: {
            endpoint,
            issues: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
          },
        });
        window.dispatchEvent(event);
      }
    }
    return data;
  }
}

const activeApi = USE_MOCK ? mockApi : realApi;

export const api = {
  isMock: USE_MOCK,

  async getDashboard() {
    const data = await activeApi.getDashboard();
    return validateWithSchema('GET /dashboard', DashboardResponseSchema, data);
  },

  async getApplications() {
    const data = await activeApi.getApplications();
    return validateWithSchema('GET /applications', z.array(ApplicationSummarySchema), data);
  },

  async getApplication(id: string) {
    const data = await activeApi.getApplication(id);
    return validateWithSchema(`GET /applications/${id}`, ApplicationDetailSchema, data);
  },

  async createApplication(categoryId: string, files: { docType: string; filename: string }[]) {
    const data = await activeApi.createApplication(categoryId, files);
    return validateWithSchema('POST /applications', ApplicationDetailSchema, data);
  },

  async precheckApplication() {
    const data = await activeApi.precheckApplication();
    return validateWithSchema('POST /applications/precheck', PrecheckResultSchema, data);
  },

  async validateApplication(id: string) {
    const data = await activeApi.validateApplication(id);
    return validateWithSchema(`POST /applications/${id}/validate`, ApplicationDetailSchema, data);
  },

  async downloadReport(id: string) {
    return activeApi.downloadReport(id);
  },

  async getDocument(id: string) {
    const data = await activeApi.getDocument(id);
    return validateWithSchema(`GET /documents/${id}`, DocumentSchema, data);
  },

  async getDocumentFile(id: string) {
    return activeApi.getDocumentFile(id);
  },

  getDocumentRenderUrl(id: string, rev: number, page: number) {
    return activeApi.getDocumentRenderUrl(id, rev, page);
  },

  async getExplanation(findingId: string) {
    const data = await activeApi.getExplanation(findingId);
    return validateWithSchema(`GET /findings/${findingId}/explain`, ExplanationSchema, data);
  },

  async recordDecision(
    findingId: string,
    action: 'accept' | 'override' | 'clarify',
    reason: string
  ) {
    const data = await activeApi.recordDecision(findingId, action, reason);
    return validateWithSchema(`POST /findings/${findingId}/decision`, DecisionSchema, data);
  },

  async replaceDocument(docId: string, newFilename: string) {
    const data = await activeApi.replaceDocument(docId, newFilename);
    return validateWithSchema(`POST /documents/${docId}/replace`, DocumentSchema, data);
  },

  async getCategories() {
    const data = await activeApi.getCategories();
    return validateWithSchema('GET /categories', z.array(CategorySchema), data);
  },

  async getChecklist(categoryId: string) {
    const data = await activeApi.getChecklist(categoryId);
    return validateWithSchema(
      `GET /categories/${categoryId}/checklist`,
      z.array(ChecklistRowSchema),
      data
    );
  },

  async getRules(year?: string) {
    const data = await activeApi.getRules(year);
    return validateWithSchema('GET /rules', z.array(RuleSchema), data);
  },

  async patchRule(id: string, update: { enabled?: boolean; threshold_value?: number }) {
    const data = await activeApi.patchRule(id, update);
    return validateWithSchema(`PATCH /rules/${id}`, RuleSchema, data);
  },

  async getAudit() {
    const data = await activeApi.getAudit();
    return validateWithSchema('GET /audit', z.array(AuditEventSchema), data);
  },

  async verifyAuditChain() {
    const data = await activeApi.verifyAuditChain();
    return validateWithSchema('GET /audit/verify', AuditVerifyResultSchema, data);
  },

  async getMetrics() {
    const data = await activeApi.getMetrics();
    return validateWithSchema('GET /metrics', MetricsSchema, data);
  },
};
