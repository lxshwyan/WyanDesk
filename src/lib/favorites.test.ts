import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { favoriteURL, MAX_FAVORITE_LINKS, moveFavoriteItem, normalizeFavoriteGroups, putFavoriteLink } from './favorites';
import { migrateDeskState, parseDeskBackup, serializeDeskBackup } from './storage';
import type { FavoriteGroup, FavoriteLink } from '../types';

const site = { id: 'source', title: '项目文档', url: 'https://example.com/docs', icon: '文', accent: '#3478f6', category: '工作' };
const groups: FavoriteGroup[] = [{ id: 'work', title: '工作', links: [] }, { id: 'study', title: '学习', links: [] }];

describe('favorite groups', () => {
  it('refreshes only the untouched legacy launcher and preserves edited URLs, names and empty groups', () => {
    const legacy = [{ id: 'favorites-default', title: '常用', links: [
      ['wyan-tools', '工具箱', 'https://tools.wyanhub.com/tools'],
      ['wyan-whiteboard', '手绘白板', 'https://tools.wyanhub.com/tools/design/whiteboard'],
      ['wyan-forms', '表单', 'https://forms.wyanhub.com/'],
      ['wyan-survey', '问卷', 'https://survey.wyanhub.com/'],
      ['wyan-fishing', '闲钓小栈', 'https://fishing.wyanhub.com/'],
      ['wyan-sudoku', '算独方格', 'https://wyanhub.com/sudoku/'],
      ['wyan-idc', '三维机房', 'https://wyanhub.com/idc/'],
    ].map(([id, title, url]) => ({ id, title, url, icon: 'W', accent: '#3478f6' })) }];
    expect(normalizeFavoriteGroups(legacy)[0].links.map((link) => link.title)).toEqual(['微境沙盘', '手绘白板', '微言表单', '问卷', '闲钓小栈', '算独方格']);
    const editedURL = structuredClone(legacy);
    editedURL[0].links[0].url = 'https://example.com/my-tools';
    expect(normalizeFavoriteGroups(editedURL)[0].links[0].url).toBe('https://example.com/my-tools');
    const renamed = structuredClone(legacy);
    renamed[0].links[0].title = '我的工具';
    expect(normalizeFavoriteGroups(renamed)[0].links[0].title).toBe('我的工具');
    expect(normalizeFavoriteGroups([{ ...legacy[0], links: [] }])[0].links).toEqual([]);
  });

  it('seeds the old launcher once while preserving existing workspaces, theme and content', () => {
    const old = { ...createDefaultState(), version: 8, favoriteGroups: undefined };
    old.workspaces[0].note = '保留的笔记';
    old.preferences.scene = 'night';
    const upgraded = migrateDeskState(old);
    expect(upgraded.version).toBe(9);
    expect(upgraded.workspaces).toEqual(old.workspaces);
    expect(upgraded.preferences).toEqual(old.preferences);
    expect(upgraded.favoriteGroups[0].links.map((link) => link.title)).toEqual(['微境沙盘', '手绘白板', '微言表单', '问卷', '闲钓小栈', '算独方格']);
    expect(migrateDeskState(upgraded)).toEqual(upgraded);
    upgraded.favoriteGroups[0].links = [];
    expect(migrateDeskState(upgraded).favoriteGroups[0].links).toEqual([]);
    upgraded.favoriteGroups = [];
    expect(migrateDeskState(upgraded).favoriteGroups).toEqual([]);
  });

  it('copies an independent entry and leaves shortcuts intact when the copy is edited or removed', () => {
    const source = structuredClone(site);
    const original = JSON.stringify(source);
    const copied = putFavoriteLink(groups, 'work', { ...source, id: 'copy' });
    expect(copied[0].links[0]).toMatchObject({ id: 'copy', title: source.title, url: source.url });
    expect(copied[0].links[0]).not.toHaveProperty('category');
    const edited = putFavoriteLink(copied, 'work', { ...copied[0].links[0], title: '独立的入口', url: 'https://example.com/new' });
    expect(edited[0].links).toHaveLength(1);
    expect(copied[0].links[0].title).toBe(site.title);
    edited[0].links = [];
    expect(JSON.stringify(source)).toBe(original);
    expect(groups[0].links).toEqual([]);
  });

  it('deduplicates normalized addresses within a group but allows the same site in different groups', () => {
    const link = { ...site, id: 'copy', url: 'example.com' };
    const copied = putFavoriteLink(groups, 'work', link);
    expect(() => putFavoriteLink(copied, 'work', { ...link, id: 'again', url: 'https://example.com/' })).toThrow('已经');
    expect(putFavoriteLink(copied, 'study', { ...link, id: 'other' })[1].links).toHaveLength(1);
    expect(putFavoriteLink(copied, 'work', { ...link, title: '更新' })[0].links[0].title).toBe('更新');
  });

  it('rejects active schemes and URLs containing credentials', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,hello', 'file:///etc/passwd', 'ftp://example.com', 'https://user:secret@example.com']) expect(() => favoriteURL(url)).toThrow();
    expect(favoriteURL(' http://localhost:8080/path?q=1#section ')).toBe('http://localhost:8080/path?q=1#section');
  });

  it('sanitizes imports without reviving deleted defaults', () => {
    const saved = [{ id: 'work', title: '工作', links: [site, { ...site, id: 'duplicate' }, { ...site, id: 'unsafe', url: 'javascript:alert(1)' }, { ...site, id: 'other', url: 'https://other.example', accent: 'red', icon: '<script>' }] }, { id: 'work', title: '重复', links: [] }, null];
    const normalized = normalizeFavoriteGroups(saved);
    expect(normalized).toHaveLength(1);
    expect(normalized[0].links).toHaveLength(2);
    expect(normalized[0].links[1]).toMatchObject({ accent: '#3478f6', icon: '<s' });
    expect(normalizeFavoriteGroups([])).toEqual([]);
    expect(normalizeFavoriteGroups([{ id: '', title: '' }])).toEqual([]);
  });

  it('bounds imported and newly created groups and entries', () => {
    const many: FavoriteLink[] = Array.from({ length: MAX_FAVORITE_LINKS + 2 }, (_, index) => ({ ...site, id: String(index), url: `https://example.com/${index}` }));
    const normalized = normalizeFavoriteGroups([{ id: 'work', title: '工作', links: many }]);
    expect(normalized[0].links).toHaveLength(MAX_FAVORITE_LINKS);
    expect(() => putFavoriteLink(normalized, 'work', { ...site, id: 'extra' })).toThrow('最多');
    expect(() => putFavoriteLink(groups, 'missing', site)).toThrow('分组');
  });

  it('keeps group and entry order and survives export/import without losing original shortcuts', () => {
    const state = createDefaultState();
    const originalShortcuts = structuredClone(state.workspaces[0].shortcuts);
    state.favoriteGroups = moveFavoriteItem(putFavoriteLink(groups, 'work', { ...site, id: 'copy' }), 'study', -1);
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored).toEqual(state);
    expect(restored.favoriteGroups.map((group) => group.id)).toEqual(['study', 'work']);
    expect(restored.workspaces[0].shortcuts).toEqual(originalShortcuts);
    expect(moveFavoriteItem(restored.favoriteGroups, 'study', -1)).toBe(restored.favoriteGroups);
    expect(moveFavoriteItem([site, { ...site, id: 'other' }], 'other', -1).map((link) => link.id)).toEqual(['other', 'source']);
  });

  it('persists the simple view without rewriting widget visibility or accepting invalid preferences', () => {
    const state = createDefaultState();
    const layout = structuredClone(state.workspaces);
    state.preferences.minimalMode = true;
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored.preferences.minimalMode).toBe(true);
    expect(restored.workspaces).toEqual(layout);
    const invalid = { ...state, preferences: { ...state.preferences, minimalMode: 'true' } };
    expect(migrateDeskState(invalid).preferences.minimalMode).toBe(false);
  });
});
