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

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API ${res.status}: ${errorText || res.statusText}`);
  }

  return res.json();
}

export const realApi = {
  async getDashboard(): Promise<DashboardResponse> {
    return request<DashboardResponse>('/dashboard');
  },

  async getApplications(): Promise<ApplicationSummary[]> {
    return request<ApplicationSummary[]>('/applications');
  },

  async getApplication(id: string): Promise<ApplicationDetail> {
    return request<ApplicationDetail>(`/applications/${id}`);
  },

  async createApplication(
    categoryId: string,
    files: { docType: string; filename: string }[]
  ): Promise<ApplicationDetail> {
    const formData = new FormData();
    formData.append('category_id', categoryId);
    files.forEach((f) => formData.append('doc_types', f.docType));
    // Simulated upload in real adapter
    return request<ApplicationDetail>('/applications', {
      method: 'POST',
      body: formData,
    });
  },

  async precheckApplication(): Promise<PrecheckResult> {
    return request<PrecheckResult>('/applications/precheck', {
      method: 'POST',
    });
  },

  async validateApplication(id: string): Promise<ApplicationDetail> {
    return request<ApplicationDetail>(`/applications/${id}/validate`, {
      method: 'POST',
    });
  },

  async downloadReport(id: string): Promise<Blob> {
    const res = await fetch(`${BASE_URL}/applications/${id}/report`);
    if (!res.ok) throw new Error('Report download failed');
    return res.blob();
  },

  async getDocument(id: string): Promise<Document> {
    return request<Document>(`/documents/${id}`);
  },

  async getDocumentFile(id: string): Promise<string> {
    return `${BASE_URL}/documents/${id}/file`;
  },

  getDocumentRenderUrl(id: string, rev: number, page: number): string {
    return `${BASE_URL}/documents/${id}/render?rev=${rev}&page=${page}`;
  },

  async getExplanation(findingId: string): Promise<Explanation> {
    return request<Explanation>(`/findings/${findingId}/explain`);
  },

  async recordDecision(
    findingId: string,
    action: 'accept' | 'override' | 'clarify',
    reason: string
  ): Promise<Decision> {
    return request<Decision>(`/findings/${findingId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reason }),
    });
  },

  async replaceDocument(docId: string, newFilename: string): Promise<Document> {
    return request<Document>(`/documents/${docId}/replace`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: newFilename }),
    });
  },

  async getCategories(): Promise<Category[]> {
    return request<Category[]>('/categories');
  },

  async getChecklist(categoryId: string): Promise<ChecklistRow[]> {
    return request<ChecklistRow[]>(`/categories/${categoryId}/checklist`);
  },

  async getRules(year?: string): Promise<Rule[]> {
    const query = year ? `?year=${encodeURIComponent(year)}` : '';
    return request<Rule[]>(`/rules${query}`);
  },

  async patchRule(
    id: string,
    update: { enabled?: boolean; threshold_value?: number }
  ): Promise<Rule> {
    return request<Rule>(`/rules/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
  },

  async getAudit(): Promise<AuditEvent[]> {
    return request<AuditEvent[]>('/audit');
  },

  async verifyAuditChain(): Promise<AuditVerifyResult> {
    return request<AuditVerifyResult>('/audit/verify');
  },

  async getMetrics(): Promise<Metrics> {
    return request<Metrics>('/metrics');
  },
};
