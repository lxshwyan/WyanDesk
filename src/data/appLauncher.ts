import type { FavoriteGroup, FavoriteLink } from '../types';

// Initial content only. Once saved, users own this list, including an empty list.
const initialLinks: FavoriteLink[] = [
  { id: 'wyan-microcosm', title: '微境沙盘', url: 'https://wyanhub.com/microcosm/', icon: '境', accent: '#268079' },
  { id: 'wyan-whiteboard', title: '手绘白板', url: 'https://tools.wyanhub.com/tools/design/whiteboard', icon: '绘', accent: '#6554b5' },
  { id: 'wyan-forms', title: '微言表单', url: 'https://forms.wyanhub.com', icon: '表', accent: '#3478f6' },
  { id: 'wyan-survey', title: '问卷', url: 'https://survey.wyanhub.com', icon: '问', accent: '#db2777' },
  { id: 'wyan-fishing', title: '闲钓小栈', url: 'https://fishing.wyanhub.com/', icon: '钓', accent: '#149668' },
  { id: 'wyan-sudoku', title: '算独方格', url: 'https://wyanhub.com/sudoku/', icon: '独', accent: '#7c3aed' },
];

export function createDefaultFavoriteGroups(): FavoriteGroup[] {
  return [{ id: 'favorites-default', title: '常用', links: initialLinks.map((link) => ({ ...link, url: new URL(link.url).href, iconStyle: 'auto' })) }];
}
