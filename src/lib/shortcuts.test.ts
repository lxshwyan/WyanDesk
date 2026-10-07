import { describe, expect, it } from 'vitest';
import type { Shortcut } from '../types';
import { directURLFromInput, moveShortcutInCategory, shortcutURLExists } from './shortcuts';

const shortcuts: Shortcut[] = [
  { id: 'a', title: 'A', url: 'https://a.example/', category: '工作', icon: 'A', accent: '#000' },
  { id: 'x', title: 'X', url: 'https://x.example/', category: '生活', icon: 'X', accent: '#000' },
  { id: 'b', title: 'B', url: 'https://b.example/', category: '工作', icon: 'B', accent: '#000' },
];

describe('shortcut helpers', () => {
  it('moves a shortcut only within its category order', () => {
    expect(moveShortcutInCategory(shortcuts, 'b', -1).map((item) => item.id)).toEqual(['b', 'x', 'a']);
    expect(moveShortcutInCategory(shortcuts, 'a', -1)).toBe(shortcuts);
  });

  it('detects normalized duplicate URLs while allowing the edited item', () => {
    expect(shortcutURLExists(shortcuts, 'a.example')).toBe(true);
    expect(shortcutURLExists(shortcuts, 'a.example', 'a')).toBe(false);
    expect(shortcutURLExists([...shortcuts, { ...shortcuts[0], id: 'bad', url: 'not a url' }], 'b.example')).toBe(true);
  });

  it('opens only inputs that clearly look like URLs', () => {
    expect(directURLFromInput('example.com/docs')).toBe('https://example.com/docs');
    expect(directURLFromInput('https://example.com')).toBe('https://example.com/');
    expect(directURLFromInput('项目文档')).toBe('');
    expect(directURLFromInput('example com')).toBe('');
  });
});
