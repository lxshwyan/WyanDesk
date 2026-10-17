export const MAX_VISIBLE_SHORTCUT_CATEGORIES = 10;

interface VisibleCategoryCountInput {
  categoryWidths: number[];
  totalCategoryCount: number;
  availableWidth: number;
  moreWidth: number;
  categoryGap: number;
  overflowGap: number;
  maximum?: number;
}

export function visibleShortcutCategoryCount({
  categoryWidths,
  totalCategoryCount,
  availableWidth,
  moreWidth,
  categoryGap,
  overflowGap,
  maximum = MAX_VISIBLE_SHORTCUT_CATEGORIES,
}: VisibleCategoryCountInput): number {
  const widths = categoryWidths.slice(0, Math.max(0, maximum));
  if (!widths.length || totalCategoryCount <= 0 || availableWidth <= 0) return 0;

  const allVisibleWidth = widths.reduce((sum, width) => sum + width, 0)
    + Math.max(0, widths.length - 1) * categoryGap;

  if (totalCategoryCount <= maximum && allVisibleWidth <= availableWidth) {
    return Math.min(totalCategoryCount, widths.length);
  }

  if (moreWidth > availableWidth) return 0;

  let usedWidth = moreWidth;
  let visibleCount = 0;
  for (const width of widths) {
    const gap = visibleCount === 0 ? overflowGap : categoryGap;
    if (usedWidth + gap + width > availableWidth) break;
    usedWidth += gap + width;
    visibleCount += 1;
  }
  return visibleCount;
}
