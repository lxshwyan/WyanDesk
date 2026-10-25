import { describe, expect, it } from 'vitest';
import { categoryDeleteTarget, categoryExists, cleanCategoryName, deleteCategory, moveCategory, renameCategory, shortcutsForCategory } from './categories';
import type { Shortcut } from '../types';

const shortcuts: Shortcut[] = [
  { id: 'one', title: '一', url: 'https://one.example', category: '常用', icon: '一', accent: '#000000' },
  { id: 'two', title: '二', url: 'https://two.example', category: '学习', icon: '二', accent: '#000000' },
];

describe('category helpers', () => {
  it('normalizes whitespace and detects duplicate names without case sensitivity', () => {
    expect(cleanCategoryName('  项目   资料  ')).toBe('项目 资料');
    expect(categoryExists(['AI', '学习'], 'ai')).toBe(true);
    expect(categoryExists(['AI', '学习'], 'ai', 'AI')).toBe(false);
  });

  it('moves categories without changing the original list', () => {
    const categories = ['常用', '学习', '生活'];
    expect(moveCategory(categories, '学习', -1)).toEqual(['学习', '常用', '生活']);
    expect(categories).toEqual(['常用', '学习', '生活']);
    expect(moveCategory(categories, '常用', -1)).toBe(categories);
  });

  it('returns every shortcut in the selected category without changing their order', () => {
    const mixed = [shortcuts[1], shortcuts[0], { ...shortcuts[1], id: 'three' }];
    expect(shortcutsForCategory(mixed, '学习').map((shortcut) => shortcut.id)).toEqual(['two', 'three']);
    expect(shortcutsForCategory(mixed, '不存在')).toEqual([]);
  });

  it('renames a category and every shortcut inside it', () => {
    const result = renameCategory(['常用', '学习'], shortcuts, '学习', '资料');
    expect(result.categories).toEqual(['常用', '资料']);
    expect(result.shortcuts.find((shortcut) => shortcut.id === 'two')?.category).toBe('资料');
  });

  it('deletes the shortcuts inside a deleted category instead of moving them elsewhere', () => {
    expect(categoryDeleteTarget(['常用', '学习', '生活'], '学习')).toBe('常用');
    const result = deleteCategory(['常用', '学习'], shortcuts, '学习');
    expect(result.categories).toEqual(['常用']);
    expect(result.shortcuts).toEqual([shortcuts[0]]);
    expect(result.deletedShortcutIds).toEqual(['two']);
  });

  it('keeps the only remaining category intact', () => {
    const result = deleteCategory(['常用'], shortcuts.slice(0, 1), '常用');
    expect(result.categories).toEqual(['常用']);
    expect(result.shortcuts).toEqual(shortcuts.slice(0, 1));
    expect(result.deletedShortcutIds).toEqual([]);
  });
});
