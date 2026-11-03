import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { curatedWallpapers } from '../data/wallpapers';
import { desktopBackground } from './wallpapers';
import { backgroundImageValue } from './backgroundImage';
describe('wallpaper first paint', () => {
  it('keeps startup and React backgrounds identical including malformed favorites', () => {
    const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
    const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    for (const baseURI of ['https://desk.wyanhub.com/', 'https://example.test/desk/index.html', 'chrome-extension://example-extension/index.html']) for (const wallpaper of [undefined, { selectedId: 'alpine-lake' }, { daily: true, favoriteIds: ['coastal-clouds', 'bad', 'alpine-lake', 'alpine-lake'] }]) {
      const preferences = { scene: 'night', customBackground: '', wallpaper, transparentAppearance: true, wallpaperView: { x: 20, y: 80, tone: 'dark', strength: 15 } };
      const properties = new Map();
      const document = { baseURI, documentElement: { classList: { add() {} }, dataset: {}, style: { setProperty(k, v) { properties.set(k, v); }, removeProperty(k) { properties.delete(k); } } } };
      runInNewContext(script, { URL, document, window: { localStorage: { getItem: () => JSON.stringify({ preferences }) }, setTimeout() {} }, Date });
      const expected = desktopBackground(preferences, new Date());
      expect(document.documentElement.dataset.deskMaterial).toBe('transparent');
      expect(document.documentElement.dataset.deskInk).toBe('dark');
      expect(properties.get('--wallpaper-position')).toBe('20% 80%');
      expect(properties.get('--clear-surface-opacity')).toBe('0.15');
      expect(properties.get('--desk-startup-image')).toBe(expected ? backgroundImageValue(expected, baseURI) : undefined);
    }
    expect(curatedWallpapers.every((item) => item.license === 'CC0' && item.src.startsWith('wallpapers/'))).toBe(true);
  });
});
