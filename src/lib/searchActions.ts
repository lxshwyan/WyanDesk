import type { Shortcut } from '../types';
import { directURLFromInput } from './shortcuts';
import { matchingWidgets, type WidgetSearchItem } from './widgetSearch';

export type SearchAction = {
  id: string;
  title: string;
  detail: string;
} & (
  | { kind: 'widget'; widget: WidgetSearchItem; url?: never; shortcut?: never }
  | { kind: 'url' | 'web' | 'shortcut'; url: string; shortcut?: Shortcut; widget?: never }
);

export function desktopSearchActions(query: string, engine: 'baidu' | 'bing', shortcuts: Shortcut[], widgets: WidgetSearchItem[] = []): SearchAction[] {
  const value = query.trim();
  if (!value) return [];
  const web: SearchAction = {
    id: 'search-web', kind: 'web', title: `用${engine === 'bing' ? '必应' : '百度'}搜索“${value}”`, detail: '搜索网页',
    url: `${engine === 'bing' ? 'https://cn.bing.com/search?q=' : 'https://www.baidu.com/s?wd='}${encodeURIComponent(value)}`,
  };
  const direct = directURLFromInput(value);
  const widgetActions: SearchAction[] = matchingWidgets(value, widgets).map((widget) => ({
    id: `widget-${widget.id}`, kind: 'widget', title: widget.label, detail: `桌面组件 · ${widget.description}`, widget,
  }));
  const result: SearchAction[] = direct
    ? [{ id: 'open-url', kind: 'url', title: `打开 ${value}`, detail: '打开网址', url: direct }, web]
    : [...widgetActions, web];
  return [...result, ...shortcuts.slice(0, 4).map((shortcut): SearchAction => ({
    id: `shortcut-${shortcut.id}`, kind: 'shortcut', title: shortcut.title, detail: `${shortcut.category} · 已收藏网站`, url: shortcut.url, shortcut,
  }))];
}
