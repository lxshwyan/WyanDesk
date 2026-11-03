import type { CSSProperties } from 'react';
import type { BlockBackground, DeskState, DeskWidgetId, DeskWorkspaceLayout } from '../types';

export const MAX_BLOCK_IMAGE_LENGTH = 64 * 1024;
export const MAX_BLOCK_IMAGES_LENGTH = 512 * 1024;

export const blockGradientPresets = [
  { id: 'blue', label: '雾蓝', fill: 'linear-gradient(135deg, #cbdcfb, #e9f2ff)' },
  { id: 'mint', label: '薄荷', fill: 'linear-gradient(135deg, #bde5d5, #e7f5ed)' },
  { id: 'apricot', label: '暖杏', fill: 'linear-gradient(135deg, #f8d7b5, #fff1df)' },
  { id: 'lilac', label: '浅紫', fill: 'linear-gradient(135deg, #d9cff3, #f1eaff)' },
  { id: 'aqua', label: '晴空', fill: 'linear-gradient(135deg, #b9e2e9, #e7f5f8)' },
  { id: 'silver', label: '云灰', fill: 'linear-gradient(135deg, #d5deea, #edf2f8)' },
] as const;

const widgetGradients: Record<DeskWidgetId, NonNullable<BlockBackground['gradient']>> = {
  shortcuts: 'silver', quickActions: 'blue', dailyOverview: 'mint', notes: 'apricot',
  focus: 'blue', weather: 'aqua', schedule: 'blue', tasks: 'mint', reminders: 'apricot',
  converter: 'silver', calendar: 'silver', calculator: 'silver', worldClock: 'aqua', clipboard: 'silver', countdown: 'apricot',
};

export function withRecommendedWidgetBackgrounds(layout: DeskWorkspaceLayout): DeskWorkspaceLayout {
  return { ...layout, widgets: Object.fromEntries(Object.entries(layout.widgets).map(([id, size]) => [id, { ...size, background: { gradient: widgetGradients[id as DeskWidgetId] || 'apricot' } }])) as DeskWorkspaceLayout['widgets'] };
}

export function normalizeBlockBackground(value: unknown): BlockBackground | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as BlockBackground;
  const color = typeof raw.color === 'string' && /^#[\da-f]{6}$/i.test(raw.color) ? raw.color.toLowerCase() : undefined;
  const gradient = blockGradientPresets.find((preset) => preset.id === raw.gradient)?.id;
  const image = typeof raw.image === 'string' && raw.image.length <= MAX_BLOCK_IMAGE_LENGTH && /^data:image\/(jpeg|png|webp);base64,[A-Za-z\d+/]+={0,2}$/.test(raw.image) ? raw.image : undefined;
  return color || gradient || image ? { ...(color ? { color } : {}), ...(gradient ? { gradient } : {}), ...(image ? { image } : {}) } : undefined;
}

export function normalizeCategoryBackgrounds(value: unknown, categories: string[]): Record<string, BlockBackground> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const entries = categories.flatMap((category) => {
    const background = normalizeBlockBackground(Object.hasOwn(value, category) ? (value as Record<string, unknown>)[category] : undefined);
    return background ? [[category, background] as const] : [];
  });
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function blockBackgroundStyle(background?: BlockBackground): CSSProperties | undefined {
  if (!background) return undefined;
  const gradient = blockGradientPresets.find((preset) => preset.id === background.gradient)?.fill;
  return { '--block-color': background.color || '#ffffff', '--block-image': background.image ? `linear-gradient(rgba(255,255,255,.84), rgba(255,255,255,.84)), url("${background.image}")` : gradient || 'none' } as CSSProperties;
}

export function blockImageLength(state: DeskState): number {
  return state.workspaces.reduce((total, workspace) => total
    + Object.values(workspace.categoryBackgrounds || {}).reduce((sum, value) => sum + (value.image?.length || 0), 0)
    + Object.values(workspace.layout.widgets).reduce((sum, value) => sum + (value.background?.image?.length || 0), 0), 0);
}

export async function readBlockImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片');
  if (file.size > 5 * 1024 * 1024) throw new Error('请选择小于 5 MB 的图片');
  const bitmap = await createImageBitmap(file).catch(() => { throw new Error('图片无法读取，请换一张 JPG、PNG 或 WebP 图片'); });
  try {
    const ratio = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('当前浏览器无法处理图片');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [.75, .55, .35, .2]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length <= MAX_BLOCK_IMAGE_LENGTH) return result;
    }
    throw new Error('图片细节较多，请裁剪后重试');
  } finally { bitmap.close(); }
}
