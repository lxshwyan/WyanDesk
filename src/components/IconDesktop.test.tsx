import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createDefaultState } from '../data/defaults';
import { IconDesktop } from './IconDesktop';

describe('icon desktop group visibility', () => {
  const noop = () => undefined;
  const workspace = createDefaultState().workspaces[0];
  workspace.categories = Array.from({ length: 6 }, (_, i) => `分组${i + 1}`);
  workspace.shortcuts = workspace.categories.flatMap((category, group) => Array.from({ length: group === 5 ? 15 : 1 }, (_, index) => ({ id: `${group}-${index}`, title: `入口${group}-${index}`, url: `https://example.test/${group}/${index}`, category, icon: '站', accent: '#2667d5' })));
  function render(showAllGroups: boolean) {
    return renderToStaticMarkup(<IconDesktop workspace={workspace} showAllGroups={showAllGroups} onBackground={noop} onOpen={noop} onPlaceSite={noop} onPlaceCategory={noop} onMoveSite={noop} onMoveCategory={noop} onContextMenu={noop} onCategoryContextMenu={noop} onAdd={noop} />);
  }
  it('renders the fifteenth website in the sixth group without an expand action', () => {
    const html = render(true);
    expect(html).toContain('https://example.test/5/14');
    expect(html).toContain('aria-label="收起分组6分组网址"');
    expect(html).toContain('aria-expanded="true"');
    expect((html.match(/data-desktop-site=/g) || []).length).toBe(20);
  });
  it('still supports explicitly collapsing the desktop to its first four groups', () => {
    const html = render(false);
    expect(html).toContain('https://example.test/3/0');
    expect(html).not.toContain('https://example.test/4/0');
  });
});
