import { mockStore } from './mockStore';
import {
  ApplicationDetail,
  ApplicationSummary,
  AuditEvent,
  AuditVerifyResult,
  Category,
  ChecklistRow,
  DashboardResponse,
  Decision,
  Document,
  Explanation,
  Metrics,
  PrecheckResult,
  Rule,
} from '@/types';

function delay<T>(value: T, ms?: number): Promise<T> {
  const duration =
    ms !== undefined
      ? ms
      : mockStore.simulateSlowNetwork
      ? 3000
      : Math.floor(150 + Math.random() * 250);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (mockStore.simulateErrorNextCall) {
        mockStore.simulateErrorNextCall = false;
        reject(new Error('Simulated network error (Dev Panel)'));
      } else {
        resolve(value);
      }
    }, duration);
  });
}

export const mockApi = {
  async getDashboard(): Promise<DashboardResponse> {
    return delay(mockStore.getDashboard());
  },

  async getApplications(): Promise<ApplicationSummary[]> {
    return delay(mockStore.getApplications());
  },

  async getApplication(id: string): Promise<ApplicationDetail> {
    const app = mockStore.getApplication(id);
    if (!app) {
      throw new Error(`Application ${id} not found`);
    }
    return delay(app);
  },

  async createApplication(
    categoryId: string,
    files: { docType: string; filename: string }[]
  ): Promise<ApplicationDetail> {
    const newApp = mockStore.createApplication(categoryId, files);
    return delay(newApp, 600);
  },

  async precheckApplication(): Promise<PrecheckResult> {
    return delay(mockStore.precheck(), 500);
  },

  async validateApplication(id: string): Promise<ApplicationDetail> {
    const validated = mockStore.validateApplication(id);
    return delay(validated, 800);
  },

  async downloadReport(_id: string): Promise<Blob> {
    return delay(new Blob(['Mock PDF Report Content'], { type: 'application/pdf' }), 500);
  },

  async getDocument(id: string): Promise<Document> {
    const doc = mockStore.getDocument(id);
    if (!doc) throw new Error(`Document ${id} not found`);
    return delay(doc);
  },

  async getDocumentFile(id: string): Promise<string> {
    // Returns URL to local public PDF asset
    return delay(`/mock/pdfs/${id}.pdf`);
  },

  getDocumentRenderUrl(id: string, rev: number, page: number): string {
    return `/mock/render/${id}/${rev}/page${page}.png`;
  },

  async getExplanation(findingId: string): Promise<Explanation> {
    return delay(mockStore.getExplanation(findingId), 400);
  },

  async recordDecision(
    findingId: string,
    action: 'accept' | 'override' | 'clarify',
    reason: string
  ): Promise<Decision> {
    return delay(mockStore.recordDecision(findingId, action, reason), 300);
  },

  async replaceDocument(docId: string, newFilename: string): Promise<Document> {
    const replaced = mockStore.replaceDocument(docId, newFilename);
    if (!replaced) throw new Error(`Document ${docId} not found`);
    return delay(replaced, 400);
  },

  async getCategories(): Promise<Category[]> {
    return delay(mockStore.getCategories(), 150);
  },

  async getChecklist(categoryId: string): Promise<ChecklistRow[]> {
    return delay(mockStore.getChecklist(categoryId), 150);
  },

  async getRules(year?: string): Promise<Rule[]> {
    return delay(mockStore.getRules(year), 200);
  },

  async patchRule(
    id: string,
    update: { enabled?: boolean; threshold_value?: number }
  ): Promise<Rule> {
    return delay(mockStore.patchRule(id, update.enabled, update.threshold_value), 200);
  },

  async getAudit(): Promise<AuditEvent[]> {
    return delay(mockStore.getAudit(), 200);
  },

  async verifyAuditChain(): Promise<AuditVerifyResult> {
    return delay(mockStore.verifyAuditChain(), 700);
  },

  async getMetrics(): Promise<Metrics> {
    return delay(mockStore.getMetrics(), 200);
  },
};
