import { describe, expect, it } from 'vitest';
import { desktopSearchActions } from './searchActions';
import type { Shortcut } from '../types';

const site: Shortcut = { id: 'docs', title: '项目文档', url: 'https://docs.example.com/', category: '工作', icon: '文', accent: '#3478f6' };

describe('explicit desktop search actions', () => {
  it('defaults to web search even when a saved site matches', () => {
    const actions = desktopSearchActions('项目', 'baidu', [site]);
    expect(actions.map((action) => action.kind)).toEqual(['web', 'shortcut']);
    expect(actions[0].url).toBe(`https://www.baidu.com/s?wd=${encodeURIComponent('项目')}`);
    expect(actions[1].shortcut).toBe(site);
  });
  it('opens a pasted URL first and still offers web search', () => {
    const actions = desktopSearchActions('example.com/path?q=1', 'bing', []);
    expect(actions.map((action) => action.kind)).toEqual(['url', 'web']);
    expect(actions[0].url).toBe('https://example.com/path?q=1');
    expect(actions[1].url).toContain('https://cn.bing.com/search?q=');
  });
  it('does not turn code or spaced text into direct navigation', () => {
    expect(desktopSearchActions('javascript:alert(1)', 'baidu', [])[0].kind).toBe('web');
    expect(desktopSearchActions('example com', 'bing', [])[0].kind).toBe('web');
    expect(desktopSearchActions('  ', 'baidu', [site])).toEqual([]);
  });
  it('bounds suggestions without removing the explicit search action', () => {
    const matches = Array.from({ length: 20 }, (_, index) => ({ ...site, id: String(index) }));
    expect(desktopSearchActions('文档', 'baidu', matches)).toHaveLength(5);
  });
});
