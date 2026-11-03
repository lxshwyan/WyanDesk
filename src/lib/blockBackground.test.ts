import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { migrateDeskState, parseDeskBackup, serializeDeskBackup } from './storage';
import { blockImageLength, MAX_BLOCK_IMAGE_LENGTH, normalizeBlockBackground, normalizeCategoryBackgrounds, withRecommendedWidgetBackgrounds } from './blockBackground';
import { createDefaultWorkspaceLayout } from './widgetLayout';

describe('optional block backgrounds', () => {
  it('keeps group and widget backgrounds through migration and backup without replacing content', () => {
    const state = createDefaultState();
    const workspace = state.workspaces[0];
    const category = workspace.categories[0];
    workspace.categoryBackgrounds = { [category]: { color: '#e1ecff', image: 'data:image/jpeg;base64,YWJj' } };
    workspace.layout.widgets.notes.background = { color: '#e0f2e9' };
    workspace.note = '保留原有内容';
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored.workspaces[0].categoryBackgrounds).toEqual(workspace.categoryBackgrounds);
    expect(restored.workspaces[0].layout.widgets.notes.background).toEqual({ color: '#e0f2e9' });
    expect(restored.workspaces[0].note).toBe('保留原有内容');
    expect(restored.workspaces[0].shortcuts).toEqual(workspace.shortcuts);
    expect(blockImageLength(restored)).toBe('data:image/jpeg;base64,YWJj'.length);
  });

  it('drops unknown groups, remote images, active image formats and oversized payloads', () => {
    expect(normalizeCategoryBackgrounds({ missing: { color: '#e1ecff' } }, ['常用'])).toBeUndefined();
    for (const image of ['https://example.com/a.jpg', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,a'.padEnd(MAX_BLOCK_IMAGE_LENGTH + 1, 'a')]) {
      expect(normalizeBlockBackground({ color: 'red; url(secret)', image })).toBeUndefined();
    }
    expect(normalizeBlockBackground({ color: '#E1ECFF', image: 'url(https://example.com)' })).toEqual({ color: '#e1ecff' });
  });

  it('leaves old desktops unstyled and treats clearing a background as persistent', () => {
    const state = createDefaultState();
    state.workspaces[0].layout = createDefaultWorkspaceLayout();
    delete state.workspaces[0].categoryBackgrounds;
    expect(migrateDeskState(state).workspaces[0].categoryBackgrounds).toBeUndefined();
    expect(migrateDeskState(state).workspaces[0].layout.widgets.notes.background).toBeUndefined();
    state.workspaces[0].layout.widgets.notes.background = undefined;
    state.workspaces[0].categoryBackgrounds = {};
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored.workspaces[0].categoryBackgrounds).toBeUndefined();
    expect(restored.workspaces[0].layout.widgets.notes.background).toBeUndefined();
  });

  it('restores allowed gradients and applies a palette without changing saved layout or content', () => {
    const state = createDefaultState();
    const layout = state.workspaces[0].layout;
    layout.widgets.notes.height = 'tall';
    const styled = withRecommendedWidgetBackgrounds(layout);
    expect(styled.widgetOrder).toEqual(layout.widgetOrder);
    expect(styled.widgets.notes).toEqual({ ...layout.widgets.notes, background: { gradient: 'apricot' } });
    expect(normalizeBlockBackground({ gradient: 'url(https://example.com)' })).toBeUndefined();
    expect(normalizeBlockBackground({ gradient: 'mint' })).toEqual({ gradient: 'mint' });
    expect(parseDeskBackup(serializeDeskBackup(state)).workspaces[0].layout.widgets.notes.background).toEqual({ gradient: 'apricot' });
  });
});
