import { describe, expect, it, vi } from 'vitest';
import { addLocalClipboardItem, formatLocalClipboardTime, MAX_CLIPBOARD_ITEMS, normalizeLocalClipboardItems, readLocalClipboardItems } from './localClipboard';

describe('local clipboard widget data', () => {
  it('keeps valid local text only and caps history', () => {
    const values = Array.from({ length: 25 }, (_, index) => ({ id: `item-${index}`, text: `内容 ${index}`, createdAt: `2026-10-15T00:${String(index).padStart(2, '0')}:00.000Z` }));
    expect(normalizeLocalClipboardItems([...values, { id: '', text: '坏数据', createdAt: '' }])).toHaveLength(MAX_CLIPBOARD_ITEMS);
  });

  it('moves duplicate text to the front without duplicating it', () => {
    const original = [{ id: 'old', text: '验证码 1234', createdAt: '2026-10-15T00:00:00.000Z' }];
    const next = addLocalClipboardItem(original, ' 验证码 1234 ', new Date('2026-10-15T01:00:00.000Z'), 'new');
    expect(next).toEqual([{ id: 'new', text: '验证码 1234', createdAt: '2026-10-15T01:00:00.000Z' }]);
  });

  it('recovers from damaged local storage and formats ages', () => {
    expect(readLocalClipboardItems({ getItem: vi.fn(() => '{broken') })).toEqual([]);
    expect(formatLocalClipboardTime('2026-10-15T00:00:00.000Z', new Date('2026-10-15T00:42:00.000Z'))).toBe('42 分钟前');
  });
});
