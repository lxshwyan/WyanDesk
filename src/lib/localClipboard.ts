export interface LocalClipboardItem {
  id: string;
  text: string;
  createdAt: string;
}

const CLIPBOARD_STORAGE_KEY = 'wyandesk.clipboard.v1';
export const MAX_CLIPBOARD_ITEMS = 20;

export function normalizeLocalClipboardItems(value: unknown): LocalClipboardItem[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  const result: LocalClipboardItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Partial<LocalClipboardItem>;
    const id = typeof record.id === 'string' ? record.id.trim().slice(0, 80) : '';
    const text = typeof record.text === 'string' ? record.text.trim().slice(0, 2000) : '';
    const createdAt = typeof record.createdAt === 'string' && Number.isFinite(Date.parse(record.createdAt)) ? record.createdAt : '';
    if (!id || ids.has(id) || !text || !createdAt) continue;
    result.push({ id, text, createdAt });
    ids.add(id);
    if (result.length >= MAX_CLIPBOARD_ITEMS) break;
  }
  return result;
}

export function readLocalClipboardItems(storage: Pick<Storage, 'getItem'> = window.localStorage): LocalClipboardItem[] {
  try {
    const raw = storage.getItem(CLIPBOARD_STORAGE_KEY);
    return raw ? normalizeLocalClipboardItems(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function writeLocalClipboardItems(items: LocalClipboardItem[], storage: Pick<Storage, 'setItem'> = window.localStorage): void {
  storage.setItem(CLIPBOARD_STORAGE_KEY, JSON.stringify(normalizeLocalClipboardItems(items)));
}

export function clearLocalClipboardItems(storage: Pick<Storage, 'removeItem'> = window.localStorage): void {
  storage.removeItem(CLIPBOARD_STORAGE_KEY);
}

export function addLocalClipboardItem(items: LocalClipboardItem[], rawText: string, now = new Date(), id: string = crypto.randomUUID()): LocalClipboardItem[] {
  const text = rawText.trim().slice(0, 2000);
  if (!text) return items;
  return normalizeLocalClipboardItems([{ id, text, createdAt: now.toISOString() }, ...items.filter((item) => item.text !== text)]);
}

export function formatLocalClipboardTime(value: string, now = new Date()): string {
  const differenceMinutes = Math.max(0, Math.floor((now.getTime() - Date.parse(value)) / 60_000));
  if (differenceMinutes < 1) return '刚刚';
  if (differenceMinutes < 60) return `${differenceMinutes} 分钟前`;
  const hours = Math.floor(differenceMinutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Date(value).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
}
