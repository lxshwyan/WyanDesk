import { describe, expect, it } from 'vitest';
import type { Shortcut } from '../types';
import { mergeBrowserBookmarks, parseBrowserBookmarks } from './bookmarks';

const browserExport = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
  <DT><H3>书签栏</H3>
  <DL><p>
    <DT><A HREF="https://example.com">示例 &amp; 文档</A>
    <DT><H3>开发工具</H3>
    <DL><p>
      <DT><A HREF='https://github.com'>GitHub</A>
      <DT><A HREF="javascript:alert(1)">不安全</A>
    </DL><p>
    <DT><A HREF="https://example.com/">重复示例</A>
  </DL><p>
</DL><p>`;

describe('browser bookmark import', () => {
  it('parses folders, decodes names and drops unsafe or duplicate links', () => {
    expect(parseBrowserBookmarks(browserExport)).toEqual([
      { title: '示例 & 文档', url: 'https://example.com/', category: '书签栏' },
      { title: 'GitHub', url: 'https://github.com/', category: '开发工具' },
    ]);
  });

  it('merges without overwriting or duplicating existing shortcuts', () => {
    const existing: Shortcut[] = [
      { id: 'existing', title: '示例', url: 'https://example.com/', category: '常用', icon: '示', accent: '#000' },
    ];
    let index = 0;
    const merged = mergeBrowserBookmarks(['常用'], existing, parseBrowserBookmarks(browserExport), () => `import-${index += 1}`);

    expect(merged.added).toBe(1);
    expect(merged.skipped).toBe(1);
    expect(merged.categories).toEqual(['常用', '开发工具']);
    expect(merged.shortcuts.at(-1)?.title).toBe('GitHub');
  });
});
