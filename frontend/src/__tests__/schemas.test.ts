import { describe, it, expect } from 'vitest';
import { z } from 'zod';

import {
  ApplicationDetailSchema,
  ApplicationSummarySchema,
  AuditEventSchema,
  AuditVerifyResultSchema,
  CategorySchema,
  DashboardResponseSchema,
  MetricsSchema,
  RuleSchema,
} from '@/api/schemas';

import categoriesData from '@/mock/categories.json';
import appSummariesData from '@/mock/applications.json';
import appDetailsData from '@/mock/application_details.json';
import rulesData from '@/mock/rules.json';
import auditData from '@/mock/audit.json';
import auditVerifyData from '@/mock/audit_verify.json';
import metricsData from '@/mock/metrics.json';
import dashboardData from '@/mock/dashboard.json';

import { bboxToPixelRect, bboxesOverlap } from '@/lib/geometry';
import { calculateRiskScore, getRiskBand } from '@/lib/risk';
import { STATUS_MAP, resolveDocStatusPrecedence } from '@/lib/statusMap';
import { mockStore } from '@/api/mockStore';

describe('Milestone M0: Zod Schemas & Mock Data Validation', () => {
  it('parses categories.json without errors', () => {
    const res = z.array(CategorySchema).safeParse(categoriesData);
    expect(res.success).toBe(true);
  });

  it('parses applications.json without errors', () => {
    const res = z.array(ApplicationSummarySchema).safeParse(appSummariesData);
    expect(res.success).toBe(true);
  });

  it('parses application_details.json for every application', () => {
    const res = z.record(ApplicationDetailSchema).safeParse(appDetailsData);
    expect(res.success).toBe(true);
  });

  it('parses rules.json and ensures all clause_refs are TODO-VERIFY', () => {
    const res = z.array(RuleSchema).safeParse(rulesData);
    expect(res.success).toBe(true);
    if (res.success) {
      for (const rule of res.data) {
        expect(rule.clause_ref).toBe('TODO-VERIFY');
      }
    }
  });

  it('parses audit.json and verify result', () => {
    const resAudit = z.array(AuditEventSchema).safeParse(auditData);
    expect(resAudit.success).toBe(true);

    const resVerify = AuditVerifyResultSchema.safeParse(auditVerifyData);
    expect(resVerify.success).toBe(true);
    if (resVerify.success) {
      expect(resVerify.data.valid).toBe(true);
    }
  });

  it('parses metrics.json and ensures is_sample is true', () => {
    const res = MetricsSchema.safeParse(metricsData);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.is_sample).toBe(true);
    }
  });

  it('parses dashboard.json', () => {
    const res = DashboardResponseSchema.safeParse(dashboardData);
    expect(res.success).toBe(true);
  });
});

describe('Milestone M0: Geometry Points-to-Pixels Conversion', () => {
  const pageSize = { width: 595.28, height: 841.89 }; // A4 points

  it('calculates pixel dimensions correctly at 100% zoom (displayed = 595.28px)', () => {
    const bbox: [number, number, number, number] = [100, 200, 300, 250];
    const rect = bboxToPixelRect(bbox, 595.28, pageSize);
    expect(rect).not.toBeNull();
    expect(rect!.left).toBeCloseTo(100, 1);
    expect(rect!.top).toBeCloseTo(200, 1);
    expect(rect!.width).toBeCloseTo(200, 1);
    expect(rect!.height).toBeCloseTo(50, 1);
  });

  it('scales accurately at 150% zoom (displayed = 892.92px)', () => {
    const bbox: [number, number, number, number] = [100, 200, 300, 250];
    const rect = bboxToPixelRect(bbox, 595.28 * 1.5, pageSize);
    expect(rect).not.toBeNull();
    expect(rect!.left).toBeCloseTo(150, 1);
    expect(rect!.top).toBeCloseTo(300, 1);
    expect(rect!.width).toBeCloseTo(300, 1);
    expect(rect!.height).toBeCloseTo(75, 1);
  });

  it('detects overlapping bounding boxes', () => {
    const b1: [number, number, number, number] = [100, 100, 200, 200];
    const b2: [number, number, number, number] = [150, 150, 250, 250];
    const b3: [number, number, number, number] = [300, 300, 400, 400];

    expect(bboxesOverlap(b1, b2)).toBe(true);
    expect(bboxesOverlap(b1, b3)).toBe(false);
  });

  it('returns null for null bbox', () => {
    expect(bboxToPixelRect(null, 600, pageSize)).toBeNull();
  });
});

describe('Milestone M0: Risk Score Formula & Banding', () => {
  it('applies risk formula correctly: min(100, 15*H + 7*M + 2*L)', () => {
    // Application A has 4H, 2M, 2L -> 15*4 + 7*2 + 2*2 = 60 + 14 + 4 = 78
    const score = calculateRiskScore({ high: 4, medium: 2, low: 2 });
    expect(score).toBe(78);
    expect(getRiskBand(score)).toBe('High');

    // Clean App has 0 flags -> 0
    expect(calculateRiskScore({ high: 0, medium: 0, low: 0 })).toBe(0);
    expect(getRiskBand(0)).toBe('Low');

    // Capped at 100
    expect(calculateRiskScore({ high: 10, medium: 5, low: 2 })).toBe(100);
  });
});

describe('Milestone M0: Status Map Coverage & Precedence', () => {
  it('has coverage for all six statuses', () => {
    const statuses = [
      'verified',
      'mismatch_detected',
      'expired',
      'verification_pending',
      'source_unavailable',
      'manual_review_required',
    ] as const;

    for (const s of statuses) {
      expect(STATUS_MAP[s]).toBeDefined();
      expect(STATUS_MAP[s].label).toBeTruthy();
      expect(STATUS_MAP[s].icon).toBeDefined();
    }
  });

  it('resolves document status according to exact precedence rule', () => {
    // mismatch_detected > expired > source_unavailable > verification_pending > manual_review_required > verified
    expect(
      resolveDocStatusPrecedence([
        'manual_review_required',
        'expired',
        'mismatch_detected',
      ])
    ).toBe('mismatch_detected');

    expect(
      resolveDocStatusPrecedence(['manual_review_required', 'expired'])
    ).toBe('expired');

    expect(
      resolveDocStatusPrecedence(['manual_review_required', 'verified'])
    ).toBe('manual_review_required');

    expect(resolveDocStatusPrecedence(['verified'])).toBe('verified');
  });
});

describe('Milestone M0: Mock Store Rule-Toggle Recomputation', () => {
  it('dynamically excludes disabled rule findings and recomputes risk', () => {
    mockStore.reset();
    const appBefore = mockStore.getApplication('APP-2026-0412');
    expect(appBefore).not.toBeNull();
    expect(appBefore!.risk_score).toBe(78);

    // Disable RUL-EXP-01 (medium severity, 7 points)
    mockStore.patchRule('RUL-EXP-01', false);

    // Re-validate
    const appAfter = mockStore.validateApplication('APP-2026-0412');
    // F-reg-1 (medium) was excluded, so risk score drops 78 -> 71
    expect(appAfter.risk_score).toBe(71);
    expect(appAfter.flag_counts.medium).toBe(1); // was 2

    // d_reg now has 0 active findings, so its status becomes verified!
    const regDoc = appAfter.documents.find((d) => d.id === 'd_reg');
    expect(regDoc!.status).toBe('verified');

    // Reset store back
    mockStore.reset();
  });
});
