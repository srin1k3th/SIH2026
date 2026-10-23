import { describe, it, expect, beforeEach } from 'vitest';
import { bboxToPixelRect, bboxesOverlap } from '@/lib/geometry';
import { calculateRiskScore, getRiskBand } from '@/lib/risk';
import { STATUS_MAP } from '@/lib/statusMap';
import { mockStore } from '@/api/mockStore';
import type { BBox, PageSize, DocStatus } from '@/types';

describe('Unit Tests: VeriAPH Core Logic & Helpers', () => {
  describe('Geometry - bboxToPixelRect & bboxesOverlap', () => {
    const a4PageSize: PageSize = { width: 595, height: 842 };
    // Bbox in PDF points: [x0, y0, x1, y1] (origin top-left)
    const testBbox: BBox = [100, 200, 300, 250]; // width = 200 pt, height = 50 pt

    it('correctly maps bbox at 100% zoom (displayedWidth === pageSize.width)', () => {
      const rect = bboxToPixelRect(testBbox, 595, a4PageSize)!;
      expect(rect.left).toBeCloseTo(100, 2);
      expect(rect.top).toBeCloseTo(200, 2);
      expect(rect.width).toBeCloseTo(200, 2);
      expect(rect.height).toBeCloseTo(50, 2);
    });

    it('correctly scales bbox at 50% zoom', () => {
      const displayedWidth = 595 * 0.5;
      const rect = bboxToPixelRect(testBbox, displayedWidth, a4PageSize)!;
      expect(rect.left).toBeCloseTo(50, 2);
      expect(rect.top).toBeCloseTo(100, 2);
      expect(rect.width).toBeCloseTo(100, 2);
      expect(rect.height).toBeCloseTo(25, 2);
    });

    it('correctly scales bbox at 150% zoom', () => {
      const displayedWidth = 595 * 1.5;
      const rect = bboxToPixelRect(testBbox, displayedWidth, a4PageSize)!;
      expect(rect.left).toBeCloseTo(150, 2);
      expect(rect.top).toBeCloseTo(300, 2);
      expect(rect.width).toBeCloseTo(300, 2);
      expect(rect.height).toBeCloseTo(75, 2);
    });

    it('correctly scales bbox at 200% zoom', () => {
      const displayedWidth = 595 * 2.0;
      const rect = bboxToPixelRect(testBbox, displayedWidth, a4PageSize)!;
      expect(rect.left).toBeCloseTo(200, 2);
      expect(rect.top).toBeCloseTo(400, 2);
      expect(rect.width).toBeCloseTo(400, 2);
      expect(rect.height).toBeCloseTo(100, 2);
    });

    it('detects overlapping bounding boxes correctly', () => {
      const boxA: BBox = [100, 100, 200, 200];
      const boxB: BBox = [150, 150, 250, 250]; // Overlaps boxA
      const boxC: BBox = [300, 300, 400, 400]; // Disjoint

      expect(bboxesOverlap(boxA, boxB)).toBe(true);
      expect(bboxesOverlap(boxB, boxA)).toBe(true);
      expect(bboxesOverlap(boxA, boxC)).toBe(false);
      expect(bboxesOverlap(boxB, boxC)).toBe(false);
    });
  });

  describe('Risk Calculation - Formula & Bands', () => {
    it('calculates score according to min(100, 15*H + 7*M + 2*L)', () => {
      expect(calculateRiskScore({ high: 0, medium: 0, low: 0 })).toBe(0);
      expect(calculateRiskScore({ high: 1, medium: 0, low: 0 })).toBe(15);
      expect(calculateRiskScore({ high: 0, medium: 1, low: 0 })).toBe(7);
      expect(calculateRiskScore({ high: 0, medium: 0, low: 1 })).toBe(2);

      // App A: 4 High, 2 Medium, 2 Low -> 15*4 + 7*2 + 2*2 = 60 + 14 + 4 = 78
      expect(calculateRiskScore({ high: 4, medium: 2, low: 2 })).toBe(78);

      // Clamping at 100
      expect(calculateRiskScore({ high: 10, medium: 5, low: 5 })).toBe(100);
    });

    it('assigns correct risk bands (High >= 60, Medium 30-59, Low < 30)', () => {
      expect(getRiskBand(78)).toBe('High');
      expect(getRiskBand(60)).toBe('High');
      expect(getRiskBand(59)).toBe('Medium');
      expect(getRiskBand(30)).toBe('Medium');
      expect(getRiskBand(29)).toBe('Low');
      expect(getRiskBand(0)).toBe('Low');
    });
  });

  describe('Status Map - Full Coverage', () => {
    const allStatuses: DocStatus[] = [
      'verified',
      'mismatch_detected',
      'expired',
      'verification_pending',
      'source_unavailable',
      'manual_review_required',
    ];

    it('has explicit visual configuration and human label for every DocStatus', () => {
      allStatuses.forEach((status) => {
        const config = STATUS_MAP[status];
        expect(config).toBeDefined();
        expect(typeof config.label).toBe('string');
        expect(config.label.length).toBeGreaterThan(0);
        expect(config.icon).toBeDefined();
        expect(config.textColor).toBeDefined();
        expect(config.bgColor).toBeDefined();
        expect(config.borderColor).toBeDefined();
      });
    });
  });

  describe('Mock Store - Rule Toggle Recomputation', () => {
    beforeEach(() => {
      mockStore.reset();
    });

    it('recomputes risk score and findings when a rule is toggled', () => {
      // Check baseline on APP-2026-0412
      const initialApp = mockStore.getApplication('APP-2026-0412');
      expect(initialApp).toBeDefined();
      expect(initialApp?.risk_score).toBe(78);
      expect(initialApp?.flag_counts.medium).toBe(2);

      // Document d_reg has finding F-reg-1 governed by rule RUL-EXP-01 (medium severity, 7 points)
      const docReg = initialApp?.documents.find((d) => d.id === 'd_reg');
      expect(docReg?.findings.some((f) => f.rule_id === 'RUL-EXP-01')).toBe(true);

      // Disable rule RUL-EXP-01
      mockStore.patchRule('RUL-EXP-01', false);

      // Re-fetch application after recomputation
      const updatedApp = mockStore.getApplication('APP-2026-0412');
      expect(updatedApp).toBeDefined();

      // Finding F-reg-1 should now be excluded because its rule is disabled
      const updatedDocReg = updatedApp?.documents.find((d) => d.id === 'd_reg');
      expect(updatedDocReg?.findings.some((f) => f.rule_id === 'RUL-EXP-01')).toBe(false);

      // Risk score recomputed: 78 - 7 = 71 (4 High, 1 Medium, 2 Low)
      expect(updatedApp?.risk_score).toBe(71);
      expect(updatedApp?.flag_counts.medium).toBe(1);

      // Re-enable rule
      mockStore.patchRule('RUL-EXP-01', true);
      const restoredApp = mockStore.getApplication('APP-2026-0412');
      expect(restoredApp?.risk_score).toBe(78);
    });
  });
});
