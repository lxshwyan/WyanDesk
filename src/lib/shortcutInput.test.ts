import { describe, expect, it } from 'vitest';
import { updateLinkURL, websiteNameFromURL } from './shortcutInput';

describe('local URL name suggestions', () => {
  it('uses the bundled name or hostname without visiting a website', () => {
    expect(websiteNameFromURL('github.com/team/project')).toBe('GitHub');
    expect(websiteNameFromURL('https://www.private-example.com/path')).toBe('private-example.com');
    expect(websiteNameFromURL('http://10.8.0.1:8080')).toBe('10.8.0.1');
    expect(websiteNameFromURL('')).toBe('');
    expect(websiteNameFromURL('not a URL')).toBe('');
    expect(websiteNameFromURL('https://user:password@example.com')).toBe('');
  });
  it('updates automatic names when the user replaces a pasted URL', () => {
    const first = updateLinkURL({ title: '', url: '', icon: '' }, 'github.com');
    expect(first.title).toBe('GitHub');
    expect(updateLinkURL(first, 'example.com').title).toBe('example.com');
    expect(updateLinkURL(first, '').title).toBe('');
  });
  it('preserves a custom name, icon, and an edited existing name', () => {
    expect(updateLinkURL({ title: '项目文档', url: 'github.com', icon: '项' }, 'example.com')).toEqual({ title: '项目文档', url: 'example.com', icon: '项' });
    expect(updateLinkURL({ title: 'GitHub', url: 'github.com' }, 'example.com', true).title).toBe('GitHub');
  });
});
