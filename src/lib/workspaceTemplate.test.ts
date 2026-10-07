import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { parseWorkspaceTemplate, serializeWorkspaceTemplate } from './workspaceTemplate';

describe('workspace templates', () => {
  it('exports organization without private tasks, notes, or events', () => {
    const source = createDefaultState().workspaces[0];
    source.note = '私人便签';
    source.events = [{ id: 'private', title: '私人日程', date: '2026-10-08', time: '09:00' }];
    const text = serializeWorkspaceTemplate(source, new Date('2026-10-06T00:00:00.000Z'));
    expect(text).not.toContain('私人便签');
    expect(text).not.toContain('私人日程');
    const restored = parseWorkspaceTemplate(text, 'imported');
    expect(restored.id).toBe('imported');
    expect(restored.shortcuts.length).toBe(source.shortcuts.length);
    expect(restored.tasks).toEqual([]);
    expect(restored.note).toBe('');
  });

  it('rejects unrelated JSON', () => {
    expect(() => parseWorkspaceTemplate('{"product":"other"}', 'id')).toThrow('不是可识别的 WyanDesk 模板');
  });
});
