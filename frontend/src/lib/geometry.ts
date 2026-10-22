import { BBox, PageSize } from '@/types';

export interface PixelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Converts a PDF bounding box [x0, y0, x1, y1] (origin top-left, 72 pt)
 * to displayed pixel coordinates given the displayed page width and original page dimensions.
 */
export function bboxToPixelRect(
  bbox: BBox | null,
  displayedWidth: number,
  pageSize: PageSize
): PixelRect | null {
  if (!bbox) return null;

  const [x0, y0, x1, y1] = bbox;
  if (pageSize.width <= 0) return null;

  const scale = displayedWidth / pageSize.width;

  const left = x0 * scale;
  const top = y0 * scale;
  const width = Math.max(1, (x1 - x0) * scale);
  const height = Math.max(1, (y1 - y0) * scale);

  return {
    left,
    top,
    width,
    height,
  };
}

/**
 * Checks whether two bounding boxes on the same page overlap.
 */
export function bboxesOverlap(a: BBox | null, b: BBox | null): boolean {
  if (!a || !b) return false;
  return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
}
