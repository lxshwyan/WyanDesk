import { curatedWallpapers } from '../data/wallpapers';
import type { DeskPreferences, WallpaperPreferences } from '../types';

export function normalizeWallpaperPreferences(value: unknown): WallpaperPreferences {
  const record = value && typeof value === 'object' ? value as Partial<WallpaperPreferences> : {};
  const valid = (id: unknown): id is string => typeof id === 'string' && curatedWallpapers.some((item) => item.id === id);
  return { selectedId: valid(record.selectedId) ? record.selectedId : '', daily: record.daily === true,
    favoriteIds: Array.isArray(record.favoriteIds) ? [...new Set(record.favoriteIds.filter(valid))] : [] };
}
export function selectedWallpaper(value: unknown, now: Date) {
  const preferences = normalizeWallpaperPreferences(value);
  if (!preferences.daily) return curatedWallpapers.find((item) => item.id === preferences.selectedId);
  const pool = curatedWallpapers.filter((item) => !preferences.favoriteIds.length || preferences.favoriteIds.includes(item.id));
  const day = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000);
  return pool[((day % pool.length) + pool.length) % pool.length];
}
export function desktopBackground(preferences: Pick<DeskPreferences, 'customBackground' | 'wallpaper'>, now: Date): string {
  return preferences.customBackground || selectedWallpaper(preferences.wallpaper, now)?.src || '';
}
